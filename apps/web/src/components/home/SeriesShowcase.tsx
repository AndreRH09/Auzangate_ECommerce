import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Series } from "@/lib/api";
import { BrandMark, type BrandAsset } from "../ui/BrandMark";

// Banda de series a sangre en plomo: los 5 parches (blanco sobre plomo, como se tejen en la manga)
// con su enfoque. Es la pieza más reconocible de la marca, por eso ocupa el centro de la home.
export async function SeriesShowcase({ series }: { series: Series[] }) {
  const t = await getTranslations("Home");
  return (
    <section className="mt-24 bg-granito text-nieve" aria-labelledby="h-series">
      <div className="mx-auto max-w-[1600px] px-4 py-16 md:px-8 md:py-24">
        <div className="grid gap-4 md:grid-cols-2 md:items-end">
          <h2 id="h-series" className="section-title">{t("seriesTitle")}</h2>
          <p className="max-w-prose opacity-75 md:justify-self-end md:text-right">{t("seriesIntro")}</p>
        </div>

        <ul className="mt-12 grid grid-cols-2 gap-px bg-nieve/15 md:grid-cols-5">
          {series.map((s) => {
            const [focus] = s.description.split(".");
            return (
              <li key={s.code} className="bg-granito last:col-span-2 md:last:col-span-1">
                <Link href={`/s/${s.slug}`} className="group flex h-full flex-col items-center gap-6 p-6 text-center md:p-8">
                  <BrandMark
                    asset={`parche-serie-${s.code.toLowerCase()}` as BrandAsset}
                    className="w-full max-w-40 transition-transform duration-300 ease-(--ease-fluid) group-hover:scale-[1.04] motion-reduce:transition-none"
                  />
                  <div>
                    <p className="font-semibold">{s.name}</p>
                    <p className="data mt-1 opacity-60">{focus}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
