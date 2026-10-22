import cors from "cors";
import express from "express";
import { CODIGOS } from "./errores/erroresHttp";
import { errorHandler, enviarError } from "./middleware/errorHandler";
import { logger } from "./middleware/logger";
import { requestId } from "./middleware/requestId";
import { videojuegoRutas } from "./rutas/videojuegoRutas";

export function crearApp(corsOrigin: string): express.Express {
  const app = express();

  app.use(requestId);
  app.use(logger);
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json());
  app.use("/api/videojuegos", videojuegoRutas);

  app.use((req, res) => {
    enviarError(res, 404, CODIGOS.NO_ENCONTRADO, "Ruta no encontrada", req.requestId);
  });

  app.use(errorHandler);
  return app;
}
