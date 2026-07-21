import { patternOf } from "../data/defaults";
import Header from "../components/Header";
import SettingStepper from "../components/SettingStepper";

export default function HomeView({ view, setView, settings, updateSetting, circuit, generate, rerollAt, startWorkout }) {
  const totalMin = Math.round(
    (settings.prep +
      settings.rounds * circuit.length * settings.work +
      settings.rounds * (circuit.length - 1) * settings.rest +
      (settings.rounds - 1) * settings.roundRest) /
      60
  );

  return (
    <div className="app">
      <Header view={view} setView={setView} />

      {/* 설정 */}
      <div className="settings-row">
        <SettingStepper label="라운드" value={settings.rounds} unit="회" onChange={(v) => updateSetting("rounds", v)} min={1} max={8} />
        <SettingStepper label="운동" value={settings.work} unit="초" onChange={(v) => updateSetting("work", v)} min={10} max={120} step={5} />
        <SettingStepper label="휴식" value={settings.rest} unit="초" onChange={(v) => updateSetting("rest", v)} min={5} max={90} step={5} />
      </div>
      <div className="settings-row settings-row--last">
        <SettingStepper label="준비" value={settings.prep} unit="초" onChange={(v) => updateSetting("prep", v)} min={5} max={15} step={5} />
        <SettingStepper label="라운드 휴식" value={settings.roundRest} unit="초" onChange={(v) => updateSetting("roundRest", v)} min={30} max={120} step={15} />
        <button
          className={`btn voice-toggle ${settings.voice ? "voice-toggle--on" : ""}`}
          onClick={() => updateSetting("voice", !settings.voice)}
        >
          {settings.voice ? "🔊 음성 켬" : "🔇 음성 끔"}
        </button>
      </div>

      <button className="btn display generate-btn" onClick={generate}>
        {circuit.length ? "다시 뽑기" : "서킷 뽑기"}
      </button>

      {circuit.length > 0 && (
        <>
          {circuit.map((e, i) => {
            const p = patternOf(e);
            return (
              <div key={e.id + i} className="circuit-card">
                <div className="display circuit-badge" style={{ background: p.color }}>
                  {p.label}
                </div>
                <div className="circuit-info">
                  <div className="circuit-name">{e.name}</div>
                  {e.memo && <div className="circuit-memo">{e.memo}</div>}
                </div>
                <button className="btn reroll-btn" onClick={() => rerollAt(i)} title="이 동작만 다시 뽑기">
                  ↻
                </button>
              </div>
            );
          })}

          <button className="btn display start-btn" onClick={startWorkout}>
            시작
          </button>
          <div className="plan-summary">
            준비 {settings.prep}초 → {settings.rounds}라운드 (운동 {settings.work}초 / 휴식 {settings.rest}초) · 라운드 사이{" "}
            {settings.roundRest}초 · 총 약 {totalMin}분
          </div>
        </>
      )}

      {!circuit.length && (
        <div className="empty-hint">
          하체 · 푸시 · 풀 · 코어 · 전신
          <br />
          다섯 패턴에서 하나씩 뽑아 오늘의 서킷을 만듭니다.
          <br />
          음성 가이드가 다음 동작을 미리 알려줘요.
        </div>
      )}

      <div className="footnote">패턴 색상은 경기용 케틀벨 무게 색상 코드에서 따왔습니다</div>
    </div>
  );
}
