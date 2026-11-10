import { Request, Response } from "express";
import * as servicio from "../servicios/progresoServicio";

function texto(valor: string | string[] | undefined): string {
  return typeof valor === "string" ? valor : "";
}

export async function progresoSemanal(
  req: Request,
  res: Response,
): Promise<void> {
  res.status(200).json(await servicio.progresoSemanal(texto(req.params.id)));
}
