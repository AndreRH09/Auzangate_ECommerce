import type { Metadata } from "next";

// Admin: sin header/footer de la tienda y nunca indexado.
export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default function AdminRootLayout({ children }: LayoutProps<"/[locale]/admin">) {
  return <div id="main" className="flex flex-1 flex-col bg-glaciar">{children}</div>;
}
