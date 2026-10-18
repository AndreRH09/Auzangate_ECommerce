import { redirect } from "next/navigation";

// ponytail: el admin abre en productos hasta que haya dashboard de KPIs (F2)
export default async function AdminHome({ params }: PageProps<"/[locale]/admin">) {
  redirect(`/${(await params).locale}/admin/productos`);
}
