export const CODIGOS = {
  VALIDACION: "VALIDACION",
  ID_INVALIDO: "ID_INVALIDO",
  NO_ENCONTRADO: "NO_ENCONTRADO",
  INESPERADO: "INESPERADO",
} as const;

export type CodigoError = (typeof CODIGOS)[keyof typeof CODIGOS];

export class ErrorValidacion extends Error {
  readonly codigo = CODIGOS.VALIDACION;
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorValidacion";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ErrorIdInvalido extends Error {
  readonly codigo = CODIGOS.ID_INVALIDO;
  readonly detalles: string[];
  constructor(detalle?: string) {
    super("Id mal formado");
    this.name = "ErrorIdInvalido";
    this.detalles = detalle ? [detalle] : [];
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ErrorNoEncontrado extends Error {
  readonly codigo = CODIGOS.NO_ENCONTRADO;
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorNoEncontrado";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
