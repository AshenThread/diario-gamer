import type { ErrorApi, Estado, Plataforma, Videojuego } from "../tipos";

const API_ORIGIN = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const BASE = `${API_ORIGIN}/api/videojuegos`;

export class ErrorHttp extends Error {
  readonly codigo?: string;
  readonly requestId?: string;
  readonly status: number;

  constructor(status: number, cuerpo: ErrorApi) {
    const detalle = cuerpo.detalles?.join(". ");
    super(detalle ? `${cuerpo.error ?? "Error"}: ${detalle}` : (cuerpo.error ?? `Error HTTP ${status}`));
    this.status = status;
    this.codigo = cuerpo.codigo;
    this.requestId = cuerpo.requestId;
  }
}

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

export async function listarVideojuegos(filtro: {
  estado?: Estado | "";
  plataforma?: Plataforma | "";
}): Promise<Videojuego[]> {
  const params = new URLSearchParams();
  if (filtro.estado) {
    params.set("estado", filtro.estado);
  }
  if (filtro.plataforma) {
    params.set("plataforma", filtro.plataforma);
  }
  const query = params.toString();
  const respuesta = await fetch(query ? `${BASE}?${query}` : BASE);
  const cuerpo = await manejar<unknown>(respuesta);
  if (Array.isArray(cuerpo)) {
    return cuerpo as Videojuego[];
  }
  if (
    cuerpo !== null &&
    typeof cuerpo === "object" &&
    "videojuegos" in cuerpo &&
    Array.isArray(cuerpo.videojuegos)
  ) {
    return cuerpo.videojuegos as Videojuego[];
  }
  throw new Error("La API devolvió un formato de videojuegos no válido.");
}

export async function crearVideojuego(datos: {
  nombre: string;
  plataforma: Plataforma;
  estado: Estado;
  logros: { nombre: string; descripcion: string; obtenido: boolean }[];
}): Promise<Videojuego> {
  const respuesta = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  return manejar<Videojuego>(respuesta);
}

export async function actualizarEstado(id: string, estado: Estado): Promise<Videojuego> {
  const respuesta = await fetch(`${BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado }),
  });
  return manejar<Videojuego>(respuesta);
}

export async function marcarLogro(
  id: string,
  logroId: string,
  obtenido: boolean
): Promise<Videojuego> {
  const respuesta = await fetch(`${BASE}/${id}/logros/${logroId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ obtenido }),
  });
  return manejar<Videojuego>(respuesta);
}

export async function eliminarVideojuego(id: string): Promise<void> {
  const respuesta = await fetch(`${BASE}/${id}`, { method: "DELETE" });
  await manejar<void>(respuesta);
}
