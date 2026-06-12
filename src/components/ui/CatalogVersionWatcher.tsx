"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

const POLL_MS = 20_000;

/**
 * Detecta cambios de catálogo hechos desde /admin y refresca la página vía
 * router.refresh(). No corre en /admin (ahí es donde se origina el cambio,
 * no queremos perder estado de formularios).
 */
export default function CatalogVersionWatcher() {
  const router = useRouter();
  const pathname = usePathname();
  const versionRef = useRef<number | null>(null);
  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    if (isAdmin) return;

    async function poll() {
      try {
        const res = await fetch("/api/catalog-version", { cache: "no-store" });
        if (!res.ok) return;
        const { version } = await res.json();
        if (typeof version !== "number") return;
        if (versionRef.current === null) {
          versionRef.current = version;
          return;
        }
        if (version !== versionRef.current) {
          versionRef.current = version;
          router.refresh();
        }
      } catch {
        // Ignorar fallos de red; se reintenta en el próximo ciclo.
      }
    }

    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => clearInterval(interval);
  }, [router, isAdmin]);

  return null;
}
