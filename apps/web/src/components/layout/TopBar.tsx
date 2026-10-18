import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "./LanguageSwitcher";

// Franja técnica superior en plomo: firma de altura (6384 · PERÚ), aviso de envío y selector ES | EN.
// No es sticky: al hacer scroll se va y queda solo el header.
export async function TopBar() {
  const t = await getTranslations("Header");
  return (
    <div className="bg-granito text-nieve">
      <div className="data mx-auto grid h-8 max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center px-4 md:px-8">
        <p className="tracking-[0.2em]">6384 · PERÚ</p>
        <p className="hidden opacity-80 md:block">{t("shippingNote")}</p>
        <LanguageSwitcher className="justify-self-end" />
      </div>
    </div>
  );
}
