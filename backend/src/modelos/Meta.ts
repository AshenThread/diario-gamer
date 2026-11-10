import { Schema, Types, model } from "mongoose";

export interface HitoAtributos {
  descripcion: string;
  porcentajeObjetivo: number;
}

export interface MetaAtributos {
  videojuego: Types.ObjectId;
  horasSemanales: number;
  diasPorSemana: number;
  activa: boolean;
  hitos: HitoAtributos[];
}

const hitoSchema = new Schema<HitoAtributos>(
  {
    descripcion: {
      type: String,
      required: [true, "La descripción del hito es obligatoria"],
      trim: true,
    },
    porcentajeObjetivo: {
      type: Number,
      required: [true, "El porcentaje objetivo es obligatorio"],
      min: [1, "El porcentaje objetivo mínimo es 1"],
      max: [100, "El porcentaje objetivo máximo es 100"],
    },
  },
  { _id: false },
);

const metaSchema = new Schema<MetaAtributos>(
  {
    videojuego: {
      type: Schema.Types.ObjectId,
      ref: "Videojuego",
      required: [true, "El videojuego es obligatorio"],
    },
    horasSemanales: {
      type: Number,
      required: [true, "Las horas semanales son obligatorias"],
      min: [0.01, "Las horas semanales deben ser mayores que 0"],
      max: [100, "Las horas semanales máximas son 100"],
    },
    diasPorSemana: {
      type: Number,
      required: [true, "Los días por semana son obligatorios"],
      min: [1, "Los días por semana mínimos son 1"],
      max: [7, "Los días por semana máximos son 7"],
      validate: {
        validator: Number.isInteger,
        message: "Los días por semana deben ser un entero",
      },
    },
    activa: {
      type: Boolean,
      default: true,
    },
    hitos: {
      type: [hitoSchema],
      default: [],
      validate: {
        validator: (v: HitoAtributos[]) => v.length <= 5,
        message: "Una meta admite como máximo 5 hitos",
      },
    },
  },
  { versionKey: false, timestamps: true },
);

export const Meta = model<MetaAtributos>("Meta", metaSchema, "metas");
