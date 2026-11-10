import { Router } from "express";
import * as metaControlador from "../controladores/metaControlador";
import { asyncHandler } from "./asyncHandler";

export const metaRutas = Router();

metaRutas.post("/", asyncHandler(metaControlador.crear));
metaRutas.get("/:id", asyncHandler(metaControlador.obtenerPorId));
metaRutas.patch("/:id", asyncHandler(metaControlador.actualizar));
metaRutas.post("/:id/desactivar", asyncHandler(metaControlador.desactivar));
