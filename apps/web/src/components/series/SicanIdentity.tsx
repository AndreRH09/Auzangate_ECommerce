import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/format";
import type { SicanContent } from "@/lib/series-identity";
import { BrandMark } from "../ui/BrandMark";
import { SeriesVideo } from "./SeriesVideo";

// Página de la serie Sicán (maquetado "Serie Sicán · pieza única"): la única en negativo. Vitrina de una pieza,
// «Acabados» en 3 motion (bordado, tela común, ripstop fino) y la capa half zip. El listado va debajo, en #productos.
export function SicanIdentity({ content: c, breadcrumb }: { content: SicanContent; breadcrumb: ReactNode }) {
  const wrap = "mx-auto max-w-[1600px] px-4 md:px-8"; // mismo ancho y margen que el listado «La serie» de abajo
  const head = (id: string, b: { eyebrow: string; title: string }) => (
    <div className="mb-8 flex flex-wrap items-baseline justify-between gap-3 border-t border-[#4A4A4C] pt-6">
      <h2 id={id} className="section-title">{b.title}</h2>
      <span className="data tracking-[0.06em] text-[#B9BBBB]">{b.eyebrow}</span>
    </div>
  );

  return (
    <div className="bg-[#1A1A1B] text-nieve [&_a]:text-inherit">
      <div className={`${wrap} flex flex-wrap items-end justify-between gap-4 pt-6 [&_a]:text-nieve [&_nav]:text-[#B9BBBB] [&_[aria-current]]:text-nieve`}>
        <div>
          {breadcrumb}
          <h1 className="sr-only">{c.heading}</h1>
        </div>
        <span className="data tracking-[0.06em] text-[#B9BBBB]">{c.line}</span>
      </div>

      <section aria-label="Sicán" className={`${wrap} pt-4 pb-24`}>
        <div className="grid items-end gap-10 border-t border-nieve pt-10 md:grid-cols-3">
          <div className="flex flex-col gap-7">
            <BrandMark asset="parche-serie-sican" label="6384 · SICÁN" className="w-24" />
            <p className="display text-[clamp(44px,3.9vw,70px)] normal-case" style={{ lineHeight: 0.85 }}>{c.manifesto}</p>
          </div>
          <figure className="relative m-0 flex aspect-[4/5] items-center justify-center bg-[linear-gradient(180deg,#3A393C_0%,#29282B_55%,#1C1B1D_100%)]">
            <figcaption className="data absolute top-4 left-4 tracking-[0.08em] text-[#B9BBBB]">{c.hero.label}</figcaption>
            {/* eslint-disable-next-line @next/next/no-img-element -- ver ui/ProductPhoto */}
            <img src={c.hero.image} alt={c.hero.alt} width={1152} height={1536} className="h-[80%] w-[80%] object-contain" />
          </figure>
          {/* columna derecha a todo el ancho: precio grande, texto y un solo botón a la ficha */}
          {/* -15% de fuente en toda la columna; pl equilibra el aire respecto a la figura (30px en desktop) */}
          <div className="flex flex-col gap-6 pl-[5px] md:pl-[30px]">
            <p className="data text-[clamp(24px,1.87vw,32px)] leading-none">{formatPrice(c.hero.priceCents)}</p>
            <p className="text-[17px] leading-normal text-[#D9DBDB]">{c.lead}</p>
            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <Link href={c.hero.href} className="btn w-full bg-nieve !text-granito hover:bg-roca-clara">{c.hero.cta}</Link>
              {/* negro sobre el fondo #1A1A1B: el borde lo separa del fondo */}
              <a href="#productos" className="btn w-full border border-[#4A4A4C] bg-black hover:border-nieve">{c.hero.seriesCta}</a>
            </div>
          </div>
        </div>
      </section>

      {/* acabados: tres motion cuadrados sin texto (bordado, tela común, ripstop fino); el texto va en el pie */}
      <section aria-labelledby="h-det" className={`${wrap} pb-24`}>
        {head("h-det", c.finishes)}
        <div className="grid gap-1 md:grid-cols-3">
          {c.finishes.items.map((it, i) => (
            <figure key={it.title} className="m-0 flex flex-col">
              <div className="relative aspect-square overflow-hidden bg-black">
                <SeriesVideo media={it.media} className="absolute inset-0" />
              </div>
              <figcaption className="grid grid-cols-[40px_1fr] gap-x-3 gap-y-1 pt-4 pb-6 md:pb-0">
                <span className="data text-[#B9BBBB]">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-[17px] font-bold tracking-[0.02em] uppercase">{it.title}</span>
                <span className="col-start-2 text-sm leading-normal text-[#B9BBBB]">{it.body}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section aria-labelledby="h-capa" className={`${wrap} pb-28`}>
        <div className={`grid items-center gap-x-16 gap-y-8 border-t border-[#4A4A4C] pt-6 ${c.layer.image ? "md:grid-cols-2" : ""}`}>
          <div className="flex flex-col gap-5">
            <span className="data tracking-[0.06em] text-[#B9BBBB]">{c.layer.eyebrow}</span>
            <h2 id="h-capa" className="text-[clamp(36px,4.4vw,64px)] leading-none font-bold" style={{ fontStretch: "110%" }}>{c.layer.title}</h2>
            <p className="max-w-[440px] text-lg leading-normal text-[#D9DBDB]">{c.layer.body}</p>
            <a href="#productos" className="btn self-start bg-nieve !text-granito hover:bg-roca-clara">{c.layer.cta}</a>
          </div>
          {c.layer.image && (
            <figure className="relative m-0 flex aspect-[4/5] items-center justify-center bg-granito">
              {/* eslint-disable-next-line @next/next/no-img-element -- ver ui/ProductPhoto */}
              <img src={c.layer.image} alt={c.layer.alt ?? ""} className="h-[92%] w-[92%] object-contain" />
            </figure>
          )}
        </div>
      </section>
    </div>
  );
}
