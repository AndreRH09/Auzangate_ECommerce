import { AbsoluteFill, OffthreadVideo, Series, staticFile, useVideoConfig } from "remotion";
import clips from "../../clips.json";

export type ClipSet = "expedition" | "weather" | "vicus-expedition" | "vicus-weather";

// Collage de video real con cortes secos, en el orden de clips.json. Cada clip ya viene recortado a su tramo
// por scripts/fetch-clips.mjs. Sin textos ni gráficos encima (spec: no mezclar).
export const clipsOf = (set: ClipSet) => clips.filter((c) => c.set === set);
export const collageSeconds = (set: ClipSet) => clipsOf(set).reduce((s, c) => s + c.durSec, 0);

export const Collage = ({ set }: { set: ClipSet }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Series>
        {clipsOf(set).map((c) => (
          <Series.Sequence key={c.id} name={c.id} durationInFrames={Math.round(c.durSec * fps)}>
            <OffthreadVideo src={staticFile(`clips/${c.id}.mp4`)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  );
};
