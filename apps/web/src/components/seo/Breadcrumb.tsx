import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { absolute } from "@/lib/seo";
import { JsonLd } from "./JsonLd";

// Breadcrumb visible (mono 12) + BreadcrumbList JSON-LD (plan §8.4)
export function Breadcrumb({ locale, items }: { locale: Locale; items: { name: string; href: string }[] }) {
  return (
    <>
      <nav aria-label="breadcrumb" className="data text-pizarra">
        <ol className="flex flex-wrap gap-1">
          {items.map((it, i) => (
            <li key={it.href} className="flex gap-1">
              {i > 0 && <span aria-hidden>/</span>}
              {i === items.length - 1 ? (
                <span aria-current="page" className="text-granito">{it.name}</span>
              ) : (
                <Link href={it.href} className="hover:text-granito">{it.name}</Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: items.map((it, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: it.name,
            item: absolute(`/${locale}${it.href === "/" ? "" : it.href}`),
          })),
        }}
      />
    </>
  );
}
