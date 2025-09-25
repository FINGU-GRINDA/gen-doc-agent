"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  Home,
  Loader2,
  CheckCircle,
  AlertCircle,
  Database,
  FileSearch,
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<"rfp" | "reference">("rfp");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleParseDocument = async () => {
    if (!selectedFile && fileType === "reference") {
      setUploadStatus({
        type: "error",
        message: "레퍼런스 문서는 파일을 선택해야 합니다.",
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus({ type: null, message: "" });

    try {
      let response;

      if (selectedFile) {
        // 파일 업로드
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("fileType", fileType);

        response = await fetch("/api/documents/parse", {
          method: "POST",
          body: formData,
        });
      } else {
        // 기존 data.pdf 사용
        response = await fetch("/api/documents/parse", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to parse document");
      }

      setUploadStatus({
        type: "success",
        message: `문서가 성공적으로 파싱되어 ${data.stats.totalChunks}개의 청크로 인덱싱되었습니다.`,
      });
    } catch (error) {
      console.error("Parse error:", error);
      setUploadStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "문서 파싱 중 오류가 발생했습니다.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
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
              <Database className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                문서 관리
              </h1>
            </div>
          </div>
          <button
            onClick={() => router.push("/search")}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 rounded-lg transition-all"
          >
            <FileSearch className="w-4 h-4" />
            검색 페이지로
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            문서 업로드 및 인덱싱
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            RFP 문서와 레퍼런스 문서를 Pinecone Vector DB에 인덱싱합니다
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
          <div className="space-y-6">
            {/* 파일 종류 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                문서 종류
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="rfp"
                    checked={fileType === "rfp"}
                    onChange={(e) =>
                      setFileType(e.target.value as "rfp" | "reference")
                    }
                    className="mr-2 text-blue-600"
                  />
                  <span className="text-sm">RFP 문서 (제안요청서)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="reference"
                    checked={fileType === "reference"}
                    onChange={(e) =>
                      setFileType(e.target.value as "rfp" | "reference")
                    }
                    className="mr-2 text-blue-600"
                  />
                  <span className="text-sm">레퍼런스 문서 (참고자료)</span>
                </label>
              </div>
            </div>

            {/* 파일 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                PDF 파일 선택
              </label>
              {fileType === "rfp" ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    기본 RFP 파일(data/data.pdf)을 사용하거나 새 파일을 업로드할
                    수 있습니다.
                  </p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) =>
                      setSelectedFile(e.target.files?.[0] || null)
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    레퍼런스 문서를 업로드하세요. (필수)
                  </p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) =>
                      setSelectedFile(e.target.files?.[0] || null)
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              )}
              {selectedFile && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  선택된 파일: {selectedFile.name}
                </p>
              )}
            </div>

            {/* 설명 */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>참고:</strong>
                {fileType === "rfp"
                  ? " RFP 문서는 제안서 목차 생성과 내용 작성에 사용됩니다."
                  : " 레퍼런스 문서는 제안서 작성 시 문체, 스타일, 유사 내용을 참고하는데 사용됩니다."}
              </p>
            </div>

            <button
              onClick={handleParseDocument}
              disabled={
                isUploading || (fileType === "reference" && !selectedFile)
              }
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  파싱 중...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  문서 파싱 및 인덱싱
                </>
              )}
            </button>
          </div>

          {/* Status Message */}
          {uploadStatus.type && (
            <div
              className={`mt-6 p-4 rounded-lg flex items-start gap-3 ${
                uploadStatus.type === "success"
                  ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200"
                  : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200"
              }`}
            >
              {uploadStatus.type === "success" ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <p>{uploadStatus.message}</p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-3">
            🔧 환경 설정 안내
          </h3>
          <div className="space-y-3 text-sm text-blue-800 dark:text-blue-300">
            <p>다음 환경 변수를 .env.local 파일에 설정해주세요:</p>
            <pre className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg overflow-x-auto">
              {`# API Keys
UPSTAGE_API_KEY=your_upstage_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here

# Pinecone Configuration
PINECONE_INDEX_NAME=rfp-documents
PINECONE_NAMESPACE=rfp-namespace`}
            </pre>
            <div className="mt-4">
              <p className="font-medium mb-2">API 키 발급:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  Upstage API:{" "}
                  <a
                    href="https://console.upstage.ai"
                    target="_blank"
                    className="underline"
                  >
                    https://console.upstage.ai
                  </a>
                </li>
                <li>
                  Pinecone API:{" "}
                  <a
                    href="https://www.pinecone.io"
                    target="_blank"
                    className="underline"
                  >
                    https://www.pinecone.io
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Process Flow */}
        <div className="mt-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            📋 처리 프로세스
          </h3>
          <ol className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-semibold text-xs">
                1
              </span>
              <div>
                <p className="font-medium">PDF 문서 파싱</p>
                <p className="text-gray-600 dark:text-gray-400">
                  Upstage Document Parser API를 사용하여 PDF 내용 추출
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-semibold text-xs">
                2
              </span>
              <div>
                <p className="font-medium">텍스트 청킹</p>
                <p className="text-gray-600 dark:text-gray-400">
                  문서를 적절한 크기의 청크로 분할 (약 500자)
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-semibold text-xs">
                3
              </span>
              <div>
                <p className="font-medium">벡터 임베딩 및 저장</p>
                <p className="text-gray-600 dark:text-gray-400">
                  Pinecone에서 자동으로 임베딩 생성 및 저장
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-semibold text-xs">
                4
              </span>
              <div>
                <p className="font-medium">검색 준비 완료</p>
                <p className="text-gray-600 dark:text-gray-400">
                  검색 페이지에서 자연어 검색 가능
                </p>
              </div>
            </li>
          </ol>
        </div>
      </main>
    </div>
  );
}
