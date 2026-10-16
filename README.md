# 학교용 웹앱 공통 템플릿

한국 초등학생 15~20명 규모의 수업용 정적 웹앱 시작점입니다.

## 구조
- `web/`: GitHub Pages로 배포하는 HTML/CSS/JS 화면. 설정 전에는 저장·AI 버튼 비활성화.
- `firestore.rules`: 익명 인증 사용자별 개인 메모만 접근 허용.
- `worker/`: Firebase ID 토큰을 검증하고 Gemini API를 호출하는 Cloudflare Worker.
- `.github/workflows/pages.yml`: GitHub Pages 배포 워크플로.
- `AGENTS.md`: Codex가 따를 개발·개인정보·비용 규칙.

## 처음 한 번 설정
1. GitHub Settings → Pages → Build and deployment → Source에서 **GitHub Actions** 선택.
2. Firebase 프로젝트 생성 (Spark 무료 플랜), 웹앱 등록, Authentication에서 Anonymous 활성화, Firestore 생성.
3. Firestore Rules에 `firestore.rules` 내용 게시. **테스트 모드의 공개 규칙을 사용하지 말 것.**
4. `web/config.js`에 Firebase **공개 웹 구성값** 입력. 이 값은 API 비밀키가 아니지만 프로젝트 보호 설정은 필요함.
5. Google AI Studio에서 현재 사용 가능한 Gemini 무료 티어 및 데이터 처리 약관 확인 후 API 키 생성. **학생 개인정보를 AI로 보내지 말 것.**
6. Cloudflare Worker 생성, `worker/src.js` 배포. KV namespace `QUOTA` 바인딩.
7. Worker 환경변수: `FIREBASE_PROJECT_ID`, `ALLOWED_ORIGIN=https://dimkum47-jpg.github.io`, `GEMINI_MODEL`(현재 지원 모델 확인). `GEMINI_API_KEY`는 **Secret**으로 저장.
8. `web/config.js`의 `workerUrl`을 실제 Worker 주소로 변경하고 배포 확인.
9. 학급 적용 전 학생 데이터 접근 제어, AI 요청 제한, 보관·삭제 정책을 시험.

## 주의
- 아직 외부 서비스가 연결되지 않은 시작 템플릿입니다. 배포만으로 저장·AI 기능이 동작하지 않습니다.
- 익명 로그인은 브라우저 단위이며 교사 대시보드/학생 신원 확인을 제공하지 않습니다.
- KV 질문 제한은 동시 요청 시 엄격하지 않습니다. 악용 방지 및 학교 보안 심사 후 실제 사용하세요.
- 무료 한도는 변동될 수 있으며 비용이 발생하는 플랜을 임의로 활성화하지 마세요.
- 새 앱은 이 저장소를 템플릿으로 복제하고, 학생 활동과 데이터 구조를 먼저 설계하세요.
