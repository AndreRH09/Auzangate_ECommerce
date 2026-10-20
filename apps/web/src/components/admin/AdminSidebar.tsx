"use client";

import { CaretDoubleLeft, List, X } from "@phosphor-icons/react/dist/ssr";
import { type ReactNode, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { PopoverPanel } from "../ui/PopoverPanel";

export type AdminNavItem = { href: string; label: string; icon: ReactNode; phase?: string };

// el layout (servidor) lee la misma cookie: un export de un módulo "use client" no le llega como string
const SIDEBAR_COOKIE = "admin_sidebar";
const DRAWER_ID = "admin-nav";

// RF-A00. Escritorio: barra lateral colapsable (el estado va en una cookie para que el servidor
// la pinte ya colapsada, sin parpadeo). Móvil: barra superior + drawer con la Popover API.
// Módulos aún no construidos se ven deshabilitados con su fase.
// `footer` puede ocultar texto al colapsar con `group-data-[collapsed=true]:sr-only`.
export function AdminSidebar({
  items,
  brand,
  footer,
  initialCollapsed,
  labels,
}: {
  items: AdminNavItem[];
  brand: ReactNode;
  footer: ReactNode;
  initialCollapsed: boolean;
  labels: { menu: string; close: string; collapse: string; expand: string };
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const toggle = () => {
    setCollapsed(!collapsed);
    document.cookie = `${SIDEBAR_COOKIE}=${collapsed ? "open" : "collapsed"}; path=/; max-age=31536000; samesite=lax`;
  };

  const nav = (compact: boolean) => (
    <ul className="space-y-1 text-sm">
      {items.map(({ href, label, icon, phase }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        const row = `flex h-10 items-center gap-3 rounded-md px-3 ${compact ? "justify-center" : ""}`;
        const content = (
          <>
            <span className="shrink-0" aria-hidden>{icon}</span>
            <span className={compact ? "sr-only" : "flex-1 truncate"}>{label}</span>
            {phase && !compact && <span className="data text-[10px] text-pizarra">{phase}</span>}
          </>
        );
        return (
          <li key={href} title={compact ? label : undefined}>
            {phase ? (
              <span aria-disabled className={`${row} cursor-not-allowed text-pizarra/60`}>{content}</span>
            ) : (
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`${row} ${active ? "bg-granito text-nieve" : "hover:bg-roca-clara"}`}
              >
                {content}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {/* móvil */}
      <div className="flex h-14 items-center justify-between border-b border-linea bg-nieve px-4 md:hidden">
        {brand}
        <button popoverTarget={DRAWER_ID} className="grid size-11 place-items-center">
          <List size={22} aria-hidden />
          <span className="sr-only">{labels.menu}</span>
        </button>
      </div>
      <PopoverPanel
        id={DRAWER_ID}
        className="mr-auto h-dvh max-h-none w-72 max-w-[85vw] border-0 border-r border-linea bg-nieve p-0 text-granito [--from:-100%_0]"
      >
        <div className="flex min-h-full flex-col">
          <div className="flex h-14 items-center justify-between border-b border-linea px-4">
            {brand}
            <button popoverTarget={DRAWER_ID} popoverTargetAction="hide" className="grid size-11 place-items-center">
              <X size={20} aria-hidden />
              <span className="sr-only">{labels.close}</span>
            </button>
          </div>
          <nav className="flex-1 p-3">{nav(false)}</nav>
          <div className="border-t border-linea p-4">{footer}</div>
        </div>
      </PopoverPanel>

      {/* escritorio */}
      <aside
        data-collapsed={collapsed}
        className={`group sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-linea bg-nieve transition-[width] duration-300 ease-(--ease-fluid) md:flex ${collapsed ? "w-16" : "w-60"}`}
      >
        <div className={`flex h-14 items-center border-b border-linea px-3 ${collapsed ? "justify-center" : "justify-between"}`}>
          {!collapsed && brand}
          <button
            type="button"
            onClick={toggle}
            aria-expanded={!collapsed}
            className="grid size-9 place-items-center rounded-md text-pizarra hover:bg-roca-clara hover:text-granito"
          >
            <CaretDoubleLeft size={16} aria-hidden className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
            <span className="sr-only">{collapsed ? labels.expand : labels.collapse}</span>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">{nav(collapsed)}</nav>
        <div className={`border-t border-linea py-4 ${collapsed ? "px-2" : "px-4"}`}>{footer}</div>
      </aside>
    </>
  );
}
