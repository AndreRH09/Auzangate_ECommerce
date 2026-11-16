import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import type { NascaContent } from "@/lib/series-identity";
import { BrandMark } from "../ui/BrandMark";
import { ShopGenderLink } from "./ShopGenderLink";
import { SeriesVideo } from "./SeriesVideo";

// Página de la serie Nasca (maquetado "Nasca · peso como protagonista"): manifiesto en peso ligero, collage de fotos
// de clima cálido y "Liviana, no frágil" con las tres piezas de motion NASCA. El listado va debajo, en #productos.
// Mosaico de 5 columnas en desktop: la foto 0 ocupa 2×2, la 1 una columna a lo alto, el resto una celda cada una.
const TILE = ["col-span-2 aspect-[3/2] md:row-span-2", "md:row-span-2", "", "", "", ""];

export async function NascaIdentity({ content: c, slug, breadcrumb }: { content: NascaContent; slug: string; breadcrumb: ReactNode }) {
  const t = await getTranslations("Series");
  const wrap = "mx-auto max-w-[1440px] px-4 md:px-16";

  return (
    <>
      <div className={`${wrap} flex flex-wrap items-end justify-between gap-4 pt-6`}>
        <div>
          {breadcrumb}
          <h1 className="sr-only">{c.heading}</h1>
        </div>
        <span className="data tracking-[0.06em] text-pizarra">{c.line}</span>
      </div>

      {/* la única serie con titular en peso 300 */}
      <section aria-label="Nasca" className={`${wrap} flex flex-wrap items-end justify-between gap-10 pt-16 pb-14`}>
        <div className="flex flex-col gap-8">
          <p className="display text-[clamp(48px,7vw,112px)] whitespace-pre-line normal-case" style={{ fontWeight: 300 }}>{c.manifesto}</p>
          <div className="flex flex-wrap gap-3">
            <ShopGenderLink slug={slug} gender="men" className="btn bg-granito text-nieve hover:bg-pizarra">{t("shopMen")}</ShopGenderLink>
            <ShopGenderLink slug={slug} gender="women" className="btn border border-granito text-granito hover:bg-roca-clara">{t("shopWomen")}</ShopGenderLink>
          </div>
        </div>
        <BrandMark asset="parche-serie-nasca" label="6384 · NASCA" className="w-28 shrink-0" />
      </section>

      {/* fotos a sangre y sin separación: ni marco ni líneas entre ellas */}
      <section aria-labelledby="h-clima" className="relative md:text-nieve">
        <div className="grid grid-cols-2 md:h-[min(640px,80svh)] md:grid-cols-5 md:grid-rows-2">
          {c.climate.photos.map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- <img> nativo, mismo motivo que ProductPhoto
            <img key={p.src} src={p.src} alt={p.alt} loading="lazy" className={`aspect-square h-full w-full object-cover md:aspect-auto ${TILE[i]}`} />
          ))}
        </div>
        <div className="flex flex-wrap items-end justify-between gap-6 px-4 py-8 md:absolute md:inset-x-0 md:bottom-0 md:bg-gradient-to-t md:from-granito/75 md:to-transparent md:px-16 md:pt-32 md:pb-12">
          <h2 id="h-clima" className="text-[clamp(47px,5.85vw,83px)] leading-none font-bold" style={{ fontStretch: "110%" }}>{c.climate.title}</h2>
          <div className="flex max-w-[420px] flex-col items-start gap-5 md:items-end md:text-right">
            <p className="text-lg leading-normal">{c.climate.body}</p>
            {/* sobre la foto (desktop) va blanco; en mobile el texto queda sobre blanco y el botón es granito */}
            <a href="#productos" className="btn bg-granito text-nieve hover:bg-pizarra md:bg-nieve md:text-granito md:hover:bg-roca-clara">{t("viewSeries")}</a>
          </div>
        </div>
      </section>

      <section aria-labelledby="h-tec" className={`${wrap} py-24`}>
        <div className="mb-8 flex flex-wrap items-baseline justify-between gap-3 border-t border-granito pt-6">
          <h2 id="h-tec" className="section-title">{c.tech.title}</h2>
          <span className="data tracking-[0.06em] text-pizarra">{c.tech.eyebrow}</span>
        </div>
        <div className="grid gap-1 md:grid-cols-3">
          {c.tech.items.map((it) => (
            <article key={it.title} className="flex flex-col">
              {/* sin video publicado queda el fondo negro de la tarjeta */}
              <div className="relative aspect-[16/10] overflow-hidden bg-black">
                <SeriesVideo media={it.media} className="absolute inset-0" />
              </div>
              <h3 className="mt-5 mb-1.5 text-xl font-bold tracking-[0.02em]">{it.title}</h3>
              <p className="text-[15px] leading-normal text-pizarra">{it.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-label={c.line} className={`${wrap} pb-24`}>
        <dl className="m-0 grid border-t border-granito border-b border-b-linea font-mono sm:grid-cols-3">
          {c.data.map((d, i) => (
            <div key={d.label} className={`py-7 ${i === 0 ? "pr-6" : "px-6 sm:border-l sm:border-linea"}`}>
              <dt className="text-[11px] tracking-[0.08em] text-pizarra">{d.label}</dt>
              <dd className="mt-2 text-[32px] font-medium">{d.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
