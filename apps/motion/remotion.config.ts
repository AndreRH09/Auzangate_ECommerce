import { Config } from "@remotion/cli/config";

// Videos para la web: H.264 sin audio, loop en <video muted>.
Config.setVideoImageFormat("jpeg");
Config.setCodec("h264");
Config.setMuted(true);
