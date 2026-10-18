"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { subscribe } from "@/app/actions";

// Newsletter: input con botón pegado, en una línea, sin pop-up (design system §7.5)
export function NewsletterForm() {
  const t = useTranslations("Home");
  const [state, action, pending] = useActionState(subscribe, null);

  return (
    <section className="mt-24 border-t border-linea pt-12" aria-labelledby="h-news">
      <h2 id="h-news" className="text-lg font-semibold">{t("newsletterTitle")}</h2>
      <form action={action} className="mt-4 max-w-lg">
        <label htmlFor="news-email" className="text-xs text-pizarra">{t("newsletterLabel")}</label>
        <div className="mt-1 flex">
          <input
            id="news-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            aria-invalid={state === "error"}
            aria-describedby="news-msg"
            className="h-cta min-w-0 flex-1 rounded-l-md border border-r-0 border-linea bg-nieve px-4 aria-invalid:border-cochinilla"
          />
          <button disabled={pending} className="h-cta rounded-r-md bg-granito px-6 font-semibold text-nieve disabled:opacity-60">
            {t("newsletterCta")}
          </button>
        </div>
        <p id="news-msg" role="status" className={`mt-2 min-h-5 text-xs ${state === "error" ? "text-cochinilla" : "text-pizarra"}`}>
          {state === "ok" ? t("newsletterOk") : state === "error" ? t("newsletterError") : ""}
        </p>
      </form>
    </section>
  );
}
