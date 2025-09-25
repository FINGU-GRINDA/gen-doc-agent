import { GoogleGenerativeAI } from "@google/generative-ai";
import { Pinecone } from "@pinecone-database/pinecone";
import { NextRequest, NextResponse } from "next/server";

// Initialize clients
const initPinecone = () => {
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) throw new Error("PINECONE_API_KEY is not set");
  return new Pinecone({ apiKey });
};

const initGemini = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  return new GoogleGenerativeAI(apiKey);
};

// Search for relevant content in Pinecone
async function searchRelevantContent(
  query: string,
  topK: number = 10,
  documentType?: string
) {
  const pc = initPinecone();
  const indexName = process.env.PINECONE_INDEX_NAME || "rfp-documents";

  // 문서 타입에 따른 namespace 설정
  let namespace = process.env.PINECONE_NAMESPACE || "rfp-namespace";
  if (documentType === "reference") {
    namespace = "reference-namespace";
  } else if (documentType === "rfp") {
    namespace = "rfp-namespace";
  }

  const index = pc.index(indexName).namespace(namespace);

  try {
    const searchConfig: any = {
      query: {
        topK,
        inputs: { text: query },
      },
    };

    const results = await index.searchRecords(searchConfig);
    return results.result.hits;
  } catch (error) {
    console.error(`Error searching for "${query}":`, error);
    return [];
  }
}

// Generate TOC first
async function generateTOC(projectTitle: string) {
  // TOC 관련 검색
  const queries = ["제안서 목차", "제안서 구성", "평가 기준", "요구사항"];
  const allResults = [];

  for (const query of queries) {
    const results = await searchRelevantContent(query, 5, "rfp");
    allResults.push(...results);
  }

  // 중복 제거
  const uniqueResults = Array.from(
    new Map(allResults.map((hit: any) => [hit.id, hit])).values()
  )
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, 10);

  const genAI = initGemini();
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  const context = uniqueResults
    .map((result: any) => result.fields?.chunk_text || result.chunk_text)
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

  const result = await model.generateContent(prompt);
  const tocText = result.response.text().trim();

  // 구조화된 TOC 생성
  return parseTOCToStructure(tocText);
}

// Parse TOC to structure
function parseTOCToStructure(tocText: string) {
  const lines = tocText.split("\n").filter((line) => line.trim());
  const sections: any[] = [];
  let currentMainSection: any = null;
  let currentSubSection: any = null;
  let sectionId = 1;

  for (const line of lines) {
    const trimmedLine = line.trim();
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

// Generate content for each section
async function generateSectionContent(
  projectTitle: string,
  sectionNumber: string,
  sectionTitle: string,
  level: number
) {
  // 섹션 관련 내용 검색 (RFP)
  const searchQuery = `${sectionTitle}`;
  const rfpResults = await searchRelevantContent(searchQuery, 6, "rfp");

  // 추가 컨텍스트 검색 (RFP)
  const additionalQueries = [
    sectionTitle,
    sectionTitle.includes("기술") ? "기술 아키텍처 시스템 구성" : "",
    sectionTitle.includes("예산") || sectionTitle.includes("가격")
      ? "비용 예산 견적"
      : "",
    sectionTitle.includes("일정") ? "프로젝트 일정 계획" : "",
    sectionTitle.includes("조직") || sectionTitle.includes("인력")
      ? "팀 구성 역할"
      : "",
  ].filter((q) => q);

  for (const query of additionalQueries) {
    const results = await searchRelevantContent(query, 2, "rfp");
    rfpResults.push(...results);
  }

  // 레퍼런스 문서에서 유사 섹션 검색
  const referenceResults = await searchRelevantContent(
    sectionTitle,
    4,
    "reference"
  );
  const referenceQuery = `${sectionNumber.split(".")[0]}. `; // 같은 레벨 섹션 검색
  const additionalRefResults = await searchRelevantContent(
    referenceQuery,
    2,
    "reference"
  );
  referenceResults.push(...additionalRefResults);

  // RFP 컨텍스트
  const rfpContext = rfpResults
    .map((result: any) => result.fields?.chunk_text || result.chunk_text)
    .join("\n\n");

  // 레퍼런스 컨텍스트
  const referenceContext = referenceResults
    .map((result: any) => result.fields?.chunk_text || result.chunk_text)
    .join("\n\n");

  const genAI = initGemini();
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  const sectionType = level === 1 ? "대섹션" : "소섹션";

  let prompt = `
당신은 프로젝트의 제안서를 작성하는 전문 컨설턴트입니다.
다음 자료들을 참고하여 제안서의 "${sectionNumber}. ${sectionTitle}" ${sectionType}의 내용을 작성해주세요.

RFP 요구사항 및 평가기준:
${rfpContext}`;

  if (referenceContext) {
    prompt += `

레퍼런스 제안서 참고 내용 (문체와 스타일 참고):
${referenceContext}`;
  }

  prompt += `

작성 지침:
1. RFP 요구사항을 충실히 반영하여 작성하세요
2. ${
    referenceContext
      ? "레퍼런스 문서의 문체와 스타일을 참고하되, 프로젝트에 맞게 내용을 조정하세요"
      : "전문적이고 구체적인 내용으로 작성하세요"
  }
3. 구체적인 예시, 수치, 방법론을 포함하세요
4. ${
    level === 1 ? "3-5개의 하위 섹션(###)으로 구성하여" : "2-3개의 문단으로"
  } 체계적으로 작성하세요
5. 전문 용어와 업계 표준을 적절히 활용하세요
6. 실제 구현 가능한 현실적인 내용으로 작성하세요
7. 가능한 한 구체적이고 상세한 설명을 포함하세요
8. 도표나 그림이 필요한 경우 [그림: 설명] 형태로 표시하세요
9. 최소 ${level === 1 ? "800" : "400"}자 이상으로 작성하세요

마크다운 형식으로 작성하되, 섹션 번호는 제외하고 내용만 작성하세요.
`;

  try {
    const result = await model.generateContent(prompt);
    const content = result.response.text().trim();
    return content;
  } catch (error) {
    console.error(
      `Error generating content for section ${sectionNumber}:`,
      error
    );
    return `### ${sectionTitle}\n\n[내용 생성 중 오류가 발생했습니다]`;
  }
}

// Generate full proposal
async function generateFullProposal(projectTitle: string, toc: any[]) {
  const sections = [];

  for (const mainSection of toc) {
    console.log(
      `Generating content for section ${mainSection.number}: ${mainSection.title}`
    );

    // 메인 섹션 내용 생성
    const mainContent = await generateSectionContent(
      projectTitle,
      mainSection.number,
      mainSection.title,
      mainSection.level
    );

    const section = {
      id: mainSection.id,
      title: `${mainSection.number}. ${mainSection.title}`,
      content: mainContent,
    };

    // 하위 섹션이 있는 경우 각각 생성
    if (mainSection.children && mainSection.children.length > 0) {
      const subContents = [];
      for (const subSection of mainSection.children) {
        console.log(
          `  Generating content for subsection ${subSection.number}: ${subSection.title}`
        );
        const subContent = await generateSectionContent(
          projectTitle,
          subSection.number,
          subSection.title,
          subSection.level
        );
        subContents.push(
          `### ${subSection.number} ${subSection.title}\n\n${subContent}`
        );
      }

      // 메인 내용과 서브 내용 결합
      section.content = mainContent + "\n\n" + subContents.join("\n\n");
    }

    sections.push(section);
  }

  return sections;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      projectTitle = "AI 기반 시스템 구축",
      generateContent = false,
      toc: existingTOC,
    } = body;

    console.log("Starting proposal generation for:", projectTitle);

    // 1. 목차 생성 또는 기존 목차 사용
    let toc;
    let tocText;

    if (existingTOC) {
      console.log("Using existing TOC");
      toc = existingTOC;
      tocText = generateTOCText(toc);
    } else if (!generateContent) {
      // 목차만 필요한 경우 /api/toc/generate 호출
      console.log("Calling /api/toc/generate for TOC generation");

      const tocResponse = await fetch(
        `${request.nextUrl.origin}/api/toc/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ projectTitle }),
        }
      );

      const tocData = await tocResponse.json();

      console.log("TOC API Response:", tocData); // 디버깅용

      if (!tocResponse.ok) {
        throw new Error(tocData.error || "목차 생성에 실패했습니다.");
      }

      return NextResponse.json({
        success: true,
        toc: tocData.structuredTOC || [],
        tocText: tocData.toc || "",
        projectTitle,
      });
    } else {
      // 제안서 생성을 위한 자체 목차 생성
      console.log("Step 1: Generating TOC...");
      toc = await generateTOC(projectTitle);
      tocText = generateTOCText(toc);
      console.log(`Generated TOC with ${toc.length} main sections`);
    }

    // generateContent가 false면 이미 위에서 처리됨
    if (!generateContent) {
      return NextResponse.json({
        success: true,
        toc,
        tocText,
        projectTitle,
      });
    }

    // 2. 각 섹션별 내용 생성
    console.log("Step 2: Generating content for each section...");
    const sections = await generateFullProposal(projectTitle, toc);

    // 3. 제안서 메타데이터 생성
    const proposal = {
      title: `${projectTitle} 제안서`,
      createdAt: new Date().toISOString(),
      sections,
      toc,
    };

    return NextResponse.json({
      success: true,
      proposal,
    });
  } catch (error) {
    console.error("Error generating proposal:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

// TOC를 텍스트 형식으로 변환
function generateTOCText(toc: any[]): string {
  let tocText = "";
  for (const section of toc) {
    tocText += `${section.number}. ${section.title}\n`;
    if (section.children && section.children.length > 0) {
      for (const child of section.children) {
        tocText += `   ${child.number} ${child.title}\n`;
      }
    }
  }
  return tocText.trim();
}
