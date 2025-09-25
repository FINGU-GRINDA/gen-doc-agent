"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  FileText,
  Home,
  Loader2,
  ChevronRight,
  FileSearch,
  Database,
  Sparkles,
} from "lucide-react";

interface SearchResult {
  id: string;
  score: number;
  chunk_text: string;
  category?: string;
  page?: number;
  metadata?: {
    title?: string;
    section?: string;
    document_type?: string;
  };
}

// 더미 검색 결과 - 실제로는 API에서 가져올 예정
const dummySearchResults: SearchResult[] = [
  {
    id: "1",
    score: 0.95,
    chunk_text:
      "제안서는 총 5개 분야로 평가되며, 각 분야별 배점은 다음과 같습니다. 1) 기술성(40점): 제안된 기술의 적정성, 구현 가능성, 혁신성을 평가합니다. 2) 사업수행능력(20점): 유사 프로젝트 수행 경험, 전문 인력 보유 현황을 검토합니다.",
    category: "평가기준",
    page: 15,
    metadata: {
      title: "제안서 평가 기준",
      section: "4. 평가 및 선정",
    },
  },
  {
    id: "2",
    score: 0.89,
    chunk_text:
      "제안서의 목차는 다음과 같이 구성되어야 합니다: I. 제안 개요, II. 기술 제안, III. 사업 수행 계획, IV. 프로젝트 관리 방안, V. 기대 효과 및 활용 방안. 각 항목은 세부 내용을 포함하여 구체적으로 작성되어야 합니다.",
    category: "제안서 구성",
    page: 8,
    metadata: {
      title: "제안서 작성 지침",
      section: "2. 제안서 구성 요소",
    },
  },
  {
    id: "3",
    score: 0.82,
    chunk_text:
      "본 프로젝트는 AI 기반 문서 분석 시스템 구축을 목표로 합니다. 주요 요구사항은 1) 다양한 문서 형식 지원(PDF, DOCX, XLSX), 2) 한국어 자연어 처리 능력, 3) 실시간 검색 및 분석 기능, 4) 사용자 친화적 인터페이스 제공입니다.",
    category: "프로젝트 개요",
    page: 3,
    metadata: {
      title: "사업 개요",
      section: "1. 프로젝트 목적 및 범위",
    },
  },
];

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [documentType, setDocumentType] = useState<"all" | "rfp" | "reference">(
    "all"
  );
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const response = await fetch("/api/documents/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          topK: 10,
          rerank: true,
          documentType: documentType === "all" ? undefined : documentType,
        }),
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();

      if (data.success && data.results) {
        setSearchResults(data.results);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      // Fallback to dummy data if API fails
      setSearchResults(dummySearchResults);
    } finally {
      setIsSearching(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return "text-green-600 dark:text-green-400";
    if (score >= 0.7) return "text-yellow-600 dark:text-yellow-400";
    return "text-gray-600 dark:text-gray-400";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Home className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <FileSearch className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                RFP 문서 검색
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Database className="w-4 h-4" />
            <span>Pinecone Vector DB</span>
            <span className="text-gray-400">|</span>
            <span>data.pdf</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            제안요청서에서 필요한 정보를 찾아보세요
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
            AI 기반 의미 검색으로 관련 내용을 빠르게 찾아드립니다
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-500">
            <Sparkles className="w-4 h-4" />
            <span>Upstage Document Parser + Pinecone Vector Search</span>
          </div>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-12">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="예: 평가 기준은 무엇인가요? / 제안서 목차 구성 / 프로젝트 요구사항"
                className="w-full px-6 py-4 pr-32 text-lg border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-white shadow-lg"
                disabled={isSearching}
              />
              <button
                type="submit"
                disabled={isSearching || !query.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium rounded-xl transition-all duration-200 flex items-center gap-2"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    검색 중...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    검색
                  </>
                )}
              </button>
            </div>

            {/* 문서 타입 선택 */}
            <div className="flex items-center gap-4 justify-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="all"
                  checked={documentType === "all"}
                  onChange={(e) =>
                    setDocumentType(
                      e.target.value as "all" | "rfp" | "reference"
                    )
                  }
                  className="mr-2 text-purple-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  전체 문서
                </span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="rfp"
                  checked={documentType === "rfp"}
                  onChange={(e) =>
                    setDocumentType(
                      e.target.value as "all" | "rfp" | "reference"
                    )
                  }
                  className="mr-2 text-purple-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  RFP 문서
                </span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="reference"
                  checked={documentType === "reference"}
                  onChange={(e) =>
                    setDocumentType(
                      e.target.value as "all" | "rfp" | "reference"
                    )
                  }
                  className="mr-2 text-purple-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  레퍼런스 문서
                </span>
              </label>
            </div>
          </div>
        </form>

        {/* Search Results */}
        {hasSearched && (
          <div className="space-y-6">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {isSearching ? (
                  "검색 중..."
                ) : searchResults.length > 0 ? (
                  <>검색 결과 ({searchResults.length}개)</>
                ) : (
                  "검색 결과가 없습니다"
                )}
              </h3>
              {searchResults.length > 0 && !isSearching && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  관련도 순으로 정렬됨
                </div>
              )}
            </div>

            {/* Results List */}
            {isSearching ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-12 h-12 animate-spin text-purple-600 dark:text-purple-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  RFP 문서에서 관련 내용을 검색하고 있습니다...
                </p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-4">
                {searchResults.map((result, index) => (
                  <div
                    key={result.id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 dark:border-gray-700 overflow-hidden"
                  >
                    <div className="p-6">
                      {/* Result Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg font-semibold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              {result.metadata?.title && (
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                  {result.metadata.title}
                                </h4>
                              )}
                              {result.metadata?.document_type && (
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full ${
                                    result.metadata.document_type === "rfp"
                                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                      : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  }`}
                                >
                                  {result.metadata.document_type === "rfp"
                                    ? "RFP"
                                    : "레퍼런스"}
                                </span>
                              )}
                            </div>
                            {result.metadata?.section && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {result.metadata.section}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div
                            className={`text-sm font-medium ${getScoreColor(
                              result.score
                            )}`}
                          >
                            관련도: {(result.score * 100).toFixed(0)}%
                          </div>
                          {result.page && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              페이지 {result.page}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Result Content */}
                      <div className="mb-3">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {result.chunk_text}
                        </p>
                      </div>

                      {/* Result Footer */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {result.category && (
                            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-full">
                              {result.category}
                            </span>
                          )}
                        </div>
                        <button className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors">
                          자세히 보기
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
                  검색 결과가 없습니다
                </p>
                <p className="text-gray-500 dark:text-gray-500">
                  다른 키워드로 검색해보세요
                </p>
              </div>
            )}
          </div>
        )}

        {/* Info Box */}
        {!hasSearched && (
          <div className="max-w-3xl mx-auto mt-12">
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
              <h3 className="font-semibold text-purple-900 dark:text-purple-200 mb-3">
                💡 검색 팁
              </h3>
              <ul className="space-y-2 text-purple-800 dark:text-purple-300 text-sm">
                <li>• 자연어로 질문하세요 (예: "평가 기준은 무엇인가요?")</li>
                <li>• 키워드로 검색하세요 (예: "제안서 목차", "요구사항")</li>
                <li>
                  • 구체적인 내용을 검색할수록 정확한 결과를 얻을 수 있습니다
                </li>
                <li>• Vector DB는 의미적으로 유사한 내용도 찾아줍니다</li>
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
