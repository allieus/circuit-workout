import { PRESETS } from "../data/defaults";
import { calcStreak, weekCount } from "../history";
import Header from "../components/Header";

const fmtDate = (ts) =>
  new Date(ts).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
const fmtTime = (ts) => new Date(ts).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
const presetName = (id) => PRESETS.find((p) => p.id === id)?.name;

export default function HistoryView({ view, setView, history, removeRecord }) {
  const streak = calcStreak(history);

  return (
    <div className="app">
      <Header view={view} setView={setView} />

      <div className="stats-row">
        <div className="stat-card">
          <div className="display stat-value">🔥 {streak}일</div>
          <div className="stat-label">연속 운동</div>
        </div>
        <div className="stat-card">
          <div className="display stat-value">{weekCount(history)}회</div>
          <div className="stat-label">이번 주</div>
        </div>
        <div className="stat-card">
          <div className="display stat-value">{history.length}회</div>
          <div className="stat-label">전체</div>
        </div>
      </div>

      {!history.length && (
        <div className="empty-hint">
          아직 완료한 운동이 없어요.
          <br />
          서킷을 끝까지 마치면 여기에 기록됩니다.
        </div>
      )}

      {history.map((r) => (
        <div key={r.id} className="record-row">
          <div className="record-head">
            <span className="record-date">
              {fmtDate(r.endedAt)} {fmtTime(r.endedAt)}
            </span>
            <button className="btn remove-btn" onClick={() => removeRecord(r.id)}>
              삭제
            </button>
          </div>
          <div className="record-meta">
            {presetName(r.preset) && <span className="record-preset">{presetName(r.preset)}</span>}
            {r.rounds}라운드 × {r.exercises.length}동작 · 약 {r.durationMin}분
          </div>
          <div className="record-exs">{r.exercises.map((e) => e.name).join(" · ")}</div>
        </div>
      ))}
    </div>
  );
}
