import mongoose from "mongoose";

/**
 * Abre una conexión al arrancar. Mongoose reutiliza ese cliente en cada consulta.
 * dbName elige la base dentro del cluster; no es un ajuste de pool.
 * El pool queda en el default del driver: un solo proceso y sin cifra de concurrencia medida.
 */
export function conectarDB(uri: string, dbName: string): Promise<typeof mongoose> {
  return mongoose.connect(uri, { dbName });
}
