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

// Caral (maquetado "Serie Caral"): la serie clásica. Manifiesto corto, banda de fibras, costura plana en video
// junto a su lista, y uso en video partido con texto. El catálogo de debajo es el protagonista.
export type CaralContent = {
  heading: string;
  line: string;
  manifesto: string;
  lead: string;
  fibers: { label: string; value: string }[];
  seam: { eyebrow: string; title: string; media?: SeriesMedia; points: Copy[] };
  use: { eyebrow: string; title: string; body: string; cta: string; media?: SeriesMedia };
};

const CARAL: Record<Locale, CaralContent> = {
  es: {
    heading: "Serie Caral: merino, algodón y polar clásicos",
    line: "LÍNEA CLASSIC · 4 PRODUCTOS",
    manifesto: "Donde\nempezó todo.",
    lead: "La serie clásica y pionera de Auzangate. Fibras nobles, cortes clásicos.",
    fibers: [
      { label: "FIBRA BASE", value: "Merino 100 %" },
      { label: "POLO", value: "Algodón 100 %" },
      { label: "POLAR", value: "300 g/m²" },
      { label: "DESDE", value: "S/ 79" },
    ],
    seam: {
      eyebrow: "01 · SISTEMA",
      title: "Confeccionado",
      media: m("CaralTechSeam"),
      points: [
        { title: "PLANA, SIN ROCE", body: "La costura flatlock queda al ras de la tela: no marca ni roza la piel, aunque la lleves todo el día o debajo de una mochila." },
        { title: "4 HILOS ENTRELAZADOS", body: "Dos agujas y un looper cruzan cuatro hilos sobre la unión: aguanta el uso diario y los lavados sin abrirse." },
        { title: "CEDE CON LA TELA", body: "El zigzag se estira junto con el punto y vuelve a su sitio, y por dentro no deja bordes sueltos: se ve igual de limpia por ambos lados." },
      ],
    },
    use: {
      eyebrow: "02 · USO",
      title: "Comodidad y diseño",
      body: "Caral es la puerta de entrada a Auzangate: piezas cómodas, ya sea en un viaje corto o como base de una salida más larga.",
      cta: "Ver la serie",
      media: m("CaralEveryday"),
    },
  },
  en: {
    heading: "Caral Series: classic merino, cotton and fleece",
    line: "CLASSIC LINE · 4 PRODUCTS",
    manifesto: "Where it\nall began.",
    lead: "Auzangate's classic, pioneering series. Noble fibers, classic cuts.",
    fibers: [
      { label: "BASE FIBER", value: "100% merino" },
      { label: "TEE", value: "100% cotton" },
      { label: "FLEECE", value: "300 g/m²" },
      { label: "FROM", value: "S/ 79" },
    ],
    seam: {
      eyebrow: "01 · SYSTEM",
      title: "How it's sewn",
      media: m("CaralTechSeam"),
      points: [
        { title: "FLAT, NO CHAFING", body: "The flatlock seam sits flush with the fabric: it won't mark or rub your skin, even all day or under a backpack." },
        { title: "4 INTERLOCKED THREADS", body: "Two needles and a looper cross four threads over the join: it holds up to daily wear and washing without opening." },
        { title: "GIVES WITH THE FABRIC", body: "The zigzag stretches with the knit and springs back, with no loose edges inside: it looks just as clean on both sides." },
      ],
    },
    use: {
      eyebrow: "02 · USE",
      title: "Comfort and design",
      body: "Caral is the way into Auzangate: comfortable pieces for a short trip or as the base of a longer outing.",
      cta: "See the series",
      media: m("CaralEveryday"),
    },
  },
};

export const getCaralContent = (locale: Locale): CaralContent => CARAL[locale];

// Nasca (maquetado "Nasca · peso como protagonista"): manifiesto en peso ligero, collage de fotos de clima cálido
// (Pexels, en public/series/nasca) y "Liviana, no frágil" con las fotos reales del pantalón AN04 que sirve la API.
export type NascaContent = {
  heading: string;
  line: string;
  manifesto: string;
  climate: { title: string; body: string; photos: { src: string; alt: string }[] };
  // items[i]: texto + pieza de motion NASCA (apps/motion); sin media, la tarjeta queda en negro
  tech: { eyebrow: string; title: string; items: (Copy & { media?: SeriesMedia })[] };
  data: { label: string; value: string }[];
};

const NASCA_PHOTOS = (alts: string[]) =>
  ["hiker-dunes", "group-dunes", "dune-ridge", "dry-coast", "dune-sky", "sand-ripples"].map((f, i) => ({ src: `/series/nasca/${f}.webp`, alt: alts[i] }));

const NASCA: Record<Locale, NascaContent> = {
  es: {
    heading: "Serie Nasca: ropa liviana para climas cálidos",
    line: "LÍNEA LIGHT",
    manifesto: "Lo que no pesa,\nno estorba.",
    climate: {
      title: "Sol. Arena. Calor.",
      body: "Para el desierto, la costa y los valles cálidos: prendas que se secan solas y se guardan en un bolsillo.",
      photos: NASCA_PHOTOS([
        "Caminante cruzando una duna frente a una cordillera seca",
        "Tres personas caminando sobre dunas a pleno sol",
        "Cresta de una duna contra el cielo azul",
        "Playa seca bajo un acantilado",
        "Duna lisa bajo un cielo con nubes altas",
        "Ondas de viento sobre la arena",
      ]),
    },
    tech: {
      eyebrow: "01 · TECNOLOGÍA",
      title: "Liviana, no frágil",
      items: [
        { title: "RIPSTOP 40D", body: "Una rejilla de hilo reforzado frena cualquier rasgón antes de que avance.", media: m("NascaTechRipstop") },
        { title: "MERINO 87 %", body: "La fibra saca el sudor de la piel y lo suelta como vapor; no guarda olor en días de calor.", media: m("NascaTechMerino") },
        { title: "UPF 50", body: "Bloquea el 98 % de la radiación UV en caminatas largas bajo el sol.", media: m("NascaTechUpf") },
      ],
    },
    data: [
      { label: "PESO", value: "260 g" },
      { label: "TELA", value: "Ripstop 40D" },
      { label: "PROTECCIÓN", value: "UPF 50" },
    ],
  },
  en: {
    heading: "Nasca Series: lightweight gear for warm climates",
    line: "LIGHT LINE",
    manifesto: "What weighs nothing\ngets in no one's way.",
    climate: {
      title: "Sun. Sand. Heat.",
      body: "For the desert, the coast and warm valleys: gear that dries on its own and packs into a pocket.",
      photos: NASCA_PHOTOS([
        "Hiker crossing a dune in front of a dry mountain range",
        "Three people walking on dunes in full sun",
        "Dune crest against a blue sky",
        "Dry beach below a cliff",
        "Smooth dune under high clouds",
        "Wind ripples on the sand",
      ]),
    },
    tech: {
      eyebrow: "01 · TECHNOLOGY",
      title: "Light, not fragile",
      items: [
        { title: "40D RIPSTOP", body: "A grid of reinforced thread stops any tear before it spreads.", media: m("NascaTechRipstop") },
        { title: "MERINO 87%", body: "The fiber pulls sweat off your skin and releases it as vapor; it holds no odor on hot days.", media: m("NascaTechMerino") },
        { title: "UPF 50", body: "Blocks 98% of UV radiation on long walks under the sun.", media: m("NascaTechUpf") },
      ],
    },
    data: [
      { label: "WEIGHT", value: "260 g" },
      { label: "FABRIC", value: "40D ripstop" },
      { label: "PROTECTION", value: "UPF 50" },
    ],
  },
};

export const getNascaContent = (locale: Locale): NascaContent => NASCA[locale];

// Sicán (maquetado "Serie Sicán · pieza única"): la única serie en negativo. Vitrina de una pieza (puffer AS05),
// «Acabados» en 3 paneles con motion sin texto (bordado, rasgadura en tela común, ripstop que la frena) y la capa half zip AS02.
type SicanBlock = { eyebrow: string; title: string; body: string; media?: SeriesMedia };
type SicanFinish = { title: string; body: string; media?: SeriesMedia };
export type SicanContent = {
  heading: string;
  line: string;
  manifesto: string;
  lead: string;
  // priceCents fijo: AS05 ya está en el catálogo; pasarlo a getProduct
  hero: { label: string; image: string; alt: string; href: string; priceCents: number; cta: string; seriesCta: string };
  finishes: { eyebrow: string; title: string; items: SicanFinish[] };
  layer: SicanBlock & { cta: string; image?: string; alt?: string };
};

const SICAN: Record<Locale, SicanContent> = {
  es: {
    heading: "Serie Sicán: prendas selectas de acabado fino",
    line: "LÍNEA SELECTO",
    manifesto: "Para estándares altos.",
    lead: "Pensada como la orfebrería sicán: pocas piezas, trabajadas al detalle.",
    hero: { label: "CASACA AS05 · PUFFER", image: "/products/AS05/C/front.png", alt: "Casaca AS05, puffer negro de cuello alto con tapeta frontal, vista frontal", href: "/p/casaca-as05", priceCents: 69900, cta: "Comprar", seriesCta: "Ver la serie" },
    finishes: {
      eyebrow: "01 · DETALLE",
      title: "Acabados",
      items: [
        { title: "Bordado", body: "El parche 6384 · Sicán en hilo blanco, directo sobre la tela negra: una sola tinta y relieve que se lee con la luz.", media: m("SicanPatch") },
        { title: "Tela común", body: "Sin retícula, un enganche se convierte en una rasgadura que recorre la prenda.", media: m("SicanTechPlain") },
        { title: "Ripstop fino", body: "Los hilos de refuerzo frenan la rasgadura: el daño queda en un solo cuadro.", media: m("SicanTechRipstop") },
      ],
    },
    layer: {
      eyebrow: "02 · CAPA",
      title: "Half zip AS02",
      body: "La capa intermedia de la serie: medio cierre para regular el calor, cuello alto y un corte limpio que va bajo el puffer o solo.",
      cta: "Ver AS02",
    },
  },
  en: {
    heading: "Sicán Series: select pieces with a fine finish",
    line: "SELECTO LINE",
    manifesto: "For high standards.",
    lead: "Made like Sicán goldwork: few pieces, worked down to the detail.",
    hero: { label: "AS05 JACKET · PUFFER", image: "/products/AS05/C/front.png", alt: "AS05 jacket, black high-collar puffer with front storm flap, front view", href: "/p/jacket-as05", priceCents: 69900, cta: "Shop", seriesCta: "View the series" },
    finishes: {
      eyebrow: "01 · DETAIL",
      title: "Finishes",
      items: [
        { title: "Embroidered", body: "The 6384 · Sicán patch in white thread, straight onto the black fabric: one ink and a relief that shows in the light.", media: m("SicanPatch") },
        { title: "Plain fabric", body: "Without a grid, one snag turns into a tear that runs through the garment.", media: m("SicanTechPlain") },
        { title: "Fine ripstop", body: "The reinforcement threads stop the tear: the damage stays in a single square.", media: m("SicanTechRipstop") },
      ],
    },
    layer: {
      eyebrow: "02 · LAYER",
      title: "AS02 half zip",
      body: "The series' mid layer: a half zip to regulate heat, a high collar and a clean cut that works under the puffer or on its own.",
      cta: "See AS02",
    },
  },
};

export const getSicanContent = (locale: Locale): SicanContent => SICAN[locale];

const IDENTITIES: Record<string, Record<Locale, SeriesIdentity>> = { WARI };

export const getSeriesIdentity = (code: string, locale: Locale): SeriesIdentity | null => IDENTITIES[code]?.[locale] ?? null;
