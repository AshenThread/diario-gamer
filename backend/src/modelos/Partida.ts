import { Schema, Types, model } from "mongoose";

export interface PartidaAtributos {
  videojuego: Types.ObjectId;
  fecha: Date;
  duracionMinutos: number;
  porcentajeAvance: number;
}

const partidaSchema = new Schema<PartidaAtributos>(
  {
    videojuego: {
      type: Schema.Types.ObjectId,
      ref: "Videojuego",
      required: [true, "El videojuego es obligatorio"],
    },
    fecha: {
      type: Date,
      required: [true, "La fecha es obligatoria"],
    },
    duracionMinutos: {
      type: Number,
      required: [true, "La duración es obligatoria"],
      min: [1, "La duración mínima es 1 minuto"],
      max: [1440, "La duración máxima es 1440 minutos"],
    },
    porcentajeAvance: {
      type: Number,
      required: [true, "El porcentaje de avance es obligatorio"],
      min: [0, "El avance mínimo es 0"],
      max: [100, "El avance máximo es 100"],
    },
  },
  { versionKey: false, timestamps: true }
);

export const Partida = model<PartidaAtributos>("Partida", partidaSchema, "partidas");
