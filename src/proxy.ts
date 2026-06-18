import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// En Next.js 16 el antiguo "middleware" se llama "proxy" (misma funcionalidad).
// Aquí lo usamos como defensa CSRF en profundidad para el panel admin: las
// mutaciones bajo /api/admin/* solo se aceptan si el header Origin coincide con
// el host de la petición. Complementa al SameSite=Lax de la cookie de sesión y
// cierra vectores como el force-logout cross-site o un markPaid forzado.

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function proxy(request: NextRequest) {
  if (SAFE_METHODS.has(request.method)) {
    return NextResponse.next();
  }

  const origin = request.headers.get("origin");

  // Si no hay Origin no es una petición de navegador (curl, cron, server-to-server):
  // se deja pasar porque igual debe superar el getSession() de la ruta. Un ataque
  // CSRF clásico SIEMPRE envía el Origin del sitio atacante, así que exigir que
  // coincida cuando está presente es suficiente y no rompe llamadas legítimas.
  if (origin) {
    const host = request.headers.get("host");
    let originHost: string | null = null;
    try {
      originHost = new URL(origin).host;
    } catch {
      originHost = null;
    }
    if (!originHost || originHost !== host) {
      return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/admin/:path*",
};
