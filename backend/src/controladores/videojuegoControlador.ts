import { Request, Response } from "express";
import * as videojuegoServicio from "../servicios/videojuegoServicio";

function texto(valor: string | string[] | undefined): string {
  return typeof valor === "string" ? valor : "";
}

export async function listar(req: Request, res: Response): Promise<void> {
  const juegos = await videojuegoServicio.listar({
    estado: req.query.estado,
    plataforma: req.query.plataforma,
  });
  res.status(200).json(juegos);
}

export async function obtenerPorId(req: Request, res: Response): Promise<void> {
  const juego = await videojuegoServicio.obtenerPorId(texto(req.params.id));
  res.status(200).json(juego);
}

export async function crear(req: Request, res: Response): Promise<void> {
  const juego = await videojuegoServicio.crear(req.body);
  res.status(201).json(juego);
}

export async function actualizar(req: Request, res: Response): Promise<void> {
  const juego = await videojuegoServicio.actualizar(texto(req.params.id), req.body);
  res.status(200).json(juego);
}

export async function eliminar(req: Request, res: Response): Promise<void> {
  await videojuegoServicio.eliminar(texto(req.params.id));
  res.status(204).send();
}

export async function actualizarLogro(req: Request, res: Response): Promise<void> {
  const juego = await videojuegoServicio.actualizarLogro(
    texto(req.params.id),
    texto(req.params.logroId),
    req.body
  );
  res.status(200).json(juego);
}
