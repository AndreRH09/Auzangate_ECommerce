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

// Vicús (maquetado "Vicús · propuesta técnica"): outdoor moderado, de la ciudad al sendero y al camping.
// Layout propio: hero partido con fotos de producto, banda de datos, tecnología en pestañas y uso en video enmarcado.
export type VicusContent = {
  heading: string;
  line: string;
  manifesto: string;
  lead: string;
  figure: { product: string; slug: string; alt: string; zones: string[] }; // slug del producto en la API: de ahí salen las fotos
  data: { label: string; value: string }[];
  positioning: { title: string; body: string };
  tech: { eyebrow: string; title: string; items: (Copy & { media?: SeriesMedia })[] };
  use: { eyebrow: string; title: string; overlay: string; media?: SeriesMedia; moments: { time: string; body: string }[] };
};

const VICUS: Record<Locale, VicusContent> = {
  es: {
    heading: "Serie Vicús: softshells y pantalones para todos los días",
    line: "LÍNEA BALANCE",
    manifesto: "Una prenda,\nmil planes",
    lead: "Resistencia, acabados limpios y comodidad. Lo justo para moverte del sendero a la ciudad sin cambiarte.",
    figure: { product: "SHORT AV04 · MUSGO", slug: "short-av04", alt: "Short AV04 color musgo, vistas frontal y tres cuartos", zones: ["CINTURA ELÁSTICA CON CINTURÓN", "RIPSTOP STRETCH", "BOLSILLOS CARGO CON CIERRE", "LARGO SOBRE LA RODILLA"] },
    data: [
      { label: "PESO", value: "390 g" },
      { label: "ELASTICIDAD", value: "4 vías" },
      { label: "PROTECCIÓN SOLAR", value: "UPF 50" },
      { label: "ACABADO", value: "DWR sin PFC" },
    ],
    positioning: {
      title: "Del sendero a la ciudad sin cambiarte.",
      body: "Vicús es la línea de equilibrio de Auzangate: prendas que aguantan una caminata de fin de semana, una tarde en el parque o una noche de camping, y se ven bien el lunes. Sin capas de más, sin detalles que sobren.",
    },
    tech: {
      eyebrow: "01 · TECNOLOGÍA",
      title: "Cómo está hecha",
      items: [
        { title: "STRETCH 4 VÍAS", body: "El tejido cede en todas las direcciones y vuelve a su forma: rodillas y hombros se mueven sin tirar.", media: m("VicusTechStretch") },
        { title: "DWR SIN PFC", body: "El agua forma gotas y resbala sin empapar el tejido. Acabado sin químicos perfluorados.", media: m("VicusTechDwr") },
        { title: "UPF 50", body: "Bloquea el 98 % de la radiación UV: protección en caminatas largas bajo el sol.", media: m("VicusTechUpf") },
      ],
    },
    use: {
      eyebrow: "02 · USO",
      title: "Un día, tres escenarios",
      overlay: "Parque. Sendero. Camping.",
      media: m("VicusExpedition"),
      moments: [
        { time: "07:30 · PARQUE", body: "Corte limpio y colores sobrios: igual de bien en la ciudad que en el parque." },
        { time: "13:00 · SENDERO", body: "Stretch 4 vías y DWR para subir sin pensar en la ropa." },
        { time: "19:00 · CAMPING", body: "Cortaviento cuando cae la tarde junto a la carpa." },
      ],
    },
  },
  en: {
    heading: "Vicús Series: everyday softshells and pants",
    line: "BALANCE LINE",
    manifesto: "One piece,\nendless plans",
    lead: "Durability, clean finishes and comfort. Just enough to go from the trail to the city without changing.",
    figure: { product: "SHORT AV04 · MOSS", slug: "shorts-av04", alt: "Short AV04 in moss, front and three-quarter views", zones: ["ELASTIC WAIST WITH BELT", "STRETCH RIPSTOP", "ZIPPED CARGO POCKETS", "ABOVE-KNEE LENGTH"] },
    data: [
      { label: "WEIGHT", value: "390 g" },
      { label: "STRETCH", value: "4-way" },
      { label: "SUN PROTECTION", value: "UPF 50" },
      { label: "FINISH", value: "PFC-free DWR" },
    ],
    positioning: {
      title: "From the trail to the city without changing.",
      body: "Vicús is Auzangate's balance line: gear that handles a weekend hike, an afternoon in the park or a night at camp, and still looks right on Monday. No extra layers, no details you don't need.",
    },
    tech: {
      eyebrow: "01 · TECHNOLOGY",
      title: "How it's made",
      items: [
        { title: "4-WAY STRETCH", body: "The fabric gives in every direction and snaps back: knees and shoulders move without pulling.", media: m("VicusTechStretch") },
        { title: "PFC-FREE DWR", body: "Water beads up and rolls off without soaking the fabric. Finished without perfluorinated chemicals.", media: m("VicusTechDwr") },
        { title: "UPF 50", body: "Blocks 98% of UV radiation: protection on long walks under the sun.", media: m("VicusTechUpf") },
      ],
    },
    use: {
      eyebrow: "02 · USE",
      title: "One day, three scenes",
      overlay: "Park. Trail. Camp.",
      media: m("VicusExpedition"),
      moments: [
        { time: "07:30 · PARK", body: "Clean cut and quiet colors: as right in the city as in the park." },
        { time: "13:00 · TRAIL", body: "4-way stretch and DWR to climb without thinking about your clothes." },
        { time: "19:00 · CAMP", body: "Windproof when the evening cools down by the tent." },
      ],
    },
  },
};

export const getVicusContent = (locale: Locale): VicusContent => VICUS[locale];

const IDENTITIES: Record<string, Record<Locale, SeriesIdentity>> = { WARI };

export const getSeriesIdentity = (code: string, locale: Locale): SeriesIdentity | null => IDENTITIES[code]?.[locale] ?? null;
