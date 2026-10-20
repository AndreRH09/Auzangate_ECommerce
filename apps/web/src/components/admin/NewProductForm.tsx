"use client";

import { ArrowLeft } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { startTransition, useActionState } from "react";
import { createProduct, type ErrorState } from "@/app/actions";
import { Link } from "@/i18n/navigation";
import type { AdminCatalogOptions } from "@/lib/api";
import { KNOWN_ERRORS } from "./ProductForm";

const input = "mt-1 h-10 w-full rounded-md border border-linea bg-nieve px-3 text-sm focus:border-granito";
const label = "block text-xs text-pizarra";

// RF-A02 (alta): lo mínimo para crear el borrador; al guardar abre la edición completa (ficha, variantes, fotos).
// onSubmit (no <form action>) para que React no limpie los campos si la API rechaza el alta (p. ej. código repetido).
export function NewProductForm({ options }: { options: AdminCatalogOptions }) {
  const t = useTranslations("Admin");
  const [state, action, pending] = useActionState<ErrorState, FormData>(createProduct, null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      className="max-w-3xl"
    >
      <Link href="/admin/productos" className="inline-flex items-center gap-2 text-sm text-pizarra hover:text-granito">
        <ArrowLeft size={14} aria-hidden /> {t("products")}
      </Link>
      <h1 className="section-title mt-4">{t("newProduct")}</h1>
      <p className="mt-2 text-sm text-pizarra">{t("newProductHint")}</p>

      <section className="mt-8 grid gap-4 rounded-panel bg-nieve p-6 sm:grid-cols-2">
        <label className={label}>
          {t("code")}
          <input name="code" required pattern="[Ff]?[Aa][CWSVNcwsvn][0-9]{2}" placeholder="AW03" aria-describedby="code-hint" className={`${input} data uppercase`} />
          <span id="code-hint" className="mt-1 block">{t("codeHint")}</span>
        </label>
        <label className={label}>
          {t("gender")}
          <select name="gender" defaultValue="UNISEX" className={input}>
            {(["UNISEX", "MEN", "WOMEN"] as const).map((g) => <option key={g} value={g}>{t(`genderName.${g}`)}</option>)}
          </select>
        </label>
        <label className={label}>
          {t("category")}
          <select name="categoryId" required className={input}>
            {options.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className={label}>
          {t("series")}
          <select name="seriesId" defaultValue="" className={input}>
            <option value="">{t("noSeries")}</option>
            {options.series.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label className={label}>
          {t("name")} ES
          <input name="es.name" lang="es" required maxLength={120} placeholder="Casaca AW03" className={input} />
        </label>
        <label className={label}>
          {t("name")} EN
          <input name="en.name" lang="en" required maxLength={120} placeholder="Jacket AW03" className={input} />
        </label>
      </section>

      <div className="mt-6 flex flex-wrap items-center justify-end gap-4">
        <div role="status" aria-live="polite" className="text-sm text-[#c4384a]">
          {state?.errors.map((e) => <p key={e}>{KNOWN_ERRORS.includes(e) ? t(`errors.${e}`) : e}</p>)}
        </div>
        <button disabled={pending} className="btn h-10 bg-granito text-nieve hover:bg-pizarra disabled:opacity-60">
          {pending ? t("saving") : t("createDraft")}
        </button>
      </div>
    </form>
  );
}
