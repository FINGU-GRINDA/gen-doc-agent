import { Pinecone } from "@pinecone-database/pinecone";
import { NextRequest, NextResponse } from "next/server";

// Initialize Pinecone client
const initPinecone = () => {
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) {
    throw new Error("PINECONE_API_KEY is not set");
  }
  return new Pinecone({ apiKey });
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, topK = 10, rerank = false, documentType } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required and must be a string" },
        { status: 400 }
      );
    }

    // Initialize Pinecone
    const pc = initPinecone();
    const indexName = process.env.PINECONE_INDEX_NAME || "rfp-documents";

    // Search configuration
    const searchConfig: any = {
      query: {
        topK,
        inputs: { text: query },
      },
    };

    // Add reranking if requested
    if (rerank) {
      searchConfig.rerank = {
        model: "bge-reranker-v2-m3",
        topN: topK,
        rankFields: ["chunk_text"],
      };
    }

    // 문서 타입에 따른 namespace 설정 및 검색
    let results;

    if (!documentType || documentType === "all") {
      // 모든 namespace 검색
      const rfpIndex = pc.index(indexName).namespace("rfp-namespace");
      const refIndex = pc.index(indexName).namespace("reference-namespace");

      // 두 namespace에서 병렬로 검색
      const [rfpResults, refResults] = await Promise.all([
        rfpIndex
          .searchRecords(searchConfig)
          .catch(() => ({ result: { hits: [] } })),
        refIndex
          .searchRecords(searchConfig)
          .catch(() => ({ result: { hits: [] } })),
      ]);

      // 결과 병합 및 점수순 정렬
      const allHits = [...rfpResults.result.hits, ...refResults.result.hits];
      allHits.sort((a: any, b: any) => b.score - a.score);

      // topK만큼만 반환
      results = {
        result: {
          hits: allHits.slice(0, topK),
        },
      };
    } else {
      // 특정 namespace만 검색
      const namespace =
        documentType === "reference" ? "reference-namespace" : "rfp-namespace";
      const index = pc.index(indexName).namespace(namespace);
      results = await index.searchRecords(searchConfig);
    }

    // Perform search
    console.log("Searching with query:", query);

    // Debug logging
    console.log(`Found ${results.result.hits.length} results`);
    if (results.result.hits.length > 0) {
      console.log(
        "Sample hit structure:",
        JSON.stringify(results.result.hits[0], null, 2)
      );
    }

    // Format results for frontend
    const formattedResults = results.result.hits.map((hit: any) => ({
      id: hit.id,
      score: hit.score,
      chunk_text: hit.chunk_text,
      category: hit.category,
      page: hit.page,
      metadata: {
        title: hit.title,
        section: hit.section,
        document_type: hit.document_type,
        file_name: hit.file_name,
        source: hit.source,
        uploadedAt: hit.uploadedAt,
      },
    }));

    return NextResponse.json({
      success: true,
      results: formattedResults,
      query,
      totalResults: formattedResults.length,
    });
  } catch (error) {
    console.error("Error searching documents:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
