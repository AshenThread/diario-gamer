import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ErrorIdInvalido,
  ErrorNoEncontrado,
  ErrorValidacion,
} from "../errores/erroresHttp";

mongoose.set("bufferCommands", false);

const db = vi.hoisted(() => ({
  exists: vi.fn(),
  find: vi.fn(),
  findByIdAndDelete: vi.fn(),
  save: vi.fn(),
}));

vi.mock("../modelos/Videojuego", () => ({
  Videojuego: { exists: db.exists },
}));

vi.mock("../modelos/Partida", () => {
  class Partida {
    static find = db.find;
    static findByIdAndDelete = db.findByIdAndDelete;
    save = db.save;

    constructor(datos?: object) {
      Object.assign(this, datos ?? {});
    }

    populate() {
      return Promise.resolve(this);
    }
  }

  return { Partida };
});

import { crear, eliminar, listar, resumen } from "./partidaServicio";

const ID = "507f1f77bcf86cd799439011";
const ID_MENOR = "000000000000000000000001";
const ID_MAYOR = "000000000000000000000002";

function cuerpo(extra: Record<string, unknown> = {}) {
  return {
    videojuego: ID,
    fecha: "2026-11-01T17:00:00.000Z",
    duracionMinutos: 90,
    porcentajeAvance: 40,
    ...extra,
  };
}

beforeEach(() => {
  db.exists.mockReset();
  db.find.mockReset();
  db.findByIdAndDelete.mockReset();
  db.save.mockReset();
  db.save.mockResolvedValue(undefined);
});

describe("crear", () => {
  it("valida forma, id y rangos antes de guardar", async () => {
    await expect(crear(null)).rejects.toBeInstanceOf(ErrorValidacion);
    await expect(crear(cuerpo({ videojuego: "corto" }))).rejects.toBeInstanceOf(
      ErrorIdInvalido,
    );
    expect(db.exists).not.toHaveBeenCalled();

    db.exists.mockResolvedValue(null);
    await expect(crear(cuerpo())).rejects.toBeInstanceOf(ErrorNoEncontrado);

    db.exists.mockResolvedValue({ _id: ID });
    await expect(crear(cuerpo({ duracionMinutos: 0 }))).rejects.toThrow(
      /duracionMinutos/,
    );
    await expect(crear(cuerpo({ porcentajeAvance: 101 }))).rejects.toThrow(
      /porcentajeAvance/,
    );
    await expect(crear(cuerpo({ fecha: "ayer" }))).rejects.toThrow(/fecha/);
    expect(db.save).not.toHaveBeenCalled();
  });

  it("guarda la sesión cuando el videojuego existe", async () => {
    db.exists.mockResolvedValue({ _id: ID });

    const partida = await crear(cuerpo());

    expect(db.save).toHaveBeenCalledOnce();
    expect(partida).toMatchObject({
      videojuego: ID,
      duracionMinutos: 90,
      porcentajeAvance: 40,
    });
  });
});

describe("listar y eliminar", () => {
  it("pide el populate del videojuego ordenado por fecha", async () => {
    const sort = vi.fn().mockResolvedValue([]);
    const populate = vi.fn().mockReturnValue({ sort });
    db.find.mockReturnValue({ populate });

    await expect(listar()).resolves.toEqual([]);
    expect(populate).toHaveBeenCalledWith("videojuego");
    expect(sort).toHaveBeenCalledWith({ fecha: -1 });
  });

  it("avisa si la partida no existe", async () => {
    db.findByIdAndDelete.mockResolvedValue(null);
    await expect(eliminar(ID)).rejects.toBeInstanceOf(ErrorNoEncontrado);
  });
});

describe("resumen", () => {
  it("devuelve ceros cuando el juego no tiene partidas", async () => {
    db.exists.mockResolvedValue({ _id: ID });
    db.find.mockReturnValue({ sort: () => Promise.resolve([]) });

    await expect(resumen(ID)).resolves.toEqual({
      horasTotales: 0,
      cantidadPartidas: 0,
      fechaUltimaSesion: null,
      avanceActual: null,
    });
  });

  it("redondea las horas y, si la fecha empata, se queda con el _id mayor", async () => {
    const fecha = new Date("2026-11-01T17:00:00.000Z");
    db.exists.mockResolvedValue({ _id: ID });
    db.find.mockReturnValue({
      sort: () =>
        Promise.resolve([
          {
            _id: { toString: () => ID_MENOR },
            fecha,
            duracionMinutos: 30,
            porcentajeAvance: 10,
          },
          {
            _id: { toString: () => ID_MAYOR },
            fecha,
            duracionMinutos: 70,
            porcentajeAvance: 55,
          },
        ]),
    });

    await expect(resumen(ID)).resolves.toEqual({
      horasTotales: 1.67,
      cantidadPartidas: 2,
      fechaUltimaSesion: fecha,
      avanceActual: 55,
    });
  });

  it("usa la partida más reciente aunque su _id sea menor", async () => {
    db.exists.mockResolvedValue({ _id: ID });
    db.find.mockReturnValue({
      sort: () =>
        Promise.resolve([
          {
            _id: { toString: () => ID_MAYOR },
            fecha: new Date("2026-11-01T17:00:00.000Z"),
            duracionMinutos: 60,
            porcentajeAvance: 10,
          },
          {
            _id: { toString: () => ID_MENOR },
            fecha: new Date("2026-11-03T17:00:00.000Z"),
            duracionMinutos: 60,
            porcentajeAvance: 80,
          },
        ]),
    });

    const resultado = await resumen(ID);
    expect(resultado.avanceActual).toBe(80);
    expect(resultado.fechaUltimaSesion).toEqual(
      new Date("2026-11-03T17:00:00.000Z"),
    );
  });
});
