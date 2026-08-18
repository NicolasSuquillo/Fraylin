import Link from "next/link";

export const metadata = {
  title: "Sin conexión",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="min-h-dvh flex items-center justify-center bg-gray-50 px-4 py-10 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-md border border-gray-100 w-full max-w-sm text-center">
        <p className="text-sm font-medium tracking-wide text-brand-dark uppercase mb-2">
          Fraylin
        </p>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Sin conexión</h1>
        <p className="text-sm text-gray-500 mb-6">
          No hay internet en este momento. La interfaz del panel sigue disponible
          con lo último que se guardó en este dispositivo.
        </p>
        <Link
          href="/admin"
          className="inline-flex items-center justify-center w-full rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark transition-colors"
        >
          Abrir el panel
        </Link>
      </div>
    </main>
  );
}
