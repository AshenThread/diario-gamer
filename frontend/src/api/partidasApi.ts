import type { Partida, Resumen } from "../tipos";

const API_ORIGIN = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const BASE = `${API_ORIGIN}/api`;

async function manejar<T>(respuesta: Response): Promise<T> {
  if (respuesta.status === 204) {
    return undefined as T;
  }
  const cuerpo = await respuesta.json() as T | { error?: string; detalles?: string[] };
  if (!respuesta.ok) {
    const error = cuerpo as { error?: string; detalles?: string[] };
    throw new Error([error.error, ...(error.detalles ?? [])].filter(Boolean).join(": "));
  }
  return cuerpo as T;
}

export async function listarPartidas(videojuegoId: string): Promise<Partida[]> {
  const respuesta = await fetch(`${BASE}/videojuegos/${videojuegoId}/partidas`);
  return manejar<Partida[]>(respuesta);
}

export async function crearPartida(datos: {
  videojuego: string;
  fecha: string;
  duracionMinutos: number;
  porcentajeAvance: number;
}): Promise<Partida> {
  const respuesta = await fetch(`${BASE}/partidas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  return manejar<Partida>(respuesta);
}

export async function obtenerResumen(videojuegoId: string): Promise<Resumen> {
  const respuesta = await fetch(`${BASE}/videojuegos/${videojuegoId}/resumen`);
  return manejar<Resumen>(respuesta);
}
