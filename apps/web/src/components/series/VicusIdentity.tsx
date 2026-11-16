import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import type { Locale } from "@/i18n/routing";
import { getProduct } from "@/lib/api";
import type { VicusContent } from "@/lib/series-identity";
import { BrandMark } from "../ui/BrandMark";
import { ShopGenderLink } from "./ShopGenderLink";
import { SeriesVideo } from "./SeriesVideo";
import { VicusTech } from "./VicusTech";

// Página de la serie Vicús (maquetado "Vicús · propuesta técnica"): encabezado, hero partido con las fotos del short AV04 (servidas por la API),
// banda de datos, posicionamiento, tecnología en pestañas y uso en video enmarcado. El listado va debajo, en #productos.
export async function VicusIdentity({ content: c, slug, breadcrumb, locale }: { content: VicusContent; slug: string; breadcrumb: ReactNode; locale: Locale }) {
  const [t, product] = await Promise.all([getTranslations("Series"), getProduct(c.figure.slug, locale).catch(() => null)]);
  // orden del admin: frontal, posterior, lateral. Si el producto no existe (BD local sin él) el hero queda sin fotos, la página no cae.
  const [front, , side] = product?.images ?? [];
  const wrap = "mx-auto max-w-[1440px] px-4 md:px-16";
  const sectionHead = (id: string, title: string, eyebrow: string) => (
    <div className="mb-8 flex flex-wrap items-baseline justify-between gap-3 border-t border-granito pt-6">
      <h2 id={id} className="section-title">{title}</h2>
      <span className="data tracking-[0.06em] text-pizarra">{eyebrow}</span>
    </div>
  );

  return (
    <>
      <div className={`${wrap} flex flex-wrap items-end justify-between gap-4 pt-6`}>
        <div>
          {breadcrumb}
        </div>
        <span className="data tracking-[0.06em] text-pizarra">{c.line}</span>
      </div>

      <section aria-label="Vicús" className={`${wrap} pt-12`}>
        <div className="grid border-t border-granito border-b border-b-linea md:grid-cols-2">
          <div className="flex min-h-[600px] flex-col justify-between gap-10 py-12 md:pr-12">
            <BrandMark asset="parche-serie-vicus" label="6384 · VICÚS" className="w-24" />
            <div className="flex flex-col gap-7">
              <p className="display text-[clamp(48px,6.4vw,75px)] whitespace-pre-line normal-case" style={{ lineHeight: 0.82 }}>{c.manifesto}</p>
              <p className="max-w-[440px] text-lg leading-normal text-pizarra">{c.lead}</p>
              <div className="flex flex-wrap gap-3">
                <ShopGenderLink slug={slug} gender="men" className="btn bg-granito text-nieve hover:bg-pizarra">{t("shopMen")}</ShopGenderLink>
                <ShopGenderLink slug={slug} gender="women" className="btn border border-granito text-granito hover:bg-roca-clara">{t("shopWomen")}</ShopGenderLink>
              </div>
            </div>
          </div>
          <figure className="relative m-0 flex min-h-[600px] flex-col overflow-hidden bg-roca-clara">
            <span className="data absolute top-4 right-4 z-10 tracking-[0.08em] text-pizarra">{c.figure.product}</span>
            {/* Dos vistas del short (3/4 detrás, frontal delante), recortadas sobre el fondo transparente de las fotos */}
            <div className="relative flex-1">
              {side && (
                // eslint-disable-next-line @next/next/no-img-element -- <img> nativo, mismo motivo que ProductPhoto
                <img src={side.url} alt="" width={side.width} height={side.height} fetchPriority="high" className="absolute top-[6%] left-[4%] h-[80%] w-auto object-contain" />
              )}
              {front && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={front.url} alt={c.figure.alt} width={front.width} height={front.height} fetchPriority="high" className="absolute right-[4%] bottom-[2%] h-[80%] w-auto object-contain drop-shadow-[0_18px_24px_rgba(38,37,39,0.18)]" />
              )}
            </div>
            <dl className="data m-0 grid grid-cols-2 border-t border-linea tracking-[0.04em]">
              {c.figure.zones.map((z, i) => (
                <div key={z} className={`px-4 py-3.5 ${i % 2 === 0 ? "border-r border-linea" : ""} ${i < 2 ? "border-b border-linea" : ""}`}>
                  <dt className="text-pizarra">{String(i + 1).padStart(2, "0")}</dt>
                  <dd className="mt-1">{z}</dd>
                </div>
              ))}
            </dl>
          </figure>
        </div>
      </section>

      <section aria-label={c.line} className={wrap}>
        <dl className="m-0 grid border-b border-linea font-mono sm:grid-cols-2 lg:grid-cols-4">
          {c.data.map((d, i) => (
            <div key={d.label} className={`py-7 ${i === 0 ? "pr-6" : "px-6 lg:border-l lg:border-linea"}`}>
              <dt className="text-[11px] tracking-[0.08em] text-pizarra">{d.label}</dt>
              <dd className="mt-2 text-[32px] font-medium">{d.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="h-pos" className={`${wrap} grid gap-x-16 gap-y-8 py-24 md:grid-cols-2`}>
        <h2 id="h-pos" className="text-[clamp(32px,3.4vw,48px)] leading-[1.05] font-bold" style={{ fontStretch: "110%" }}>{c.positioning.title}</h2>
        <p className="text-xl leading-normal">{c.positioning.body}</p>
      </section>

      <section aria-labelledby="h-tec" className={`${wrap} pb-24`}>
        {sectionHead("h-tec", c.tech.title, c.tech.eyebrow)}
        <VicusTech items={c.tech.items} />
      </section>

      <section aria-labelledby="h-uso" className={`${wrap} pb-24`}>
        {sectionHead("h-uso", c.use.title, c.use.eyebrow)}
        <div className="relative h-[min(520px,70svh)] overflow-hidden bg-granito">
          <SeriesVideo media={c.use.media} className="absolute inset-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-granito/70 via-granito/15 to-transparent" />
          <p className="absolute bottom-7 left-8 text-[clamp(32px,4vw,56px)] leading-none font-bold text-nieve" style={{ fontStretch: "110%" }}>{c.use.overlay}</p>
        </div>
        <div className="grid border-b border-linea md:grid-cols-3">
          {c.use.moments.map((mo, i) => (
            <div key={mo.time} className={`py-6 ${i === 0 ? "md:pr-6" : "md:border-l md:border-linea md:px-6"}`}>
              <span className="data tracking-[0.08em] text-pizarra">{mo.time}</span>
              <p className="mt-2 text-[15px] leading-normal">{mo.body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
