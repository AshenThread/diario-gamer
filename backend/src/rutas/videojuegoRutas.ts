import { Router } from "express";
import * as videojuegoControlador from "../controladores/videojuegoControlador";
import { asyncHandler } from "./asyncHandler";

export const videojuegoRutas = Router();

videojuegoRutas.get("/", asyncHandler(videojuegoControlador.listar));
videojuegoRutas.post("/", asyncHandler(videojuegoControlador.crear));
videojuegoRutas.get("/:id", asyncHandler(videojuegoControlador.obtenerPorId));
videojuegoRutas.patch(
  "/:id/logros/:logroId",
  asyncHandler(videojuegoControlador.actualizarLogro)
);
videojuegoRutas.patch("/:id", asyncHandler(videojuegoControlador.actualizar));
videojuegoRutas.delete("/:id", asyncHandler(videojuegoControlador.eliminar));
