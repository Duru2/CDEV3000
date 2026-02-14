# Traffic Light AI Monitor - Chrome Extension

교사가 학생들의 AI 사용을 모니터링하는 Chrome/Edge 브라우저 확장 프로그램입니다. 신호등 시스템(🔴 빨강, 🟡 노랑, 🟢 초록)을 사용하여 적절한 AI 도구 사용을 추적합니다.

## 주요 기능

### 🚦 신호등 모니터링 시스템
- **🟢 초록**: 안전한 브라우징, AI 미감지
- **🟡 노랑**: AI 도구 사용 중 (주의 필요)
- **🔴 빨강**: 학업 플랫폼에서 AI 사용 (금지)

### ⏸️ 스누즈 기능 (NEW!)
- **자동 차단**: 5회 연속 빨간불 위반 시 10분간 AI 접근 차단
- **위반 카운터**: 실시간 위반 횟수 표시
- **타이머**: 남은 차단 시간 카운트다운
- **설정 가능**: 위반 임계값 및 차단 시간 조정 가능

### 📊 기타 기능
- 실시간 활동 로그
- 사용자 정의 규칙
- 설정 내보내기/가져오기
- 로컬 전용 처리 (프라이버시 보호)

## 설치 방법

### Chrome/Edge에 설치

1. Chrome 또는 Edge 브라우저 열기
2. `chrome://extensions/` 로 이동
3. 우측 상단의 **"개발자 모드"** 활성화
4. **"압축해제된 확장 프로그램을 로드합니다"** 클릭
5. `CDEV3000/browser-extension/` 폴더 선택
6. 설치 완료! 🎉

## 사용 방법

### 기본 사용
1. 확장 프로그램 아이콘을 클릭하여 현재 상태 확인
2. 배지 색상으로 실시간 상태 모니터링
3. 설정 페이지에서 규칙 커스터마이징

### 스누즈 기능
1. 학업 플랫폼에서 AI 사용 시 빨간불 발생
2. 5회 연속 위반 시 자동으로 스누즈 활성화
3. AI 웹사이트 접근 시 경고 페이지로 리디렉션
4. 10분 후 자동 해제 또는 수동 리셋 가능

## 프로젝트 구조

```
traffic-light-ai-monitor/
├── CDEV3000/
│   └── browser-extension/      # Chrome 확장 프로그램
│       ├── manifest.json       # 확장 프로그램 설정
│       ├── background.js       # 백그라운드 서비스 워커
│       ├── content.js         # 페이지 분석 스크립트
│       ├── popup.html/js      # 팝업 UI
│       ├── settings.html/js   # 설정 페이지
│       ├── blocked.html       # 스누즈 경고 페이지
│       ├── styles.css         # 공통 스타일
│       ├── rules.json         # 기본 모니터링 규칙
│       └── icons/             # 확장 프로그램 아이콘
└── README.md                  # 이 파일
```

## 모니터링 규칙

### 기본 AI 웹사이트
- ChatGPT (chat.openai.com)
- Claude (claude.ai)
- Gemini (gemini.google.com)
- Microsoft Copilot (copilot.microsoft.com)
- Perplexity (perplexity.ai)

### 기본 학업 플랫폼
- Canvas LMS (*.instructure.com)
- Blackboard (*.blackboard.com)
- Google Classroom (classroom.google.com)
- Turnitin (turnitin.com)

설정 페이지에서 사용자 정의 웹사이트 및 플랫폼을 추가할 수 있습니다.

## 스누즈 설정

설정 페이지에서 다음을 구성할 수 있습니다:

- **스누즈 활성화/비활성화**: 기능 켜기/끄기
- **위반 임계값**: 1-20회 (기본값: 5회)
- **스누즈 시간**: 1-120분 (기본값: 10분)
- **수동 리셋**: 현재 스누즈 즉시 해제

## 개발 정보

### 기술 스택
- Manifest V3
- Vanilla JavaScript
- Chrome Extension APIs
- Chrome Storage API
- Chrome Notifications API

### 주요 파일 설명

**background.js**
- 탭 모니터링 및 URL 추적
- AI 웹사이트 감지
- 규칙 평가 엔진
- 스누즈 로직 및 위반 추적
- 배지 색상 업데이트

**content.js**
- 페이지 컨텍스트 감지 (채점 시스템, LMS 플랫폼)
- 사용자 상호작용 모니터링
- 백그라운드 워커에 활동 보고

**popup.html/js**
- 현재 신호등 상태 표시
- 스누즈 카운트다운 타이머
- 위반 카운터
- 최근 활동 로그

**settings.html/js**
- 사용자 정의 규칙 구성
- 스누즈 매개변수 설정
- 설정 내보내기/가져오기

**blocked.html**
- 스누즈 중 AI 웹사이트 접근 시 표시되는 경고 페이지
- 실시간 카운트다운 타이머
- 차단 이유 설명

## 프라이버시

- ✅ 모든 처리는 로컬에서 수행 (외부 서버 없음)
- ✅ 데이터 수집 없음 (활동 로그는 기기에 저장)
- ✅ 네트워크 요청 없음 (규칙은 로컬 파일에서 로드)
- ✅ 최소 권한 (tabs, storage, activeTab, notifications만 사용)

## 라이선스

이 프로젝트는 교육 목적으로 만들어졌습니다.

## 지원

문제가 발생하거나 기능 요청이 있으면 GitHub Issues를 통해 알려주세요.

---

**Made with ❤️ for responsible AI usage in education**
