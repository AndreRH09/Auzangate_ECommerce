import { getTranslations } from "next-intl/server";

// Ficha técnica bajo la galería: Detalles · Materiales · Talla y calce · Envío y cambios.
// Acordeón exclusivo nativo (<details name>) en vez de tabs con JS; techSpecs en mono.
export async function ProductSpecsAccordion({ description, techSpecs }: { description: string; techSpecs: Record<string, string> }) {
  const t = await getTranslations("Product");
  const sections = [
    { key: "details", body: <p className="max-w-prose">{description}</p> },
    {
      key: "materials",
      body: (
        <dl className="data grid grid-cols-[auto_1fr] gap-x-8 gap-y-2">
          {Object.entries(techSpecs).map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-pizarra capitalize">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      ),
    },
    { key: "fit", body: <p className="max-w-prose">{t("fitText")}</p> },
    { key: "shipping", body: <p className="max-w-prose">{t("shippingText")}</p> },
  ] as const;

  return (
    <div className="max-w-3xl divide-y divide-linea border-y border-linea">
      {sections.map((s, i) => (
        <details key={s.key} name="pdp-info" open={i === 0} className="group">
          <summary className="flex h-14 cursor-pointer list-none items-center justify-between font-semibold">
            {t(s.key)}
            <span aria-hidden className="data transition-transform group-open:rotate-45 motion-reduce:transition-none">+</span>
          </summary>
          <div className="pb-6">{s.body}</div>
        </details>
      ))}
    </div>
  );
}
