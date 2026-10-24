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

export interface Logro {
  _id: string;
  nombre: string;
  descripcion: string;
  obtenido: boolean;
}

export interface Videojuego {
  _id: string;
  nombre: string;
  genero: Genero;
  descripcion: string;
  plataforma: Plataforma;
  estado: Estado;
  logros: Logro[];
}

export interface Partida {
  _id: string;
  videojuego: string | Videojuego;
  fecha: string;
  duracionMinutos: number;
  porcentajeAvance: number;
}

export interface Resumen {
  horasTotales: number;
  cantidadPartidas: number;
  fechaUltimaSesion: string | null;
  avanceActual: number | null;
}

export interface LogroFormulario {
  nombre: string;
  descripcion: string;
  obtenido: boolean;
}

export interface ErrorApi {
  codigo?: string;
  error?: string;
  status?: number;
  requestId?: string;
  detalles?: string[];
}
