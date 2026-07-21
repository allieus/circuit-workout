// 비프(Web Audio) + 음성 가이드(Web Speech, ko-KR)
// 모바일 브라우저는 사용자 제스처 이후에만 소리를 허용한다 — "시작" 버튼 탭이 그 역할.

let ctx = null;

export function beep(freq = 880, dur = 0.12) {
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume(); // 백그라운드를 다녀오면 suspended가 될 수 있다
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  } catch (e) {}
}

export function speak(text, enabled) {
  if (!enabled) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ko-KR";
    u.rate = 1.05;
    window.speechSynthesis.speak(u);
  } catch (e) {}
}

export function stopSpeech() {
  try {
    window.speechSynthesis.cancel();
  } catch (e) {}
}
