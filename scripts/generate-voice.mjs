// ElevenLabs 음성 클립 사전 생성 스크립트
// 실행: node --env-file=.env scripts/generate-voice.mjs
//
// 앱의 발화는 전부 템플릿이라 조합이 유한하다 — 고정 문구 + 라운드 숫자 + 동작(이름·메모)을
// 클립으로 미리 생성해 public/voice/에 두고, 런타임에는 API 호출 없이 이어붙여 재생한다.
// 텍스트가 바뀐 클립만 다시 생성한다(manifest.json의 텍스트와 비교).
// 기본 서고에 없는 사용자 추가 동작은 앱에서 Web Speech로 폴백.

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { DEFAULT_EXERCISES, KIDS_EXERCISES } from "../src/data/defaults.js";

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("ELEVENLABS_API_KEY가 없습니다 — .env 확인 후 node --env-file=.env로 실행하세요");
  process.exit(1);
}

const VOICE_ID = "uyVNoMrnUku1dZyVEXwD"; // Anna Kim — 한국어, 차분하고 또렷 (교체 시 여기만 수정)
const MODEL_ID = "eleven_multilingual_v2";
const OUT_DIR = new URL("../public/voice/", import.meta.url);

// ─── 클립 목록 (키 → 발화 텍스트) ───
const clips = {
  start: "시작!",
  half: "절반이에요.",
  done: "모든 라운드 완료! 수고했어요.",
  prep_first: "준비하세요. 첫 동작,",
  next_is: "다음 동작,",
  change: "동작 변경.",
  change_next: "다음 동작 변경.",
};
// 라운드 상한 30 (10초/50초 프리셋의 세트 수 확장 대비)
for (let n = 1; n <= 29; n++) clips[`roundrest_${n}`] = `${n}라운드 완료. 잠시 쉬세요.`;
for (let n = 2; n <= 30; n++) clips[`roundstart_${n}`] = `${n}라운드 시작!`;
for (const ex of [...DEFAULT_EXERCISES, ...KIDS_EXERCISES])
  clips[`ex_${ex.id}`] = ex.memo ? `${ex.name}. ${ex.memo}` : `${ex.name}.`;

// ─── 생성 ───
await mkdir(OUT_DIR, { recursive: true });

let prev = {};
try {
  prev = JSON.parse(await readFile(new URL("manifest.json", OUT_DIR), "utf8"));
} catch {}

const manifest = {};
let generated = 0;

for (const [key, text] of Object.entries(clips)) {
  const hash = createHash("sha1").update(`${VOICE_ID}|${MODEL_ID}|${text}`).digest("hex").slice(0, 8);
  const file = `${key}.mp3`;
  manifest[key] = { file, text, hash };

  if (prev[key]?.hash === hash) continue; // 변경 없음 — 재생성 생략

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });
  if (!res.ok) {
    console.error(`실패 [${key}] ${res.status}: ${await res.text()}`);
    process.exit(1);
  }
  await writeFile(new URL(file, OUT_DIR), Buffer.from(await res.arrayBuffer()));
  generated++;
  console.log(`생성 [${key}] "${text}"`);
}

await writeFile(new URL("manifest.json", OUT_DIR), JSON.stringify(manifest, null, 2));
console.log(`완료: ${generated}개 생성, 총 ${Object.keys(manifest).length}개 클립`);
