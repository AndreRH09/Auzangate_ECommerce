// Renderiza los videos de la serie, los sube a R2 (bucket MEDIA) con nombre hasheado y escribe el manifiesto que lee la web.
// Uso: pnpm --filter motion publish:local   (bucket local de `next dev`, .wrangler/state de apps/web)
//      pnpm --filter motion publish:remote  (producción)
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const target = process.argv.includes("--remote") ? "--remote" : "--local";
const motion = fileURLToPath(new URL("..", import.meta.url));
const web = fileURLToPath(new URL("../../web/", import.meta.url));
const manifestPath = `${web}src/lib/series-media.json`;
const MB = 1024 * 1024;

// id de composición → límite de peso (spec: collages ≤ 4 MB, tecnología ≤ 1 MB)
const VIDEOS = {
  WariExpedition: 4 * MB,
  WariWeather: 4 * MB,
  WariTechMembrane: 1 * MB,
  WariTechDown: 1 * MB,
  WariTechReinforcement: 1 * MB,
};

const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: ["ignore", "ignore", "inherit"], shell: process.platform === "win32" });
const kebab = (id) => id.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
const put = (key, file, type) =>
  run("pnpm", ["exec", "wrangler", "r2", "object", "put", `auzangate-media/${key}`, "--file", file, "--content-type", type, target], web);

mkdirSync(`${motion}out`, { recursive: true });
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

for (const [id, limit] of Object.entries(VIDEOS)) {
  const mp4 = `${motion}out/${id}.mp4`;
  const poster = `${motion}out/${id}.jpg`; // still de una composición con video: solo png/jpeg
  // concurrency=1: con varios hilos el compositor de Remotion falla en Windows ("No frame found") con los clips de video.
  // ponytail: sube el CRF de 3 en 3 hasta entrar en el límite; con 4 intentos basta para estos clips
  for (let crf = 26; ; crf += 3) {
    run("npx", ["remotion", "render", id, mp4, "--codec=h264", "--muted", `--crf=${crf}`, "--x264-preset=slow", "--concurrency=1"], motion);
    if (statSync(mp4).size <= limit || crf >= 35) break;
  }
  run("npx", ["remotion", "still", id, poster, "--frame=0", "--image-format=jpeg", "--jpeg-quality=80"], motion);
  const hash = createHash("sha256").update(readFileSync(mp4)).digest("hex").slice(0, 8);
  const base = `series/wari/${kebab(id)}-${hash}`;
  put(`${base}.mp4`, mp4, "video/mp4");
  put(`${base}.jpg`, poster, "image/jpeg");
  manifest[id] = { video: `/media/${base}.mp4`, poster: `/media/${base}.jpg` };
  console.log(`${id}: ${(statSync(mp4).size / MB).toFixed(2)} MB → ${base}`);
}

writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
