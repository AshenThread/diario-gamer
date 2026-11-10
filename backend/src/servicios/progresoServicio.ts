import { Partida } from "../modelos/Partida";
import { Videojuego } from "../modelos/Videojuego";
import { ErrorIdInvalido, ErrorNoEncontrado } from "../errores/erroresHttp";
import {
  diasJugadosSemana,
  evaluarHitos,
  horasSemana,
  mejorRacha,
  porcentajeHoras,
  rachaActual,
  rangoSemanaActual,
} from "../dominio/progreso";
import { metaActivaDe } from "./metaServicio";
import { resumen } from "./partidaServicio";

function esObjectId(id: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

export async function progresoSemanal(videojuegoId: string) {
  if (!esObjectId(videojuegoId)) {
    throw new ErrorIdInvalido(
      "El id del videojuego debe tener 24 caracteres hexadecimales",
    );
  }
  if (!(await Videojuego.exists({ _id: videojuegoId }))) {
    throw new ErrorNoEncontrado("Videojuego no encontrado");
  }

  const [partidas, meta, resumenJuego] = await Promise.all([
    Partida.find({ videojuego: videojuegoId }),
    metaActivaDe(videojuegoId),
    resumen(videojuegoId),
  ]);

  const ahora = new Date();
  const semana = rangoSemanaActual(ahora);
  const entradas = partidas.map((p) => ({
    fecha: p.fecha,
    duracionMinutos: p.duracionMinutos,
  }));
  const horas = horasSemana(entradas, semana);
  const horasMeta = meta ? meta.horasSemanales : null;

  return {
    semana,
    meta: meta
      ? {
          horasSemanales: meta.horasSemanales,
          diasPorSemana: meta.diasPorSemana,
        }
      : null,
    horasSemana: horas,
    porcentajeHoras: porcentajeHoras(horas, horasMeta),
    diasJugadosSemana: diasJugadosSemana(entradas, semana),
    rachaActual: rachaActual(entradas, ahora),
    mejorRacha: mejorRacha(entradas),
    hitos: evaluarHitos(meta?.hitos ?? [], resumenJuego.avanceActual),
  };
}
