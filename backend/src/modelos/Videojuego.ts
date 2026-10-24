import { Schema, model } from "mongoose";

export const PLATAFORMAS = ["PC", "PlayStation", "Xbox", "Nintendo", "Mobile"] as const;
export const ESTADOS = ["pendiente", "jugando", "completado", "abandonado"] as const;
export const GENEROS = [
  "Acción y aventura",
  "Acción",
  "Aventura",
  "RPG",
  "Estrategia",
  "Simulación",
  "Deportes",
  "Carreras",
  "Lucha",
  "Plataformas",
  "Terror",
  "Disparos",
  "Puzzle",
  "Roguelike",
  "Metroidvania",
  "Novela visual",
] as const;

export type Plataforma = (typeof PLATAFORMAS)[number];
export type Estado = (typeof ESTADOS)[number];
export type Genero = (typeof GENEROS)[number];

export interface LogroAtributos {
  nombre: string;
  descripcion: string;
  obtenido: boolean;
}

export interface VideojuegoAtributos {
  nombre: string;
  genero: Genero;
  descripcion: string;
  plataforma: Plataforma;
  estado: Estado;
  logros: LogroAtributos[];
}

const logroSchema = new Schema<LogroAtributos>(
  {
    nombre: {
      type: String,
      required: [true, "El nombre del logro es obligatorio"],
      trim: true,
    },
    descripcion: {
      type: String,
      default: "",
      trim: true,
    },
    obtenido: {
      type: Boolean,
      default: false,
    },
  },
  // Cada logro lleva su propio _id. El arreglo guarda objetos, no strings.
  { _id: true }
);

const videojuegoSchema = new Schema<VideojuegoAtributos>(
  {
    nombre: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      trim: true,
    },
    genero: {
      type: String,
      required: [true, "El género es obligatorio"],
      enum: {
        values: [...GENEROS],
        message: `El género «{VALUE}» no es válido. Usa uno de: ${GENEROS.join(", ")}`,
      },
    },
    descripcion: {
      type: String,
      default: "",
      trim: true,
    },
    plataforma: {
      type: String,
      required: [true, "La plataforma es obligatoria"],
      enum: {
        values: [...PLATAFORMAS],
        message: "La plataforma «{VALUE}» no es válida",
      },
    },
    estado: {
      type: String,
      required: [true, "El estado es obligatorio"],
      enum: {
        values: [...ESTADOS],
        message: "El estado «{VALUE}» no es válido",
      },
    },
    logros: {
      type: [logroSchema],
      default: [],
    },
  },
  { versionKey: false }
);

// El modelo se llama Videojuego para el ref futuro de Partida.
// La colección queda fija en videojuegos, sin depender del pluralizador en inglés.
export const Videojuego = model<VideojuegoAtributos>("Videojuego", videojuegoSchema, "videojuegos");
