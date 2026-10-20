"use client";

import { Trash } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { type FormEvent, startTransition, useActionState, useState, useTransition } from "react";
import { deleteCategory, type ErrorState, saveCategory, saveSeries } from "@/app/actions";
import type { AdminCategory, AdminSeries } from "@/lib/api";
import { slugify } from "@/lib/format";
import { KNOWN_ERRORS } from "./ProductForm";

const field = "mt-1 h-10 rounded-md border border-linea bg-nieve px-3 text-sm focus:border-granito";
const input = `${field} w-full`;
const area = "mt-1 w-full rounded-md border border-linea bg-nieve p-3 text-sm focus:border-granito";
const label = "block text-xs text-pizarra";

// onSubmit (no <form action>): si la API rechaza, lo escrito se conserva. Tras guardar, la página se
// vuelve a pintar (refresh en la action) y el padre remonta el formulario con lo guardado vía `key`.
function useSave(action: (state: ErrorState, form: FormData) => Promise<ErrorState>) {
  const [state, dispatch, pending] = useActionState<ErrorState, FormData>(action, null);
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => dispatch(data));
  };
  return { errors: state?.errors ?? [], pending, onSubmit };
}

function Errors({ errors }: { errors: string[] }) {
  const t = useTranslations("Admin");
  return (
    <div role="status" aria-live="polite" className="text-sm text-[#c4384a]">
      {errors.map((e) => <p key={e}>{KNOWN_ERRORS.includes(e) ? t(`errors.${e}`) : e}</p>)}
    </div>
  );
}

// RF-A06. category null = nueva. `parents`: categorías principales (solo 2 niveles).
export function CategoryForm({ category, parents }: { category: AdminCategory | null; parents: AdminCategory[] }) {
  const t = useTranslations("Admin");
  const { errors, pending, onSubmit } = useSave(saveCategory.bind(null, category?.id ?? null));
  const [deleting, startDelete] = useTransition();
  const [deleteErrors, setDeleteErrors] = useState<string[]>([]);
  // con hijas no puede colgar de otra; vacía (sin productos ni hijas) se puede borrar
  const hasChildren = !!category?.children;
  const empty = category && !category.products && !category.children;

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_6rem]">
      <label className={label}>
        {t("name")} ES
        <input name="es.name" lang="es" required maxLength={120} defaultValue={category?.names.es} className={input} />
      </label>
      <label className={label}>
        {t("name")} EN
        <input name="en.name" lang="en" required maxLength={120} defaultValue={category?.names.en} className={input} />
      </label>
      <label className={label}>
        {t("parentCategory")}
        <select name="parentId" defaultValue={category?.parentId ?? ""} disabled={hasChildren} aria-describedby={hasChildren ? `${category.id}-parent-hint` : undefined} className={`${input} disabled:opacity-60`}>
          <option value="">{t("mainCategory")}</option>
          {parents.filter((p) => p.id !== category?.id).map((p) => <option key={p.id} value={p.id}>{p.names.es}</option>)}
        </select>
        {hasChildren && <span id={`${category.id}-parent-hint`} className="mt-1 block">{t("parentLocked")}</span>}
      </label>
      <label className={label}>
        {t("sortOrder")}
        <input name="sort" type="number" required min={0} max={999} step={1} defaultValue={category?.sort ?? 0} className={`${input} data`} />
      </label>

      <div className="flex flex-wrap items-center justify-end gap-3 sm:col-span-2 lg:col-span-4">
        <Errors errors={[...errors, ...deleteErrors]} />
        {category && (
          <button
            type="button"
            disabled={!empty || deleting}
            title={empty ? undefined : t("categoryNotEmpty")}
            onClick={() => {
              if (!confirm(t("confirmDeleteCategory", { name: category.names.es }))) return;
              startDelete(async () => setDeleteErrors((await deleteCategory(category.id))?.errors ?? []));
            }}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-linea px-3 text-sm text-pizarra hover:border-[#c4384a] hover:text-[#c4384a] disabled:pointer-events-none disabled:opacity-40"
          >
            <Trash size={14} aria-hidden /> {t("delete")}
          </button>
        )}
        <button disabled={pending} className="btn h-10 bg-granito text-nieve hover:bg-pizarra disabled:opacity-60">
          {pending ? t("saving") : category ? t("save") : t("createCategory")}
        </button>
      </div>
    </form>
  );
}

// Las 5 series de marca: solo nombre, descripción (la primera frase es la línea: "Classic.") y orden.
export function SeriesForm({ series }: { series: AdminSeries }) {
  const t = useTranslations("Admin");
  const { errors, pending, onSubmit } = useSave(saveSeries.bind(null, series.id));

  return (
    <form onSubmit={onSubmit} className="grid gap-4 lg:grid-cols-2">
      {(["es", "en"] as const).map((l) => (
        <div key={l} lang={l} className="space-y-3">
          <label className={label}>
            {t("name")} {l.toUpperCase()}
            <input name={`${l}.name`} required maxLength={60} defaultValue={series.translations[l].name} className={input} />
            <span className="data mt-1 block">/{slugify(series.translations[l].name)}</span>
          </label>
          <label className={label}>
            {t("description")} {l.toUpperCase()}
            <textarea name={`${l}.description`} required rows={3} maxLength={1000} defaultValue={series.translations[l].description} className={area} />
          </label>
        </div>
      ))}
      <div className="flex flex-wrap items-end justify-between gap-3 lg:col-span-2">
        <label className={label}>
          {t("sortOrder")}
          <input name="sort" type="number" required min={0} max={999} step={1} defaultValue={series.sort} className={`${field} data block w-24`} />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <Errors errors={errors} />
          <button disabled={pending} className="btn h-10 bg-granito text-nieve hover:bg-pizarra disabled:opacity-60">
            {pending ? t("saving") : t("save")}
          </button>
        </div>
      </div>
    </form>
  );
}
