import { useEffect, useRef, useState } from "react";

import { beep, speakGuide, stopSpeech, prefetchClips } from "../audio";

// 타이머 상태 머신: phase ∈ idle | ready | work | rest | roundRest | done
// 흐름: 준비(prep초) → [운동(work초) → 휴식(rest초)] × 동작 수 → 라운드 휴식(roundRest초) → ... → 완료
// 구현: 1초 interval은 secondsLeft만 감소시키고, secondsLeft를 감시하는 effect가
// 0이 되면 advance()를 호출한다. 스킵 버튼도 setSecondsLeft(0)으로 같은 경로를 탄다 —
// 단계 전환 로직은 advance() 한 곳에만 둘 것.
export function useWorkoutTimer({ circuit, settings, rerollAt }) {
  const [phase, setPhase] = useState("idle");
  const [roundIdx, setRoundIdx] = useState(0);
  const [exIdx, setExIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [paused, setPaused] = useState(false);
  const startTimeRef = useRef(null);
  const halfSpokenRef = useRef(false);
  const settingsRef = useRef(settings); // stale closure 회피
  settingsRef.current = settings;

  // keys: 사전 생성 클립 키 배열, text: 클립이 없을 때 Web Speech가 읽을 폴백 문장
  const say = (keys, text) => speakGuide(keys, text, settingsRef.current.voice);

  const start = () => {
    if (!circuit.length) return;
    setRoundIdx(0);
    setExIdx(0);
    setPhase("ready");
    setSecondsLeft(settings.prep);
    setPaused(false);
    startTimeRef.current = Date.now();
    halfSpokenRef.current = false;
    // 이번 세션에 쓸 클립 프리페치 — 발화 지연 제거
    const keys = ["start", "half", "done", "prep_first", "next_is", "change", "change_next"];
    for (let n = 1; n < settings.rounds; n++) keys.push(`roundrest_${n}`, `roundstart_${n + 1}`);
    circuit.forEach((e) => keys.push(`ex_${e.id}`));
    prefetchClips(keys);
    beep(1100, 0.2);
    const first = circuit[0];
    say(["prep_first", `ex_${first.id}`], `준비하세요. 첫 동작, ${first.name}. ${first.memo || ""}`);
  };

  // 단계 전환 — 스킵 버튼과 자동 진행이 함께 사용
  const advance = () => {
    halfSpokenRef.current = false;
    if (phase === "ready") {
      setPhase("work");
      setSecondsLeft(settings.work);
      beep(1100, 0.2);
      say(["start"], "시작!");
      return;
    }
    if (phase === "work") {
      const lastEx = exIdx === circuit.length - 1;
      const lastRound = roundIdx === settings.rounds - 1;
      if (lastEx && lastRound) {
        setPhase("done");
        setSecondsLeft(0);
        beep(1320, 0.4);
        say(["done"], "모든 라운드 완료! 수고했어요.");
        return;
      }
      if (lastEx) {
        setPhase("roundRest");
        setSecondsLeft(settings.roundRest);
        beep(440, 0.15);
        say([`roundrest_${roundIdx + 1}`], `${roundIdx + 1}라운드 완료. 잠시 쉬세요.`);
        return;
      }
      const nx = circuit[exIdx + 1];
      setPhase("rest");
      setSecondsLeft(settings.rest);
      beep(440, 0.15);
      say(["next_is", `ex_${nx.id}`], `다음은 ${nx.name}입니다. ${nx.memo || ""}`);
      return;
    }
    if (phase === "rest") {
      setExIdx((i) => i + 1);
      setPhase("work");
      setSecondsLeft(settings.work);
      beep(1100, 0.2);
      say(["start"], "시작!");
      return;
    }
    if (phase === "roundRest") {
      setRoundIdx((r) => r + 1);
      setExIdx(0);
      setPhase("work");
      setSecondsLeft(settings.work);
      beep(1100, 0.2);
      const first = circuit[0];
      say([`roundstart_${roundIdx + 2}`, `ex_${first.id}`], `${roundIdx + 2}라운드 시작! ${first.name}`);
      return;
    }
  };

  // 1초 카운트다운
  useEffect(() => {
    if (paused || phase === "done" || phase === "idle") return;
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [paused, phase]);

  // 초 변화에 반응: 비프, 절반 안내, 0이면 다음 단계
  useEffect(() => {
    if (phase === "done" || phase === "idle") return;
    if (secondsLeft === 0) {
      advance();
      return;
    }
    if (secondsLeft <= 3) beep(660, 0.08);
    if (
      phase === "work" &&
      settings.work >= 20 &&
      secondsLeft === Math.floor(settings.work / 2) &&
      !halfSpokenRef.current
    ) {
      halfSpokenRef.current = true;
      say(["half"], "절반이에요.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  const skip = () => {
    if (phase === "done" || phase === "idle") return;
    setSecondsLeft(0);
  };

  const stop = () => {
    stopSpeech();
    setPhase("idle");
  };

  const togglePause = () => setPaused((p) => !p);

  // 타이머 중 동작 교체: 운동 중이면 현재 동작, 휴식 중이면 다음 동작
  const rerollLive = () => {
    const target = phase === "rest" ? exIdx + 1 : exIdx;
    const next = rerollAt(target);
    if (next)
      say(
        [phase === "rest" ? "change_next" : "change", `ex_${next.id}`],
        `${phase === "rest" ? "다음 동작 변경. " : "동작 변경. "}${next.name}. ${next.memo || ""}`
      );
  };

  const elapsedMinutes = () =>
    startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 60000) : 0;

  return {
    phase,
    roundIdx,
    exIdx,
    secondsLeft,
    paused,
    start,
    stop,
    skip,
    togglePause,
    rerollLive,
    elapsedMinutes,
  };
}
