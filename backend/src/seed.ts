import { conectarDB } from "./config/conexionDB";
import { cargarEnv } from "./config/env";
import { Videojuego, type VideojuegoAtributos } from "./modelos/Videojuego";

const JUEGOS_INICIALES: VideojuegoAtributos[] = [
  {
    nombre: "Hades",
    genero: "Acción y aventura",
    plataforma: "PC",
    estado: "jugando",
    logros: [
      { nombre: "Primera escapada", descripcion: "Escapa del Inframundo por primera vez.", obtenido: false },
      { nombre: "Favor del Olimpo", descripcion: "Consigue una bendición de un dios.", obtenido: true },
    ],
  },
  {
    nombre: "The Legend of Zelda: Tears of the Kingdom",
    genero: "Aventura",
    plataforma: "Nintendo",
    estado: "jugando",
    logros: [
      { nombre: "Cielo abierto", descripcion: "Explora una isla celeste.", obtenido: false },
    ],
  },
  {
    nombre: "Red Dead Redemption 2",
    genero: "Acción y aventura",
    plataforma: "PlayStation",
    estado: "pendiente",
    logros: [],
  },
  {
    nombre: "Celeste",
    genero: "Plataformas",
    plataforma: "PC",
    estado: "completado",
    logros: [
      { nombre: "La cima", descripcion: "Llega a la cima de la montaña.", obtenido: true },
      { nombre: "Corazón de cristal", descripcion: "Encuentra un corazón de cristal.", obtenido: false },
    ],
  },
];

async function main(): Promise<void> {
  const entorno = cargarEnv();
  await conectarDB(entorno.MONGODB_URI, entorno.MONGODB_DB);

  let insertados = 0;
  let existentes = 0;

  for (const datos of JUEGOS_INICIALES) {
    const existe = await Videojuego.exists({
      nombre: datos.nombre,
      plataforma: datos.plataforma,
    });

    if (existe) {
      existentes += 1;
      continue;
    }

    await Videojuego.create(datos);
    insertados += 1;
    console.log(`Añadido: ${datos.nombre} (${datos.plataforma})`);
  }

  console.log(`Seed terminado: ${insertados} añadidos, ${existentes} ya existentes.`);
  await Videojuego.db.close();
}

main().catch(async (error: unknown) => {
  console.error(error instanceof Error ? error.message : "No se pudo cargar el seed.");
  await Videojuego.db.close().catch(() => undefined);
  process.exitCode = 1;
});
