import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import type { CaralContent } from "@/lib/series-identity";
import { BrandMark } from "../ui/BrandMark";
import { SeriesVideo } from "./SeriesVideo";

// Página de la serie Caral (maquetado "Serie Caral"): manifiesto corto, banda de fibras, costura plana en video
// con su lista y uso en video partido con texto. El listado va debajo, en #productos (es "La serie" del maquetado).
export async function CaralIdentity({ content: c, slug, breadcrumb }: { content: CaralContent; slug: string; breadcrumb: ReactNode }) {
  const t = await getTranslations("Series");
  const shop = (gender: "men" | "women") => `/s/${slug}?gender=${gender}#productos`;
  const wrap = "mx-auto max-w-[1440px] px-4 md:px-16";
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <>
      <div className={`${wrap} flex flex-wrap items-end justify-between gap-4 pt-6`}>
        <div>
          {breadcrumb}
          <h1 className="sr-only">{c.heading}</h1>
        </div>
        <span className="data tracking-[0.06em] text-pizarra">{c.line}</span>
      </div>

      <section aria-label="Caral" className={`${wrap} grid items-end gap-x-16 gap-y-8 pt-16 pb-12 md:grid-cols-[3fr_2fr]`}>
        <div className="flex items-end gap-8">
          <BrandMark asset="parche-serie-caral" label="6384 · CARAL" className="w-28 shrink-0" />
          <p className="display text-[clamp(44px,5vw,72px)] whitespace-pre-line xl:whitespace-pre normal-case" style={{ lineHeight: 0.82 }}>{c.manifesto}</p>
        </div>
        <div className="flex flex-col gap-6">
          <p className="max-w-[480px] text-lg leading-normal text-pizarra">{c.lead}</p>
          <div className="flex flex-wrap gap-3">
            <Link href={shop("men")} className="btn bg-granito text-nieve hover:bg-pizarra">{t("shopMen")}</Link>
            <Link href={shop("women")} className="btn border border-granito text-granito hover:bg-roca-clara">{t("shopWomen")}</Link>
          </div>
        </div>
      </section>

      <section aria-label={c.line} className="bg-granito text-nieve">
        <dl className={`${wrap} m-0 grid font-mono sm:grid-cols-2 lg:grid-cols-4`}>
          {c.fibers.map((f, i) => (
            <div key={f.label} className={`py-8 ${i === 0 ? "pr-6" : "px-6 lg:border-l lg:border-pizarra"}`}>
              <dt className="text-[11px] tracking-[0.08em] text-roca-clara">{f.label}</dt>
              <dd className="mt-2 text-[32px] font-medium">{f.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="h-capas" className={`${wrap} py-24`}>
        <div className="mb-8 flex flex-wrap items-baseline justify-between gap-3 border-t border-granito pt-6">
          <h2 id="h-capas" className="section-title">{c.seam.title}</h2>
          <span className="data tracking-[0.06em] text-pizarra">{c.seam.eyebrow}</span>
        </div>
        <div className="grid gap-x-16 gap-y-8 md:grid-cols-2">
          <div className="relative min-h-[360px] overflow-hidden bg-granito md:min-h-[560px]">
            <SeriesVideo media={c.seam.media} className="absolute inset-0" />
          </div>
          <ol className="m-0 flex list-none flex-col p-0">
            {c.seam.points.map((p, i) => (
              <li key={p.title} className={`grid grid-cols-[48px_1fr] gap-x-4 gap-y-1 py-6 ${i === 0 ? "border-t-2 border-granito" : "border-t border-linea"}`}>
                <span className="data pt-1.5">{pad(i + 1)}</span>
                <span className="text-[22px] font-bold tracking-[0.02em]">{p.title}</span>
                <span />
                <span className="text-[15px] leading-normal text-pizarra">{p.body}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="h-uso" className={`${wrap} pb-24`}>
        <div className="grid items-end gap-x-16 gap-y-8 border-t border-granito pt-6 md:grid-cols-3">
          <div className="relative aspect-video overflow-hidden bg-granito md:col-span-2">
            <SeriesVideo media={c.use.media} className="absolute inset-0" />
          </div>
          <div className="flex flex-col gap-4">
            <span className="data tracking-[0.06em] text-pizarra">{c.use.eyebrow}</span>
            <h2 id="h-uso" className="text-[clamp(32px,3.4vw,48px)] leading-[1.05] font-bold" style={{ fontStretch: "110%" }}>{c.use.title}</h2>
            <p className="text-[17px] leading-normal text-pizarra">{c.use.body}</p>
            <a href="#productos" className="btn self-start bg-granito text-nieve hover:bg-pizarra">{c.use.cta}</a>
          </div>
        </div>
      </section>
    </>
  );
}
