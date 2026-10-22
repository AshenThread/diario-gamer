import { NextFunction, Request, RequestHandler, Response } from "express";

type ControladorAsync = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export function asyncHandler(controlador: ControladorAsync): RequestHandler {
  return (req, res, next) => {
    controlador(req, res, next).catch(next);
  };
}
