import { useEffect, useState } from "react";

import { PATTERNS, DEFAULT_EXERCISES, DEFAULT_SETTINGS } from "./data/defaults";
import { storage } from "./storage";
import { useWorkoutTimer, SESSION_KEY, SESSION_MAX_AGE } from "./hooks/useWorkoutTimer";
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
  const [resumeSession, setResumeSession] = useState(null);

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
      // 진행 중이던 운동 세션 — 앱이 백그라운드에서 종료됐어도 이어서 할 수 있게
      try {
        const sess = await storage.get(SESSION_KEY);
        if (sess && sess.value) {
          const s = JSON.parse(sess.value);
          const fresh = s.savedAt && Date.now() - s.savedAt < SESSION_MAX_AGE;
          if (fresh && s.circuit?.length && s.phase && s.phase !== "idle" && s.phase !== "done") {
            setCircuit(s.circuit);
            setResumeSession(s);
          } else {
            storage.delete(SESSION_KEY);
          }
        }
      } catch (e) {}
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
  // 모드 필터에 맞는 동작이 패턴에 하나도 없으면 모드를 무시하고 패턴 전체에서 뽑는다
  const pickRandom = (patternId, excludeId, mode = settings.mode || "all") => {
    const inMode = (e) => mode === "all" || e.equip === mode;
    let pool = exercises.filter((e) => e.pattern === patternId && inMode(e) && e.id !== excludeId);
    if (!pool.length) pool = exercises.filter((e) => e.pattern === patternId && inMode(e));
    if (!pool.length) pool = exercises.filter((e) => e.pattern === patternId);
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
  };

  const generate = () => setCircuit(PATTERNS.map((p) => pickRandom(p.id)).filter(Boolean));

  // 모드 변경 — 이미 뽑아둔 서킷이 있으면 새 모드 기준으로 다시 뽑는다
  const changeMode = (mode) => {
    const next = { ...settings, mode };
    setSettings(next);
    persist(exercises, next);
    if (circuit.length) setCircuit(PATTERNS.map((p) => pickRandom(p.id, undefined, mode)).filter(Boolean));
  };

  const rerollAt = (idx) => {
    const cur = circuit[idx];
    if (!cur) return null;
    const next = pickRandom(cur.pattern, cur.id);
    if (next) setCircuit((c) => c.map((e, i) => (i === idx ? next : e)));
    return next;
  };

  // ─── 라이브러리 ───
  const addExercise = (pattern, name, memo, equip) => {
    const ex = { id: "u" + Date.now(), pattern, name, memo, equip };
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

  // 저장돼 있던 진행 세션을 타이머 화면(일시정지 상태)으로 복원
  useEffect(() => {
    if (!loaded || !resumeSession) return;
    timer.restore(resumeSession);
    setView("timer");
    setResumeSession(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, resumeSession]);

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
      changeMode={changeMode}
      circuit={circuit}
      generate={generate}
      rerollAt={rerollAt}
      startWorkout={startWorkout}
    />
  );
}
