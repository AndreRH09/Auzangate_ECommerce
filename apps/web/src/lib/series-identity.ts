import type { Locale } from "@/i18n/routing";
import media from "./series-media.json";

// Identidad de sub-marca por serie (spec 2026-11-13-series-identity). Una serie sin entrada aquí conserva la página
// de listado de siempre. Videos y pósters: los genera apps/motion (`pnpm --filter motion publish:*`) en series-media.json.
export type SeriesMedia = { video: string; poster: string };
type Copy = { title: string; body: string };

export type SeriesIdentity = {
  heading: string;
  manifesto: string;
  expedition: { title: string; line: string; media?: SeriesMedia };
  positioning: string;
  tech: (Copy & { media?: SeriesMedia })[];
  conditions: Copy & { data: { label: string; value: string }[]; media?: SeriesMedia };
};

const m = (id: string): SeriesMedia | undefined => (media as Record<string, SeriesMedia>)[id];

// Condiciones: rangos del entorno (Ausangate 6 384 m, Rajuntay ~5 477 m), no certificación de las prendas.
const WARI: Record<Locale, SeriesIdentity> = {
  es: {
    heading: "Serie Wari: casacas y pantalones de expedición",
    manifesto: "La cima es la\nmitad del camino",
    expedition: { title: "Expedición", line: "Para el viento, la altura y el frío seco del altiplano.", media: m("WariExpedition") },
    positioning: "Wari es la línea de expedición de Auzangate: montañismo y outdoor exigente. Prendas técnicas pensadas desde la altura del apu, 6384 metros, para quien no toma el camino fácil.",
    tech: [
      { title: "MEMBRANA 20K", body: "Nylon de 2 capas con membrana impermeable de 20 000 mm que deja salir el vapor.", media: m("WariTechMembraneReal") },
      { title: "PLUMA 650", body: "Más aire atrapado por gramo: más calor con menos peso dentro de la mochila.", media: m("WariTechDownReal") },
      { title: "REFUERZOS", body: "Tejido doble en rodillas y bajos, donde la roca y los crampones desgastan primero.", media: m("WariTechReinforcementReal") },
    ],
    conditions: {
      title: "Lluvia. Nieve. Ventisca.",
      body: "El clima cambia en minutos: de la lluvia a la nieve, de la calma a la ventisca. Wari se construye para esos escenarios.",
      data: [
        { label: "ALTURA", value: "4 800 – 6 384 m" },
        { label: "TEMPERATURA", value: "−20 a 10 °C" },
        { label: "VIENTO", value: "ráfagas de 80 km/h" },
        { label: "HUMEDAD", value: "30 – 90 %" },
      ],
      media: m("WariWeather"),
    },
  },
  en: {
    heading: "Wari Series: expedition jackets and pants",
    manifesto: "The summit is\nhalfway there",
    expedition: { title: "Expedition", line: "Built for wind, altitude and the dry cold of the high Andes.", media: m("WariExpedition") },
    positioning: "Wari is Auzangate's expedition line: mountaineering and demanding outdoors. Technical gear designed from the height of the apu, 6384 meters, for those who never take the easy way.",
    tech: [
      { title: "20K MEMBRANE", body: "2-layer nylon with a 20,000 mm waterproof membrane that lets vapor out.", media: m("WariTechMembraneReal") },
      { title: "650 DOWN", body: "More air trapped per gram: more warmth with less weight in your pack.", media: m("WariTechDownReal") },
      { title: "REINFORCEMENTS", body: "Double fabric at the knees and hems, where rock and crampons wear first.", media: m("WariTechReinforcementReal") },
    ],
    conditions: {
      title: "Rain. Snow. Blizzard.",
      body: "Up high the weather turns in minutes: from rain to snow, from calm to blizzard. Wari is built for those scenarios.",
      data: [
        { label: "ALTITUDE", value: "4,800 – 6,384 m" },
        { label: "TEMPERATURE", value: "−20 to 10 °C" },
        { label: "WIND", value: "gusts of 80 km/h" },
        { label: "HUMIDITY", value: "30 – 90 %" },
      ],
      media: m("WariWeather"),
    },
  },
};

const IDENTITIES: Record<string, Record<Locale, SeriesIdentity>> = { WARI };

export const getSeriesIdentity = (code: string, locale: Locale): SeriesIdentity | null => IDENTITIES[code]?.[locale] ?? null;
