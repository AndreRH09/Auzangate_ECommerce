import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

// "Anterior" / "Ver más" por cursor. Los href ya vienen armados con los filtros vigentes.
export async function Pagination({ prevHref, nextHref }: { prevHref: string | null; nextHref: string | null }) {
  if (!prevHref && !nextHref) return null;
  const t = await getTranslations("Listing");
  return (
    <nav className="mt-12 flex justify-center gap-2" aria-label="pagination">
      {prevHref && (
        <Link href={prevHref} className="flex h-cta items-center rounded-md border border-granito px-6 font-semibold">
          {t("prev")}
        </Link>
      )}
      {nextHref && (
        <Link href={nextHref} className="flex h-cta items-center rounded-md bg-granito px-6 font-semibold text-nieve">
          {t("next")}
        </Link>
      )}
    </nav>
  );
}
