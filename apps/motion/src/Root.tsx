import { Composition } from "remotion";
import { Collage, collageSeconds } from "./collage/Collage";
import { Down } from "./tech/Down";
import { Membrane } from "./tech/Membrane";
import { Reinforcement } from "./tech/Reinforcement";
import { TECH } from "./theme";

// Una composición por video de la serie Wari. Los ids son las claves de apps/web/src/lib/series-media.json.
export const RemotionRoot = () => (
  <>
    <Composition id="WariTechMembrane" component={Membrane} durationInFrames={8 * TECH.fps} {...TECH} />
    <Composition id="WariTechDown" component={Down} durationInFrames={8 * TECH.fps} {...TECH} />
    <Composition id="WariTechReinforcement" component={Reinforcement} durationInFrames={6 * TECH.fps} {...TECH} />
    <Composition id="WariExpedition" component={Collage} defaultProps={{ set: "expedition" as const }} durationInFrames={collageSeconds("expedition") * 30} fps={30} width={1920} height={1080} />
    <Composition id="WariWeather" component={Collage} defaultProps={{ set: "weather" as const }} durationInFrames={collageSeconds("weather") * 30} fps={30} width={1920} height={1080} />
  </>
);
