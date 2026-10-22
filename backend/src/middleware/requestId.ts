import { randomUUID } from "crypto";
import { NextFunction, Request, Response } from "express";
import "../tipos/express";

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = randomUUID();
  req.requestId = id;
  res.setHeader("X-Request-Id", id);
  next();
}
