import { Composition, Still } from "remotion";
import { type Piece, VicusBoard } from "./board/VicusBoard";
import { CaralBoard, type CaralPiece } from "./board/CaralBoard";
import { Cotton as CaralCotton } from "./tech/caral/Cotton";
import { Fleece as CaralFleece } from "./tech/caral/Fleece";
import { Merino as CaralMerino } from "./tech/caral/Merino";
import { Seam as CaralSeam, SEAM } from "./tech/caral/Seam";
import { Dwr } from "./tech/Dwr";
import { VTECH } from "./tech/frame";
import { Stretch } from "./tech/Stretch";
import { Upf } from "./tech/Upf";
import { Collage, collageSeconds } from "./collage/Collage";
import { Down } from "./tech/Down";
import { DownReal } from "./tech/DownReal";
import { Membrane } from "./tech/Membrane";
import { MembraneReal } from "./tech/MembraneReal";
import { Reinforcement } from "./tech/Reinforcement";
import { ReinforcementReal } from "./tech/ReinforcementReal";
import { TECH } from "./theme";

// Una composición por video de la serie Wari. Los ids son las claves de apps/web/src/lib/series-media.json.
export const RemotionRoot = () => (
  <>
    <Composition id="WariTechMembrane" component={Membrane} durationInFrames={8 * TECH.fps} {...TECH} />
    <Composition id="WariTechDown" component={Down} durationInFrames={8 * TECH.fps} {...TECH} />
    <Composition id="WariTechReinforcement" component={Reinforcement} durationInFrames={6 * TECH.fps} {...TECH} />
    <Composition id="WariTechMembraneReal" component={MembraneReal} durationInFrames={8 * TECH.fps} {...TECH} />
    <Composition id="WariTechDownReal" component={DownReal} durationInFrames={9 * TECH.fps} {...TECH} />
    <Composition id="WariTechReinforcementReal" component={ReinforcementReal} durationInFrames={210} {...TECH} />
    <Composition id="WariExpedition" component={Collage} defaultProps={{ set: "expedition" as const }} durationInFrames={collageSeconds("expedition") * 30} fps={30} width={1920} height={1080} />
    <Composition id="VicusTechStretch" component={Stretch} durationInFrames={6 * VTECH.fps} {...VTECH} />
    <Composition id="VicusTechDwr" component={Dwr} durationInFrames={6 * VTECH.fps} {...VTECH} />
    <Composition id="VicusTechUpf" component={Upf} durationInFrames={6 * VTECH.fps} {...VTECH} />
    {/* storyboard previo a las piezas VICÚS: un still por beat (props.beat 0|1|2) */}
    <Still id="VicusBoard" component={VicusBoard} defaultProps={{ piece: "stretch" as Piece, beat: 0 as 0 | 1 | 2 }} width={1920} height={1080} />
    <Still id="CaralBoard" component={CaralBoard} defaultProps={{ piece: "merino" as CaralPiece, beat: 0 as 0 | 1 | 2 }} width={1920} height={1080} />
    <Composition id="CaralTechMerino" component={CaralMerino} durationInFrames={6 * TECH.fps} {...TECH} />
    <Composition id="CaralTechFleece" component={CaralFleece} durationInFrames={6 * TECH.fps} {...TECH} />
    <Composition id="CaralTechCotton" component={CaralCotton} durationInFrames={6 * TECH.fps} {...TECH} />
    <Composition id="CaralTechSeam" component={CaralSeam} durationInFrames={SEAM.seconds * SEAM.fps} fps={SEAM.fps} width={SEAM.width} height={SEAM.height} />
    {/* CARAL · 02 USO: everyday walk urbano, mañana → tarde */}
    <Composition id="CaralEveryday" component={Collage} defaultProps={{ set: "caral-everyday" as const }} durationInFrames={collageSeconds("caral-everyday") * 30} fps={30} width={1920} height={1080} />
    <Composition id="WariWeather" component={Collage} defaultProps={{ set: "weather" as const }} durationInFrames={collageSeconds("weather") * 30} fps={30} width={1920} height={1080} />
    <Composition id="VicusExpedition" component={Collage} defaultProps={{ set: "vicus-expedition" as const }} durationInFrames={collageSeconds("vicus-expedition") * 30} fps={30} width={1920} height={1080} />
    <Composition id="VicusWeather" component={Collage} defaultProps={{ set: "vicus-weather" as const }} durationInFrames={collageSeconds("vicus-weather") * 30} fps={30} width={1920} height={1080} />
  </>
);
