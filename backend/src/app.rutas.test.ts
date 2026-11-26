import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { crearApp } from "./app";
import {
  ErrorConflicto,
  ErrorIdInvalido,
  ErrorNoEncontrado,
  ErrorValidacion,
} from "./errores/erroresHttp";
import * as metaServicio from "./servicios/metaServicio";
import * as partidaServicio from "./servicios/partidaServicio";
import * as progresoServicio from "./servicios/progresoServicio";
import * as videojuegoServicio from "./servicios/videojuegoServicio";

vi.mock("./servicios/videojuegoServicio", () => ({
  listar: vi.fn(),
  obtenerPorId: vi.fn(),
  crear: vi.fn(),
  actualizar: vi.fn(),
  eliminar: vi.fn(),
  actualizarLogro: vi.fn(),
}));

vi.mock("./servicios/partidaServicio", () => ({
  listar: vi.fn(),
  listarPorVideojuego: vi.fn(),
  crear: vi.fn(),
  eliminar: vi.fn(),
  resumen: vi.fn(),
}));

vi.mock("./servicios/metaServicio", () => ({
  crear: vi.fn(),
  obtenerPorId: vi.fn(),
  listarPorVideojuego: vi.fn(),
  actualizar: vi.fn(),
  desactivar: vi.fn(),
  metaActivaDe: vi.fn(),
}));

vi.mock("./servicios/progresoServicio", () => ({
  progresoSemanal: vi.fn(),
}));

const app = crearApp("http://localhost:5174");
const ID = "507f1f77bcf86cd799439011";
const LOGRO = "507f1f77bcf86cd799439012";

vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "error").mockImplementation(() => {});

function reiniciarMocks(modulo: object): void {
  for (const valor of Object.values(modulo)) {
    if (typeof valor === "function" && "mockReset" in valor) {
      (valor as { mockReset: () => void }).mockReset();
    }
  }
}

beforeEach(() => {
  reiniciarMocks(videojuegoServicio);
  reiniciarMocks(partidaServicio);
  reiniciarMocks(metaServicio);
  reiniciarMocks(progresoServicio);
});

describe("GET /health", () => {
  it("responde ok sin pasar por los servicios", async () => {
    const res = await request(app).get("/health").expect(200);

    expect(res.body).toEqual({ status: "ok" });
    expect(res.headers["x-request-id"]).toEqual(expect.any(String));
    expect(videojuegoServicio.listar).not.toHaveBeenCalled();
    expect(partidaServicio.listar).not.toHaveBeenCalled();
    expect(metaServicio.crear).not.toHaveBeenCalled();
  });
});

describe("rutas desconocidas", () => {
  it("GET / sigue en 404 con requestId", async () => {
    const res = await request(app).get("/").expect(404);

    expect(res.body).toMatchObject({
      codigo: "NO_ENCONTRADO",
      error: "Ruta no encontrada",
      status: 404,
    });
    expect(res.body.requestId).toBe(res.headers["x-request-id"]);
  });

  it("una ruta /api inexistente también es 404", async () => {
    const res = await request(app).get("/api/no-existe").expect(404);
    expect(res.body.codigo).toBe("NO_ENCONTRADO");
  });
});

describe("videojuegos", () => {
  it("lista con los filtros de la query", async () => {
    vi.mocked(videojuegoServicio.listar).mockResolvedValue([
      { nombre: "Hades" },
    ] as never);

    const res = await request(app)
      .get("/api/videojuegos")
      .query({ estado: "jugando", plataforma: "PC" })
      .expect(200);

    expect(res.body).toEqual([{ nombre: "Hades" }]);
    expect(videojuegoServicio.listar).toHaveBeenCalledWith({
      estado: "jugando",
      plataforma: "PC",
    });
  });

  it("obtiene, crea, actualiza y borra", async () => {
    vi.mocked(videojuegoServicio.obtenerPorId).mockResolvedValue({
      nombre: "Hades",
    } as never);
    vi.mocked(videojuegoServicio.crear).mockResolvedValue({
      nombre: "Celeste",
    } as never);
    vi.mocked(videojuegoServicio.actualizar).mockResolvedValue({
      estado: "completado",
    } as never);
    vi.mocked(videojuegoServicio.eliminar).mockResolvedValue(
      undefined as never,
    );
    vi.mocked(videojuegoServicio.actualizarLogro).mockResolvedValue({
      nombre: "Hades",
    } as never);

    await request(app).get(`/api/videojuegos/${ID}`).expect(200);
    expect(videojuegoServicio.obtenerPorId).toHaveBeenCalledWith(ID);

    const creado = await request(app)
      .post("/api/videojuegos")
      .send({ nombre: "Celeste" })
      .expect(201);
    expect(creado.body).toEqual({ nombre: "Celeste" });
    expect(videojuegoServicio.crear).toHaveBeenCalledWith({
      nombre: "Celeste",
    });

    await request(app)
      .patch(`/api/videojuegos/${ID}`)
      .send({ estado: "completado" })
      .expect(200);
    expect(videojuegoServicio.actualizar).toHaveBeenCalledWith(ID, {
      estado: "completado",
    });

    const borrado = await request(app)
      .delete(`/api/videojuegos/${ID}`)
      .expect(204);
    expect(borrado.text).toBe("");
    expect(videojuegoServicio.eliminar).toHaveBeenCalledWith(ID);

    await request(app)
      .patch(`/api/videojuegos/${ID}/logros/${LOGRO}`)
      .send({ obtenido: true })
      .expect(200);
    expect(videojuegoServicio.actualizarLogro).toHaveBeenCalledWith(ID, LOGRO, {
      obtenido: true,
    });
  });
});

describe("partidas, resumen y progreso", () => {
  it("enruta sesiones, resumen y progreso semanal", async () => {
    vi.mocked(partidaServicio.listarPorVideojuego).mockResolvedValue(
      [] as never,
    );
    vi.mocked(partidaServicio.crear).mockResolvedValue({
      duracionMinutos: 30,
    } as never);
    vi.mocked(partidaServicio.eliminar).mockResolvedValue(undefined as never);
    vi.mocked(partidaServicio.resumen).mockResolvedValue({
      horasTotales: 0,
      cantidadPartidas: 0,
      fechaUltimaSesion: null,
      avanceActual: null,
    } as never);
    vi.mocked(progresoServicio.progresoSemanal).mockResolvedValue({
      semana: { inicio: "2026-11-02", fin: "2026-11-08" },
    } as never);

    await request(app).get(`/api/videojuegos/${ID}/partidas`).expect(200);
    expect(partidaServicio.listarPorVideojuego).toHaveBeenCalledWith(ID);

    const sesion = { videojuego: ID, duracionMinutos: 30 };
    await request(app).post("/api/partidas").send(sesion).expect(201);
    expect(partidaServicio.crear).toHaveBeenCalledWith(sesion);

    await request(app).delete(`/api/partidas/${ID}`).expect(204);
    expect(partidaServicio.eliminar).toHaveBeenCalledWith(ID);

    const resumen = await request(app)
      .get(`/api/videojuegos/${ID}/resumen`)
      .expect(200);
    expect(resumen.body.horasTotales).toBe(0);
    expect(partidaServicio.resumen).toHaveBeenCalledWith(ID);

    await request(app)
      .get(`/api/videojuegos/${ID}/progreso-semanal`)
      .expect(200);
    expect(progresoServicio.progresoSemanal).toHaveBeenCalledWith(ID);
  });
});

describe("metas", () => {
  it("crea, lee y desactiva", async () => {
    vi.mocked(metaServicio.crear).mockResolvedValue({
      horasSemanales: 5,
    } as never);
    vi.mocked(metaServicio.obtenerPorId).mockResolvedValue({
      horasSemanales: 5,
    } as never);
    vi.mocked(metaServicio.desactivar).mockResolvedValue({
      activa: false,
    } as never);
    vi.mocked(metaServicio.listarPorVideojuego).mockResolvedValue([] as never);

    await request(app)
      .post("/api/metas")
      .send({ horasSemanales: 5 })
      .expect(201);
    expect(metaServicio.crear).toHaveBeenCalledWith({ horasSemanales: 5 });

    await request(app).get(`/api/metas/${ID}`).expect(200);
    expect(metaServicio.obtenerPorId).toHaveBeenCalledWith(ID);

    await request(app).get(`/api/videojuegos/${ID}/metas`).expect(200);
    expect(metaServicio.listarPorVideojuego).toHaveBeenCalledWith(ID);

    const off = await request(app)
      .post(`/api/metas/${ID}/desactivar`)
      .expect(200);
    expect(off.body).toEqual({ activa: false });
    expect(metaServicio.desactivar).toHaveBeenCalledWith(ID);
  });
});

describe("errorHandler", () => {
  it("traduce validación, id, ausencia, conflicto y JSON inválido", async () => {
    vi.mocked(videojuegoServicio.listar).mockRejectedValue(
      new ErrorValidacion("estado debe ser uno de: pendiente, jugando"),
    );
    const validacion = await request(app).get("/api/videojuegos").expect(400);
    expect(validacion.body).toMatchObject({
      codigo: "VALIDACION",
      error: "Validación de esquema",
      status: 400,
    });
    expect(validacion.body.detalles).toEqual([
      "estado debe ser uno de: pendiente, jugando",
    ]);

    vi.mocked(videojuegoServicio.obtenerPorId).mockRejectedValue(
      new ErrorIdInvalido(
        "El id del videojuego debe tener 24 caracteres hexadecimales",
      ),
    );
    const id = await request(app).get("/api/videojuegos/no").expect(400);
    expect(id.body.codigo).toBe("ID_INVALIDO");
    expect(id.body.detalles).toEqual([
      "El id del videojuego debe tener 24 caracteres hexadecimales",
    ]);

    vi.mocked(videojuegoServicio.obtenerPorId).mockRejectedValue(
      new ErrorNoEncontrado("Videojuego no encontrado"),
    );
    const ausente = await request(app)
      .get(`/api/videojuegos/${ID}`)
      .expect(404);
    expect(ausente.body).toMatchObject({
      codigo: "NO_ENCONTRADO",
      error: "Videojuego no encontrado",
    });

    vi.mocked(metaServicio.crear).mockRejectedValue(
      new ErrorConflicto("Este videojuego ya tiene una meta activa"),
    );
    const conflicto = await request(app)
      .post("/api/metas")
      .send({})
      .expect(409);
    expect(conflicto.body).toMatchObject({
      codigo: "CONFLICTO",
      error: "Este videojuego ya tiene una meta activa",
      status: 409,
    });

    const json = await request(app)
      .post("/api/videojuegos")
      .set("Content-Type", "application/json")
      .send("{")
      .expect(400);
    expect(json.body.codigo).toBe("VALIDACION");
    expect(json.body.detalles).toEqual(["El cuerpo no es JSON válido"]);
  });

  it("oculta el detalle de un error no previsto", async () => {
    vi.mocked(videojuegoServicio.listar).mockRejectedValue(
      new Error("boom secreto"),
    );

    const res = await request(app).get("/api/videojuegos").expect(500);

    expect(res.body).toMatchObject({
      codigo: "INESPERADO",
      error: "Error inesperado",
      status: 500,
    });
    expect(JSON.stringify(res.body)).not.toContain("boom");
    expect(res.body.requestId).toBe(res.headers["x-request-id"]);
  });
});
