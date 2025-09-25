# 🚀 빠른 설정 가이드

## 1. 환경 변수 설정

`.env.local` 파일을 프로젝트 루트에 생성하고 다음 내용을 추가하세요:

```env
# API Keys
UPSTAGE_API_KEY=your_upstage_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Pinecone Configuration
PINECONE_INDEX_NAME=rfp-documents
PINECONE_NAMESPACE=rfp-namespace
```

## 2. API 키 발급 방법

### Upstage API 키

1. https://console.upstage.ai 접속
2. 회원가입/로그인
3. API Keys 메뉴에서 새 키 생성
4. Document Parser API 권한 확인

### Pinecone API 키

1. https://www.pinecone.io 접속
2. 회원가입/로그인
3. API Keys 섹션에서 키 복사
4. Free tier로도 충분 (5GB 스토리지)

### Gemini API 키

1. https://makersuite.google.com/app/apikey 접속
2. Google 계정으로 로그인
3. "Create API Key" 클릭
4. 생성된 API 키 복사
5. 무료 tier 제공 (분당 60 요청)

## 3. PDF 문서 준비

`data/data.pdf` 파일을 추가하세요.

예시 RFP 문서 내용:

- 프로젝트 개요 및 목적
- 평가 기준 (기술성, 가격, 수행능력 등)
- 제안서 작성 가이드
- 요구사항 명세

## 4. 실행 순서

```bash
# 1. 의존성 설치
npm install

# 2. 개발 서버 실행
npm run dev

# 3. 브라우저에서 확인
open http://localhost:3000

# 4. 관리자 페이지에서 문서 파싱
# http://localhost:3000/admin

# 5. 검색 페이지에서 테스트
# http://localhost:3000/search
```

## 5. API 테스트

```bash
# 서버 실행 상태에서
npm run test-api
```

## 6. 문제 해결

### "PDF file not found" 오류

- `data/data.pdf` 파일이 있는지 확인
- 파일 경로가 정확한지 확인

### "PINECONE_API_KEY is not set" 오류

- `.env.local` 파일이 있는지 확인
- 서버를 재시작 (`Ctrl+C` 후 `npm run dev`)

### 검색 결과가 없는 경우

1. `/admin` 페이지에서 문서 파싱 먼저 실행
2. 파싱 성공 메시지 확인
3. 1-2분 대기 후 검색 재시도

## 7. Docker 사용 (선택사항)

```bash
# Docker Compose로 실행
docker-compose up

# 또는 수동으로 빌드
docker build -t gen-doc-front .
docker run -p 3000:3000 --env-file .env.local gen-doc-front
```

## 📝 참고사항

- Pinecone Free tier는 1개 인덱스만 지원
- Upstage API는 유료 (크레딧 기반)
- 큰 PDF 파일은 파싱에 시간이 걸릴 수 있음
- Vector 검색은 의미적 유사성을 기반으로 작동
