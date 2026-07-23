import { useEffect, useState } from "react";

import {
  PATTERNS,
  PRESETS,
  DEFAULT_EXERCISES,
  DEFAULT_SETTINGS,
  KIDS_EXERCISES,
  KIDS_SETTINGS,
} from "./data/defaults";
import { storage } from "./storage";
import { useWorkoutTimer, SESSION_KEY, SESSION_MAX_AGE } from "./hooks/useWorkoutTimer";
import { useWakeLock } from "./hooks/useWakeLock";
import { HISTORY_KEY, HISTORY_LIMIT, calcStreak } from "./history";
import { useRoute, navigate } from "./router";
import HomeView from "./views/HomeView";
import LibraryView from "./views/LibraryView";
import TimerView from "./views/TimerView";
import HistoryView from "./views/HistoryView";
import ContactView from "./views/ContactView";

const STORAGE_KEY = "circuit-app-v1";

// 화면 이름 → 경로. Header 탭 등 setView 호출을 navigate로 이어 준다.
const PATHS = {
  home: "/",
  library: "/library",
  history: "/history",
  contact: "/contact",
  timer: "/timer",
};

export default function App() {
  const { view } = useRoute(); // URL이 화면 상태의 진실 소스
  const setView = (v) => navigate(PATHS[v] ?? "/");
  const [exercises, setExercises] = useState(DEFAULT_EXERCISES);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [circuit, setCircuit] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [resumeSession, setResumeSession] = useState(null);
  const [activePreset, setActivePreset] = useState(null); // 프리셋 id | null — 랜덤 뽑기로 돌아가면 해제
  const [history, setHistory] = useState([]); // 완료 기록 (최신순)

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
      // 완료 기록
      try {
        const rec = await storage.get(HISTORY_KEY);
        if (rec && rec.value) setHistory(JSON.parse(rec.value));
      } catch (e) {}
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
  // 어린이 모드는 전용 풀(KIDS_EXERCISES)에서 뽑는다 — 어른 서고와 완전 분리.
  // 그 외 모드 필터에 맞는 동작이 패턴에 하나도 없으면 모드를 무시하고 패턴 전체에서 뽑는다.
  const pickRandom = (patternId, excludeId, mode = settings.mode || "all") => {
    const source = mode === "kids" ? KIDS_EXERCISES : exercises;
    const inMode = (e) => mode === "all" || mode === "kids" || e.equip === mode;
    let pool = source.filter((e) => e.pattern === patternId && inMode(e) && e.id !== excludeId);
    if (!pool.length) pool = source.filter((e) => e.pattern === patternId && inMode(e));
    if (!pool.length) pool = source.filter((e) => e.pattern === patternId);
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
  };

  const generate = () => {
    setActivePreset(null);
    setCircuit(PATTERNS.map((p) => pickRandom(p.id)).filter(Boolean));
  };

  // 모드 변경 — 이미 뽑아둔 서킷이 있으면 새 모드 기준으로 다시 뽑는다.
  // 어린이 모드 진입 시에는 권장 설정(짧은 운동·2라운드)도 함께 적용.
  const changeMode = (mode) => {
    const next = { ...settings, mode, ...(mode === "kids" ? KIDS_SETTINGS : {}) };
    setSettings(next);
    persist(exercises, next);
    if (circuit.length && !activePreset) {
      setCircuit(PATTERNS.map((p) => pickRandom(p.id, undefined, mode)).filter(Boolean));
    }
  };

  // ─── 프로그램 프리셋 ───
  // 서고에서 지운 기본 동작도 프리셋에서는 쓸 수 있게 DEFAULT_EXERCISES까지 조회
  const applyPreset = (preset) => {
    const find = (id) => exercises.find((e) => e.id === id) || DEFAULT_EXERCISES.find((e) => e.id === id);
    const circ = preset.exerciseIds.map(find).filter(Boolean);
    if (!circ.length) return;
    const next = { ...settings, ...preset.settings };
    setSettings(next);
    persist(exercises, next);
    setCircuit(circ);
    setActivePreset(preset.id);
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

  // ─── 완료 기록 ───
  const persistHistory = (next) => {
    setHistory(next);
    storage.set(HISTORY_KEY, JSON.stringify(next));
  };

  const addRecord = ({ elapsedMin }) => {
    const rec = {
      id: "r" + Date.now(),
      endedAt: Date.now(),
      durationMin: elapsedMin,
      rounds: settings.rounds,
      work: settings.work,
      preset: activePreset,
      exercises: circuit.map((e) => ({ id: e.id, name: e.name })),
    };
    persistHistory([rec, ...history].slice(0, HISTORY_LIMIT));
  };

  const removeRecord = (id) => persistHistory(history.filter((r) => r.id !== id));

  // ─── 타이머 ───
  const timer = useWorkoutTimer({ circuit, settings, rerollAt, onComplete: addRecord });
  useWakeLock(view === "timer" && timer.phase !== "idle" && timer.phase !== "done");

  // 저장돼 있던 진행 세션을 타이머 화면(일시정지 상태)으로 복원
  useEffect(() => {
    if (!loaded || !resumeSession) return;
    timer.restore(resumeSession);
    navigate("/timer", { replace: true }); // 복원은 히스토리에 새 항목을 남기지 않는다
    setResumeSession(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, resumeSession]);

  // /timer 직접 진입인데 진행/복원 세션이 없으면 홈으로 폴백(세션 복원 로직은 위 effect가 담당)
  useEffect(() => {
    if (!loaded || resumeSession) return; // 복원 대기 중이면 건드리지 않는다
    if (view === "timer" && timer.phase === "idle") {
      navigate("/", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, view, resumeSession, timer.phase]);

  // 첫 진입 시 서킷을 미리 한 번 뽑아둔다 — 빈 화면 대신 기능이 바로 보이게
  useEffect(() => {
    if (!loaded || resumeSession || circuit.length) return;
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

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

  // 진행/복원 세션이 있을 때만 타이머를 그린다. 세션 없는 /timer 직접 진입은
  // 위 폴백 effect가 홈으로 URL을 교체하므로, 여기서는 홈을 잠깐 렌더하고 넘긴다.
  if (view === "timer" && timer.phase !== "idle") {
    return (
      <TimerView
        circuit={circuit}
        settings={settings}
        updateSetting={updateSetting}
        timer={timer}
        stopWorkout={stopWorkout}
        streak={calcStreak(history)}
      />
    );
  }

  if (view === "history") {
    return <HistoryView view={view} setView={setView} history={history} removeRecord={removeRecord} />;
  }

  if (view === "contact") {
    return <ContactView view={view} setView={setView} />;
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
      presets={PRESETS}
      activePreset={activePreset}
      applyPreset={applyPreset}
    />
  );
}
