import { conectarDB } from "./config/conexionDB";
import { cargarEnv } from "./config/env";
import { Videojuego, type VideojuegoAtributos } from "./modelos/Videojuego";

const JUEGOS_INICIALES: VideojuegoAtributos[] = [
  {
    nombre: "Cyberpunk 2077",
    genero: "RPG",
    descripcion: "Un RPG de acción en mundo abierto ambientado en Night City, una megalópolis futurista obsesionada con la tecnología y las modificaciones corporales, donde encarnas a un mercenario en busca de un implante único.",
    plataforma: "PC",
    estado: "pendiente",
    logros: [
      { nombre: "Primera misión", descripcion: "Completa la primera misión principal.", obtenido: false },
      { nombre: "Night City explorada", descripcion: "Descubre las zonas principales de Night City.", obtenido: false },
      { nombre: "Implante único", descripcion: "Consigue el implante central de la historia.", obtenido: false },
      { nombre: "Juego terminado", descripcion: "Completa la historia principal.", obtenido: false },
      { nombre: "Nivel máximo", descripcion: "Lleva a tu personaje al nivel máximo.", obtenido: false },
      { nombre: "Todos los trofeos", descripcion: "Consigue todos los trofeos de la plataforma.", obtenido: false },
    ],
  },
  {
    nombre: "Red Dead Redemption 2",
    genero: "Acción y aventura",
    descripcion: "Un épico juego de acción y aventura en un detallado mundo abierto que narra el declive del lejano oeste a través de la historia del forajido Arthur Morgan y la banda de Van der Linde.",
    plataforma: "PlayStation",
    estado: "pendiente",
    logros: [
      { nombre: "Primera misión", descripcion: "Completa la primera misión principal.", obtenido: false },
      { nombre: "Campamento establecido", descripcion: "Llega al primer campamento de la banda.", obtenido: false },
      { nombre: "Mapa completo", descripcion: "Explora y desbloquea todo el mapa.", obtenido: false },
      { nombre: "Juego terminado", descripcion: "Completa la historia principal.", obtenido: false },
      { nombre: "Todos los coleccionables", descripcion: "Consigue todos los objetos coleccionables.", obtenido: false },
      { nombre: "Todos los trofeos", descripcion: "Consigue todos los trofeos de la plataforma.", obtenido: false },
    ],
  },
  {
    nombre: "Hades",
    genero: "Roguelike",
    descripcion: "Un adictivo roguelike de acción y mazmorras donde interpretas a Zagreo, el príncipe del Inframundo, en su constante intento por escapar del reino de su padre usando poderes de los dioses olímpicos.",
    plataforma: "PC",
    estado: "pendiente",
    logros: [
      { nombre: "Primera escapada", descripcion: "Escapa del Inframundo por primera vez.", obtenido: false },
      { nombre: "Favor del Olimpo", descripcion: "Consigue una bendición de un dios.", obtenido: false },
      { nombre: "Primera misión", descripcion: "Completa tu primera misión principal.", obtenido: false },
      { nombre: "Juego terminado", descripcion: "Completa la historia principal.", obtenido: false },
      { nombre: "Nueva partida plus", descripcion: "Desbloquea y completa una nueva partida plus.", obtenido: false },
      { nombre: "Todos los trofeos", descripcion: "Consigue todos los trofeos de la plataforma.", obtenido: false },
    ],
  },
  {
    nombre: "Hollow Knight",
    genero: "Metroidvania",
    descripcion: "Un aclamado metroidvania en 2D donde exploras Hallownest, un vasto y ruinoso reino de insectos subterráneo lleno de secretos, combates desafiantes y una atmósfera melancólica.",
    plataforma: "PC",
    estado: "pendiente",
    logros: [
      { nombre: "Primera zona explorada", descripcion: "Completa la exploración de Cruces Olvidados.", obtenido: false },
      { nombre: "Mapa completo", descripcion: "Descubre y completa el mapa de Hallownest.", obtenido: false },
      { nombre: "Áreas secretas encontradas", descripcion: "Encuentra todas las áreas secretas.", obtenido: false },
      { nombre: "Jefe final derrotado", descripcion: "Derrota al jefe final.", obtenido: false },
      { nombre: "Todos los coleccionables", descripcion: "Consigue todos los objetos coleccionables.", obtenido: false },
      { nombre: "Todos los trofeos", descripcion: "Consigue todos los trofeos de la plataforma.", obtenido: false },
    ],
  },
  {
    nombre: "Hollow Knight: Silksong",
    genero: "Metroidvania",
    descripcion: "La secuela de Hollow Knight, protagonizada por Hornet, la protectora de Hallownest, quien viaja por un nuevo reino guiado por la seda y la canción con un sistema de combate más ágil.",
    plataforma: "PC",
    estado: "pendiente",
    logros: [
      { nombre: "Tutorial completado", descripcion: "Completa el tutorial inicial.", obtenido: false },
      { nombre: "Primera zona explorada", descripcion: "Descubre y recorre la primera zona.", obtenido: false },
      { nombre: "Zona 2 explorada", descripcion: "Descubre y recorre completamente la zona 2.", obtenido: false },
      { nombre: "Mapa completo", descripcion: "Explora y desbloquea todo el mapa.", obtenido: false },
      { nombre: "Juego terminado", descripcion: "Completa la historia principal.", obtenido: false },
      { nombre: "Todos los trofeos", descripcion: "Consigue todos los trofeos de la plataforma.", obtenido: false },
    ],
  },
  {
    nombre: "Genshin Impact",
    genero: "RPG",
    descripcion: "Un RPG de acción gacha y mundo abierto gratuito ambientado en el mundo fantástico de Teyvat, donde exploras diversos reinos combinando habilidades elementales con una amplia lista de personajes.",
    plataforma: "PC",
    estado: "pendiente",
    logros: [
      { nombre: "Tutorial completado", descripcion: "Completa las misiones iniciales.", obtenido: false },
      { nombre: "Primera región descubierta", descripcion: "Explora por completo la primera región.", obtenido: false },
      { nombre: "Todas las regiones descubiertas", descripcion: "Descubre todas las regiones disponibles.", obtenido: false },
      { nombre: "Mapa completo", descripcion: "Explora y desbloquea todo el mapa.", obtenido: false },
      { nombre: "Personaje a nivel máximo", descripcion: "Lleva un personaje al nivel máximo.", obtenido: false },
      { nombre: "Todos los coleccionables", descripcion: "Consigue todos los objetos coleccionables.", obtenido: false },
    ],
  },
  {
    nombre: "The Legend of Zelda: Tears of the Kingdom",
    genero: "Aventura",
    descripcion: "Explora Hyrule y descubre sus secretos.",
    plataforma: "Nintendo",
    estado: "jugando",
    logros: [
      { nombre: "Cielo abierto", descripcion: "Explora una isla celeste.", obtenido: false },
    ],
  },
  {
    nombre: "Celeste",
    genero: "Plataformas",
    descripcion: "Supera una montaña mientras enfrentas tus miedos.",
    plataforma: "PC",
    estado: "completado",
    logros: [
      { nombre: "Tutorial completado", descripcion: "Completa el tutorial inicial.", obtenido: false },
      { nombre: "Primera zona explorada", descripcion: "Supera y explora la primera zona.", obtenido: false },
      { nombre: "La cima", descripcion: "Llega a la cima de la montaña.", obtenido: false },
      { nombre: "Corazón de cristal", descripcion: "Encuentra todos los corazones de cristal.", obtenido: false },
      { nombre: "Todos los coleccionables", descripcion: "Consigue todos los objetos coleccionables.", obtenido: false },
      { nombre: "Todos los trofeos", descripcion: "Consigue todos los trofeos de la plataforma.", obtenido: false },
    ],
  },
];

async function main(): Promise<void> {
  const entorno = cargarEnv();
  await conectarDB(entorno.MONGODB_URI, entorno.MONGODB_DB);

  let insertados = 0;
  let existentes = 0;

  for (const datos of JUEGOS_INICIALES) {
    const resultado = await Videojuego.updateOne(
      { nombre: datos.nombre, plataforma: datos.plataforma },
      { $set: datos },
      { upsert: true }
    );

    if (resultado.upsertedCount > 0) {
      insertados += 1;
      console.log(`Añadido: ${datos.nombre} (${datos.plataforma})`);
    } else {
      existentes += 1;
      console.log(`Actualizado: ${datos.nombre} (${datos.plataforma})`);
    }
  }

  console.log(`Seed terminado: ${insertados} añadidos, ${existentes} ya existentes.`);
  await Videojuego.db.close();
}

main().catch(async (error: unknown) => {
  console.error(error instanceof Error ? error.message : "No se pudo cargar el seed.");
  await Videojuego.db.close().catch(() => undefined);
  process.exitCode = 1;
});
