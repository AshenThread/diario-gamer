import { Request, Response } from "express";
import * as servicio from "../servicios/partidaServicio";

function texto(valor: string | string[] | undefined): string {
  return typeof valor === "string" ? valor : "";
}

export async function listar(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await servicio.listar());
}

export async function listarPorVideojuego(req: Request, res: Response): Promise<void> {
  res.status(200).json(await servicio.listarPorVideojuego(texto(req.params.id)));
}

export async function crear(req: Request, res: Response): Promise<void> {
  res.status(201).json(await servicio.crear(req.body));
}

export async function eliminar(req: Request, res: Response): Promise<void> {
  await servicio.eliminar(texto(req.params.id));
  res.status(204).send();
}

export async function resumen(req: Request, res: Response): Promise<void> {
  res.status(200).json(await servicio.resumen(texto(req.params.id)));
}
