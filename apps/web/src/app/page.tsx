// ponytail: página de verificación de tokens y marca para F0. La home real llega en F1 (RF-T01).
const SWATCHES = ["glaciar", "nieve", "roca-clara", "granito", "pizarra", "linea", "cochinilla", "ichu"];

export default function Home() {
  return (
    <main className="mx-auto max-w-[1400px] px-4 py-16 md:px-8">
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático de marca, no necesita optimización */}
      <img src="/brand/lockup-horizontal.svg" alt="AUZANGATE" width={240} height={59} />

      {/* Archivo 125 % mide ~9.4em para 9 letras: 9vw (tope 140px) entra en el contenedor de 1400px y en mobile */}
      <h1 className="display mt-16 text-[clamp(32px,9vw,140px)]">Auzangate</h1>
      <p className="data mt-4 text-pizarra">6384 · PERÚ</p>

      <ul className="mt-16 grid grid-cols-4 gap-1 md:grid-cols-8">
        {SWATCHES.map((name) => (
          <li key={name}>
            <div className="aspect-square rounded-sm border border-linea" style={{ background: `var(--color-${name})` }} />
            <p className="data mt-2">--{name}</p>
          </li>
        ))}
      </ul>

      <div className="mt-16 flex flex-wrap items-center gap-4">
        <button className="h-cta rounded-md bg-granito px-6 font-semibold text-nieve">Añadir a la bolsa</button>
        <span className="label text-cochinilla">Nuevo</span>
        <span className="data">S/ 489.00</span>
      </div>
    </main>
  );
}
