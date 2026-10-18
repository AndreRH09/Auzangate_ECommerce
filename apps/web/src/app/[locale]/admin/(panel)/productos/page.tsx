import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { adminApi } from "@/lib/admin";
import { type AdminProductList, getCategories, getSeries } from "@/lib/api";
import { formatPrice } from "@/lib/format";

const STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
const GENDERS = ["UNISEX", "MEN", "WOMEN"] as const;
const FILTERS = ["q", "status", "gender", "category", "series", "sort"] as const;

const badge = { DRAFT: "bg-roca-clara", PUBLISHED: "bg-granito text-nieve", ARCHIVED: "border border-linea text-pizarra" };
const control = "h-10 rounded-md border border-linea bg-nieve px-3 text-sm";

// RF-A01. Filtros en un <form method="get">: la URL guarda el estado, sin JS de cliente.
export default async function AdminProducts({ params, searchParams }: PageProps<"/[locale]/admin/productos">) {
  const locale = (await params).locale as Locale;
  const sp = await searchParams;
  const filters = Object.fromEntries(FILTERS.flatMap((k) => (typeof sp[k] === "string" && sp[k] ? [[k, sp[k]]] : [])));
  const page = Math.max(1, Number(sp.page) || 1);

  const [t, list, categories, series] = await Promise.all([
    getTranslations("Admin"),
    adminApi<AdminProductList>(`/products?${new URLSearchParams({ locale, ...filters, page: String(page) })}`),
    getCategories(locale),
    getSeries(locale),
  ]);
  const pages = Math.max(1, Math.ceil(list.total / list.pageSize));
  const pageHref = (p: number) => `/admin/productos?${new URLSearchParams({ ...filters, page: String(p) })}`;

  return (
    <>
      <h1 className="section-title">{t("products")}</h1>

      <form className="mt-8 flex flex-wrap items-end gap-3">
        <input name="q" defaultValue={filters.q} placeholder={t("searchPlaceholder")} aria-label={t("search")} className={`${control} w-64`} />
        <select name="status" defaultValue={filters.status ?? ""} aria-label={t("status")} className={control}>
          <option value="">{t("allStatuses")}</option>
          {STATUSES.map((s) => <option key={s} value={s}>{t(`statusName.${s}`)}</option>)}
        </select>
        <select name="gender" defaultValue={filters.gender ?? ""} aria-label={t("gender")} className={control}>
          <option value="">{t("allGenders")}</option>
          {GENDERS.map((g) => <option key={g} value={g}>{t(`genderName.${g}`)}</option>)}
        </select>
        <select name="category" defaultValue={filters.category ?? ""} aria-label={t("category")} className={control}>
          <option value="">{t("allCategories")}</option>
          {categories.map((c) => (
            <optgroup key={c.slug} label={c.name}>
              <option value={c.slug}>{c.name} ({t("all")})</option>
              {c.children.map((ch) => <option key={ch.slug} value={ch.slug}>{ch.name}</option>)}
            </optgroup>
          ))}
        </select>
        <select name="series" defaultValue={filters.series ?? ""} aria-label={t("series")} className={control}>
          <option value="">{t("allSeries")}</option>
          {series.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
        </select>
        <select name="sort" defaultValue={filters.sort ?? "updated"} aria-label={t("sort")} className={control}>
          <option value="updated">{t("sortUpdated")}</option>
          <option value="code">{t("sortCode")}</option>
        </select>
        <button className="btn h-10 bg-granito text-nieve hover:bg-pizarra">{t("apply")}</button>
        {Object.keys(filters).length > 0 && <Link href="/admin/productos" className="text-sm underline underline-offset-4">{t("clear")}</Link>}
      </form>

      <p className="data mt-6 text-pizarra">{t("count", { count: list.total })}</p>

      <div className="mt-3 overflow-x-auto rounded-panel bg-nieve">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-linea text-xs text-pizarra">
            <tr>
              <th className="p-3 font-normal"><span className="sr-only">{t("photo")}</span></th>
              <th className="p-3 font-normal">{t("product")}</th>
              <th className="p-3 font-normal">{t("status")}</th>
              <th className="p-3 font-normal">{t("gender")}</th>
              <th className="p-3 font-normal">{t("category")}</th>
              <th className="p-3 font-normal">{t("series")}</th>
              <th className="p-3 text-right font-normal">{t("variants")}</th>
              <th className="p-3 text-right font-normal">{t("stock")}</th>
              <th className="p-3 text-right font-normal">{t("priceFrom")}</th>
              <th className="p-3 font-normal">{t("updated")}</th>
            </tr>
          </thead>
          <tbody>
            {list.items.map((p) => (
              <tr key={p.id} className="border-b border-linea last:border-0">
                <td className="p-3">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- ver ui/ProductPhoto; miniaturas reales con R2 (F1·5)
                    <img src={p.imageUrl} alt="" width={40} height={40} loading="lazy" className="size-10 rounded bg-glaciar object-contain" />
                  ) : (
                    <div className="size-10 rounded bg-glaciar" />
                  )}
                </td>
                <td className="p-3">
                  <span className="font-medium">{p.name}</span>
                  <span className="data block text-xs text-pizarra">{p.code}</span>
                </td>
                <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs ${badge[p.status]}`}>{t(`statusName.${p.status}`)}</span></td>
                <td className="p-3">{t(`genderName.${p.gender}`)}</td>
                <td className="p-3">{p.category}</td>
                <td className="p-3">{p.series ?? "—"}</td>
                <td className="data p-3 text-right">{p.variants}</td>
                <td className={`data p-3 text-right ${p.stock === 0 ? "text-[#c4384a]" : ""}`}>{p.stock}</td>
                <td className="data p-3 text-right">{p.priceFromCents === null ? "—" : formatPrice(p.priceFromCents)}</td>
                <td className="data p-3 text-xs text-pizarra">{new Date(p.updatedAt).toLocaleDateString(locale)}</td>
              </tr>
            ))}
            {list.items.length === 0 && (
              <tr><td colSpan={10}className="p-8 text-center text-pizarra">{t("empty")}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <nav aria-label="pagination" className="mt-6 flex items-center justify-center gap-4 text-sm">
          {page > 1 && <Link href={pageHref(page - 1)} className="btn h-10 border border-granito">{t("prev")}</Link>}
          <span className="data">{t("pageOf", { page, pages })}</span>
          {page < pages && <Link href={pageHref(page + 1)} className="btn h-10 border border-granito">{t("next")}</Link>}
        </nav>
      )}
    </>
  );
}
