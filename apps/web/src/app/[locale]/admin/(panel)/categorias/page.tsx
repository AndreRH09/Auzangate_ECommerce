import { CaretRight, Plus } from "@phosphor-icons/react/dist/ssr";
import { getTranslations } from "next-intl/server";
import { CategoryForm, SeriesForm } from "@/components/admin/TaxonomyForms";
import { BrandMark, type BrandAsset } from "@/components/ui/BrandMark";
import { adminApi } from "@/lib/admin";
import type { AdminCategory, AdminSeries } from "@/lib/api";

const panel = "rounded-lg border border-linea bg-nieve";
const summary = "flex cursor-pointer list-none flex-wrap items-center gap-3 p-4";
const caret = <CaretRight size={14} aria-hidden className="transition-transform group-open:rotate-90 motion-reduce:transition-none" />;

// RF-A06. Árbol de categorías (principales y sus hijas) + las 5 series. Cada fila se edita en su acordeón.
// `key` con lo guardado: tras guardar, el formulario se remonta con los valores nuevos.
export default async function AdminTaxonomy() {
  const [t, categories, series] = await Promise.all([getTranslations("Admin"), adminApi<AdminCategory[]>("/categories"), adminApi<AdminSeries[]>("/series")]);
  const parents = categories.filter((c) => !c.parentId);
  const tree = parents.flatMap((p) => [p, ...categories.filter((c) => c.parentId === p.id)]);

  return (
    <>
      <h1 className="section-title">{t("catalogSetup")}</h1>

      <section className="mt-8" aria-labelledby="h-categories">
        <h2 id="h-categories" className="data tracking-[0.2em] uppercase">{t("categories")}</h2>
        <p className="mt-1 text-xs text-pizarra">{t("categoriesHint")}</p>

        <details className={`group mt-4 ${panel}`}>
          <summary className={summary}>
            <Plus size={14} aria-hidden /> <span className="font-semibold">{t("newCategory")}</span>
          </summary>
          <div className="border-t border-linea p-4">
            <CategoryForm key={categories.length} category={null} parents={parents} />
          </div>
        </details>

        <ul className="mt-4 space-y-2">
          {tree.map((c) => (
            <li key={c.id} className={c.parentId ? "ml-6 md:ml-10" : ""}>
              <details className={`group ${panel}`}>
                <summary className={summary}>
                  {caret}
                  <span className="font-semibold">{c.names.es}</span>
                  <span className="text-pizarra">/ {c.names.en}</span>
                  <span className="data text-xs text-pizarra">/{c.slugs.es}</span>
                  <span className="data ml-auto text-xs text-pizarra">
                    {t("productCount", { count: c.products })}
                    {!c.parentId && ` · ${t("childCount", { count: c.children })}`}
                  </span>
                </summary>
                <div className="border-t border-linea p-4">
                  <CategoryForm key={JSON.stringify(c)} category={c} parents={parents} />
                </div>
              </details>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12" aria-labelledby="h-series">
        <h2 id="h-series" className="data tracking-[0.2em] uppercase">{t("seriesPlural")}</h2>
        <p className="mt-1 text-xs text-pizarra">{t("seriesHint")}</p>
        <ul className="mt-4 space-y-2">
          {series.map((s) => (
            <li key={s.id}>
              <details className={`group ${panel}`}>
                <summary className={summary}>
                  {caret}
                  <BrandMark asset={`parche-serie-${s.code.toLowerCase()}` as BrandAsset} className="w-8 text-granito" />
                  <span className="font-semibold">{s.translations.es.name}</span>
                  <span className="text-xs text-pizarra">{s.translations.es.description.split(".")[0]}</span>
                  <span className="data ml-auto text-xs text-pizarra">{t("productCount", { count: s.products })}</span>
                </summary>
                <div className="border-t border-linea p-4">
                  <SeriesForm key={JSON.stringify(s)} series={s} />
                </div>
              </details>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
