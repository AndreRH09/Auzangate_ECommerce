"use client";

import { ArrowLeft, Check, Plus, X } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { startTransition, useActionState, useState } from "react";
import { saveProduct, type SaveState } from "@/app/actions";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { AdminCatalogOptions, AdminProduct } from "@/lib/api";

const LOCALES = ["es", "en"] as const;
const STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
const GENDERS = ["UNISEX", "MEN", "WOMEN"] as const;
const KNOWN_ERRORS = ["code_taken", "slug_taken", "invalid_category", "need_variant_price", "need_image_alt", "invalid_tech_specs"];

const input = "mt-1 h-10 w-full rounded-md border border-linea bg-nieve px-3 text-sm focus:border-granito";
const area = "mt-1 w-full rounded-md border border-linea bg-nieve p-3 text-sm focus:border-granito";
const label = "block text-xs text-pizarra";

// Ficha técnica: filas propiedad/valor. Los inputs repetidos `${l}.specKey`/`${l}.specValue`
// llegan en orden a la server action, que los empareja con getAll.
function SpecsEditor({ locale: l, initial }: { locale: Locale; initial: Record<string, string> }) {
  const t = useTranslations("Admin");
  const [rows, setRows] = useState(() => Object.entries(initial).map(([k, v]) => ({ id: crypto.randomUUID(), k, v })));
  return (
    <fieldset>
      <legend className={label}>{t("techSpecs")}</legend>
      <ul className="mt-1 space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="flex gap-2">
            <input name={`${l}.specKey`} defaultValue={r.k} required maxLength={60} placeholder={t("specKey")} aria-label={t("specKey")} className={`${input} mt-0 w-2/5`} />
            <input name={`${l}.specValue`} defaultValue={r.v} required maxLength={200} placeholder={t("specValue")} aria-label={t("specValue")} className={`${input} data mt-0 flex-1`} />
            <button type="button" onClick={() => setRows(rows.filter((x) => x.id !== r.id))} aria-label={t("removeSpec")} className="grid size-10 shrink-0 place-items-center rounded-md border border-linea text-pizarra hover:text-[#c4384a]">
              <X size={14} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => setRows([...rows, { id: crypto.randomUUID(), k: "", v: "" }])} className="mt-2 inline-flex items-center gap-2 text-sm underline-offset-4 hover:underline">
        <Plus size={14} aria-hidden /> {t("addSpec")}
      </button>
    </fieldset>
  );
}

// RF-A02/A03. Se envía con onSubmit (no <form action>) para que React no resetee el formulario:
// si la API rechaza el guardado, lo escrito se conserva. Tras guardar bien, se remonta con lo guardado.
export function ProductForm({ product: initial, options, locale }: { product: AdminProduct; options: AdminCatalogOptions; locale: Locale }) {
  const t = useTranslations("Admin");
  const [state, dispatch, pending] = useActionState<SaveState, FormData>(saveProduct.bind(null, initial.id), null);
  const product = state?.ok ? state.product : initial;
  const title = product.translations[locale].name || product.code;

  return (
    <form
      key={product.updatedAt}
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => dispatch(data));
      }}
      className="pb-24"
    >
      <Link href="/admin/productos" className="inline-flex items-center gap-2 text-sm text-pizarra hover:text-granito">
        <ArrowLeft size={14} aria-hidden /> {t("products")}
      </Link>
      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="section-title">{title}</h1>
        {product.status === "PUBLISHED" && (
          <Link href={`/p/${product.translations[locale].slug}`} target="_blank" className="text-sm underline underline-offset-4">
            {t("viewInStore")}
          </Link>
        )}
      </div>

      <section className="mt-8 grid gap-4 rounded-panel bg-nieve p-6 sm:grid-cols-2 lg:grid-cols-5">
        <label className={label}>
          {t("code")}
          <input name="code" required defaultValue={product.code} className={`${input} data uppercase`} />
        </label>
        <label className={label}>
          {t("status")}
          <select name="status" defaultValue={product.status} className={input}>
            {STATUSES.map((s) => <option key={s} value={s}>{t(`statusName.${s}`)}</option>)}
          </select>
        </label>
        <label className={label}>
          {t("gender")}
          <select name="gender" defaultValue={product.gender} className={input}>
            {GENDERS.map((g) => <option key={g} value={g}>{t(`genderName.${g}`)}</option>)}
          </select>
        </label>
        <label className={label}>
          {t("category")}
          <select name="categoryId" defaultValue={product.categoryId} className={input}>
            {options.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className={label}>
          {t("series")}
          <select name="seriesId" defaultValue={product.seriesId ?? ""} className={input}>
            <option value="">{t("noSeries")}</option>
            {options.series.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {LOCALES.map((l) => {
          const tr = product.translations[l];
          return (
            <section key={l} lang={l} className="space-y-4 rounded-panel bg-nieve p-6">
              <h2 className="data tracking-[0.2em] uppercase">{l === "es" ? "Español" : "English"}</h2>
              <label className={label}>
                {t("name")}
                <input name={`${l}.name`} required maxLength={120} defaultValue={tr.name} className={input} />
              </label>
              <label className={label}>
                {t("slug")}
                <input name={`${l}.slug`} maxLength={140} defaultValue={tr.slug} placeholder={t("slugAuto")} pattern="[a-z0-9]+(-[a-z0-9]+)*" className={`${input} data`} />
              </label>
              <label className={label}>
                {t("subtitle")}
                <input name={`${l}.subtitle`} maxLength={160} defaultValue={tr.subtitle} className={input} />
              </label>
              <label className={label}>
                {t("description")}
                <textarea name={`${l}.description`} rows={5} maxLength={5000} defaultValue={tr.description} className={area} />
              </label>
              <SpecsEditor locale={l} initial={tr.techSpecs} />
            </section>
          );
        })}
      </div>

      <p className="mt-6 text-sm text-pizarra">{t("variantsImages", { variants: product.variants, images: product.images })}</p>

      <div className="fixed inset-x-0 bottom-0 border-t border-linea bg-nieve/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] items-center justify-end gap-4 px-4 py-3 md:px-8">
          <div role="status" aria-live="polite" className="text-sm">
            {state?.ok && !pending && (
              <span className="flex items-center gap-2"><Check size={16} aria-hidden /> {t("saved")}</span>
            )}
            {state && !state.ok && (
              <ul className="text-[#c4384a]">
                {state.errors.map((e) => <li key={e}>{KNOWN_ERRORS.includes(e) ? t(`errors.${e}`) : e}</li>)}
              </ul>
            )}
          </div>
          <button disabled={pending} className="btn h-10 bg-granito text-nieve hover:bg-pizarra disabled:opacity-60">
            {pending ? t("saving") : t("save")}
          </button>
        </div>
      </div>
    </form>
  );
}
