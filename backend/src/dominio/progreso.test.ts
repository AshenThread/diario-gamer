import { describe, expect, it } from "vitest";
import {
  diaEnZona,
  diasJugadosSemana,
  evaluarHitos,
  horasSemana,
  mejorRacha,
  porcentajeHoras,
  rachaActual,
  rangoSemanaActual,
  type PartidaProgreso,
} from "./progreso";

/** Fecha UTC que cae en el día local Guayaquil indicado (mediodía local ≈ 17:00 UTC). */
function partidaEnDia(dia: string, minutos = 60): PartidaProgreso {
  return {
    fecha: new Date(`${dia}T17:00:00.000Z`),
    duracionMinutos: minutos,
  };
}

describe("rangoSemanaActual", () => {
  it("devuelve lunes a domingo en America/Guayaquil", () => {
    // Miércoles 5 nov 2026 15:00 UTC = mismo día en Guayaquil (UTC-5)
    const ahora = new Date("2026-11-05T15:00:00.000Z");
    const semana = rangoSemanaActual(ahora);
    expect(semana).toEqual({ inicio: "2026-11-02", fin: "2026-11-08" });
  });
});

describe("horasSemana", () => {
  it("suma duraciones de la semana y redondea a un decimal", () => {
    const semana = { inicio: "2026-11-02", fin: "2026-11-08" };
    const partidas = [
      partidaEnDia("2026-11-03", 90),
      partidaEnDia("2026-11-04", 60),
      partidaEnDia("2026-10-30", 120), // fuera
    ];
    expect(horasSemana(partidas, semana)).toBe(2.5);
  });
});

describe("porcentajeHoras", () => {
  it("puede superar 100 cuando se supera la meta", () => {
    expect(porcentajeHoras(7, 5)).toBe(140);
  });

  it("devuelve null sin meta", () => {
    expect(porcentajeHoras(3, null)).toBeNull();
  });

  it("redondea a entero", () => {
    expect(porcentajeHoras(3.5, 5)).toBe(70);
  });
});

describe("diasJugadosSemana", () => {
  it("cuenta días distintos; varias partidas el mismo día = uno", () => {
    const semana = { inicio: "2026-11-02", fin: "2026-11-08" };
    const partidas = [
      partidaEnDia("2026-11-03", 30),
      partidaEnDia("2026-11-03", 45),
      partidaEnDia("2026-11-05", 60),
    ];
    expect(diasJugadosSemana(partidas, semana)).toBe(2);
  });
});

describe("rachaActual", () => {
  it("sigue viva si ayer hubo partida y hoy no", () => {
    const ahora = new Date("2026-11-05T15:00:00.000Z"); // jueves
    const hoy = diaEnZona(ahora);
    expect(hoy).toBe("2026-11-05");
    const partidas = [partidaEnDia("2026-11-03"), partidaEnDia("2026-11-04")];
    expect(rachaActual(partidas, ahora)).toBe(2);
  });

  it("se rompe si el último día es anterior a ayer", () => {
    const ahora = new Date("2026-11-05T15:00:00.000Z");
    const partidas = [partidaEnDia("2026-11-02"), partidaEnDia("2026-11-03")];
    expect(rachaActual(partidas, ahora)).toBe(0);
  });

  it("cuenta desde hoy cuando hay partida hoy", () => {
    const ahora = new Date("2026-11-05T15:00:00.000Z");
    const partidas = [
      partidaEnDia("2026-11-03"),
      partidaEnDia("2026-11-04"),
      partidaEnDia("2026-11-05"),
    ];
    expect(rachaActual(partidas, ahora)).toBe(3);
  });

  it("sin partidas es 0", () => {
    expect(rachaActual([], new Date("2026-11-05T15:00:00.000Z"))).toBe(0);
  });
});

describe("mejorRacha", () => {
  it("devuelve la mayor secuencia de días consecutivos", () => {
    const partidas = [
      partidaEnDia("2026-11-01"),
      partidaEnDia("2026-11-02"),
      partidaEnDia("2026-11-03"),
      partidaEnDia("2026-11-05"),
      partidaEnDia("2026-11-06"),
    ];
    expect(mejorRacha(partidas)).toBe(3);
  });
});

describe("evaluarHitos", () => {
  const hitos = [
    { descripcion: "25%", porcentajeObjetivo: 25 },
    { descripcion: "50%", porcentajeObjetivo: 50 },
    { descripcion: "100%", porcentajeObjetivo: 100 },
  ];

  it("marca alcanzados según avance actual", () => {
    const res = evaluarHitos(hitos, 50);
    expect(res.map((h) => h.alcanzado)).toEqual([true, true, false]);
  });

  it("deja de estar alcanzado si el avance baja", () => {
    expect(evaluarHitos(hitos, 40).map((h) => h.alcanzado)).toEqual([
      true,
      false,
      false,
    ]);
  });

  it("sin avance trata como 0", () => {
    expect(evaluarHitos(hitos, null).every((h) => !h.alcanzado)).toBe(true);
  });
});

describe("diaEnZona / cruce de medianoche", () => {
  it("asigna el día según la fecha registrada (inicio)", () => {
    // 2026-11-04 04:00 UTC = 2026-11-03 23:00 Guayaquil
    const fecha = new Date("2026-11-04T04:00:00.000Z");
    expect(diaEnZona(fecha)).toBe("2026-11-03");
  });
});
