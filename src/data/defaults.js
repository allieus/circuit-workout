// ─── 패턴 정의: 경기용 케틀벨 색상 코드에서 따옴 ───
// 32kg 빨강 / 16kg 노랑 / 12kg 파랑 / 24kg 초록 / 8kg 분홍
export const PATTERNS = [
  { id: "lower", label: "하체", color: "#E4574B" },
  { id: "push", label: "푸시", color: "#E8B93E" },
  { id: "pull", label: "풀", color: "#4E8FD9" },
  { id: "core", label: "코어", color: "#57A867" },
  { id: "full", label: "전신", color: "#D96BA0" },
];

export const patternOf = (ex) => PATTERNS.find((p) => p.id === ex.pattern) || PATTERNS[0];

// ─── 운동 모드: 기구 기준 필터 ───
// equip이 없는 동작(구버전 사용자 추가분)은 "전체" 모드에서만 뽑힌다.
export const MODES = [
  { id: "all", label: "전체" },
  { id: "kb", label: "케틀벨" },
  { id: "body", label: "맨몸" },
];

// 사전 생성 삽화 — 기본 동작만 존재(사용자 추가 동작 id는 "u"로 시작)
export const artUrl = (ex) => (ex.id.startsWith("u") ? null : `/art/ex_${ex.id}.webp`);

// 자세 참고 영상: 유튜브 검색 링크
export const ytUrl = (ex) => "https://www.youtube.com/results?search_query=" + encodeURIComponent(`${ex.name} 자세`);

// ─── 프로그램 프리셋 (docs/케틀벨-7가지.md의 프로그램) ───
// 프리셋 = 고정 순서 서킷 + 권장 타이머 설정. 적용 후 설정은 자유롭게 조정 가능.
export const PRESETS = [
  {
    id: "ten50",
    name: "10초/50초",
    desc: "스윙 1분 1세트: 10초 운동(≈5회) + 50초 휴식 × 10세트. 30세트가 쉬워지면 무게를 올린다",
    exerciseIds: ["k2"],
    settings: { rounds: 10, work: 10, roundRest: 50 },
  },
  {
    id: "movingTarget",
    name: "무빙 타겟",
    desc: "클린 → 프레스 → 스쿼트 콤플렉스, 세트마다 손 교체. 프레스 6~8회 가능한 무게로 9세트",
    exerciseIds: ["k3", "k4", "k5"],
    settings: { rounds: 9, work: 30, rest: 15, roundRest: 60 },
  },
  {
    id: "deep6",
    name: "딥 식스",
    desc: "한팔 스윙 → 스내치 → 클린 → 프레스 → 스쿼트 → 겟업 연결. 고강도 — 7동작 숙련 후에만",
    exerciseIds: ["k2", "k6", "k3", "k4", "k5", "k7"],
    settings: { rounds: 3, work: 30, rest: 10, roundRest: 90 },
  },
];

// 기본 동작 라이브러리 (케틀벨 + 맨몸)
// memo는 화면에 표시되고, 음성 가이드(TTS)가 그대로 읽어준다.
// 케틀벨 핵심 7동작은 유튜브 "하루 종일 지치지 않는 체력을 위한 운동 7가지
// (케틀벨 종합편)" 영상 기준 — 폼 포인트도 영상에서 발췌 (docs/케틀벨-7가지.md 참고)
export const DEFAULT_EXERCISES = [
  // 하체
  { id: "k1", equip: "kb", pattern: "lower", name: "양손 케틀벨 스윙", memo: "힙 힌지로 가랑이 사이에 던졌다 발사, 어깨 높이까지" },
  { id: "k2", equip: "kb", pattern: "lower", name: "한팔 케틀벨 스윙", memo: "빈손은 손잡이 터치, 몸통 비틀림 방지" },
  { id: "k5", equip: "kb", pattern: "lower", name: "케틀벨 스쿼트", memo: "클린 랙 상태 그대로 앉았다 일어나기" },
  { id: "d1", equip: "kb", pattern: "lower", name: "고블릿 스쿼트", memo: "케틀벨 가슴 앞, 팔꿈치 무릎 안쪽" },
  { id: "d3", equip: "body", pattern: "lower", name: "교대 런지", memo: "무릎이 발끝 넘지 않게" },
  { id: "d4", equip: "kb", pattern: "lower", name: "케틀벨 데드리프트", memo: "허리 곧게, 시선 정면" },
  // 푸시
  { id: "k4", equip: "kb", pattern: "push", name: "케틀벨 프레스", memo: "클린 상태에서 수직으로 밀기, 전완 수직 유지" },
  { id: "d5", equip: "body", pattern: "push", name: "푸시업", memo: "몸통 일직선 유지" },
  { id: "d7", equip: "body", pattern: "push", name: "파이크 푸시업", memo: "어깨 타깃, 엉덩이 높게" },
  // 풀
  { id: "d8", equip: "kb", pattern: "pull", name: "한팔 로우", memo: "케틀벨, 등으로 당기기" },
  { id: "d10", equip: "kb", pattern: "pull", name: "케틀벨 하이풀", memo: "이마 가까이, 팔꿈치 높게" },
  { id: "d9", equip: "body", pattern: "pull", name: "슈퍼맨", memo: "팔다리 동시에 들어올리기" },
  // 코어
  { id: "d11", equip: "body", pattern: "core", name: "플랭크", memo: "엉덩이 처지지 않게" },
  { id: "d12", equip: "kb", pattern: "core", name: "러시안 트위스트", memo: "케틀벨 들고 좌우 회전" },
  { id: "d13", equip: "body", pattern: "core", name: "데드버그", memo: "허리 바닥에 붙이기" },
  { id: "d14", equip: "body", pattern: "core", name: "마운틴 클라이머", memo: "빠르게, 코어 고정" },
  // 전신
  { id: "k3", equip: "kb", pattern: "full", name: "케틀벨 클린", memo: "턱에 어퍼컷 찌르듯, 손목 꺾이지 않게" },
  { id: "k6", equip: "kb", pattern: "full", name: "케틀벨 스내치", memo: "하이풀에서 손을 위로, 스윙보다 가벼운 무게로" },
  { id: "k7", equip: "kb", pattern: "full", name: "터키시 겟업", memo: "케틀벨에서 시선 떼지 말고, 순서대로 천천히" },
  { id: "d15", equip: "body", pattern: "full", name: "버피", memo: "본인 페이스로" },
  { id: "d17", equip: "body", pattern: "full", name: "점핑잭", memo: "가볍게 리듬 타기" },
];

export const DEFAULT_SETTINGS = {
  rounds: 3, // 라운드 수
  work: 40, // 운동 시간(초)
  rest: 20, // 동작 간 휴식(초)
  prep: 10, // 시작 전 준비(초)
  roundRest: 60, // 라운드 간 휴식(초)
  voice: true, // 음성 가이드 on/off
  mode: "all", // 운동 모드 (all | kb | body)
};
