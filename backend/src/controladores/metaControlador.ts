import { Request, Response } from "express";
import * as servicio from "../servicios/metaServicio";

function texto(valor: string | string[] | undefined): string {
  return typeof valor === "string" ? valor : "";
}

export async function crear(req: Request, res: Response): Promise<void> {
  res.status(201).json(await servicio.crear(req.body));
}

export async function obtenerPorId(req: Request, res: Response): Promise<void> {
  res.status(200).json(await servicio.obtenerPorId(texto(req.params.id)));
}

export async function listarPorVideojuego(
  req: Request,
  res: Response,
): Promise<void> {
  res
    .status(200)
    .json(await servicio.listarPorVideojuego(texto(req.params.id)));
}

export async function actualizar(req: Request, res: Response): Promise<void> {
  res
    .status(200)
    .json(await servicio.actualizar(texto(req.params.id), req.body));
}

export async function desactivar(req: Request, res: Response): Promise<void> {
  res.status(200).json(await servicio.desactivar(texto(req.params.id)));
}
