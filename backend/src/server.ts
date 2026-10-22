import { crearApp } from "./app";
import { conectarDB } from "./config/conexionDB";
import { cargarEnv } from "./config/env";

function sinUri(error: unknown): string {
  const texto = error instanceof Error ? error.message : "error desconocido";
  return texto.replace(/mongodb(\+srv)?:\/\/\S+/gi, "mongodb://***");
}

async function main(): Promise<void> {
  let entorno;
  try {
    entorno = cargarEnv();
  } catch (error) {
    console.error(sinUri(error));
    process.exit(1);
  }

  try {
    await conectarDB(entorno.MONGODB_URI, entorno.MONGODB_DB);
  } catch (error) {
    console.error(`No se pudo conectar a Atlas: ${sinUri(error)}`);
    process.exit(1);
  }

  console.log(`Conectado a MongoDB (base: ${entorno.MONGODB_DB})`);
  const app = crearApp(entorno.CORS_ORIGIN);
  const servidor = app.listen(entorno.PORT, () => {
    console.log(`API escuchando en http://localhost:${entorno.PORT}`);
  });
  servidor.on("error", (error) => {
    console.error(sinUri(error));
    process.exit(1);
  });
}

main().catch((error: unknown) => {
  console.error(sinUri(error));
  process.exit(1);
});
