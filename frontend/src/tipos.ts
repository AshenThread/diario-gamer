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
  plataforma: Plataforma;
  estado: Estado;
  logros: Logro[];
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
