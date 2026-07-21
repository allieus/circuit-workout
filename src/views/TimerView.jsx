import { PATTERNS, patternOf } from "../data/defaults";

export default function TimerView({ circuit, settings, updateSetting, timer, stopWorkout }) {
  const { phase, roundIdx, exIdx, secondsLeft, paused } = timer;
  const cur = circuit[exIdx];
  const p = cur ? patternOf(cur) : PATTERNS[0];
  const isWork = phase === "work";
  const bg =
    phase === "done" || phase === "ready" || phase === "roundRest" ? "#1E2126" : isWork ? p.color : "#33373E";
  const nextEx = phase === "rest" ? circuit[exIdx + 1] : null;
  const total =
    { ready: settings.prep, work: settings.work, rest: settings.rest, roundRest: settings.roundRest }[phase] || 1;
  const progress = 1 - secondsLeft / total;

  return (
    <div className="app app--timer" style={{ background: bg }}>
      {/* 상단 바 */}
      <div className="timer-top">
        <div className="display timer-round">
          {phase === "done" ? "완료" : `라운드 ${roundIdx + 1} / ${settings.rounds}`}
        </div>
        <div className="timer-top-actions">
          <button className="btn timer-chip" onClick={() => updateSetting("voice", !settings.voice)}>
            {settings.voice ? "🔊" : "🔇"}
          </button>
          <button className="btn timer-chip" onClick={stopWorkout}>
            종료
          </button>
        </div>
      </div>

      {/* 중앙 */}
      {phase === "done" ? (
        <div className="timer-center">
          <div className="display timer-done-title">수고했어요!</div>
          <div className="timer-done-sub">
            {settings.rounds}라운드 × {circuit.length}동작 · 약 {timer.elapsedMinutes()}분
          </div>
        </div>
      ) : phase === "roundRest" ? (
        <div className="timer-center">
          <div className="timer-label">라운드 휴식</div>
          <div className="display timer-count timer-count--medium">{secondsLeft}</div>
          <div className="timer-next-title">다음 라운드 순서</div>
          {circuit.map((e, i) => {
            const ep = patternOf(e);
            return (
              <div key={e.id + i} className="timer-lineup-row">
                <span className="dot" style={{ background: ep.color }} />
                <span className="timer-lineup-name">{e.name}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="timer-center">
          <div className="timer-label timer-label--phase">{phase === "ready" ? "준비" : isWork ? "운동" : "휴식"}</div>
          <div className="display timer-count">{secondsLeft}</div>

          {phase === "ready" && cur && (
            <>
              <div className="timer-hint">첫 동작</div>
              <div className="display timer-exname" style={{ color: p.color }}>
                {cur.name}
              </div>
              {cur.memo && <div className="timer-memo">{cur.memo}</div>}
            </>
          )}
          {isWork && cur && (
            <>
              <div className="display timer-exname timer-exname--work">{cur.name}</div>
              {cur.memo && <div className="timer-memo timer-memo--work">{cur.memo}</div>}
            </>
          )}
          {phase === "rest" && nextEx && (
            <>
              <div className="timer-hint">다음 동작</div>
              <div className="display timer-exname" style={{ color: patternOf(nextEx).color }}>
                {nextEx.name}
              </div>
              {nextEx.memo && <div className="timer-memo">{nextEx.memo}</div>}
            </>
          )}

          {/* 진행 바 */}
          <div className="progress">
            <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
      )}

      {/* 하단 컨트롤 */}
      <div className="timer-controls">
        {phase === "done" ? (
          <button className="btn timer-btn timer-btn--primary" onClick={stopWorkout}>
            돌아가기
          </button>
        ) : (
          <>
            <button className="btn timer-btn timer-btn--wide" onClick={timer.togglePause}>
              {paused ? "계속하기" : "일시정지"}
            </button>
            {(phase === "work" || phase === "rest") && (
              <button className="btn timer-btn" onClick={timer.rerollLive} title="동작 교체">
                ↻ 교체
              </button>
            )}
            <button className="btn timer-btn" onClick={timer.skip}>
              건너뛰기
            </button>
          </>
        )}
      </div>
    </div>
  );
}
