import { Partida } from "../modelos/Partida";
import { Videojuego } from "../modelos/Videojuego";
import { ErrorIdInvalido, ErrorNoEncontrado, ErrorValidacion } from "../errores/erroresHttp";

function esObjectId(id: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

function exigirId(id: string, campo: string): void {
  if (!esObjectId(id)) {
    throw new ErrorIdInvalido(`El id de ${campo} debe tener 24 caracteres hexadecimales`);
  }
}

function cuerpoObjeto(body: unknown): Record<string, unknown> {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new ErrorValidacion("El cuerpo debe ser un objeto");
  }
  return body as Record<string, unknown>;
}

function numero(valor: unknown, campo: string, minimo: number, maximo: number): number {
  if (typeof valor !== "number" || !Number.isFinite(valor) || valor < minimo || valor > maximo) {
    throw new ErrorValidacion(`${campo} debe ser un número entre ${minimo} y ${maximo}`);
  }
  return valor;
}

function fecha(valor: unknown): Date {
  const resultado = new Date(typeof valor === "string" || valor instanceof Date ? valor : "");
  if (Number.isNaN(resultado.getTime())) {
    throw new ErrorValidacion("La fecha debe ser válida");
  }
  return resultado;
}

async function datosPartida(body: unknown) {
  const cuerpo = cuerpoObjeto(body);
  const videojuego = cuerpo.videojuego;
  if (typeof videojuego !== "string") {
    throw new ErrorValidacion("El videojuego es obligatorio");
  }
  exigirId(videojuego, "videojuego");
  if (!(await Videojuego.exists({ _id: videojuego }))) {
    throw new ErrorNoEncontrado("Videojuego no encontrado");
  }
  return {
    videojuego,
    fecha: fecha(cuerpo.fecha),
    duracionMinutos: numero(cuerpo.duracionMinutos, "duracionMinutos", 1, 1440),
    porcentajeAvance: numero(cuerpo.porcentajeAvance, "porcentajeAvance", 0, 100),
  };
}

export async function listar() {
  return Partida.find().populate("videojuego").sort({ fecha: -1 });
}

export async function listarPorVideojuego(videojuegoId: string) {
  exigirId(videojuegoId, "videojuego");
  if (!(await Videojuego.exists({ _id: videojuegoId }))) {
    throw new ErrorNoEncontrado("Videojuego no encontrado");
  }
  return Partida.find({ videojuego: videojuegoId }).sort({ fecha: -1 });
}

export async function crear(body: unknown) {
  const datos = await datosPartida(body);
  const partida = new Partida(datos);
  await partida.save();
  return partida.populate("videojuego");
}

export async function eliminar(id: string) {
  exigirId(id, "partida");
  const partida = await Partida.findByIdAndDelete(id);
  if (!partida) {
    throw new ErrorNoEncontrado("Partida no encontrada");
  }
}

export async function resumen(videojuegoId: string) {
  const partidas = await listarPorVideojuego(videojuegoId);
  const minutos = partidas.reduce((total, partida) => total + partida.duracionMinutos, 0);
  const ultima = partidas.reduce<typeof partidas[number] | null>(
    (actual, partida) => (!actual || partida.fecha > actual.fecha || (partida.fecha.getTime() === actual.fecha.getTime() && partida._id.toString() > actual._id.toString()) ? partida : actual),
    null
  );
  return {
    horasTotales: Math.round((minutos / 60) * 100) / 100,
    cantidadPartidas: partidas.length,
    fechaUltimaSesion: ultima?.fecha ?? null,
    avanceActual: ultima?.porcentajeAvance ?? null,
  };
}
