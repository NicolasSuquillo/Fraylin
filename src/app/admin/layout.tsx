import { redirect } from "next/navigation";
import { getSession } from "@/lib/admin-auth";
import AdminNav from "./AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/admin-login");

  /* Altura ≈ header móvil fijo: zona segura + h-14 + borde + 2px de margen visual */
  const mobileHeaderSpacerStyle = {
    height: "calc(env(safe-area-inset-top, 0px) + 3.5rem + 1px + 2px)",
  } as const;

  /*
   * Nav inferior fijo: borde superior + fila de pestañas (min-h 52px en AdminNav) +
   * padding inferior con zona segura + margen para que no tape CTAs al hacer scroll.
   */
  const mobileBottomNavSpacerStyle = {
    height: "calc(env(safe-area-inset-bottom, 0px) + 52px + 1px + 16px)",
  } as const;

  return (
    <div className="min-h-dvh bg-gray-50">
      <AdminNav />
      <main className="relative z-0 min-h-dvh overflow-y-auto overscroll-y-contain px-4 pt-0 pb-0 sm:px-5 md:ml-52 md:p-8">
        {/* Reserva espacio real en el flujo: barras fixed no ocupan sitio */}
        <div
          className="md:hidden shrink-0 w-full pointer-events-none"
          style={mobileHeaderSpacerStyle}
          aria-hidden
        />
        {children}
        <div
          className="md:hidden shrink-0 w-full pointer-events-none"
          style={mobileBottomNavSpacerStyle}
          aria-hidden
        />
      </main>
    </div>
  );
}
