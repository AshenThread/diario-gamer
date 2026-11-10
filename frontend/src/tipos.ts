export const PLATAFORMAS = [
  "PC",
  "PlayStation",
  "Xbox",
  "Nintendo",
  "Mobile",
] as const;
export const ESTADOS = [
  "pendiente",
  "jugando",
  "completado",
  "abandonado",
] as const;
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

export interface HitoMeta {
  descripcion: string;
  porcentajeObjetivo: number;
  alcanzado?: boolean;
}

export interface Meta {
  _id: string;
  videojuego: string;
  horasSemanales: number;
  diasPorSemana: number;
  activa: boolean;
  hitos: HitoMeta[];
}

export interface ProgresoSemanal {
  semana: { inicio: string; fin: string };
  meta: { horasSemanales: number; diasPorSemana: number } | null;
  horasSemana: number;
  porcentajeHoras: number | null;
  diasJugadosSemana: number;
  rachaActual: number;
  mejorRacha: number;
  hitos: Array<HitoMeta & { alcanzado: boolean }>;
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
