import { Composition } from "remotion";
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
  </>
);
