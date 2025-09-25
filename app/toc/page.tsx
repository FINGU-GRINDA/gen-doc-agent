"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Home,
  FileText,
  Loader2,
  Sparkles,
  List,
  ChevronRight,
  Copy,
  CheckCircle,
  FileCode,
  Eye,
} from "lucide-react";

interface TOCSection {
  id: string;
  number: string;
  title: string;
  level: number;
  children?: TOCSection[];
}

export default function TOCPage() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [toc, setToc] = useState<string>("");
  const [structuredTOC, setStructuredTOC] = useState<TOCSection[]>([]);
  const [error, setError] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"structured" | "text">("structured");

  const handleGenerateTOC = async () => {
    setIsGenerating(true);
    setError("");
    setToc("");
    setStructuredTOC([]);

    try {
      const response = await fetch("/api/toc/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectTitle: "AI 기반 제안서 작성 시스템", // 나중에 동적으로 변경 가능
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "목차 생성에 실패했습니다.");
      }

      setToc(data.toc);
      setStructuredTOC(data.structuredTOC || []);
    } catch (error) {
      console.error("TOC generation error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "목차 생성 중 오류가 발생했습니다."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyTOC = async () => {
    try {
      await navigator.clipboard.writeText(toc);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  // 재귀적으로 목차 항목을 렌더링하는 컴포넌트
  const TOCItem = ({ section }: { section: TOCSection }) => (
    <div className={`${section.level === 2 ? "ml-6" : ""}`}>
      <div className="flex items-start gap-3 py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
        <span className="font-mono text-sm text-indigo-600 dark:text-indigo-400 flex-shrink-0">
          {section.number}
        </span>
        <span className="text-gray-700 dark:text-gray-300">
          {section.title}
        </span>
      </div>
      {section.children && section.children.length > 0 && (
        <div className="ml-2">
          {section.children.map((child) => (
            <TOCItem key={child.id} section={child} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
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
              <List className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                제안서 목차 생성
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Sparkles className="w-4 h-4" />
            <span>Powered by Gemini AI</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            AI 기반 목차 자동 생성
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            RFP 문서를 분석하여 최적화된 제안서 목차를 생성합니다
          </p>
        </div>

        {/* Generate Button */}
        <div className="flex justify-center mb-12">
          <button
            onClick={handleGenerateTOC}
            disabled={isGenerating}
            className="group px-8 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-3"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                목차 생성 중...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                목차 생성하기
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Generated TOC */}
        {toc && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                생성된 목차
              </h3>
              <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("structured")}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                      viewMode === "structured"
                        ? "bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      구조화
                    </div>
                  </button>
                  <button
                    onClick={() => setViewMode("text")}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                      viewMode === "text"
                        ? "bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <FileCode className="w-4 h-4" />
                      텍스트
                    </div>
                  </button>
                </div>
                <button
                  onClick={handleCopyTOC}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-all"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      복사됨!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      복사하기
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Content based on view mode */}
            {viewMode === "structured" ? (
              <div className="space-y-1">
                {structuredTOC.map((section) => (
                  <TOCItem key={section.id} section={section} />
                ))}
              </div>
            ) : (
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-gray-700 dark:text-gray-300 leading-relaxed">
                  {toc}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Information Box */}
        <div className="mt-12 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-6">
          <h3 className="font-semibold text-indigo-900 dark:text-indigo-200 mb-3">
            💡 목차 생성 프로세스
          </h3>
          <ol className="space-y-2 text-indigo-800 dark:text-indigo-300 text-sm">
            <li>1. RFP 문서에서 목차 관련 내용 검색</li>
            <li>2. 평가 기준 및 요구사항 분석</li>
            <li>3. Gemini AI를 통한 최적화된 목차 구성</li>
            <li>4. 업계 표준 및 베스트 프랙티스 반영</li>
          </ol>
        </div>
      </main>
    </div>
  );
}
