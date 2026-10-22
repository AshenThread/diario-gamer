import { Types } from "mongoose";
import { ErrorIdInvalido, ErrorNoEncontrado, ErrorValidacion } from "../errores/erroresHttp";
import {
  ESTADOS,
  PLATAFORMAS,
  Videojuego,
  type Estado,
  type Plataforma,
} from "../modelos/Videojuego";

const CAMPOS_ACTUALIZABLES = ["nombre", "plataforma", "estado", "logros"] as const;
type CampoActualizable = (typeof CAMPOS_ACTUALIZABLES)[number];

export interface FiltroListado {
  estado?: unknown;
  plataforma?: unknown;
}

// isValid() de Mongoose acepta cualquier string de 12 bytes. Aquí el id son 24 hex.
function esObjectId(id: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

function exigirObjectId(id: string, detalle: string): void {
  if (!esObjectId(id)) {
    throw new ErrorIdInvalido(detalle);
  }
}

function leerObjeto(body: unknown): Record<string, unknown> {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new ErrorValidacion("El cuerpo debe ser un objeto");
  }
  return body as Record<string, unknown>;
}

function exigirNombre(valor: unknown): string {
  if (typeof valor !== "string" || valor.trim() === "") {
    throw new ErrorValidacion("El nombre es obligatorio");
  }
  return valor;
}

function exigirPlataforma(valor: unknown): Plataforma {
  if (typeof valor !== "string" || !(PLATAFORMAS as readonly string[]).includes(valor)) {
    throw new ErrorValidacion("La plataforma debe ser PC, PlayStation, Xbox, Nintendo o Mobile");
  }
  return valor as Plataforma;
}

function exigirEstado(valor: unknown): Estado {
  if (typeof valor !== "string" || !(ESTADOS as readonly string[]).includes(valor)) {
    throw new ErrorValidacion("El estado debe ser pendiente, jugando, completado o abandonado");
  }
  return valor as Estado;
}

function leerFiltro<T extends string>(
  valor: unknown,
  permitidos: readonly T[],
  campo: string
): T | undefined {
  if (valor === undefined) {
    return undefined;
  }
  if (Array.isArray(valor)) {
    throw new ErrorValidacion(`${campo} admite un solo valor`);
  }
  if (typeof valor !== "string" || !(permitidos as readonly string[]).includes(valor)) {
    throw new ErrorValidacion(`${campo} debe ser uno de: ${permitidos.join(", ")}`);
  }
  return valor as T;
}

function revisarLogros(valor: unknown): void {
  if (!Array.isArray(valor)) {
    throw new ErrorValidacion("logros debe ser un arreglo de objetos");
  }
  for (const item of valor) {
    if (item === null || typeof item !== "object" || Array.isArray(item)) {
      throw new ErrorValidacion("Cada logro debe ser un objeto");
    }
    const logro = item as Record<string, unknown>;
    if (!Object.hasOwn(logro, "nombre") || typeof logro.nombre !== "string" || logro.nombre.trim() === "") {
      throw new ErrorValidacion("El nombre del logro es obligatorio");
    }
    if (Object.hasOwn(logro, "descripcion") && typeof logro.descripcion !== "string") {
      throw new ErrorValidacion("descripcion debe ser texto");
    }
    if (Object.hasOwn(logro, "obtenido") && typeof logro.obtenido !== "boolean") {
      throw new ErrorValidacion("obtenido debe ser true o false");
    }
  }
}

function camposPresentes(body: unknown): Partial<Record<CampoActualizable, unknown>> {
  const cuerpo = leerObjeto(body);
  const datos: Partial<Record<CampoActualizable, unknown>> = {};
  for (const campo of CAMPOS_ACTUALIZABLES) {
    if (Object.hasOwn(cuerpo, campo)) {
      datos[campo] = cuerpo[campo];
    }
  }
  if (Object.keys(datos).length === 0) {
    throw new ErrorValidacion("Envía al menos un campo: nombre, plataforma, estado o logros");
  }
  return datos;
}

export async function listar(filtro: FiltroListado) {
  const estado = leerFiltro(filtro.estado, ESTADOS, "estado");
  const plataforma = leerFiltro(filtro.plataforma, PLATAFORMAS, "plataforma");
  // Las propiedades presentes se exigen juntas: estado y plataforma a la vez.
  const consulta: { estado?: Estado; plataforma?: Plataforma } = {};
  if (estado) {
    consulta.estado = estado;
  }
  if (plataforma) {
    consulta.plataforma = plataforma;
  }
  return Videojuego.find(consulta);
}

export async function obtenerPorId(id: string) {
  exigirObjectId(id, "El id del videojuego debe tener 24 caracteres hexadecimales");
  const juego = await Videojuego.findById(id);
  if (!juego) {
    throw new ErrorNoEncontrado("Videojuego no encontrado");
  }
  return juego;
}

export async function crear(body: unknown) {
  const cuerpo = leerObjeto(body);
  const datos: {
    nombre: string;
    plataforma: Plataforma;
    estado: Estado;
    logros?: unknown;
  } = {
    nombre: exigirNombre(cuerpo.nombre),
    plataforma: exigirPlataforma(cuerpo.plataforma),
    estado: exigirEstado(cuerpo.estado),
  };
  if (Object.hasOwn(cuerpo, "logros")) {
    revisarLogros(cuerpo.logros);
    datos.logros = cuerpo.logros;
  }
  const juego = new Videojuego(datos);
  await juego.save();
  return juego;
}

export async function actualizar(id: string, body: unknown) {
  exigirObjectId(id, "El id del videojuego debe tener 24 caracteres hexadecimales");
  const datos = camposPresentes(body);
  const juego = await Videojuego.findById(id);
  if (!juego) {
    throw new ErrorNoEncontrado("Videojuego no encontrado");
  }
  if (Object.hasOwn(datos, "nombre")) {
    juego.nombre = exigirNombre(datos.nombre);
  }
  if (Object.hasOwn(datos, "plataforma")) {
    juego.plataforma = exigirPlataforma(datos.plataforma);
  }
  if (Object.hasOwn(datos, "estado")) {
    juego.estado = exigirEstado(datos.estado);
  }
  if (Object.hasOwn(datos, "logros")) {
    revisarLogros(datos.logros);
    juego.set("logros", datos.logros);
  }
  await juego.save();
  return juego;
}

export async function eliminar(id: string): Promise<void> {
  exigirObjectId(id, "El id del videojuego debe tener 24 caracteres hexadecimales");
  const juego = await Videojuego.findByIdAndDelete(id);
  if (!juego) {
    throw new ErrorNoEncontrado("Videojuego no encontrado");
  }
}

export async function actualizarLogro(id: string, logroId: string, body: unknown) {
  exigirObjectId(id, "El id del videojuego debe tener 24 caracteres hexadecimales");
  exigirObjectId(logroId, "El id del logro debe tener 24 caracteres hexadecimales");
  const cuerpo = leerObjeto(body);
  if (!Object.hasOwn(cuerpo, "obtenido") || typeof cuerpo.obtenido !== "boolean") {
    throw new ErrorValidacion("obtenido debe ser true o false");
  }

  const juego = await Videojuego.findById(id);
  if (!juego) {
    throw new ErrorNoEncontrado("Videojuego no encontrado");
  }

  const logro = juego.logros.find((item) => {
    const sub = item as { _id?: Types.ObjectId };
    return sub._id?.toString().toLowerCase() === logroId.toLowerCase();
  });
  if (!logro) {
    throw new ErrorNoEncontrado("Logro no encontrado");
  }

  logro.obtenido = cuerpo.obtenido;
  await juego.save();
  return juego;
}
