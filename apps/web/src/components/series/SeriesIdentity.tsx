import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import type { SeriesIdentity as Identity } from "@/lib/series-identity";
import { BrandMark, type BrandAsset } from "../ui/BrandMark";
import { SeriesVideo } from "./SeriesVideo";

// Página de sub-marca de una serie (maqueta "Serie Wari · identidad"): sello + manifiesto, expedición en video,
// posicionamiento, tecnología (motion gráfico) y condiciones (video de clima). El listado va debajo, en #productos.
// Regla del spec: los videos reales no llevan gráficos encima y la tecnología no lleva video real.
export async function SeriesIdentity({ identity: id, code, slug, breadcrumb }: { identity: Identity; code: string; slug: string; breadcrumb: ReactNode }) {
  const t = await getTranslations("Series");
  const patch = `parche-serie-${code.toLowerCase()}` as BrandAsset;
  const shop = (gender: "men" | "women") => `/s/${slug}?gender=${gender}#productos`;

  return (
    <>
      <div className="mx-auto max-w-[1600px] px-4 pt-6 md:px-8">
        {breadcrumb}
        <h1 className="sr-only">{id.heading}</h1> {/* oculto: el manifiesto hace de titular visual; el h1 queda para SEO y lectores */}
        <div className="flex flex-wrap items-end gap-6 pt-14 pb-16 md:gap-10 md:pt-18 md:pb-20">
          <BrandMark asset={patch} label={`6384 · ${code}`} className="w-20 shrink-0 md:w-30" />
          <p className="display text-[clamp(44px,7vw,112px)] whitespace-pre-line normal-case" style={{ lineHeight: 0.8 }}>
            {id.manifesto}
          </p>
        </div>
      </div>

      <section aria-labelledby="h-expedition" className="relative h-[min(680px,85svh)] overflow-hidden bg-granito text-nieve">
        <SeriesVideo media={id.expedition.media} className="absolute inset-0" />
        <div className="absolute inset-0 bg-granito/45" />
        <div className="relative flex h-full flex-col items-center justify-center gap-5 px-6 text-center">
          <BrandMark asset={patch} className="w-18 md:w-22" />
          <h2 id="h-expedition" className="text-[clamp(40px,5vw,72px)] leading-none font-bold" style={{ fontStretch: "110%" }}>
            {id.expedition.title}
          </h2>
          <p className="max-w-[520px] text-lg">{id.expedition.line}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-4">
            <Link href={shop("men")} className="btn bg-nieve text-granito hover:bg-roca-clara">{t("shopMen")}</Link>
            <Link href={shop("women")} className="btn bg-nieve text-granito hover:bg-roca-clara">{t("shopWomen")}</Link>
          </div>
        </div>
      </section>

      <p className="mx-auto max-w-[880px] px-6 py-20 text-center text-xl leading-normal md:py-22">{id.positioning}</p>

      <section aria-labelledby="h-tech" className="mx-auto max-w-[1600px] px-4 pb-24 md:px-8 md:pb-30">
        <header className="mb-8 flex flex-wrap items-baseline justify-between gap-3 border-t border-linea pt-6">
          <h2 id="h-tech" className="section-title">{t("techTitle")}</h2>
          <span className="data tracking-[0.06em] text-pizarra uppercase">{t("techEyebrow")}</span>
        </header>
        <div className="grid gap-x-1 gap-y-10 md:grid-cols-3">
          {id.tech.map((item) => (
            <article key={item.title}>
              <div className="aspect-[400/440] overflow-hidden bg-granito">
                <SeriesVideo media={item.media} />
              </div>
              <h3 className="mt-5 mb-1.5 text-xl font-bold tracking-[0.02em]">{item.title}</h3>
              <p className="text-[15px] leading-normal text-pizarra">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="h-conditions" className="relative min-h-[640px] overflow-hidden bg-granito text-nieve">
        <SeriesVideo media={id.conditions.media} className="absolute inset-0" />
        <div className="absolute inset-0 bg-granito/60" />
        <div className="relative mx-auto flex max-w-[1600px] flex-wrap items-end justify-between gap-12 px-4 py-24 md:px-8 md:py-30">
          <div className="flex max-w-[560px] flex-col gap-5">
            <span className="data tracking-[0.06em] text-roca-clara uppercase">{t("conditionsEyebrow")}</span>
            <h2 id="h-conditions" className="text-[clamp(36px,4.5vw,64px)] leading-none font-bold" style={{ fontStretch: "110%" }}>
              {id.conditions.title}
            </h2>
            <p className="text-lg leading-normal">{id.conditions.body}</p>
            <dl className="mt-2 grid grid-cols-2 gap-6 font-mono">
              {id.conditions.data.map((d) => (
                <div key={d.label}>
                  <dt className="text-[11px] tracking-[0.08em] text-roca-clara">{d.label}</dt>
                  <dd className="mt-1.5 text-[22px] font-medium">{d.value}</dd>
                </div>
              ))}
            </dl>
            <Link href={`/s/${slug}#productos`} className="btn mt-3 self-start bg-nieve text-granito hover:bg-roca-clara">{t("seeSeries")}</Link>
          </div>
          <BrandMark asset={patch} className="w-24 md:w-26" />
        </div>
      </section>
    </>
  );
}
