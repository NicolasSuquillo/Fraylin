import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Cachear el cliente en globalThis: en dev, cada recompilación HMR re-evalúa este
// módulo y sin caché se crea un pool nuevo cada vez, agotando el límite del pooler.
// max bajo porque detrás de pgbouncer cada worker (build/serverless) abre su propio pool.
const globalForDb = globalThis as unknown as { pgClient?: ReturnType<typeof postgres> };

const client =
  globalForDb.pgClient ?? postgres(process.env.DATABASE_URL!, { prepare: false, max: 2 });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgClient = client;
}

export const db = drizzle(client, { schema });
