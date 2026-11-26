import mongoose from "mongoose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorIdInvalido, ErrorNoEncontrado } from "../errores/erroresHttp";

mongoose.set("bufferCommands", false);

interface PartidaDoc {
  _id: { toString(): string };
  fecha: Date;
  duracionMinutos: number;
  porcentajeAvance: number;
}

interface MetaDoc {
  horasSemanales: number;
  diasPorSemana: number;
  hitos: Array<Record<string, unknown>>;
}

const db = vi.hoisted(() => ({
  exists: vi.fn(),
  find: vi.fn(),
  findOne: vi.fn(),
  partidas: [] as PartidaDoc[],
  meta: null as MetaDoc | null,
}));

vi.mock("../modelos/Videojuego", () => ({
  Videojuego: { exists: db.exists },
}));

vi.mock("../modelos/Partida", () => ({
  Partida: { find: db.find },
}));

vi.mock("../modelos/Meta", () => ({
  Meta: { findOne: db.findOne },
}));

import { progresoSemanal } from "./progresoServicio";

const ID = "507f1f77bcf86cd799439011";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-05T15:00:00.000Z"));
  db.partidas = [];
  db.meta = null;
  db.exists.mockReset();
  db.find.mockReset();
  db.findOne.mockReset();
  db.exists.mockResolvedValue({ _id: ID });
  db.find.mockImplementation(() => {
    const pending = Promise.resolve(db.partidas);
    return Object.assign(pending, {
      sort: () => Promise.resolve(db.partidas),
    });
  });
  db.findOne.mockImplementation(async () => db.meta);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("progresoSemanal", () => {
  it("rechaza un id inválido y un videojuego ausente", async () => {
    await expect(progresoSemanal("123")).rejects.toBeInstanceOf(
      ErrorIdInvalido,
    );
    expect(db.exists).not.toHaveBeenCalled();

    db.exists.mockResolvedValue(null);
    await expect(progresoSemanal(ID)).rejects.toBeInstanceOf(ErrorNoEncontrado);
  });

  it("sin meta activa deja la meta y el porcentaje de horas en null", async () => {
    const resultado = await progresoSemanal(ID);

    expect(resultado.semana).toEqual({
      inicio: "2026-11-02",
      fin: "2026-11-08",
    });
    expect(resultado.meta).toBeNull();
    expect(resultado.porcentajeHoras).toBeNull();
    expect(resultado.horasSemana).toBe(0);
    expect(resultado.hitos).toEqual([]);
  });

  it("calcula la semana de Guayaquil y entrega hitos planos", async () => {
    db.partidas = [
      {
        _id: { toString: () => "507f1f77bcf86cd799439012" },
        fecha: new Date("2026-11-04T17:00:00.000Z"),
        duracionMinutos: 60,
        porcentajeAvance: 30,
      },
    ];
    db.meta = {
      horasSemanales: 5,
      diasPorSemana: 3,
      hitos: [
        {
          descripcion: "Primer jefe",
          porcentajeObjetivo: 25,
          $__: { parent: true },
          __parentArray: [],
          _doc: { descripcion: "no debe salir" },
        },
      ],
    };

    const resultado = await progresoSemanal(ID);

    expect(resultado).toMatchObject({
      semana: { inicio: "2026-11-02", fin: "2026-11-08" },
      meta: { horasSemanales: 5, diasPorSemana: 3 },
      horasSemana: 1,
      porcentajeHoras: 20,
      diasJugadosSemana: 1,
      rachaActual: 1,
      mejorRacha: 1,
    });
    expect(resultado.hitos).toEqual([
      {
        descripcion: "Primer jefe",
        porcentajeObjetivo: 25,
        alcanzado: true,
      },
    ]);
  });
});
