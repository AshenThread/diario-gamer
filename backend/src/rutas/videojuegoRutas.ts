import { Router } from "express";
import * as videojuegoControlador from "../controladores/videojuegoControlador";
import * as partidaControlador from "../controladores/partidaControlador";
import * as metaControlador from "../controladores/metaControlador";
import * as progresoControlador from "../controladores/progresoControlador";
import { asyncHandler } from "./asyncHandler";

export const videojuegoRutas = Router();

videojuegoRutas.get("/", asyncHandler(videojuegoControlador.listar));
videojuegoRutas.post("/", asyncHandler(videojuegoControlador.crear));
videojuegoRutas.get(
  "/:id/partidas",
  asyncHandler(partidaControlador.listarPorVideojuego),
);
videojuegoRutas.get("/:id/resumen", asyncHandler(partidaControlador.resumen));
videojuegoRutas.get(
  "/:id/progreso-semanal",
  asyncHandler(progresoControlador.progresoSemanal),
);
videojuegoRutas.get(
  "/:id/metas",
  asyncHandler(metaControlador.listarPorVideojuego),
);
videojuegoRutas.get("/:id", asyncHandler(videojuegoControlador.obtenerPorId));
videojuegoRutas.patch(
  "/:id/logros/:logroId",
  asyncHandler(videojuegoControlador.actualizarLogro),
);
videojuegoRutas.patch("/:id", asyncHandler(videojuegoControlador.actualizar));
videojuegoRutas.delete("/:id", asyncHandler(videojuegoControlador.eliminar));
