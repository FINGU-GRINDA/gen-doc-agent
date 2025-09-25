# 제안서 생성 웹사이트

AI 기반 제안서 작성 도구로, 제안요청서(RFP) 문서를 검색하고 참조하여 맞춤형 제안서를 생성할 수 있습니다.

## 🚀 주요 기능

### 1. **제안서 생성** (`/`)

- 프로젝트 정보 입력
- 평가 기준 설정
- AI 기반 제안서 자동 생성

### 2. **문서 편집** (`/editor`)

- 실시간 문서 편집
- 좌측 목차 네비게이션
- AI 채팅 어시스턴트
- 텍스트 드래그 → 채팅 연동

### 3. **RFP 검색** (`/search`)

- Pinecone Vector DB 기반 의미 검색
- Upstage Document Parser로 PDF 파싱
- 관련도 기반 결과 정렬
- Reranking 지원

### 4. **문서 관리** (`/admin`)

- PDF 문서 업로드
  - RFP 문서: 제안서 목차 생성 및 내용 작성 참고
  - 레퍼런스 문서: 문체, 스타일, 유사 내용 참고
- 자동 파싱 및 인덱싱
- Vector DB 관리

### 5. **목차 생성** (`/toc`)

- RFP 분석 기반 목차 자동 생성
- Gemini AI 활용
- 업계 표준 반영
- 복사 기능 제공

## 🛠 기술 스택

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **AI/ML**: Upstage Document Parser, Pinecone Vector DB, Google Gemini
- **기타**: Docker 지원

## 📋 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# API Keys
UPSTAGE_API_KEY=your_upstage_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Pinecone Configuration
PINECONE_INDEX_NAME=rfp-documents
PINECONE_NAMESPACE=rfp-namespace
```

#### API 키 발급:

- **Upstage API**: https://console.upstage.ai
- **Pinecone API**: https://www.pinecone.io
- **Gemini API**: https://makersuite.google.com/app/apikey

### 3. PDF 문서 준비

`data/data.pdf` 파일을 추가하세요. 이 파일은 제안요청서(RFP) 문서여야 합니다.

### 4. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 확인할 수 있습니다.

### 5. 문서 인덱싱

1. `/admin` 페이지로 이동
2. "문서 파싱 및 인덱싱" 버튼 클릭
3. 완료 후 `/search` 페이지에서 검색 가능

## 🐳 Docker로 실행

```bash
docker-compose up
```

## 📁 프로젝트 구조

```
gen-doc-front/
├── app/
│   ├── api/
│   │   ├── documents/
│   │   │   ├── parse/          # PDF 파싱 API
│   │   │   └── search/         # 검색 API
│   │   └── toc/
│   │       └── generate/       # 목차 생성 API
│   ├── admin/                  # 관리자 페이지
│   ├── editor/                 # 문서 편집기
│   ├── search/                 # RFP 검색
│   ├── toc/                    # 목차 생성
│   └── page.tsx               # 메인 페이지
├── data/
│   └── data.pdf               # RFP 문서 (사용자 추가 필요)
├── docker-compose.yml
├── Dockerfile
└── README.md
```

## 🔍 사용 방법

### 제안서 생성 플로우

1. **문서 업로드** (`/admin`)
   - RFP 문서와 레퍼런스 문서 업로드
   - Vector DB에 자동 인덱싱
2. **메인 페이지**에서 프로젝트 제목 입력
3. **목차 생성** - RFP 분석을 통한 맞춤형 목차 생성
4. **목차 확인** - 구조화된 뷰와 텍스트 뷰로 목차 검토
5. **제안서 생성**
   - RFP 요구사항 기반 내용 작성
   - 레퍼런스 문서의 스타일과 문체 참고
6. **편집기**에서 생성된 제안서 확인 및 수정
7. AI 채팅으로 실시간 수정
