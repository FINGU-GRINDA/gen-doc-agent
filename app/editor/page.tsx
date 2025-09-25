"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Home,
  Send,
  ChevronLeft,
  ChevronRight,
  Download,
  Save,
  MessageSquare,
  X,
  Maximize2,
  Minimize2,
  AlertCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

// 더미 데이터 (로컬스토리지에 데이터가 없을 때 사용)
const dummyDocument = {
  title: "7B LLM을 활용한 사내 문서 연동 챗봇 개발 제안서",
  sections: [
    {
      id: "1",
      title: "1. 프로젝트 개요",
      content: `### 1.1 프로젝트 배경

현재 기업 환경에서는 방대한 양의 내부 문서와 지식이 분산되어 있어, 직원들이 필요한 정보를 신속하게 찾고 활용하는 데 어려움을 겪고 있습니다. 이러한 문제를 해결하기 위해 7B 파라미터 규모의 경량화된 대규모 언어모델(LLM)을 활용한 사내 문서 연동 챗봇을 개발하고자 합니다.

### 1.2 프로젝트 목표

- **정보 접근성 향상**: 직원들이 자연어로 질문하여 필요한 정보를 즉시 얻을 수 있도록 지원
- **업무 효율성 증대**: 문서 검색 시간 단축 및 정확한 정보 제공을 통한 생산성 향상
- **비용 효율성**: 7B 모델 사용으로 인프라 비용 절감 및 온프레미스 배포 가능
- **보안성 강화**: 사내 데이터의 외부 유출 없이 안전한 환경에서 운영`,
    },
    {
      id: "2",
      title: "2. 기술 아키텍처",
      content: `### 2.1 시스템 구성도

본 시스템은 크게 4개의 주요 컴포넌트로 구성됩니다:

**1) LLM 엔진 레이어**
- 7B 파라미터 오픈소스 LLM (Llama 2, Mistral 등)
- 모델 최적화 및 양자화를 통한 경량화
- GPU 서버 또는 고사양 CPU 서버에서 운영

**2) 문서 처리 파이프라인**
- 문서 수집 및 전처리 모듈
- 벡터 임베딩 생성 및 저장
- RAG(Retrieval-Augmented Generation) 시스템

**3) 애플리케이션 레이어**
- RESTful API 서버
- WebSocket 기반 실시간 통신
- 사용자 인증 및 권한 관리

**4) 사용자 인터페이스**
- 웹 기반 채팅 인터페이스
- 모바일 반응형 디자인
- 다중 언어 지원`,
    },
    {
      id: "3",
      title: "3. 구현 계획",
      content: `### 3.1 개발 단계

**Phase 1: 기반 구축 (4주)**
- 인프라 환경 구성
- LLM 모델 선정 및 최적화
- 기본 RAG 파이프라인 구축

**Phase 2: 핵심 기능 개발 (6주)**
- 문서 수집 및 인덱싱 시스템 개발
- 챗봇 엔진 구현
- API 서버 개발

**Phase 3: 인터페이스 구현 (4주)**
- 웹 UI/UX 디자인 및 개발
- 관리자 대시보드 구축
- 모바일 최적화

**Phase 4: 테스트 및 최적화 (4주)**
- 성능 테스트 및 튜닝
- 사용자 피드백 수집 및 반영
- 보안 점검 및 강화

### 3.2 필요 리소스

- **인력**: AI 엔지니어 2명, 백엔드 개발자 2명, 프론트엔드 개발자 1명
- **인프라**: GPU 서버 (A100 40GB 이상) 또는 고사양 CPU 서버
- **기간**: 총 18주 (약 4.5개월)`,
    },
    {
      id: "4",
      title: "4. 기대 효과",
      content: `### 4.1 정량적 효과

- **정보 검색 시간 단축**: 평균 검색 시간 80% 감소 (30분 → 6분)
- **문서 활용률 증가**: 사내 문서 활용도 3배 이상 증가
- **인건비 절감**: 연간 약 2억원의 인건비 절감 효과
- **처리 속도**: 초당 20개 이상의 동시 질의 처리 가능

### 4.2 정성적 효과

- **지식 공유 문화 활성화**: 부서 간 정보 사일로 해소
- **의사결정 품질 향상**: 데이터 기반 의사결정 지원
- **직원 만족도 증대**: 업무 스트레스 감소 및 효율성 향상
- **혁신 문화 조성**: AI 기술 도입을 통한 디지털 트랜스포메이션 가속화`,
    },
    {
      id: "5",
      title: "5. 예산 계획",
      content: `### 5.1 초기 투자 비용

**하드웨어 (1회성)**
- GPU 서버: 5,000만원
- 스토리지 시스템: 2,000만원
- 네트워크 장비: 1,000만원

**소프트웨어 라이선스**
- 벡터 DB 라이선스: 연 1,200만원
- 모니터링 도구: 연 600만원

**개발 비용**
- 인건비 (18주): 9,000만원
- 외주 개발: 3,000만원

### 5.2 운영 비용 (연간)

- 서버 유지보수: 1,200만원
- 전력 및 냉각: 600만원
- 기술 지원: 1,800만원
- 모델 업데이트: 1,200만원

**총 초기 투자**: 2억 1,600만원
**연간 운영비**: 6,600만원`,
    },
    {
      id: "6",
      title: "6. 리스크 관리",
      content: `### 6.1 기술적 리스크

**리스크 1: 모델 성능 미달**
- 대응: 파인튜닝 및 프롬프트 엔지니어링 최적화
- 예방: 초기 PoC를 통한 성능 검증

**리스크 2: 확장성 문제**
- 대응: 로드 밸런싱 및 분산 처리 아키텍처 도입
- 예방: 스트레스 테스트 및 단계적 확장 계획 수립

### 6.2 운영적 리스크

**리스크 3: 데이터 보안 우려**
- 대응: 엄격한 접근 권한 관리 및 암호화
- 예방: 보안 감사 및 정기적인 취약점 점검

**리스크 4: 사용자 적응 어려움**
- 대응: 직관적 UI/UX 설계 및 교육 프로그램 제공
- 예방: 사용자 피드백 기반 지속적 개선`,
    },
  ],
};

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  selectedText?: string;
}

export default function EditorPage() {
  const router = useRouter();
  const [proposalDoc, setProposalDoc] = useState(dummyDocument);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "안녕하세요! 제안서 수정을 도와드리겠습니다. 수정하고 싶은 부분을 드래그하거나 직접 질문해주세요.",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // localStorage에서 생성된 제안서 데이터 로드
  useEffect(() => {
    const loadProposal = () => {
      try {
        const savedProposal = localStorage.getItem("generatedProposal");

        if (savedProposal && savedProposal !== "undefined") {
          try {
            const proposalData = JSON.parse(savedProposal);

            // 데이터 유효성 검증
            if (
              proposalData &&
              typeof proposalData === "object" &&
              proposalData.title
            ) {
              setProposalDoc({
                title: proposalData.title || "제안서",
                sections: Array.isArray(proposalData.sections)
                  ? proposalData.sections
                  : [],
              });

              if (proposalData.sections && proposalData.sections.length > 0) {
                setActiveSection(proposalData.sections[0].id);
              }
            } else {
              console.warn("Invalid proposal data structure, using dummy data");
              if (dummyDocument.sections.length > 0) {
                setActiveSection(dummyDocument.sections[0].id);
              }
            }
          } catch (parseError) {
            console.error("Failed to parse proposal data:", parseError);
            console.log("Saved data:", savedProposal);
            // 파싱 실패 시 localStorage 정리
            localStorage.removeItem("generatedProposal");
            // 더미 데이터 사용
            if (dummyDocument.sections.length > 0) {
              setActiveSection(dummyDocument.sections[0].id);
            }
          }
        } else {
          // 저장된 데이터가 없는 경우 더미 데이터 사용
          if (dummyDocument.sections.length > 0) {
            setActiveSection(dummyDocument.sections[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to load proposal:", error);
        if (dummyDocument.sections.length > 0) {
          setActiveSection(dummyDocument.sections[0].id);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadProposal();
  }, []);

  // 텍스트 선택 감지
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        setSelectedText(selection.toString());
      }
    };

    document.addEventListener("mouseup", handleSelection);
    return () => document.removeEventListener("mouseup", handleSelection);
  }, []);

  // 채팅 스크롤
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim() && !selectedText) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage,
      selectedText: selectedText,
    };

    setMessages([...messages, newMessage]);

    // 더미 응답 생성
    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "네, 해당 부분을 수정해드리겠습니다. 어떻게 변경하시겠습니까?",
      };
      setMessages((prev) => [...prev, response]);
    }, 1000);

    setInputMessage("");
    setSelectedText("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            제안서를 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="h-14 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Home className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h1 className="font-semibold text-gray-900 dark:text-white">
              {proposalDoc.title}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2">
            <Save className="w-4 h-4" />
            저장
          </button>
          <button className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            내보내기
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Table of Contents */}
        <aside
          className={`${
            sidebarCollapsed ? "w-12" : "w-64"
          } bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col`}
        >
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            {!sidebarCollapsed && (
              <h2 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                목차
              </h2>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>
          {!sidebarCollapsed && (
            <nav className="flex-1 overflow-y-auto p-3">
              <ul className="space-y-1">
                {proposalDoc.sections.map((section) => (
                  <li key={section.id}>
                    <button
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeSection === section.id
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {section.title}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Document Content */}
          <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800">
            <div ref={contentRef} className="max-w-4xl mx-auto p-8">
              {proposalDoc.sections.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    제안서 내용이 없습니다. 메인 페이지에서 제안서를
                    생성해주세요.
                  </p>
                </div>
              ) : (
                proposalDoc.sections.map((section) => (
                  <section
                    key={section.id}
                    id={`section-${section.id}`}
                    className="mb-12"
                  >
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                      {section.title}
                    </h2>
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                      <ReactMarkdown>{section.content}</ReactMarkdown>
                    </div>
                  </section>
                ))
              )}
            </div>
          </div>

          {/* Chat Interface */}
          <div
            className={`${
              chatExpanded ? "h-96" : "h-48"
            } border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all duration-300`}
          >
            {/* Chat Header */}
            <div className="h-10 px-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  AI 어시스턴트
                </span>
                {selectedText && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded">
                    텍스트 선택됨
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setChatExpanded(!chatExpanded)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  {chatExpanded ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div
              className={`${
                chatExpanded ? "h-72" : "h-24"
              } overflow-y-auto p-4 space-y-3`}
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-2xl px-4 py-2 rounded-lg ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                    }`}
                  >
                    {message.selectedText && (
                      <div className="text-xs opacity-75 mb-1 italic">
                        선택된 텍스트: "{message.selectedText.substring(0, 50)}
                        ..."
                      </div>
                    )}
                    {message.content}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="h-14 px-4 py-2 border-t border-gray-200 dark:border-gray-700 flex gap-2">
              {selectedText && (
                <div className="flex items-center px-2 bg-blue-50 dark:bg-blue-900/30 rounded text-xs text-blue-600 dark:text-blue-400">
                  <span className="truncate max-w-xs">
                    "{selectedText.substring(0, 30)}..."
                  </span>
                  <button
                    onClick={() => setSelectedText("")}
                    className="ml-2 hover:text-blue-800 dark:hover:text-blue-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  selectedText
                    ? "선택된 텍스트를 어떻게 수정할까요?"
                    : "메시지를 입력하세요..."
                }
                className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={handleSendMessage}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                전송
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
