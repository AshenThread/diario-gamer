import mongoose from "mongoose";

/**
 * Abre una conexión al arrancar. Mongoose reutiliza ese cliente en cada consulta.
 * Sin opciones de pool: un solo proceso Express de larga duración, uso personal,
 * y todavía no hay una cifra de concurrencia que justifique salir del default del driver.
 */
export function conectarDB(uri: string): Promise<typeof mongoose> {
  return mongoose.connect(uri);
}
