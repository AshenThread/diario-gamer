import { Router } from "express";
import * as controlador from "../controladores/partidaControlador";
import { asyncHandler } from "./asyncHandler";

export const partidaRutas = Router();

partidaRutas.get("/", asyncHandler(controlador.listar));
partidaRutas.post("/", asyncHandler(controlador.crear));
partidaRutas.delete("/:id", asyncHandler(controlador.eliminar));
