export const ZONA_ECUADOR = "America/Guayaquil";

export interface PartidaProgreso {
  fecha: Date;
  duracionMinutos: number;
}

export interface HitoMeta {
  descripcion: string;
  porcentajeObjetivo: number;
}

export interface SemanaRango {
  inicio: string;
  fin: string;
}

/** YYYY-MM-DD en la zona dada. */
export function diaEnZona(fecha: Date, zona: string = ZONA_ECUADOR): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: zona,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(fecha);
}

function parseDia(dia: string): { y: number; m: number; d: number } {
  const [y, m, d] = dia.split("-").map(Number);
  return { y, m, d };
}

function sumarDias(dia: string, delta: number): string {
  const { y, m, d } = parseDia(dia);
  const utc = Date.UTC(y, m - 1, d + delta);
  const dt = new Date(utc);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/** Lunes = 0 … Domingo = 6 en calendario ISO a partir de YYYY-MM-DD. */
function diaSemanaLunes0(dia: string): number {
  const { y, m, d } = parseDia(dia);
  const js = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=dom
  return js === 0 ? 6 : js - 1;
}

export function rangoSemanaActual(
  ahora: Date = new Date(),
  zona: string = ZONA_ECUADOR,
): SemanaRango {
  const hoy = diaEnZona(ahora, zona);
  const offset = diaSemanaLunes0(hoy);
  const inicio = sumarDias(hoy, -offset);
  const fin = sumarDias(inicio, 6);
  return { inicio, fin };
}

export function horasSemana(
  partidas: PartidaProgreso[],
  semana: SemanaRango,
  zona: string = ZONA_ECUADOR,
): number {
  const minutos = partidas
    .filter((p) => {
      const dia = diaEnZona(p.fecha, zona);
      return dia >= semana.inicio && dia <= semana.fin;
    })
    .reduce((acc, p) => acc + p.duracionMinutos, 0);
  return Math.round((minutos / 60) * 10) / 10;
}

/** Sin tope en 100: puede superar la meta. Sin meta → null. */
export function porcentajeHoras(
  horas: number,
  horasSemanales: number | null,
): number | null {
  if (horasSemanales === null || horasSemanales <= 0) {
    return null;
  }
  return Math.round((horas / horasSemanales) * 100);
}

export function diasJugadosSemana(
  partidas: PartidaProgreso[],
  semana: SemanaRango,
  zona: string = ZONA_ECUADOR,
): number {
  const dias = new Set<string>();
  for (const p of partidas) {
    const dia = diaEnZona(p.fecha, zona);
    if (dia >= semana.inicio && dia <= semana.fin) {
      dias.add(dia);
    }
  }
  return dias.size;
}

function diasUnicosOrdenados(
  partidas: PartidaProgreso[],
  zona: string,
): string[] {
  const set = new Set(partidas.map((p) => diaEnZona(p.fecha, zona)));
  return [...set].sort();
}

function longitudRachaHasta(diasAsc: string[], fin: string): number {
  if (!diasAsc.includes(fin)) {
    return 0;
  }
  let racha = 1;
  let esperado = sumarDias(fin, -1);
  for (let i = diasAsc.indexOf(fin) - 1; i >= 0; i--) {
    if (diasAsc[i] === esperado) {
      racha += 1;
      esperado = sumarDias(esperado, -1);
    } else if (diasAsc[i]! < esperado) {
      break;
    }
  }
  return racha;
}

/**
 * Racha actual: viva si el último día jugado es hoy o ayer.
 * Varias partidas el mismo día = un día.
 */
export function rachaActual(
  partidas: PartidaProgreso[],
  ahora: Date = new Date(),
  zona: string = ZONA_ECUADOR,
): number {
  if (partidas.length === 0) {
    return 0;
  }
  const dias = diasUnicosOrdenados(partidas, zona);
  const ultimo = dias[dias.length - 1]!;
  const hoy = diaEnZona(ahora, zona);
  const ayer = sumarDias(hoy, -1);
  if (ultimo !== hoy && ultimo !== ayer) {
    return 0;
  }
  return longitudRachaHasta(dias, ultimo);
}

export function mejorRacha(
  partidas: PartidaProgreso[],
  zona: string = ZONA_ECUADOR,
): number {
  const dias = diasUnicosOrdenados(partidas, zona);
  if (dias.length === 0) {
    return 0;
  }
  let mejor = 1;
  let actual = 1;
  for (let i = 1; i < dias.length; i++) {
    if (dias[i] === sumarDias(dias[i - 1]!, 1)) {
      actual += 1;
      mejor = Math.max(mejor, actual);
    } else {
      actual = 1;
    }
  }
  return mejor;
}

export function evaluarHitos(
  hitos: HitoMeta[],
  porcentajeAvanceActual: number | null,
): Array<HitoMeta & { alcanzado: boolean }> {
  const avance = porcentajeAvanceActual ?? 0;
  return hitos.map((h) => ({
    ...h,
    alcanzado: avance >= h.porcentajeObjetivo,
  }));
}
