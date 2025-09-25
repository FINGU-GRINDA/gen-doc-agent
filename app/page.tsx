"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  ArrowRight,
  FileSearch,
  Settings,
  List,
  CheckCircle,
  Eye,
  FileCode,
} from "lucide-react";

interface TOCSection {
  id: string;
  number: string;
  title: string;
  level: number;
  children?: TOCSection[];
}

export default function Home() {
  const router = useRouter();
  const [projectTitle, setProjectTitle] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [error, setError] = useState("");
  const [toc, setToc] = useState<TOCSection[]>([]);
  const [tocText, setTocText] = useState("");
  const [viewMode, setViewMode] = useState<"structured" | "text">("structured");
  const [step, setStep] = useState<"input" | "toc" | "generating">("input");

  // 목차 생성
  const handleGenerateTOC = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError("");

    try {
      const response = await fetch("/api/proposal/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectTitle,
          generateContent: false, // 목차만 생성
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "목차 생성에 실패했습니다.");
      }

      // 데이터 구조 확인 및 설정
      if (data.toc && Array.isArray(data.toc)) {
        setToc(data.toc);
      } else {
        console.error("Invalid toc format:", data.toc);
        setToc([]);
      }

      if (data.tocText) {
        setTocText(data.tocText);
      } else {
        console.error("Missing tocText:", data.tocText);
        setTocText("");
      }

      setStep("toc");
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

  // 제안서 내용 생성
  const handleGenerateProposal = async () => {
    setIsGeneratingContent(true);
    setError("");
    setStep("generating");

    try {
      const response = await fetch("/api/proposal/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectTitle,
          generateContent: true,
          toc, // 생성된 목차 전달
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "제안서 생성에 실패했습니다.");
      }

      // 생성된 제안서 데이터를 localStorage에 저장
      localStorage.setItem("generatedProposal", JSON.stringify(data.proposal));

      // 편집기 페이지로 이동
      router.push("/editor");
    } catch (error) {
      console.error("Proposal generation error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "제안서 생성 중 오류가 발생했습니다."
      );
      setStep("toc");
    } finally {
      setIsGeneratingContent(false);
    }
  };

  // 재귀적으로 목차 항목을 렌더링하는 컴포넌트
  const TOCItem = ({ section }: { section: TOCSection }) => (
    <div className={`${section.level === 2 ? "ml-6" : ""}`}>
      <div className="flex items-start gap-3 py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
        <span className="font-mono text-sm text-blue-600 dark:text-blue-400 flex-shrink-0">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              제안서 생성 도구
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/toc")}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
            >
              <List className="w-4 h-4" />
              목차 생성
            </button>
            <button
              onClick={() => router.push("/search")}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 rounded-lg transition-all"
            >
              <FileSearch className="w-4 h-4" />
              RFP 검색
            </button>
            <button
              onClick={() => router.push("/admin")}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-all"
            >
              <Settings className="w-4 h-4" />
              관리
            </button>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              v1.0.0 Demo
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* 단계별 진행 표시 */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div
              className={`flex items-center ${
                step === "input" ? "text-blue-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  step === "input"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-300"
                }`}
              >
                1
              </div>
              <span className="ml-2 text-sm font-medium">프로젝트 입력</span>
            </div>
            <div className="w-8 h-px bg-gray-300"></div>
            <div
              className={`flex items-center ${
                step === "toc"
                  ? "text-blue-600"
                  : step === "generating"
                  ? "text-green-600"
                  : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  step === "toc"
                    ? "border-blue-600 bg-blue-50"
                    : step === "generating"
                    ? "border-green-600 bg-green-50"
                    : "border-gray-300"
                }`}
              >
                2
              </div>
              <span className="ml-2 text-sm font-medium">목차 확인</span>
            </div>
            <div className="w-8 h-px bg-gray-300"></div>
            <div
              className={`flex items-center ${
                step === "generating" ? "text-blue-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  step === "generating"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-300"
                }`}
              >
                3
              </div>
              <span className="ml-2 text-sm font-medium">제안서 생성</span>
            </div>
          </div>
        </div>

        {/* 에러 메시지 - 모든 step에서 표시 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Step 1: 프로젝트 입력 */}
        {step === "input" && (
          <>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                AI 제안서 자동 생성
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                프로젝트 제목만 입력하면 RFP 분석을 통해 맞춤형 목차를
                생성합니다
              </p>
            </div>

            <form onSubmit={handleGenerateTOC} className="space-y-8">
              {/* 프로젝트 제목 */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  프로젝트 제목
                </label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="예) 7B LLM을 활용한 사내 문서 연동 챗봇 개발"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all text-lg"
                  required
                  disabled={isGenerating}
                />
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  프로젝트의 핵심 내용을 담은 제목을 입력해주세요
                </p>
              </div>

              {/* 제출 버튼 */}
              <div className="flex justify-center pt-4">
                <button
                  type="submit"
                  disabled={isGenerating || !projectTitle.trim()}
                  className="group px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-3"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      목차 생성 중...
                    </>
                  ) : (
                    <>
                      목차 생성하기
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* 프로세스 안내 */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">
                    1
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  RFP 분석
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">
                    2
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  목차 생성
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">
                    3
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  내용 작성
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">
                    4
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  제안서 완성
                </p>
              </div>
            </div>

            {/* 안내 메시지 */}
            <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                💡 <strong>참고:</strong> RFP 문서가 Vector DB에 업로드되어
                있어야 합니다. 문서 업로드는 <strong>관리</strong> 페이지에서
                진행해주세요.
              </p>
            </div>
          </>
        )}

        {/* Step 2: 목차 확인 */}
        {step === "toc" && (
          <>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                생성된 목차를 확인하세요
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {projectTitle} 프로젝트를 위한 제안서 목차
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  제안서 목차
                </h3>
                <div className="flex items-center gap-2">
                  {/* View Mode Toggle */}
                  <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode("structured")}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                        viewMode === "structured"
                          ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
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
                          ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <FileCode className="w-4 h-4" />
                        텍스트
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Content based on view mode */}
              {viewMode === "structured" ? (
                <div className="space-y-1">
                  {toc && toc.length > 0 ? (
                    toc.map((section) => (
                      <TOCItem key={section.id} section={section} />
                    ))
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                      목차를 불러오는 중... 잠시만 기다려주세요.
                    </p>
                  )}
                </div>
              ) : (
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    {tocText || "목차를 불러오는 중..."}
                  </pre>
                </div>
              )}
            </div>

            {/* 버튼 영역 */}
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setStep("input");
                  setToc([]);
                  setTocText("");
                }}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-colors"
              >
                다시 작성
              </button>
              <button
                onClick={handleGenerateProposal}
                disabled={isGeneratingContent}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
              >
                {isGeneratingContent ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    제안서 생성 중...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />이 목차로 제안서 생성하기
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {/* Step 3: 제안서 생성 중 */}
        {step === "generating" && (
          <div className="text-center py-12">
            <div className="mb-8">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                제안서를 생성하고 있습니다
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                각 섹션별로 RFP를 분석하여 내용을 작성 중입니다...
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                약 2-3분 정도 소요됩니다
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
