import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Series } from "@/lib/api";

// ponytail: foto MOCK (picsum) hasta tener fotografía real de la serie
const EDITORIAL_IMAGE = "https://picsum.photos/seed/auzangate-wari/1600/2000";

// Bloque editorial: foto grande + parche de la serie + 3 datos técnicos en mono (design system §7.4)
export async function SeriesEditorial({ series }: { series: Series }) {
  const t = await getTranslations("Home");
  return (
    <section className="mt-24 grid items-end gap-8 md:grid-cols-2" aria-labelledby="h-ed">
      {/* eslint-disable-next-line @next/next/no-img-element -- ver ui/ProductPhoto */}
      <img src={EDITORIAL_IMAGE} alt="" loading="lazy" width={1600} height={2000} className="aspect-[4/5] w-full rounded-sm bg-photo object-cover" />
      <div className="pb-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG de marca */}
        <img src={`/brand/parche-serie-${series.code.toLowerCase()}.svg`} alt="" width={96} height={96} className="size-24" />
        <h2 id="h-ed" className="section-title mt-6">{t("editorialTitle")}</h2>
        <p className="data mt-4">{t("editorialData")}</p>
        <p className="mt-4 max-w-prose text-pizarra">{series.description}</p>
        <Link href={`/s/${series.slug}`} className="mt-8 inline-flex h-cta items-center rounded-md bg-granito px-6 font-semibold text-nieve">
          {t("editorialCta")}
        </Link>
      </div>
    </section>
  );
}
