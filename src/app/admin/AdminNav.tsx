"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Package, Tags, Images, ShoppingCart, Truck, Landmark, MessageSquare, LogOut, ExternalLink, Settings } from "lucide-react";

const links = [
  { href: "/admin/products",  label: "Productos",   Icon: Package },
  { href: "/admin/categories",label: "Categorías",  Icon: Tags },
  { href: "/admin/orders",    label: "Pedidos",     Icon: ShoppingCart },
  { href: "/admin/gallery",   label: "Galería",     Icon: Images },
  { href: "/admin/reviews",   label: "Reseñas",     Icon: MessageSquare },
  { href: "/admin/shipping",  label: "Envío",       Icon: Truck },
  { href: "/admin/payment",   label: "Pagos",       Icon: Landmark },
  { href: "/admin/settings",  label: "Config.",     Icon: Settings },
] as const;

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      router.push("/admin-login");
      router.refresh();
    }
  }

  return (
    <>
      {/* Sidebar — escritorio: fijo para no afectar el flujo del main */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-30 w-52 bg-white border-r border-gray-200 flex-col py-8 px-4 shrink-0 shadow-sm">
        <p className="text-lg font-bold text-amber-800 mb-8 px-1">Fraylin Admin</p>
        <nav className="flex-1 space-y-1">
          {links.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              prefetch={false}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                pathname.startsWith(href)
                  ? "bg-amber-100 text-amber-900"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0 opacity-90" aria-hidden />
              {label}
            </Link>
          ))}
        </nav>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-amber-700 text-left px-3 py-2.5 rounded-xl hover:bg-gray-100 transition mb-1"
        >
          <ExternalLink className="w-4 h-4 shrink-0" aria-hidden />
          Ver sitio
        </a>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 text-left px-3 py-2.5 rounded-xl hover:bg-gray-100 transition"
        >
          <LogOut className="w-4 h-4 shrink-0" aria-hidden />
          Cerrar sesión
        </button>
      </aside>

      {/* Barra superior — móvil */}
      <header className="md:hidden fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 pt-[env(safe-area-inset-top,0px)]">
        <div className="flex h-14 items-center justify-between px-4">
          <p className="text-base font-bold text-amber-800">Fraylin Admin</p>
          <div className="flex items-center -mr-2">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 min-h-[44px] rounded-lg text-sm font-medium text-gray-700 active:bg-gray-100 px-3"
            >
              <ExternalLink className="w-4 h-4 shrink-0" aria-hidden />
              Ver sitio
            </a>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 min-h-[44px] rounded-lg text-sm font-medium text-gray-700 active:bg-gray-100 px-3"
            >
              <LogOut className="w-4 h-4 shrink-0" aria-hidden />
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Navegación inferior — móvil (iconos + etiqueta) */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_24px_rgba(0,0,0,0.06)]"
        aria-label="Secciones del panel"
      >
        <div className="flex max-w-lg mx-auto">
          {links.map(({ href, label, Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                prefetch={false}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 min-h-[52px] py-2 px-1 transition ${
                  active ? "text-amber-800 bg-amber-50/90" : "text-gray-500 active:bg-gray-50"
                }`}
              >
                <Icon
                  className={`w-6 h-6 shrink-0 ${active ? "text-amber-700" : "text-gray-400"}`}
                  aria-hidden
                />
                <span className="text-[10px] font-semibold leading-tight text-center">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
