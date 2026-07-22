// 운동 완료 기록 — circuit-history-v1에 배열로 저장 (최신순, 상한 500개)
// 레코드: { id, endedAt(ms), durationMin, rounds, work, preset(id|null), exercises: [{id, name}] }

export const HISTORY_KEY = "circuit-history-v1";
export const HISTORY_LIMIT = 500;

// 로컬 기준 YYYY-MM-DD (sv 로케일이 이 형식을 냄)
export const dayKey = (ts) => new Date(ts).toLocaleDateString("sv");

// 연속 운동 일수 — 오늘부터 거꾸로 센다. 오늘 아직 안 했으면 어제까지의 연속을 유지.
export function calcStreak(records) {
  const days = new Set(records.map((r) => dayKey(r.endedAt)));
  const d = new Date();
  if (!days.has(dayKey(d.getTime()))) d.setDate(d.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(d.getTime()))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

// 이번 주(월요일 시작) 완료 횟수
export function weekCount(records) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const weekStart = d.getTime();
  return records.filter((r) => r.endedAt >= weekStart).length;
}
