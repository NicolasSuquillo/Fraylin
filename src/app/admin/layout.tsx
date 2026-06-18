import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/admin-auth";
import AdminNav from "./AdminNav";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/admin-login");

  /* Altura ≈ header móvil fijo: zona segura + h-14 + borde + 2px de margen visual */
  const mobileHeaderSpacerStyle = {
    height: "calc(env(safe-area-inset-top, 0px) + 3.5rem + 1px + 2px)",
  } as const;

  /*
   * Nav inferior fijo: min-h 52px + py-2 + borde + zona segura + margen extra
   * para que el último CTA no quede tapado al llegar al final del scroll.
   */
  const mobileBottomNavSpacerStyle = {
    height: "calc(env(safe-area-inset-bottom, 0px) + 52px + 16px + 1px + 24px)",
  } as const;

  return (
    <div className="min-h-dvh bg-gray-50">
      <AdminNav />
      <main className="relative z-0 md:ml-52 h-dvh max-h-dvh overflow-y-auto overscroll-y-contain">
        {/* Reserva espacio real en el flujo: barras fixed no ocupan sitio */}
        <div
          className="md:hidden shrink-0 w-full pointer-events-none"
          style={mobileHeaderSpacerStyle}
          aria-hidden
        />
        <div className="px-4 sm:px-5 md:px-8 md:pt-8">{children}</div>
        <div
          className="md:hidden shrink-0 w-full pointer-events-none"
          style={mobileBottomNavSpacerStyle}
          aria-hidden
        />
        <div className="hidden md:block h-8 shrink-0" aria-hidden />
      </main>
    </div>
  );
}
