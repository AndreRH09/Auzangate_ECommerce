"use client";

import { ArrowRight, Check } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { subscribe } from "@/app/actions";

// Newsletter en el footer (fondo plomo): input con botón pegado, en una línea, sin pop-up.
// Al suscribirse, el formulario se reemplaza por la confirmación con una entrada suave.
export function NewsletterForm() {
  const t = useTranslations("Home");
  const [state, action, pending] = useActionState(subscribe, null);

  return (
    <section aria-labelledby="h-news" className="max-w-md">
      <h2 id="h-news" className="text-lg font-semibold">{t("newsletterTitle")}</h2>
      {state === "ok" ? (
        <p role="status" className="mt-4 flex items-center gap-2 starting:translate-y-2 starting:opacity-0 transition-[opacity,translate] duration-400 ease-(--ease-fluid)">
          <Check size={18} aria-hidden />
          {t("newsletterOk")}
        </p>
      ) : (
        <form action={action} className="mt-4">
          <label htmlFor="news-email" className="text-xs opacity-70">{t("newsletterLabel")}</label>
          <div className="mt-1 flex">
            <input
              id="news-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              aria-invalid={state === "error"}
              aria-describedby="news-msg"
              className="h-cta min-w-0 flex-1 rounded-l-md border border-r-0 border-nieve/30 bg-transparent px-4 text-nieve placeholder:text-nieve/50 focus:border-nieve aria-invalid:border-[#e5707f]"
            />
            <button disabled={pending} aria-label={t("newsletterCta")} className="btn rounded-l-none bg-nieve px-5 text-granito hover:bg-roca-clara disabled:opacity-60">
              <span className="max-sm:sr-only">{t("newsletterCta")}</span>
              <ArrowRight size={16} aria-hidden />
            </button>
          </div>
          <p id="news-msg" role="status" className="mt-2 min-h-5 text-xs text-[#f0a3ad]">
            {state === "error" ? t("newsletterError") : ""}
          </p>
        </form>
      )}
    </section>
  );
}
