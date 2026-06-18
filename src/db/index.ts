import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Cachear el cliente en globalThis: en dev, cada recompilación HMR re-evalúa este
// módulo y sin caché se crea un pool nuevo cada vez, agotando el límite del pooler.
// max bajo porque detrás de pgbouncer cada worker (build/serverless) abre su propio pool.
const globalForDb = globalThis as unknown as { pgClient?: ReturnType<typeof postgres> };

// idle_timeout/max_lifetime: el pooler de Supabase corta conexiones TCP inactivas;
// sin esto, la siguiente query se cuelga sobre una conexión muerta hasta agotar
// el connect_timeout por defecto (30s) o indefinidamente.
const client =
  globalForDb.pgClient ??
  postgres(process.env.DATABASE_URL!, {
    prepare: false,
    max: 4,
    idle_timeout: 120,
    max_lifetime: 60 * 30,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgClient = client;
}

export const db = drizzle(client, { schema });
