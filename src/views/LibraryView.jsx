import { useState } from "react";

import { EQUIP_CHOICES, GEAR, PATTERNS, ytUrl } from "../data/defaults";
import ExerciseArt from "../components/ExerciseArt";
import Header from "../components/Header";

const equipLabel = (id) => EQUIP_CHOICES.find((m) => m.id === id)?.label;
const gearLabel = (id) => GEAR.find((g) => g.id === id)?.label;

export default function LibraryView({ view, setView, exercises, addExercise, removeExercise }) {
  const [newName, setNewName] = useState("");
  const [newMemo, setNewMemo] = useState("");
  const [newPattern, setNewPattern] = useState("lower");
  const [newEquip, setNewEquip] = useState("body");

  const submit = () => {
    if (!newName.trim()) return;
    addExercise(newPattern, newName.trim(), newMemo.trim(), newEquip);
    setNewName("");
    setNewMemo("");
  };

  return (
    <div className="app">
      <Header view={view} setView={setView} />

      <div className="add-card">
        <div className="display add-title">새 동작 추가</div>
        <div className="pattern-picker">
          {PATTERNS.map((p) => (
            <button
              key={p.id}
              className="btn pattern-chip"
              onClick={() => setNewPattern(p.id)}
              style={newPattern === p.id ? { background: p.color, color: "#1E2126" } : undefined}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="pattern-picker">
          {EQUIP_CHOICES.map((m) => (
            <button
              key={m.id}
              className={`btn pattern-chip ${newEquip === m.id ? "pattern-chip--active" : ""}`}
              onClick={() => setNewEquip(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
        <input
          className="input"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="동작 이름 (예: 케틀벨 스내치)"
        />
        <input
          className="input input--memo"
          value={newMemo}
          onChange={(e) => setNewMemo(e.target.value)}
          placeholder="메모 — 음성 가이드로 읽어줄 포인트 한 줄 (선택)"
        />
        <button className="btn add-submit" disabled={!newName.trim()} onClick={submit}>
          서고에 저장
        </button>
      </div>

      {PATTERNS.map((p) => {
        const list = exercises.filter((e) => e.pattern === p.id);
        return (
          <div key={p.id} className="pattern-group">
            <div className="pattern-group-head">
              <span className="dot dot--lg" style={{ background: p.color }} />
              <span className="display pattern-group-title">{p.label}</span>
              <span className="pattern-group-count">{list.length}개</span>
            </div>
            {list.map((e) => (
              <div key={e.id} className="exercise-row" style={{ borderLeftColor: p.color }}>
                <ExerciseArt ex={e} className="exercise-thumb" />
                <div className="exercise-info">
                  <div className="exercise-name">
                    {e.name}
                    {equipLabel(e.equip) && <span className="equip-tag">{equipLabel(e.equip)}</span>}
                    {gearLabel(e.gear) && <span className="equip-tag">{gearLabel(e.gear)}</span>}
                  </div>
                  {e.memo && <div className="exercise-memo">{e.memo}</div>}
                </div>
                <a className="yt-link" href={ytUrl(e)} target="_blank" rel="noreferrer" title="자세 영상 검색">
                  ▶ 영상
                </a>
                <button className="btn remove-btn" onClick={() => removeExercise(e.id)}>
                  삭제
                </button>
              </div>
            ))}
            {!list.length && <div className="pattern-empty">아직 없어요 — 위에서 추가하세요</div>}
          </div>
        );
      })}
    </div>
  );
}
