import type { ErrorApi, Meta, ProgresoSemanal } from "../tipos";
import { ErrorHttp } from "./videojuegosApi";

const API_ORIGIN = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const BASE = `${API_ORIGIN}/api`;

async function manejar<T>(respuesta: Response): Promise<T> {
  if (respuesta.status === 204) {
    return undefined as T;
  }
  const cuerpo = (await respuesta.json().catch(() => ({}))) as T & ErrorApi;
  if (!respuesta.ok) {
    throw new ErrorHttp(respuesta.status, cuerpo);
  }
  return cuerpo;
}

export async function obtenerProgresoSemanal(
  videojuegoId: string,
): Promise<ProgresoSemanal> {
  const respuesta = await fetch(
    `${BASE}/videojuegos/${videojuegoId}/progreso-semanal`,
  );
  return manejar<ProgresoSemanal>(respuesta);
}

export async function listarMetas(videojuegoId: string): Promise<Meta[]> {
  const respuesta = await fetch(`${BASE}/videojuegos/${videojuegoId}/metas`);
  return manejar<Meta[]>(respuesta);
}

export async function crearMeta(datos: {
  videojuego: string;
  horasSemanales: number;
  diasPorSemana: number;
  hitos: Array<{ descripcion: string; porcentajeObjetivo: number }>;
}): Promise<Meta> {
  const respuesta = await fetch(`${BASE}/metas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  return manejar<Meta>(respuesta);
}

export async function actualizarMeta(
  id: string,
  datos: {
    horasSemanales?: number;
    diasPorSemana?: number;
    hitos?: Array<{ descripcion: string; porcentajeObjetivo: number }>;
    activa?: boolean;
  },
): Promise<Meta> {
  const respuesta = await fetch(`${BASE}/metas/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  return manejar<Meta>(respuesta);
}

export async function desactivarMeta(id: string): Promise<Meta> {
  const respuesta = await fetch(`${BASE}/metas/${id}/desactivar`, {
    method: "POST",
  });
  return manejar<Meta>(respuesta);
}
