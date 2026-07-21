import { useEffect, useState } from "react";

import { PATTERNS, DEFAULT_EXERCISES, DEFAULT_SETTINGS } from "./data/defaults";
import { storage } from "./storage";
import { useWorkoutTimer } from "./hooks/useWorkoutTimer";
import { useWakeLock } from "./hooks/useWakeLock";
import HomeView from "./views/HomeView";
import LibraryView from "./views/LibraryView";
import TimerView from "./views/TimerView";

const STORAGE_KEY = "circuit-app-v1";

export default function App() {
  const [view, setView] = useState("home"); // home | library | timer
  const [exercises, setExercises] = useState(DEFAULT_EXERCISES);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [circuit, setCircuit] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // ─── 저장/불러오기 ───
  useEffect(() => {
    (async () => {
      try {
        const result = await storage.get(STORAGE_KEY);
        if (result && result.value) {
          const data = JSON.parse(result.value);
          if (data.exercises && data.exercises.length) setExercises(data.exercises);
          if (data.settings) setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
        }
      } catch (e) {
        // 저장 데이터 없음 — 기본값 사용
      }
      setLoaded(true);
    })();
  }, []);

  const persist = async (exs, sets) => {
    try {
      await storage.set(STORAGE_KEY, JSON.stringify({ exercises: exs, settings: sets }));
    } catch (e) {
      console.error("저장 실패", e);
    }
  };

  // ─── 서킷 생성 ───
  const pickRandom = (patternId, excludeId) => {
    const pool = exercises.filter((e) => e.pattern === patternId && e.id !== excludeId);
    if (!pool.length) {
      const fb = exercises.filter((e) => e.pattern === patternId);
      return fb.length ? fb[Math.floor(Math.random() * fb.length)] : null;
    }
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const generate = () => setCircuit(PATTERNS.map((p) => pickRandom(p.id)).filter(Boolean));

  const rerollAt = (idx) => {
    const cur = circuit[idx];
    if (!cur) return null;
    const next = pickRandom(cur.pattern, cur.id);
    if (next) setCircuit((c) => c.map((e, i) => (i === idx ? next : e)));
    return next;
  };

  // ─── 라이브러리 ───
  const addExercise = (pattern, name, memo) => {
    const ex = { id: "u" + Date.now(), pattern, name, memo };
    const next = [...exercises, ex];
    setExercises(next);
    persist(next, settings);
  };

  const removeExercise = (id) => {
    const next = exercises.filter((e) => e.id !== id);
    setExercises(next);
    persist(next, settings);
    setCircuit((c) => c.filter((e) => e.id !== id));
  };

  const updateSetting = (key, val) => {
    const next = { ...settings, [key]: val };
    setSettings(next);
    persist(exercises, next);
  };

  // ─── 타이머 ───
  const timer = useWorkoutTimer({ circuit, settings, rerollAt });
  useWakeLock(view === "timer" && timer.phase !== "idle" && timer.phase !== "done");

  const startWorkout = () => {
    if (!circuit.length) return;
    timer.start();
    setView("timer");
  };

  const stopWorkout = () => {
    timer.stop();
    setView("home");
  };

  if (!loaded) {
    return (
      <div className="app app--center">
        <div className="loading">불러오는 중...</div>
      </div>
    );
  }

  if (view === "timer") {
    return (
      <TimerView
        circuit={circuit}
        settings={settings}
        updateSetting={updateSetting}
        timer={timer}
        stopWorkout={stopWorkout}
      />
    );
  }

  if (view === "library") {
    return (
      <LibraryView
        view={view}
        setView={setView}
        exercises={exercises}
        addExercise={addExercise}
        removeExercise={removeExercise}
      />
    );
  }

  return (
    <HomeView
      view={view}
      setView={setView}
      settings={settings}
      updateSetting={updateSetting}
      circuit={circuit}
      generate={generate}
      rerollAt={rerollAt}
      startWorkout={startWorkout}
    />
  );
}
