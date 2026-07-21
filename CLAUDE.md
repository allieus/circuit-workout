# 서킷 뽑기 (circuit-workout)

홈트용 서킷 운동 랜덤 생성기 + 음성 가이드 타이머 PWA. Claude.ai 아티팩트 → 로컬 개발 → v0.3에서 SPA 재구축(모듈 분리 + PWA화).

## 배경과 목적

사용자 문제: 홈트를 하면 매번 하던 동작만 반복하게 되고, 영상에서 본 새 동작을 기억하지 못함.
해결 접근: 동작을 개별로 외우는 대신 **패턴 5개(하체/푸시/풀/코어/전신)** 프레임만 기억하고, 앱이 각 패턴에서 랜덤으로 뽑아 조합. 운동 중에는 **음성 가이드가 다음 동작을 미리 읽어줘서 폰을 쳐다보지 않아도 되게** 하는 것이 핵심 설계 원칙.
사용 형태: iPhone 홈 화면에 추가(standalone PWA)해 앱처럼 실행.

## 실행

```bash
npm install
npm run dev        # http://localhost:5173 — server.host=true라 같은 와이파이 폰에서도 접속 가능
npm run build      # dist/ + 서비스워커(precache) 생성
npm run preview    # 빌드 결과 확인 (SW 포함 동작은 preview에서 확인)
```

## 구조

```
src/
  main.jsx                 # 엔트리 — SW 등록(virtual:pwa-register)
  App.jsx                  # 상태 소유(운동 서고·설정·서킷) + 화면 전환(home/library/timer)
  styles.css               # 전체 스타일 — 디자인 토큰(CSS 변수) + 클래스. 동적 색만 인라인
  audio.js                 # beep(Web Audio) + speak/stopSpeech(Web Speech ko-KR)
  storage.js               # 스토리지 어댑터 — localStorage 구현, 아티팩트의 window.storage 인터페이스 유지
  data/defaults.js         # PATTERNS(5패턴+색), patternOf, DEFAULT_EXERCISES(기본 21동작), DEFAULT_SETTINGS
  hooks/
    useWorkoutTimer.js     # 타이머 상태 머신 전체 (advance 로직의 유일한 위치)
    useWakeLock.js         # 타이머 중 화면 꺼짐 방지 + visibilitychange 재획득
  views/
    HomeView.jsx           # 설정 스테퍼 + 서킷 뽑기/교체 + 시작
    LibraryView.jsx        # 동작 추가 폼(로컬 상태) + 패턴별 목록
    TimerView.jsx          # 타이머 표시 전용 (로직은 useWorkoutTimer)
  components/
    Header.jsx             # 로고 + home/library 탭
    SettingStepper.jsx     # −/+ 스테퍼
public/                    # PWA 아이콘 (icon-192/512, maskable, apple-touch-icon, favicon.svg)
docs/
  기획.md                  # 타이머 5단계 흐름과 음성 가이드 스펙 (기능의 정본 문서)
  케틀벨-7가지.md          # 기본 동작의 근거 자료 + 프리셋 아이디어
```

## 핵심 로직

- **타이머 상태 머신** (`hooks/useWorkoutTimer.js`): `phase ∈ idle | ready | work | rest | roundRest | done`
  - 흐름: 준비(prep초) → [운동(work초) → 휴식(rest초)] × 동작 수 → 라운드 휴식(roundRest초) → ... → 완료
  - 마지막 라운드 마지막 동작 뒤에는 바로 done. rest는 라운드 내 동작 사이에만 발생.
  - 구현: 1초 interval이 `secondsLeft`만 감소 → `secondsLeft` 변화를 감시하는 useEffect가 0이면 `advance()` 호출. **스킵 버튼도 `setSecondsLeft(0)`으로 같은 경로를 탄다** — 전환 로직은 advance() 한 곳에만 둘 것.
- **음성 가이드(TTS)** (`audio.js`): Web Speech API `speechSynthesis`, lang=ko-KR. 준비/시작/절반/휴식(다음 동작+memo 낭독)/라운드 완료/전체 완료 시점에 발화. `settingsRef`로 stale closure 회피. 모바일 브라우저는 사용자 제스처 이후에만 소리 허용 — "시작" 버튼 탭이 그 역할.
- **동작 교체(reroll)** (`App.jsx`): 같은 패턴 풀에서 현재 동작 제외 후 랜덤. 타이머 중에도 가능(운동 중→현재 동작, 휴식 중→다음 동작).
- **저장** (`storage.js`): 단일 키 `circuit-app-v1`에 `{exercises, settings}` JSON 통합 저장. 키를 쪼개지 말 것.
- **PWA** (`vite.config.js`): vite-plugin-pwa `autoUpdate`. manifest는 standalone·portrait·ko. 구글 폰트는 workbox runtimeCaching으로 첫 로드 후 오프라인 유지. SW·manifest가 동작하려면 HTTPS 배포 필요(로컬 dev는 예외).
- **Wake Lock** (`hooks/useWakeLock.js`): 타이머 진행 중(phase가 idle/done이 아닐 때)만 활성. 화면을 다녀오면 자동 해제되므로 visibilitychange에서 재획득.

## 규약

- UI 언어는 한국어. 코드 주석도 한국어.
- 디자인: 패턴 5색은 경기용 케틀벨 무게 색상 코드(32kg 빨강/16kg 노랑/12kg 파랑/24kg 초록/8kg 분홍)에서 따온 것 — 임의로 바꾸지 말 것. 배경 #1E2126(주철), 텍스트 #F2EFE9(초크). 폰트: Black Han Sans(디스플레이/숫자) + Noto Sans KR(본문). 토큰은 styles.css `:root`에 정의.
- 앱 아이콘: 주사위 5눈 배치(뽑기=랜덤) × 패턴 5색. 재생성은 PIL 스크립트로(원 5개, 4배 슈퍼샘플링).
- 모바일 퍼스트(maxWidth 480). 타이머 화면 숫자는 1m 거리에서 읽히는 크기 유지.
- 새 동작의 memo는 TTS가 그대로 읽는다 — memo 문구는 "소리 내어 읽었을 때 자연스러운 한 줄"로.
- 스타일은 styles.css 클래스로. 인라인 style은 패턴색 등 동적 색상에만 사용.

## 로드맵 후보 (미착수)

- [x] PWA화(오프라인 + 홈 화면 추가) — v0.3 완료
- [x] 화면 꺼짐 방지 (Wake Lock API) — v0.3 완료
- [ ] 운동 기록: 완료한 서킷 히스토리 저장, 주간 통계
- [ ] 동작에 참고 영상 URL 필드 추가 (영상 보고 배운 동작 원본 링크 보관)
- [ ] 서킷 프리셋 저장/공유 (JSON 내보내기) — 케틀벨-7가지.md의 프로그램(10초/50초, 무빙 타겟, 딥식스) 프리셋 후보
- [ ] 케틀벨 무게 기록 필드

## 이관 시 주의점

원본 아티팩트는 Claude 전용 `window.storage` API 사용 → `src/storage.js` 어댑터로 치환 완료. 이후 서버 동기화가 필요하면 storage.js만 교체하면 된다. 저장 키(`circuit-app-v1`)와 데이터 형태는 v0.2와 호환 — 기존 로컬 데이터가 그대로 로드된다.
