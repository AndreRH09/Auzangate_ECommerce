import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Series } from "@/lib/api";
import { BrandMark, type BrandAsset } from "../ui/BrandMark";

// Paisajes 720 × 1280 (9:16), en el orden de las series. Se recortan a 2:5 en desktop y a cuadrado en mobile.
const PHOTOS = ["/layout/1arequipa.webp", "/layout/2ausangate.webp", "/layout/3lima.webp", "/layout/4huaccachina.webp", "/layout/5ballestas.webp"];

// Banda de series a sangre en plomo: cinco paisajes separados por líneas de granito, cada uno con su
// parche blanco abajo. La silueta de cordillera (layout/superior.png, 669 × 135) corta el borde superior
// de toda la fila: en desktop las cinco columnas, en mobile solo la primera fila de dos cuadrados.
export async function SeriesShowcase({ series }: { series: Series[] }) {
  const t = await getTranslations("Home");
  return (
    <section className="mt-24 bg-granito text-nieve" aria-labelledby="h-series">
      <div className="mx-auto max-w-[1600px] px-4 pt-25 md:px-8 md:pt-[35px]">
        <div className="relative">
          {/* máscara del PNG sobre bg-granito: la silueta queda del mismo plomo que el fondo y los separadores.
              En mobile sube 1/4 para dejar ver más foto en los cuadrados. El encabezado va sobre el plomo de la
              silueta, nunca sobre las fotos. */}
          <div className="pointer-events-none absolute inset-x-0 -top-px z-10 aspect-[669/135] -translate-y-1/4 md:translate-y-0">
            <div aria-hidden className="size-full bg-granito [mask:url(/layout/superior.png)_top/100%_100%_no-repeat]" />
            {/* mobile: el plomo de la silueta es fino, así que el texto va entero en el padding superior,
                apoyado sobre el borde superior del decorador */}
            <div className="absolute inset-x-0 bottom-full flex pb-2 md:top-0 md:bottom-auto md:pb-0 flex-wrap items-baseline justify-between gap-x-4 gap-y-1 md:pt-[21px]">
              <h2 id="h-series" className="section-title text-[28px] md:text-[clamp(35px,3.75vw,50px)]">{t("seriesTitle")}</h2>
              <p className="text-[15px] opacity-90 md:text-[17.5px]">{t("seriesIntro")}</p>
            </div>
          </div>
          <ul className="grid grid-cols-2 gap-2 md:grid-cols-5 md:gap-3">
            {series.map((s, i) => {
              const [focus] = s.description.split(".");
              return (
                <li key={s.code} className="aspect-square last:col-span-2 last:aspect-[2/1] md:aspect-[2/5] md:last:col-span-1 md:last:aspect-[2/5]">
                  <Link href={`/s/${s.slug}`} className="group relative flex size-full flex-col items-center justify-end gap-2 overflow-hidden p-4 text-center md:gap-4 md:p-8">
                    {/* eslint-disable-next-line @next/next/no-img-element -- ver ui/ProductPhoto */}
                    <img
                      src={PHOTOS[i % PHOTOS.length]}
                      alt=""
                      width={720}
                      height={1280}
                      loading="lazy"
                      className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-(--ease-fluid) group-hover:scale-[1.08] group-focus-visible:scale-[1.08] motion-reduce:transition-none"
                    />
                    {/* mobile: velo parejo para que parche y texto lean sobre cualquier foto; desktop: solo al pie */}
                    <div aria-hidden className="absolute inset-0 bg-black/45 md:bg-transparent md:bg-linear-to-t md:from-black/55 md:to-transparent md:to-45%" />
                    <span className="relative drop-shadow-[0_4px_10px_rgb(0_0_0/0.55)]">
                      <BrandMark
                        asset={`parche-serie-${s.code.toLowerCase()}` as BrandAsset}
                        label={s.name}
                        className="w-20 transition-transform duration-300 ease-(--ease-fluid) group-hover:scale-[1.06] motion-reduce:transition-none md:w-32"
                      />
                    </span>
                    <p className="data relative line-clamp-2 max-w-[24ch] opacity-85">{focus}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
