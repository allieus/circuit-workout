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
npm run voice      # ElevenLabs 음성 클립 재생성 — .env의 ELEVENLABS_API_KEY 필요
```

자세 삽화 재생성: `codex exec`의 imagegen 도구 사용 (스타일 프롬프트는 아래 규약 참조). 1024px 원본 생성 후 512px webp로 축소해 `public/art/ex_<id>.webp`로 저장.

## 구조

```
src/
  main.jsx                 # 엔트리 — SW 등록(virtual:pwa-register) + 음성 매니페스트 로드
  App.jsx                  # 상태 소유(운동 서고·설정·서킷·기록) + 화면 전환(home/library/history/timer)
  history.js               # 완료 기록 유틸 — HISTORY_KEY, 연속 일수(calcStreak), 주간 횟수
  styles.css               # 전체 스타일 — 디자인 토큰(CSS 변수) + 클래스. 동적 색만 인라인
  audio.js                 # beep(Web Audio) + 음성 클립 플레이어(speakGuide) + Web Speech 폴백
  storage.js               # 스토리지 어댑터 — localStorage 구현, 아티팩트의 window.storage 인터페이스 유지
  data/defaults.js         # PATTERNS(5패턴+색), MODES(운동 모드), DEFAULT_EXERCISES(기본 21동작+equip), DEFAULT_SETTINGS, artUrl/ytUrl
  hooks/
    useWorkoutTimer.js     # 타이머 상태 머신 전체 (advance 로직의 유일한 위치)
    useWakeLock.js         # 타이머 중 화면 꺼짐 방지 + visibilitychange 재획득
  views/
    HomeView.jsx           # 설정 스테퍼 + 서킷 뽑기/교체 + 시작
    LibraryView.jsx        # 동작 추가 폼(로컬 상태) + 패턴별 목록
    TimerView.jsx          # 타이머 표시 전용 (로직은 useWorkoutTimer)
    HistoryView.jsx        # 완료 기록 목록 + 스트릭·주간·전체 통계
  components/
    Header.jsx             # 로고 + home/library 탭
    SettingStepper.jsx     # −/+ 스테퍼
    InstallHint.jsx        # 홈 화면 추가 안내 배너 (iOS/Android 브라우저 접속 시, 닫으면 localStorage 기억)
    ExerciseArt.jsx        # 자세 삽화 img — 없으면 onError로 숨김, key=ex.id로 교체 시 리셋
scripts/
  generate-voice.mjs       # ElevenLabs 클립 사전 생성 (npm run voice)
public/                    # PWA 아이콘 (icon-192/512, maskable, apple-touch-icon, favicon.svg)
  voice/                   # 사전 생성된 음성 클립(mp3 42개) + manifest.json — 커밋 대상
  art/                     # 사전 생성된 자세 삽화(webp 21개, 기본 동작 전용) — 커밋 대상
docs/
  기획.md                  # 타이머 5단계 흐름과 음성 가이드 스펙 (기능의 정본 문서)
  케틀벨-7가지.md          # 기본 동작의 근거 자료 + 프리셋 아이디어
```

## 핵심 로직

- **타이머 상태 머신** (`hooks/useWorkoutTimer.js`): `phase ∈ idle | ready | work | rest | roundRest | done`
  - 흐름: 준비(prep초) → [운동(work초) → 휴식(rest초)] × 동작 수 → 라운드 휴식(roundRest초) → ... → 완료
  - 마지막 라운드 마지막 동작 뒤에는 바로 done. rest는 라운드 내 동작 사이에만 발생.
  - 구현: 1초 interval이 `secondsLeft`만 감소 → `secondsLeft` 변화를 감시하는 useEffect가 0이면 `advance()` 호출. **스킵 버튼도 `setSecondsLeft(0)`으로 같은 경로를 탄다** — 전환 로직은 advance() 한 곳에만 둘 것.
- **음성 가이드** (`audio.js` + `public/voice/`): 발화는 전부 템플릿이라 조합이 유한 — 고정 문구·라운드 숫자·동작(이름+memo)을 ElevenLabs(Anna Kim, eleven_multilingual_v2)로 **사전 생성**해 정적 mp3로 배포. 런타임 API 호출 0회, 오프라인 동작, 키 노출 없음. `speakGuide(keys, fallbackText, enabled)`가 클립을 AudioContext로 이어붙여 재생하고, 클립이 없는 발화(**사용자 추가 동작** 등)는 Web Speech(ko-KR)로 폴백. 타이머 시작 시 그 세션의 클립을 프리페치. 모바일 브라우저는 사용자 제스처 이후에만 소리 허용 — "시작" 버튼 탭이 AudioContext를 unlock. **기본 동작의 name/memo를 바꾸면 `npm run voice`로 클립 재생성 필수**(텍스트 해시 비교로 바뀐 것만 재생성).
- **동작 교체(reroll)** (`App.jsx`): 같은 패턴 풀에서 현재 동작 제외 후 랜덤. 타이머 중에도 가능(운동 중→현재 동작, 휴식 중→다음 동작).
- **운동 모드** (`App.jsx` pickRandom): `settings.mode ∈ all | kb | body` — 동작의 `equip` 태그로 풀을 필터. 모드에 맞는 동작이 패턴에 없으면 모드 무시하고 패턴 전체에서 뽑는 폴백. 모드 변경 시 뽑아둔 서킷이 있으면 즉시 다시 뽑는다(프리셋 중엔 유지). equip 없는 동작(구버전 사용자 추가분)은 "전체"에서만 등장.
- **프로그램 프리셋** (`defaults.js` PRESETS + `App.jsx` applyPreset): 케틀벨-7가지.md의 프로그램(10초/50초·무빙 타겟·딥 식스)을 고정 서킷 + 권장 설정으로 적용. 별도 타이머 로직 없음 — 기존 상태 머신 그대로(10초/50초는 1동작 서킷이라 rest 없이 work→roundRest 반복). 적용 후 설정 조정 자유. "다시 뽑기"(랜덤 생성)로 해제되고, 프리셋 중에는 홈의 개별 ↻ 숨김. 라운드 상한 30 — 라운드 음성 클립도 30까지 사전 생성돼 있음. 서고에서 지운 기본 동작도 프리셋에선 DEFAULT_EXERCISES 폴백으로 동작.
- **타이머 화면 표시** (`TimerView.jsx`): 상단 스텝 점(휴식 중엔 다음 동작을 **빈 점 + "다음 동작 n/N" 라벨**로 예고 — 진행과 구분) + 진행 바 아래 전체 서킷 라인업(완료 취소선·현재 강조, 세로 640px 미만에선 숨김). 휴식 화면의 큰 동작명은 다음 동작 예고임(기획.md "휴식=예습 시간") — 같은 동작이 연속 반복되는 버그 아님. 랜덤 서킷은 5슬롯=5패턴 각 1개라 인접 중복이 구조적으로 불가능(10초/50초 프리셋만 의도적 반복). body 배경을 페이즈 색으로 동기화해 넓은 화면에서도 여백 없이 채워진다. 900px 이상 와이드 화면에선 라인업이 오른쪽 사이드 컬럼으로 이동하고 숫자·삽화가 확대된다(timer-center--split).
- **자세 삽화** (`public/art/` + `ExerciseArt.jsx`): codex imagegen으로 사전 생성한 픽토그램. 스타일: 정사각형·주철색(#1E2126) 단색 배경·초크 화이트(#F2EFE9) 굵은 라인·전신 실루엣·디테일/텍스트 없음. 타이머(준비/운동/휴식)와 서고 목록에 표시. 사용자 추가 동작(id가 "u"로 시작)은 삽화 없음 — artUrl이 null 반환.
- **참고 영상**: 동작별 유튜브 검색 링크(ytUrl — "동작이름 자세" 검색). 홈 카드 ▶ 버튼, 서고 "▶ 영상" 링크.
- **저장** (`storage.js`): 단일 키 `circuit-app-v1`에 `{exercises, settings}` JSON 통합 저장. 키를 쪼개지 말 것.
- **완료 기록** (`history.js` + `HistoryView.jsx`): done 도달 시 useWorkoutTimer의 onComplete → App.addRecord가 `circuit-history-v1`에 저장(최신순, 상한 500). 연속 일수는 로컬 날짜(YYYY-MM-DD) 기준 — 오늘 안 했으면 어제까지의 연속을 유지해서 표시. 완료 화면에 "🔥 N일 연속", 기록 탭에 스트릭·이번 주(월요일 시작)·전체 통계. 중도 종료는 기록하지 않음.
- **세션 복원** (`useWorkoutTimer.js` + `App.jsx`): iOS는 백그라운드의 PWA를 수시로 종료 → 진행 중 세션을 `circuit-session-v1`에 매초 저장(phase/roundIdx/exIdx/secondsLeft/circuit/savedAt). 앱 재실행 시 1시간 이내 세션이면 타이머 화면을 **일시정지 상태로 복원**해 "계속하기"로 재개. idle/done 진입 시 삭제. 화면 이탈(visibilitychange hidden) 시 자동 일시정지.
- **스플래시**: iOS만 기기 해상도별 PNG 필요(`public/splash/`, index.html의 apple-touch-startup-image 17종 — iPhone 12종+iPad 5종). Android·폴드·플립은 manifest(background_color+아이콘+이름)로 자동 생성. 원화는 케틀벨 스윙 그림자(codex imagegen, 솔리드 실루엣) — 재생성 시 스크래치 스크립트로 합성.
- **PWA** (`vite.config.js`): vite-plugin-pwa `autoUpdate`. manifest는 standalone·portrait·ko. 음성 클립까지 프리캐시(globPatterns), 구글 폰트는 workbox runtimeCaching으로 첫 로드 후 오프라인 유지. SW·manifest가 동작하려면 HTTPS 배포 필요(로컬 dev는 예외). 배포: Vercel `circuit-workout` 프로젝트, 프로덕션 https://circuit-workout-two.vercel.app
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
- [x] 운동 기록: 완료한 서킷 히스토리 저장, 스트릭·주간 통계 — v0.3 완료
- [ ] 동작에 참고 영상 URL 필드 추가 (영상 보고 배운 동작 원본 링크 보관)
- [ ] 서킷 프리셋 저장/공유 (JSON 내보내기) — 케틀벨-7가지.md의 프로그램(10초/50초, 무빙 타겟, 딥식스) 프리셋 후보
- [ ] 케틀벨 무게 기록 필드

## 이관 시 주의점

원본 아티팩트는 Claude 전용 `window.storage` API 사용 → `src/storage.js` 어댑터로 치환 완료. 이후 서버 동기화가 필요하면 storage.js만 교체하면 된다. 저장 키(`circuit-app-v1`)와 데이터 형태는 v0.2와 호환 — 기존 로컬 데이터가 그대로 로드된다.
