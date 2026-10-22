import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
  quiet: true,
});

export interface Entorno {
  MONGODB_URI: string;
  MONGODB_DB: string;
  PORT: number;
  CORS_ORIGIN: string;
}

export function cargarEnv(): Entorno {
  const uri = process.env.MONGODB_URI?.trim() ?? "";
  if (!uri) {
    throw new Error(
      "Falta MONGODB_URI. Copia backend/.env.example a backend/.env y pega la URI de Atlas."
    );
  }
  if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
    throw new Error("MONGODB_URI debe empezar por mongodb:// o mongodb+srv://.");
  }

  return {
    MONGODB_URI: uri,
    MONGODB_DB: leerBase(process.env.MONGODB_DB),
    PORT: leerPuerto(process.env.PORT),
    CORS_ORIGIN: process.env.CORS_ORIGIN?.trim() || "http://localhost:5174",
  };
}

function leerBase(valor: string | undefined): string {
  const nombre = valor?.trim() || "diario_gamer";
  if (!/^[A-Za-z0-9_-]+$/.test(nombre)) {
    throw new Error("MONGODB_DB solo puede tener letras, números, guion y guion bajo.");
  }
  return nombre;
}

function leerPuerto(valor: string | undefined): number {
  if (valor === undefined || valor.trim() === "") {
    return 3001;
  }
  const puerto = Number(valor);
  if (!Number.isInteger(puerto) || puerto < 1 || puerto > 65535) {
    throw new Error("PORT debe ser un entero entre 1 y 65535.");
  }
  return puerto;
}
