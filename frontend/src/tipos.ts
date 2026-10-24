export const PLATAFORMAS = ["PC", "PlayStation", "Xbox", "Nintendo", "Mobile"] as const;
export const ESTADOS = ["pendiente", "jugando", "completado", "abandonado"] as const;

export type Plataforma = (typeof PLATAFORMAS)[number];
export type Estado = (typeof ESTADOS)[number];

export interface Logro {
  _id: string;
  nombre: string;
  descripcion: string;
  obtenido: boolean;
}

export interface Videojuego {
  _id: string;
  nombre: string;
  genero: string;
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
