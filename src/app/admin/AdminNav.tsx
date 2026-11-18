"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ExternalLink,
  Images,
  Landmark,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  PlusCircle,
  Settings,
  ShoppingCart,
  Tags,
  Truck,
  X,
} from "lucide-react";

const primaryLinks = [
  { href: "/admin/orders", label: "Pedidos", Icon: ShoppingCart, excludePrefix: "/admin/orders/new" },
  { href: "/admin/orders/new", label: "Nuevo pedido", mobileLabel: "Crear", Icon: PlusCircle },
  { href: "/admin/products", label: "Inventario", Icon: Package },
  { href: "/admin/categories", label: "Categorías", Icon: Tags },
] as const;

const secondaryLinks = [
  { href: "/admin/gallery", label: "Galería", Icon: Images },
  { href: "/admin/reviews", label: "Reseñas", Icon: MessageSquare },
  { href: "/admin/shipping", label: "Envío", Icon: Truck },
  { href: "/admin/payment", label: "Pagos", Icon: Landmark },
  { href: "/admin/settings", label: "Configuración", Icon: Settings },
] as const;

function isLinkActive(pathname: string, href: string, excludePrefix?: string): boolean {
  if (excludePrefix && (pathname === excludePrefix || pathname.startsWith(`${excludePrefix}/`))) {
    return false;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getSectionTitle(pathname: string): string {
  if (pathname.startsWith("/admin/orders/new")) return "Nuevo pedido";
  if (pathname.startsWith("/admin/orders")) return "Pedidos";
  if (pathname.startsWith("/admin/products")) return "Inventario";
  if (pathname.startsWith("/admin/categories")) return "Categorías";
  if (pathname.startsWith("/admin/gallery")) return "Galería";
  if (pathname.startsWith("/admin/reviews")) return "Reseñas";
  if (pathname.startsWith("/admin/shipping")) return "Envío";
  if (pathname.startsWith("/admin/payment")) return "Pagos";
  if (pathname.startsWith("/admin/settings")) return "Configuración";
  return "Fraylin Admin";
}

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);

  const secondaryActive = secondaryLinks.some((l) => isLinkActive(pathname, l.href));
  const sectionTitle = getSectionTitle(pathname);

  useEffect(() => {
    if (!moreOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [moreOpen]);

  async function handleLogout() {
    setMoreOpen(false);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      router.push("/admin-login");
      router.refresh();
    }
  }

  return (
    <>
      {/* Sidebar — escritorio */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-30 w-56 bg-white border-r border-gray-200 flex-col py-6 px-3.5 shrink-0 shadow-sm">
        <div className="px-2 mb-5">
          <p className="text-lg font-bold text-amber-800 tracking-tight">Fraylin Admin</p>
          <p className="text-[11px] text-gray-400">Panel de gestión y pedidos</p>
        </div>

        <Link
          href="/admin/orders/new"
          prefetch={false}
          className={`mb-5 flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold shadow-sm transition ${
            pathname.startsWith("/admin/orders/new")
              ? "bg-amber-700 text-white"
              : "bg-amber-600 text-white hover:bg-amber-700"
          }`}
        >
          <PlusCircle className="w-4 h-4 shrink-0" aria-hidden />
          Crear pedido
        </Link>

        <nav className="flex-1 space-y-5 overflow-y-auto pr-0.5">
          <div className="space-y-1">
            <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Operación
            </p>
            {primaryLinks
              .filter((l) => l.href !== "/admin/orders/new")
              .map(({ href, label, Icon, ...rest }) => {
                const active = isLinkActive(
                  pathname,
                  href,
                  "excludePrefix" in rest ? rest.excludePrefix : undefined
                );
                return (
                  <Link
                    key={href}
                    href={href}
                    prefetch={false}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                      active
                        ? "bg-amber-100 text-amber-950 font-semibold"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 opacity-90" aria-hidden />
                    {label}
                  </Link>
                );
              })}
          </div>

          <div className="space-y-1">
            <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Sitio y ajustes
            </p>
            {secondaryLinks.map(({ href, label, Icon }) => {
              const active = isLinkActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  prefetch={false}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    active
                      ? "bg-amber-100 text-amber-950 font-semibold"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 opacity-90" aria-hidden />
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-gray-100 pt-3 mt-3 space-y-1">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-amber-700 text-left px-3 py-2.5 rounded-xl hover:bg-gray-100 transition"
          >
            <ExternalLink className="w-4 h-4 shrink-0" aria-hidden />
            Ver tienda pública
          </a>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 text-left px-3 py-2.5 rounded-xl hover:bg-gray-100 transition"
          >
            <LogOut className="w-4 h-4 shrink-0" aria-hidden />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Barra superior — móvil */}
      <header className="md:hidden fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 pt-[env(safe-area-inset-top,0px)]">
        <div className="flex h-14 items-center justify-between px-4 gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
              Fraylin Admin
            </p>
            <p className="truncate text-base font-bold text-gray-900 leading-tight">
              {sectionTitle}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {!pathname.startsWith("/admin/orders/new") && (
              <Link
                href="/admin/orders/new"
                prefetch={false}
                className="inline-flex min-h-[38px] items-center gap-1 rounded-xl bg-amber-600 px-3 text-xs font-semibold text-white active:bg-amber-700"
              >
                <PlusCircle className="w-3.5 h-3.5" aria-hidden />
                Pedido
              </Link>
            )}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center h-[38px] w-[38px] rounded-xl border border-gray-200 text-gray-700 active:bg-gray-100"
              aria-label="Ver sitio web"
            >
              <ExternalLink className="w-4 h-4" aria-hidden />
            </a>
          </div>
        </div>
      </header>

      {/* Cajón "Más" móvil */}
      {moreOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/45 backdrop-blur-[1px] flex items-end"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMoreOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Más opciones del panel"
        >
          <div className="w-full rounded-t-3xl bg-white p-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] shadow-2xl space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-sm font-bold text-gray-900">Más secciones y ajustes</p>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600"
                aria-label="Cerrar menú"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {secondaryLinks.map(({ href, label, Icon }) => {
                const active = isLinkActive(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    prefetch={false}
                    onClick={() => setMoreOpen(false)}
                    className={`flex items-center gap-2.5 min-h-[48px] rounded-xl border px-3 text-sm font-medium ${
                      active
                        ? "border-amber-300 bg-amber-50 text-amber-950 font-semibold"
                        : "border-gray-200 bg-white text-gray-700 active:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 text-amber-700" aria-hidden />
                    {label}
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2.5 min-h-[48px] rounded-xl border border-red-200 bg-red-50/70 px-3 text-sm font-semibold text-red-700 active:bg-red-100"
              >
                <LogOut className="w-4 h-4 shrink-0" aria-hidden />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navegación inferior — móvil (5 columnas ergonómicas) */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-sm border-t border-gray-200 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_24px_rgba(0,0,0,0.06)]"
        aria-label="Secciones del panel"
      >
        <div className="grid grid-cols-5 max-w-lg mx-auto">
          {primaryLinks.map(({ href, label, Icon, ...rest }) => {
            const active = isLinkActive(
              pathname,
              href,
              "excludePrefix" in rest ? rest.excludePrefix : undefined
            );
            const displayLabel = "mobileLabel" in rest && rest.mobileLabel ? rest.mobileLabel : label;
            return (
              <Link
                key={href}
                href={href}
                prefetch={false}
                onClick={() => setMoreOpen(false)}
                className={`flex flex-col items-center justify-center gap-0.5 min-h-[54px] py-1.5 px-1 transition ${
                  active ? "text-amber-900 font-semibold" : "text-gray-500 active:bg-gray-50"
                }`}
              >
                <span
                  className={`flex h-7 w-10 items-center justify-center rounded-full transition ${
                    active ? "bg-amber-100 text-amber-800" : ""
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" aria-hidden />
                </span>
                <span className="text-[11px] leading-tight text-center truncate max-w-full">
                  {displayLabel}
                </span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className={`flex flex-col items-center justify-center gap-0.5 min-h-[54px] py-1.5 px-1 transition ${
              moreOpen || secondaryActive ? "text-amber-900 font-semibold" : "text-gray-500 active:bg-gray-50"
            }`}
            aria-expanded={moreOpen}
          >
            <span
              className={`flex h-7 w-10 items-center justify-center rounded-full transition ${
                moreOpen || secondaryActive ? "bg-amber-100 text-amber-800" : ""
              }`}
            >
              <Menu className="w-5 h-5 shrink-0" aria-hidden />
            </span>
            <span className="text-[11px] leading-tight text-center">Más</span>
          </button>
        </div>
      </nav>
    </>
  );
}
