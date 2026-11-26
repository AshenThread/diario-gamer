import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ErrorConflicto,
  ErrorIdInvalido,
  ErrorNoEncontrado,
} from "../errores/erroresHttp";

mongoose.set("bufferCommands", false);

const db = vi.hoisted(() => ({
  exists: vi.fn(),
  findOne: vi.fn(),
  findById: vi.fn(),
  find: vi.fn(),
  save: vi.fn(),
}));

vi.mock("../modelos/Videojuego", () => ({
  Videojuego: { exists: db.exists },
}));

vi.mock("../modelos/Meta", () => {
  class Meta {
    static findOne = db.findOne;
    static findById = db.findById;
    static find = db.find;
    save = db.save;
    _id = "507f1f77bcf86cd799439013";
    videojuego = "";
    horasSemanales = 0;
    diasPorSemana = 0;
    activa = true;
    hitos: unknown[] = [];

    constructor(datos?: object) {
      Object.assign(this, datos ?? {});
    }
  }

  return { Meta };
});

import {
  actualizar,
  crear,
  desactivar,
  listarPorVideojuego,
  obtenerPorId,
} from "./metaServicio";

const ID = "507f1f77bcf86cd799439011";
const META = "507f1f77bcf86cd799439013";

function cuerpo(extra: Record<string, unknown> = {}) {
  return {
    videojuego: ID,
    horasSemanales: 5,
    diasPorSemana: 4,
    hitos: [{ descripcion: "  Primer jefe  ", porcentajeObjetivo: 50 }],
    ...extra,
  };
}

beforeEach(() => {
  db.exists.mockReset();
  db.findOne.mockReset();
  db.findById.mockReset();
  db.find.mockReset();
  db.save.mockReset();
  db.save.mockResolvedValue(undefined);
  db.exists.mockResolvedValue({ _id: ID });
  db.findOne.mockResolvedValue(null);
});

describe("crear", () => {
  it("exige videojuego, horas, días y como máximo 5 hitos", async () => {
    await expect(crear({ horasSemanales: 5 })).rejects.toThrow(/videojuego/);
    await expect(crear(cuerpo({ videojuego: "x" }))).rejects.toBeInstanceOf(
      ErrorIdInvalido,
    );

    db.exists.mockResolvedValue(null);
    await expect(crear(cuerpo())).rejects.toBeInstanceOf(ErrorNoEncontrado);

    db.exists.mockResolvedValue({ _id: ID });
    await expect(crear(cuerpo({ horasSemanales: 0 }))).rejects.toThrow(
      /horasSemanales/,
    );
    await expect(crear(cuerpo({ diasPorSemana: 8 }))).rejects.toThrow(
      /diasPorSemana/,
    );
    await expect(
      crear(
        cuerpo({
          hitos: Array.from({ length: 6 }, (_, i) => ({
            descripcion: `h${i}`,
            porcentajeObjetivo: 10,
          })),
        }),
      ),
    ).rejects.toThrow(/5 hitos/);
    expect(db.save).not.toHaveBeenCalled();
  });

  it("rechaza una segunda meta activa y no guarda", async () => {
    db.findOne.mockResolvedValue({ _id: META });

    await expect(crear(cuerpo())).rejects.toBeInstanceOf(ErrorConflicto);
    expect(db.save).not.toHaveBeenCalled();
  });

  it("guarda una meta inactiva aunque ya exista otra activa", async () => {
    db.findOne.mockResolvedValue({ _id: META });

    const meta = await crear(cuerpo({ activa: false }));

    expect(db.findOne).not.toHaveBeenCalled();
    expect(db.save).toHaveBeenCalledOnce();
    expect(meta).toMatchObject({
      videojuego: ID,
      horasSemanales: 5,
      diasPorSemana: 4,
      activa: false,
      hitos: [{ descripcion: "Primer jefe", porcentajeObjetivo: 50 }],
    });
  });
});

describe("leer, listar y desactivar", () => {
  it("no encuentra una meta ausente", async () => {
    db.findById.mockResolvedValue(null);
    await expect(obtenerPorId(META)).rejects.toBeInstanceOf(ErrorNoEncontrado);
  });

  it("lista las metas del videojuego", async () => {
    const sort = vi.fn().mockResolvedValue([{ horasSemanales: 5 }]);
    db.find.mockReturnValue({ sort });

    await expect(listarPorVideojuego(ID)).resolves.toEqual([
      { horasSemanales: 5 },
    ]);
    expect(db.find).toHaveBeenCalledWith({ videojuego: ID });
    expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  it("desactiva sin buscar otra meta activa", async () => {
    const meta = {
      _id: META,
      videojuego: ID,
      activa: true,
      horasSemanales: 5,
      diasPorSemana: 3,
      hitos: [],
      save: db.save,
    };
    db.findById.mockResolvedValue(meta);

    const resultado = await desactivar(META);

    expect(resultado).toBe(meta);
    expect(meta.activa).toBe(false);
    expect(db.findOne).not.toHaveBeenCalled();
    expect(db.save).toHaveBeenCalledOnce();
  });

  it("impide reactivar si ya hay otra meta activa", async () => {
    const meta = {
      _id: META,
      videojuego: ID,
      activa: false,
      horasSemanales: 5,
      diasPorSemana: 3,
      hitos: [],
      save: db.save,
    };
    db.findById.mockResolvedValue(meta);
    db.findOne.mockResolvedValue({ _id: "507f1f77bcf86cd799439014" });

    await expect(actualizar(META, { activa: true })).rejects.toBeInstanceOf(
      ErrorConflicto,
    );
    expect(meta.activa).toBe(false);
    expect(db.save).not.toHaveBeenCalled();
  });
});
