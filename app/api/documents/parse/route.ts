import { Pinecone } from "@pinecone-database/pinecone";
import FormData from "form-data";
import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import fetch from "node-fetch";
import path from "path";

// Initialize Pinecone client
const initPinecone = () => {
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) {
    throw new Error("PINECONE_API_KEY is not set");
  }
  return new Pinecone({ apiKey });
};

// Parse document using Upstage API
async function parseDocument(fileBuffer: Buffer, fileName: string) {
  const upstageApiKey = process.env.UPSTAGE_API_KEY;
  if (!upstageApiKey) {
    throw new Error("UPSTAGE_API_KEY is not set");
  }

  const formData = new FormData();
  formData.append("document", fileBuffer, { filename: fileName });
  formData.append("output_formats", JSON.stringify(["html", "text"]));
  formData.append("base64_encoding", JSON.stringify(["table"]));
  formData.append("ocr", "auto");
  formData.append("coordinates", "true");
  formData.append("model", "document-parse");

  const response = await fetch(
    "https://api.upstage.ai/v1/document-digitization",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${upstageApiKey}`,
        ...formData.getHeaders(),
      },
      body: formData as any,
    }
  );

  if (!response.ok) {
    throw new Error(`Upstage API error: ${response.statusText}`);
  }

  return response.json();
}

// Split text into chunks
function splitTextIntoChunks(text: string, chunkSize: number = 1000): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > chunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += " " + sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// Create records for Pinecone
function createRecords(chunks: string[], metadata: any = {}) {
  return chunks.map((chunk, index) => ({
    id: `chunk-${Date.now()}-${index}`,
    chunk_text: chunk, // Direct field for integrated embedding
    page: metadata.page || 0,
    category: metadata.category || "general",
    document_type: metadata.document_type || "rfp",
    file_name: metadata.file_name || "unknown",
    source: metadata.source || "unknown",
    uploadedAt: metadata.uploadedAt || new Date().toISOString(),
  }));
}

export async function POST(request: NextRequest) {
  try {
    console.log("Starting document parse request...");

    // Parse form data
    const contentType = request.headers.get("content-type") || "";
    let fileBuffer: Buffer;
    let fileName: string = "document.pdf";
    let fileType: string = "rfp";

    if (contentType.includes("multipart/form-data")) {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get("file") as File;
      fileType = (formData.get("fileType") as string) || "rfp";

      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        fileBuffer = Buffer.from(arrayBuffer);
        fileName = file.name;
      } else {
        // Default to data.pdf
        const pdfPath = path.join(process.cwd(), "data", "data.pdf");
        if (!fs.existsSync(pdfPath)) {
          return NextResponse.json(
            { error: "No file provided and default PDF not found" },
            { status: 404 }
          );
        }
        fileBuffer = fs.readFileSync(pdfPath);
        fileName = "data.pdf";
      }
    } else {
      // Default to data.pdf for backward compatibility
      const pdfPath = path.join(process.cwd(), "data", "data.pdf");
      if (!fs.existsSync(pdfPath)) {
        return NextResponse.json(
          { error: "PDF file not found at data/data.pdf" },
          { status: 404 }
        );
      }
      fileBuffer = fs.readFileSync(pdfPath);
      fileName = "data.pdf";
    }

    // Initialize Pinecone
    const pc = initPinecone();
    const indexName = process.env.PINECONE_INDEX_NAME || "rfp-documents";

    // 문서 타입에 따른 namespace 설정
    const namespace =
      fileType === "reference"
        ? "reference-namespace"
        : process.env.PINECONE_NAMESPACE || "rfp-namespace";

    // Check if index exists, if not create it
    const indexes = await pc.listIndexes();
    const indexExists = indexes.indexes?.some((idx) => idx.name === indexName);

    if (!indexExists) {
      // Create index with embedding model
      await pc.createIndexForModel({
        name: indexName,
        cloud: "aws",
        region: "us-east-1",
        embed: {
          model: "multilingual-e5-large", // Using a more common model
          fieldMap: { text: "chunk_text" },
        },
        waitUntilReady: true,
      });
    }

    console.log("Parsing document with Upstage API...");
    // Parse document with Upstage
    const parsedData = await parseDocument(fileBuffer, fileName);
    console.log("Document parsed successfully");

    // Extract text from parsed data - 다양한 경로 확인
    let text = "";

    if (parsedData.content?.text) {
      text = parsedData.content.text;
      console.log("Found text in content.text");
    } else if (parsedData.text) {
      text = parsedData.text;
      console.log("Found text in text");
    } else if (parsedData.content?.pages) {
      // 페이지별 텍스트 결합
      text = parsedData.content.pages
        .map((page: any) => page.text || "")
        .join("\n");
      console.log("Found text in content.pages");
    } else if (parsedData.pages) {
      // 페이지별 텍스트 결합 (다른 구조)
      text = parsedData.pages.map((page: any) => page.text || "").join("\n");
      console.log("Found text in pages");
    }

    if (!text) {
      console.error(
        "No text found in parsed data. Structure:",
        Object.keys(parsedData)
      );
      if (parsedData.content) {
        console.error("Content keys:", Object.keys(parsedData.content));
      }
      return NextResponse.json(
        { error: "No text content found in parsed document" },
        { status: 400 }
      );
    }

    console.log(`Extracted text length: ${text.length} characters`);

    // Split text into chunks
    const chunks = splitTextIntoChunks(text);
    console.log(`Created ${chunks.length} chunks`);

    // Create records for Pinecone
    const records = createRecords(chunks, {
      source: fileName,
      document_type: fileType,
      file_name: fileName,
      uploadedAt: new Date().toISOString(),
    });

    // Get index and upsert records in batches (Pinecone limit: 96 records per batch)
    const index = pc.index(indexName).namespace(namespace);
    const batchSize = 96;
    const totalBatches = Math.ceil(records.length / batchSize);

    console.log(
      `Upserting ${records.length} records in ${totalBatches} batches...`
    );

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      console.log(
        `Upserting batch ${batchNumber}/${totalBatches} (${batch.length} records)`
      );
      await index.upsertRecords(batch);
    }

    return NextResponse.json({
      success: true,
      message: "Document parsed and indexed successfully",
      stats: {
        totalChunks: chunks.length,
        totalBatches,
        indexName,
        namespace,
      },
    });
  } catch (error) {
    console.error("Error parsing document:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
