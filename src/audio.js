// 소리 계층: 비프(Web Audio) + 음성 가이드
// 음성 가이드는 사전 생성된 ElevenLabs 클립(public/voice/, scripts/generate-voice.mjs)을
// 이어붙여 재생하고, 클립이 없는 발화(사용자 추가 동작 등)는 Web Speech(ko-KR)로 폴백한다.
// 클립 재생도 beep과 같은 AudioContext를 공유 — "시작" 버튼 탭으로 unlock된 컨텍스트라
// iOS standalone에서도 이후의 자동 발화가 허용된다.

let ctx = null;

function ensureCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume(); // 백그라운드를 다녀오면 suspended가 될 수 있다
  return ctx;
}

export function beep(freq = 880, dur = 0.12) {
  try {
    const c = ensureCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(c.destination);
    gain.gain.setValueAtTime(0.25, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    osc.start();
    osc.stop(c.currentTime + dur);
  } catch (e) {}
}

// ─── 음성 클립 플레이어 ───
let clipManifest = null; // key → { file, text }
const bufferCache = new Map(); // key → Promise<AudioBuffer>
let activeSources = [];
let playToken = 0; // 새 발화가 시작되면 증가 — 이전 발화의 늦은 재생을 무효화

export async function initVoiceClips() {
  try {
    const res = await fetch("/voice/manifest.json");
    if (res.ok) clipManifest = await res.json();
  } catch (e) {
    // 매니페스트 없음 — 전부 Web Speech 폴백으로 동작
  }
}

function loadBuffer(key) {
  if (!bufferCache.has(key)) {
    bufferCache.set(
      key,
      fetch(`/voice/${clipManifest[key].file}`)
        .then((r) => {
          if (!r.ok) throw new Error(`clip ${key}: ${r.status}`);
          return r.arrayBuffer();
        })
        .then((ab) => ensureCtx().decodeAudioData(ab))
    );
  }
  return bufferCache.get(key);
}

// 타이머 시작 시 이번 세션에 쓸 클립을 미리 받아 두면 발화 지연이 없다
export function prefetchClips(keys) {
  if (!clipManifest) return;
  for (const k of keys) {
    if (clipManifest[k]) loadBuffer(k).catch(() => bufferCache.delete(k));
  }
}

function stopClips() {
  for (const s of activeSources) {
    try {
      s.stop();
    } catch (e) {}
  }
  activeSources = [];
}

// 모든 발화(클립 + Web Speech) 중지
export function stopSpeech() {
  playToken++;
  stopClips();
  try {
    window.speechSynthesis.cancel();
  } catch (e) {}
}

function webSpeak(text) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ko-KR";
    u.rate = 1.05;
    window.speechSynthesis.speak(u);
  } catch (e) {}
}

// keys의 클립이 모두 있으면 이어붙여 재생, 하나라도 없으면 fallbackText를 Web Speech로
export function speakGuide(keys, fallbackText, enabled) {
  if (!enabled) return;
  stopSpeech();
  const token = playToken;

  if (!clipManifest || !keys.every((k) => clipManifest[k])) {
    webSpeak(fallbackText);
    return;
  }

  (async () => {
    try {
      const c = ensureCtx();
      const buffers = await Promise.all(keys.map(loadBuffer));
      if (token !== playToken) return; // 그 사이 다른 발화가 시작됨
      let at = c.currentTime + 0.02;
      for (const buf of buffers) {
        const src = c.createBufferSource();
        src.buffer = buf;
        src.connect(c.destination);
        src.start(at);
        at += buf.duration + 0.15; // 클립 사이 짧은 숨
        activeSources.push(src);
      }
    } catch (e) {
      keys.forEach((k) => bufferCache.delete(k));
      if (token === playToken) webSpeak(fallbackText); // 클립 로드 실패 → 폴백
    }
  })();
}
