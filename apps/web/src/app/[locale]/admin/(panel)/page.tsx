import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { adminApi } from "@/lib/admin";
import type { AdminDashboard, OrderStatus } from "@/lib/api";
import { formatPrice } from "@/lib/format";

// Etiquetas del flujo de despacho: PAID = Pendiente, PREPARING = Por enviar, SHIPPED = Enviado, DELIVERED = Entregado.
const orderBadge: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "border border-dashed border-linea text-pizarra",
  PAID: "bg-ichu",
  NEEDS_REVIEW: "border border-cochinilla text-cochinilla",
  PREPARING: "bg-roca-clara",
  SHIPPED: "bg-granito text-nieve",
  DELIVERED: "border border-granito",
  CANCELLED: "text-pizarra line-through",
  REFUNDED: "text-pizarra line-through",
};

const th = "p-3 font-normal";

// RF-A30. Una sola llamada a la API (5 consultas acotadas en paralelo).
export default async function AdminDashboardPage({ params }: PageProps<"/[locale]/admin">) {
  const locale = (await params).locale as Locale;
  const [t, d] = await Promise.all([getTranslations("Admin"), adminApi<AdminDashboard>(`/dashboard?locale=${locale}`)]);

  const kpis = [
    [t("kpi.salesToday"), formatPrice(d.salesTodayCents)],
    [t("kpi.sales30d"), formatPrice(d.sales30dCents)],
    [t("kpi.avgTicket"), formatPrice(d.avgTicketCents)],
    [t("kpi.toShip"), String(d.ordersToShip)],
  ];

  return (
    <>
      <h1 className="section-title">{t("dashboard")}</h1>

      <dl className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map(([label, value]) => (
          <div key={label} className="rounded-panel bg-nieve p-4 md:p-5">
            <dt className="text-xs text-pizarra">{label}</dt>
            <dd className="data mt-2 text-xl md:text-2xl">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 grid gap-10 xl:grid-cols-2">
        <section>
          <h2 className="font-semibold">{t("lowStock")}</h2>
          <div className="mt-3 overflow-x-auto rounded-panel bg-nieve">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-linea text-xs text-pizarra">
                <tr>
                  <th className={th}>{t("product")}</th>
                  <th className={th}>{t("imageColor")}</th>
                  <th className={th}>{t("size")}</th>
                  <th className={`${th} text-right`}>{t("stock")}</th>
                </tr>
              </thead>
              <tbody>
                {d.lowStock.map((v) => (
                  <tr key={v.sku} className="border-b border-linea last:border-0">
                    <td className="p-3">
                      <Link href={`/admin/productos/${v.productId}`} className="font-medium hover:underline hover:underline-offset-4">{v.name}</Link>
                      <span className="data block text-xs text-pizarra">{v.sku}</span>
                    </td>
                    <td className="p-3">{v.color}</td>
                    <td className="data p-3">{v.size}</td>
                    <td className={`data p-3 text-right ${v.stock === 0 ? "text-cochinilla" : ""}`}>
                      {v.stock}<span className="text-pizarra"> / {v.lowStockAt}</span>
                    </td>
                  </tr>
                ))}
                {d.lowStock.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-pizarra">{t("lowStockEmpty")}</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="font-semibold">{t("recentOrders")}</h2>
          <div className="mt-3 overflow-x-auto rounded-panel bg-nieve">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-linea text-xs text-pizarra">
                <tr>
                  <th className={th}>{t("order")}</th>
                  <th className={th}>{t("status")}</th>
                  <th className={`${th} text-right`}>{t("total")}</th>
                  <th className={th}>{t("date")}</th>
                </tr>
              </thead>
              <tbody>
                {d.recentOrders.map((o) => (
                  <tr key={o.id} className="border-b border-linea last:border-0">
                    <td className="p-3">
                      <span className="data font-medium">{o.number}</span>
                      <span className="block truncate text-xs text-pizarra">{o.email}</span>
                    </td>
                    <td className="p-3"><span className={`rounded-sm px-2 py-0.5 text-xs ${orderBadge[o.status]}`}>{t(`orderStatus.${o.status}`)}</span></td>
                    <td className="data p-3 text-right">{formatPrice(o.totalCents)}</td>
                    <td className="data p-3 text-xs text-pizarra">{new Date(o.createdAt).toLocaleDateString(locale)}</td>
                  </tr>
                ))}
                {d.recentOrders.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-pizarra">{t("ordersEmpty")}</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
