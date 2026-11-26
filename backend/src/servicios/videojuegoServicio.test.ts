import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ErrorIdInvalido,
  ErrorNoEncontrado,
  ErrorValidacion,
} from "../errores/erroresHttp";

mongoose.set("bufferCommands", false);

const db = vi.hoisted(() => ({
  find: vi.fn(),
  findById: vi.fn(),
  findByIdAndDelete: vi.fn(),
  exists: vi.fn(),
  save: vi.fn(),
  set: vi.fn(),
  partidaDeleteMany: vi.fn(),
  metaDeleteMany: vi.fn(),
}));

vi.mock("../modelos/Videojuego", async () => {
  const actual = await vi.importActual<typeof import("../modelos/Videojuego")>(
    "../modelos/Videojuego",
  );

  class Videojuego {
    static find = db.find;
    static findById = db.findById;
    static findByIdAndDelete = db.findByIdAndDelete;
    static exists = db.exists;
    save = db.save;
    set = db.set;
    logros: Array<{ _id?: { toString(): string }; obtenido: boolean }> = [];

    constructor(datos?: object) {
      Object.assign(this, datos ?? {});
    }
  }

  return { ...actual, Videojuego };
});

vi.mock("../modelos/Partida", () => ({
  Partida: { deleteMany: db.partidaDeleteMany },
}));

vi.mock("../modelos/Meta", () => ({
  Meta: { deleteMany: db.metaDeleteMany },
}));

import {
  actualizar,
  actualizarLogro,
  crear,
  eliminar,
  listar,
  obtenerPorId,
} from "./videojuegoServicio";

const ID = "507f1f77bcf86cd799439011";
const LOGRO = "507f1f77bcf86cd799439012";

const juegoValido = {
  nombre: "Hades",
  genero: "Roguelike",
  plataforma: "PC",
  estado: "jugando",
};

beforeEach(() => {
  db.find.mockReset();
  db.findById.mockReset();
  db.findByIdAndDelete.mockReset();
  db.exists.mockReset();
  db.save.mockReset();
  db.set.mockReset();
  db.partidaDeleteMany.mockReset();
  db.metaDeleteMany.mockReset();
  db.save.mockResolvedValue(undefined);
  db.partidaDeleteMany.mockResolvedValue({ deletedCount: 1 });
  db.metaDeleteMany.mockResolvedValue({ deletedCount: 1 });
});

describe("listar", () => {
  it("rechaza un filtro que no está en el enum y no consulta", async () => {
    await expect(listar({ estado: "roto" })).rejects.toBeInstanceOf(
      ErrorValidacion,
    );
    await expect(listar({ estado: ["jugando"] })).rejects.toThrow(
      /un solo valor/,
    );
    expect(db.find).not.toHaveBeenCalled();
  });

  it("arma la consulta solo con filtros válidos", async () => {
    db.find.mockResolvedValue([{ nombre: "Hades" }]);

    await expect(listar({})).resolves.toEqual([{ nombre: "Hades" }]);
    expect(db.find).toHaveBeenCalledWith({});

    await listar({ estado: "jugando", plataforma: "PC" });
    expect(db.find).toHaveBeenCalledWith({
      estado: "jugando",
      plataforma: "PC",
    });
  });
});

describe("crear", () => {
  it("valida el cuerpo antes de construir el documento", async () => {
    await expect(crear([])).rejects.toThrow(/objeto/);
    await expect(crear({ ...juegoValido, nombre: "  " })).rejects.toThrow(
      /nombre/,
    );
    await expect(crear({ ...juegoValido, genero: "MOBA" })).rejects.toThrow(
      /género/,
    );
    await expect(
      crear({ ...juegoValido, logros: [{ nombre: "" }] }),
    ).rejects.toThrow(/logro/);
    expect(db.save).not.toHaveBeenCalled();
  });

  it("guarda un videojuego válido y recorta la descripción", async () => {
    const juego = await crear({
      ...juegoValido,
      descripcion: "  escape del inframundo  ",
      logros: [{ nombre: "Primera escapada", obtenido: false }],
    });

    expect(db.save).toHaveBeenCalledOnce();
    expect(juego).toMatchObject({
      nombre: "Hades",
      genero: "Roguelike",
      plataforma: "PC",
      estado: "jugando",
      descripcion: "escape del inframundo",
    });
  });
});

describe("obtener, actualizar y eliminar", () => {
  it("exige 24 hex y no acepta un id de 12 caracteres", async () => {
    await expect(obtenerPorId("123456789012")).rejects.toBeInstanceOf(
      ErrorIdInvalido,
    );
    await expect(eliminar("no-es-un-id")).rejects.toBeInstanceOf(
      ErrorIdInvalido,
    );
    expect(db.findById).not.toHaveBeenCalled();
    expect(db.findByIdAndDelete).not.toHaveBeenCalled();
  });

  it("responde no encontrado cuando el documento no está", async () => {
    db.findById.mockResolvedValue(null);
    db.findByIdAndDelete.mockResolvedValue(null);

    await expect(obtenerPorId(ID)).rejects.toBeInstanceOf(ErrorNoEncontrado);
    await expect(
      actualizar(ID, { estado: "completado" }),
    ).rejects.toBeInstanceOf(ErrorNoEncontrado);
    await expect(eliminar(ID)).rejects.toBeInstanceOf(ErrorNoEncontrado);
    expect(db.partidaDeleteMany).not.toHaveBeenCalled();
  });

  it("exige al menos un campo actualizable", async () => {
    await expect(actualizar(ID, { foo: 1 })).rejects.toBeInstanceOf(
      ErrorValidacion,
    );
    expect(db.findById).not.toHaveBeenCalled();
  });

  it("actualiza el estado y, al borrar, limpia partidas y metas", async () => {
    const juego = {
      ...juegoValido,
      descripcion: "",
      save: db.save,
      set: db.set,
    };
    db.findById.mockResolvedValue(juego);
    db.findByIdAndDelete.mockResolvedValue({ _id: ID });

    const actualizado = await actualizar(ID, { estado: "completado" });
    expect(juego.estado).toBe("completado");
    expect(actualizado).toBe(juego);

    await eliminar(ID);
    expect(db.partidaDeleteMany).toHaveBeenCalledWith({ videojuego: ID });
    expect(db.metaDeleteMany).toHaveBeenCalledWith({ videojuego: ID });
  });
});

describe("actualizarLogro", () => {
  it("rechaza un obtenido que no es booleano", async () => {
    await expect(
      actualizarLogro(ID, LOGRO, { obtenido: "sí" }),
    ).rejects.toBeInstanceOf(ErrorValidacion);
    expect(db.findById).not.toHaveBeenCalled();
  });

  it("marca el logro aunque el id llegue en mayúsculas", async () => {
    const logro = { _id: { toString: () => LOGRO }, obtenido: false };
    const juego = { logros: [logro], save: db.save };
    db.findById.mockResolvedValue(juego);

    await actualizarLogro(ID, LOGRO.toUpperCase(), { obtenido: true });

    expect(logro.obtenido).toBe(true);
    expect(db.save).toHaveBeenCalledOnce();
  });

  it("avisa si el videojuego o el logro no existen", async () => {
    db.findById.mockResolvedValueOnce(null);
    await expect(
      actualizarLogro(ID, LOGRO, { obtenido: true }),
    ).rejects.toThrow(/Videojuego no encontrado/);

    db.findById.mockResolvedValueOnce({ logros: [], save: db.save });
    await expect(
      actualizarLogro(ID, LOGRO, { obtenido: false }),
    ).rejects.toThrow(/Logro no encontrado/);
    expect(db.save).not.toHaveBeenCalled();
  });
});
