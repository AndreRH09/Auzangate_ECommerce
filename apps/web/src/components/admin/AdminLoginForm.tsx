"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { login } from "@/app/actions";

const field = "mt-1 h-cta w-full rounded-md border border-linea bg-transparent px-4 focus:border-granito aria-invalid:border-[#c4384a]";

export function AdminLoginForm() {
  const t = useTranslations("Admin");
  const [state, action, pending] = useActionState(login, null);
  const invalid = state !== null;

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      <label className="text-sm">
        {t("email")}
        <input name="email" type="email" required autoComplete="username" defaultValue={state?.email} aria-invalid={invalid} aria-describedby="login-msg" className={field} />
      </label>
      <label className="text-sm">
        {t("password")}
        <input name="password" type="password" required autoComplete="current-password" aria-invalid={invalid} aria-describedby="login-msg" className={field} />
      </label>
      <p id="login-msg" role="alert" className="min-h-5 text-sm text-[#c4384a]">
        {state && t(state.error)}
      </p>
      <button disabled={pending} className="btn bg-granito text-nieve hover:bg-pizarra disabled:opacity-60">{t("submit")}</button>
    </form>
  );
}
