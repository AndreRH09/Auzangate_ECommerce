// Descarga los clips de clips.json que falten y deja en public/clips/<id>.mp4 solo su tramo (startSec, durSec)
// a 1080 px de alto y 30 fps (el ffmpeg de Remotion no trae crop/fps: el recorte a 16:9 lo hace objectFit: cover). Normalizar evita los fallos del compositor de Remotion con originales 4K/60 fps
// y deja unos MB en vez de ~600. Fuera de git: se regeneran con este script.
import { execFileSync } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const clips = JSON.parse(readFileSync(`${root}clips.json`, "utf8"));
const dir = `${root}public/clips/`;
mkdirSync(dir, { recursive: true });

for (const clip of clips) {
  const out = `${dir}${clip.id}.mp4`;
  if (existsSync(out)) continue;
  const src = `${dir}${clip.id}.src.mp4`;
  const res = await fetch(clip.url, { headers: { "user-agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`${clip.id}: HTTP ${res.status}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(src));
  execFileSync("npx", ["remotion", "ffmpeg", "-y", "-v", "error", "-ss", String(clip.startSec), "-i", src, "-t", String(clip.durSec), "-vf", "scale=-2:1080", "-r", "30", "-an", "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", out], {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  rmSync(src);
  console.log(`ok ${clip.id}`);
}
