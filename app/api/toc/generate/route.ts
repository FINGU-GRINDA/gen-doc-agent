import { GoogleGenerativeAI } from "@google/generative-ai";
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

// Initialize Gemini client
const initGemini = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  return new GoogleGenerativeAI(apiKey);
};

// Search for TOC-related content in Pinecone (RFP namespace only)
async function searchTOCContent() {
  const pc = initPinecone();
  const indexName = process.env.PINECONE_INDEX_NAME || "rfp-documents";
  const namespace = "rfp-namespace"; // TOC는 RFP에서만 검색
  const index = pc.index(indexName).namespace(namespace);

  // 목차 관련 키워드로 검색
  const queries = [
    "제안서 목차",
    "제안서 구성",
    "평가 기준",
    "요구사항",
    "제안서 작성 지침",
  ];

  const allResults = [];

  for (const query of queries) {
    try {
      const results = await index.searchRecords({
        query: {
          topK: 5,
          inputs: { text: query },
        },
      });

      if (results.result.hits.length > 0) {
        allResults.push(...results.result.hits);
      }
    } catch (error) {
      console.error(`Error searching for "${query}":`, error);
    }
  }

  // 중복 제거 및 관련도 순 정렬
  const uniqueResults = Array.from(
    new Map(allResults.map((hit: any) => [hit.id, hit])).values()
  ).sort((a: any, b: any) => b.score - a.score);

  return uniqueResults.slice(0, 10); // 상위 10개만 반환
}

// Parse TOC text to structured format
function parseTOCToStructure(tocText: string) {
  const lines = tocText.split("\n").filter((line) => line.trim());
  const sections: any[] = [];
  let currentMainSection: any = null;
  let currentSubSection: any = null;
  let sectionId = 1;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip empty lines
    if (!trimmedLine) continue;

    // 1차 목차 (1., 2., 3., ...)
    const mainMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
    if (mainMatch) {
      currentMainSection = {
        id: `section-${sectionId++}`,
        number: mainMatch[1],
        title: mainMatch[2],
        level: 1,
        children: [],
      };
      sections.push(currentMainSection);
      currentSubSection = null;
      continue;
    }

    // 2차 목차 (1.1., 1.2., ...)
    const subMatch = trimmedLine.match(/^\s*(\d+\.\d+\.?)\s+(.+)$/);
    if (subMatch && currentMainSection) {
      currentSubSection = {
        id: `section-${sectionId++}`,
        number: subMatch[1],
        title: subMatch[2],
        level: 2,
        children: [],
      };
      currentMainSection.children.push(currentSubSection);
      continue;
    }

    // 3차 목차 (1.1.1., 1.1.2., ...)
    const subSubMatch = trimmedLine.match(/^\s*(\d+\.\d+\.\d+\.?)\s+(.+)$/);
    if (subSubMatch && currentSubSection) {
      currentSubSection.children.push({
        id: `section-${sectionId++}`,
        number: subSubMatch[1],
        title: subSubMatch[2],
        level: 3,
      });
    }
  }

  return sections;
}

// Generate TOC using Gemini
async function generateTOCWithGemini(
  projectTitle: string,
  searchResults: any[]
) {
  const genAI = initGemini();
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  // 검색 결과를 컨텍스트로 변환
  const context = searchResults
    .map(
      (result) =>
        `[관련도: ${(result.score * 100).toFixed(1)}%] ${
          result.fields?.chunk_text || result.chunk_text
        }`
    )
    .join("\n\n");

  const prompt = `
당신은 전문적인 제안서 작성 컨설턴트입니다.
다음 RFP 문서 내용을 참고하여 프로젝트를 위한 최적화된 제안서 목차를 작성해주세요.

RFP 참고 내용:
${context}

요구사항:
1. 체계적이고 논리적인 구조로 작성
2. 대분류와 소분류로 구분하여 계층적으로 구성
3. 각 섹션은 번호를 매겨서 정리
4. RFP에서 요구하는 내용을 모두 포함
5. 한국어로 작성

목차만 작성하고, 추가 설명은 하지 마세요.
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text.trim();
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("목차 생성 중 오류가 발생했습니다.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectTitle = "AI 기반 제안서 작성 시스템" } = body;

    console.log("Generating TOC for:", projectTitle);

    // 1. Pinecone에서 목차 관련 내용 검색
    console.log("Searching for TOC-related content...");
    const searchResults = await searchTOCContent();
    console.log(`Found ${searchResults.length} relevant chunks`);

    if (searchResults.length === 0) {
      // 검색 결과가 없을 때 기본 목차 생성
      console.log("No search results, generating default TOC");
      const defaultTOC = `1. 제안 개요
   1.1 프로젝트 배경 및 목적
   1.2 제안 범위
   1.3 기대 효과

2. 제안사 소개
   2.1 회사 개요
   2.2 주요 사업 분야
   2.3 핵심 역량
   2.4 유사 프로젝트 수행 실적

3. 기술 제안
   3.1 시스템 아키텍처
   3.2 주요 기능 설계
   3.3 기술 스택
   3.4 보안 방안

4. 프로젝트 수행 방안
   4.1 추진 전략
   4.2 개발 방법론
   4.3 일정 계획
   4.4 조직 및 인력 구성

5. 품질 관리 방안
   5.1 품질 보증 계획
   5.2 테스트 전략
   5.3 위험 관리

6. 유지보수 방안
   6.1 유지보수 체계
   6.2 기술 지원
   6.3 교육 계획

7. 제안 가격
   7.1 구축 비용
   7.2 유지보수 비용
   7.3 총 소요 예산`;

      const structuredTOC = parseTOCToStructure(defaultTOC);

      return NextResponse.json({
        success: true,
        toc: defaultTOC,
        structuredTOC,
        source: "default",
      });
    }

    // 2. Gemini를 사용하여 목차 생성
    console.log("Generating TOC with Gemini...");
    const toc = await generateTOCWithGemini(projectTitle, searchResults);
    const structuredTOC = parseTOCToStructure(toc);

    return NextResponse.json({
      success: true,
      toc,
      structuredTOC,
      source: "gemini",
      contextUsed: searchResults.length,
    });
  } catch (error) {
    console.error("Error generating TOC:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
