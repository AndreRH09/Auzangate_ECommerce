// Descarga a public/clips/<id>.mp4 los clips de clips.json que falten (fuera de git: pesan cientos de MB).
import { createWriteStream, existsSync, mkdirSync, readFileSync } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const root = new URL("..", import.meta.url);
const clips = JSON.parse(readFileSync(new URL("clips.json", root), "utf8"));
const dir = new URL("public/clips/", root);
mkdirSync(dir, { recursive: true });

for (const clip of clips) {
  const file = new URL(`${clip.id}.mp4`, dir);
  if (existsSync(file)) continue;
  const res = await fetch(clip.url, { headers: { "user-agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`${clip.id}: HTTP ${res.status}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(file));
  console.log(`ok ${clip.id}`);
}
