import { ErrorRequestHandler, Response } from "express";
import mongoose from "mongoose";
import {
  CODIGOS,
  ErrorIdInvalido,
  ErrorNoEncontrado,
  ErrorValidacion,
  type CodigoError,
} from "../errores/erroresHttp";

export function enviarError(
  res: Response,
  status: number,
  codigo: CodigoError,
  error: string,
  requestId: string,
  detalles?: string[]
): void {
  const cuerpo: {
    codigo: CodigoError;
    error: string;
    status: number;
    requestId: string;
    detalles?: string[];
  } = { codigo, error, status, requestId };
  if (detalles && detalles.length > 0) {
    cuerpo.detalles = detalles;
  }
  res.status(status).json(cuerpo);
}

function esCuerpoJsonInvalido(err: unknown): boolean {
  if (typeof err !== "object" || err === null) {
    return false;
  }
  const candidato = err as { type?: string; status?: number };
  if (candidato.type === "entity.parse.failed") {
    return true;
  }
  return err instanceof SyntaxError && candidato.status === 400;
}

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const requestId = req.requestId || "desconocido";

  if (err instanceof mongoose.Error.ValidationError) {
    const detalles = Object.values(err.errors).map((item) => item.message);
    enviarError(res, 400, CODIGOS.VALIDACION, "Validación de esquema", requestId, detalles);
    return;
  }

  if (err instanceof ErrorValidacion) {
    enviarError(res, 400, CODIGOS.VALIDACION, "Validación de esquema", requestId, [err.message]);
    return;
  }

  if (err instanceof ErrorIdInvalido) {
    enviarError(res, 400, CODIGOS.ID_INVALIDO, "Id mal formado", requestId, err.detalles);
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    if (err.kind === "ObjectId" || err.path === "_id") {
      enviarError(res, 400, CODIGOS.ID_INVALIDO, "Id mal formado", requestId);
      return;
    }
    enviarError(res, 400, CODIGOS.VALIDACION, "Validación de esquema", requestId, [err.message]);
    return;
  }

  if (err instanceof ErrorNoEncontrado) {
    enviarError(res, 404, CODIGOS.NO_ENCONTRADO, err.message, requestId);
    return;
  }

  if (esCuerpoJsonInvalido(err)) {
    enviarError(res, 400, CODIGOS.VALIDACION, "Validación de esquema", requestId, [
      "El cuerpo no es JSON válido",
    ]);
    return;
  }

  console.error(`[${requestId}] error inesperado`, err);
  enviarError(res, 500, CODIGOS.INESPERADO, "Error inesperado", requestId);
};
