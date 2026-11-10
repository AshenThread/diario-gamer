import { Meta, type HitoAtributos } from "../modelos/Meta";
import { Videojuego } from "../modelos/Videojuego";
import {
  ErrorConflicto,
  ErrorIdInvalido,
  ErrorNoEncontrado,
  ErrorValidacion,
} from "../errores/erroresHttp";

function esObjectId(id: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

function exigirId(id: string, campo: string): void {
  if (!esObjectId(id)) {
    throw new ErrorIdInvalido(
      `El id de ${campo} debe tener 24 caracteres hexadecimales`,
    );
  }
}

function cuerpoObjeto(body: unknown): Record<string, unknown> {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new ErrorValidacion("El cuerpo debe ser un objeto");
  }
  return body as Record<string, unknown>;
}

function exigirHoras(valor: unknown): number {
  if (
    typeof valor !== "number" ||
    !Number.isFinite(valor) ||
    valor <= 0 ||
    valor > 100
  ) {
    throw new ErrorValidacion(
      "horasSemanales debe ser un número mayor que 0 y como máximo 100",
    );
  }
  return valor;
}

function exigirDias(valor: unknown): number {
  if (
    typeof valor !== "number" ||
    !Number.isInteger(valor) ||
    valor < 1 ||
    valor > 7
  ) {
    throw new ErrorValidacion("diasPorSemana debe ser un entero entre 1 y 7");
  }
  return valor;
}

function exigirHitos(valor: unknown): HitoAtributos[] {
  if (valor === undefined) {
    return [];
  }
  if (!Array.isArray(valor)) {
    throw new ErrorValidacion("hitos debe ser un arreglo");
  }
  if (valor.length > 5) {
    throw new ErrorValidacion("Una meta admite como máximo 5 hitos");
  }
  return valor.map((item, i) => {
    if (item === null || typeof item !== "object" || Array.isArray(item)) {
      throw new ErrorValidacion(`hitos[${i}] debe ser un objeto`);
    }
    const h = item as Record<string, unknown>;
    if (typeof h.descripcion !== "string" || h.descripcion.trim() === "") {
      throw new ErrorValidacion(`hitos[${i}].descripcion es obligatoria`);
    }
    if (
      typeof h.porcentajeObjetivo !== "number" ||
      !Number.isFinite(h.porcentajeObjetivo) ||
      h.porcentajeObjetivo < 1 ||
      h.porcentajeObjetivo > 100
    ) {
      throw new ErrorValidacion(
        `hitos[${i}].porcentajeObjetivo debe estar entre 1 y 100`,
      );
    }
    return {
      descripcion: h.descripcion.trim(),
      porcentajeObjetivo: h.porcentajeObjetivo,
    };
  });
}

export async function crear(body: unknown) {
  const cuerpo = cuerpoObjeto(body);
  if (typeof cuerpo.videojuego !== "string") {
    throw new ErrorValidacion("El videojuego es obligatorio");
  }
  exigirId(cuerpo.videojuego, "videojuego");
  if (!(await Videojuego.exists({ _id: cuerpo.videojuego }))) {
    throw new ErrorNoEncontrado("Videojuego no encontrado");
  }
  const activa = Object.hasOwn(cuerpo, "activa")
    ? Boolean(cuerpo.activa)
    : true;
  if (activa) {
    const existente = await Meta.findOne({
      videojuego: cuerpo.videojuego,
      activa: true,
    });
    if (existente) {
      throw new ErrorConflicto(
        "Este videojuego ya tiene una meta activa. Desactívala o actualízala antes de crear otra.",
      );
    }
  }
  const meta = new Meta({
    videojuego: cuerpo.videojuego,
    horasSemanales: exigirHoras(cuerpo.horasSemanales),
    diasPorSemana: exigirDias(cuerpo.diasPorSemana),
    activa,
    hitos: exigirHitos(cuerpo.hitos),
  });
  await meta.save();
  return meta;
}

export async function obtenerPorId(id: string) {
  exigirId(id, "meta");
  const meta = await Meta.findById(id);
  if (!meta) {
    throw new ErrorNoEncontrado("Meta no encontrada");
  }
  return meta;
}

export async function listarPorVideojuego(videojuegoId: string) {
  exigirId(videojuegoId, "videojuego");
  if (!(await Videojuego.exists({ _id: videojuegoId }))) {
    throw new ErrorNoEncontrado("Videojuego no encontrado");
  }
  return Meta.find({ videojuego: videojuegoId }).sort({ createdAt: -1 });
}

export async function actualizar(id: string, body: unknown) {
  exigirId(id, "meta");
  const cuerpo = cuerpoObjeto(body);
  const meta = await Meta.findById(id);
  if (!meta) {
    throw new ErrorNoEncontrado("Meta no encontrada");
  }
  if (Object.hasOwn(cuerpo, "horasSemanales")) {
    meta.horasSemanales = exigirHoras(cuerpo.horasSemanales);
  }
  if (Object.hasOwn(cuerpo, "diasPorSemana")) {
    meta.diasPorSemana = exigirDias(cuerpo.diasPorSemana);
  }
  if (Object.hasOwn(cuerpo, "hitos")) {
    meta.hitos = exigirHitos(cuerpo.hitos);
  }
  if (Object.hasOwn(cuerpo, "activa")) {
    const activa = Boolean(cuerpo.activa);
    if (activa && !meta.activa) {
      const otra = await Meta.findOne({
        videojuego: meta.videojuego,
        activa: true,
        _id: { $ne: meta._id },
      });
      if (otra) {
        throw new ErrorConflicto(
          "Este videojuego ya tiene una meta activa. Desactívala antes de reactivar esta.",
        );
      }
    }
    meta.activa = activa;
  }
  await meta.save();
  return meta;
}

export async function desactivar(id: string) {
  return actualizar(id, { activa: false });
}

export async function metaActivaDe(videojuegoId: string) {
  exigirId(videojuegoId, "videojuego");
  return Meta.findOne({ videojuego: videojuegoId, activa: true });
}
