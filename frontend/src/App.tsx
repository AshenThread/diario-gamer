import { CSSProperties, FormEvent, useEffect, useRef, useState } from "react";
import { ErrorHttp, actualizarEstado, actualizarVideojuego, crearVideojuego, eliminarVideojuego, listarVideojuegos, marcarLogro } from "./api/videojuegosApi";
import { crearPartida, listarPartidas, obtenerResumen } from "./api/partidasApi";
import { ESTADOS, GENEROS, PLATAFORMAS, type Estado, type Genero, type LogroFormulario, type Partida, type Plataforma, type Resumen, type Videojuego } from "./tipos";

const LOGRO_VACIO: LogroFormulario = { nombre: "", descripcion: "", obtenido: false };
const PLANTILLAS_LOGROS: LogroFormulario[] = [
  { nombre: "Tutorial completado", descripcion: "Completa el tutorial inicial.", obtenido: false },
  { nombre: "Primera misión", descripcion: "Completa la primera misión principal.", obtenido: false },
  { nombre: "Mundo abierto explorado", descripcion: "Entra y explora el mundo abierto.", obtenido: false },
  { nombre: "Zona 1 explorada", descripcion: "Descubre y recorre completamente la zona 1.", obtenido: false },
  { nombre: "Zona 2 explorada", descripcion: "Descubre y recorre completamente la zona 2.", obtenido: false },
  { nombre: "Zona 3 explorada", descripcion: "Descubre y recorre completamente la zona 3.", obtenido: false },
  { nombre: "Zona 4 explorada", descripcion: "Descubre y recorre completamente la zona 4.", obtenido: false },
  { nombre: "Zona 5 explorada", descripcion: "Descubre y recorre completamente la zona 5.", obtenido: false },
  { nombre: "Mapa completo", descripcion: "Explora y desbloquea todo el mapa del juego.", obtenido: false },
  { nombre: "Todas las regiones descubiertas", descripcion: "Descubre todas las regiones principales del juego.", obtenido: false },
  { nombre: "Áreas secretas encontradas", descripcion: "Encuentra todas las áreas secretas del mapa.", obtenido: false },
  { nombre: "Juego terminado", descripcion: "Completa la historia principal.", obtenido: false },
  { nombre: "Nueva partida plus", descripcion: "Desbloquea el modo Nueva partida plus.", obtenido: false },
  { nombre: "Nivel máximo", descripcion: "Lleva a tu personaje al nivel máximo.", obtenido: false },
  { nombre: "Todos los coleccionables", descripcion: "Consigue todos los objetos coleccionables.", obtenido: false },
  { nombre: "Todos los trofeos", descripcion: "Consigue todos los trofeos de la plataforma.", obtenido: false },
];
const FECHA_HOY = new Date().toISOString().slice(0, 10);
function slugPortada(nombre: string): string {
  return nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

type GameTheme = {
  ink: string;
  accent: string;
  paper: string;
  contrast: string;
};

function temaJuego(nombre: string): GameTheme {
  const temas: Record<string, GameTheme> = {
    "cyberpunk-2077": { ink: "#151515", accent: "#f0e900", paper: "#fffde6", contrast: "#131313" },
    "red-dead-redemption-2": { ink: "#24100e", accent: "#d83b32", paper: "#fff2df", contrast: "#fffaf2" },
    hades: { ink: "#261115", accent: "#f05a28", paper: "#fff0e6", contrast: "#fffaf5" },
    celeste: { ink: "#20133a", accent: "#9adcf1", paper: "#f3efff", contrast: "#171225" },
    "hollow-knight": { ink: "#101a2c", accent: "#46d9ef", paper: "#edf7fb", contrast: "#f8ffff" },
    "hollow-knight-silksong": { ink: "#32151a", accent: "#eb4a3d", paper: "#fff0e9", contrast: "#fff9f5" },
    "genshin-impact": { ink: "#10284c", accent: "#8ddcff", paper: "#edf8ff", contrast: "#11233d" },
  };
  return temas[slugPortada(nombre)] ?? { ink: "#171717", accent: "#c9a227", paper: "#fbf7ea", contrast: "#171717" };
}

function estiloTema(tema: GameTheme): CSSProperties {
  return {
    "--game-ink": tema.ink,
    "--game-accent": tema.accent,
    "--game-paper": tema.paper,
    "--game-contrast": tema.contrast,
  } as CSSProperties;
}

function textoError(error: unknown): string {
  if (error instanceof ErrorHttp) {
    const id = error.requestId ? ` (requestId ${error.requestId})` : "";
    const codigo = error.codigo ? ` [${error.codigo}]` : "";
    return `${error.message}${codigo}${id}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "No se pudo hablar con la API. ¿Está el backend en el puerto 3001?";
}

interface DetalleJuegoProps {
  juego: Videojuego;
  onBack: () => void;
  onChanged: () => Promise<void>;
}

function DetalleJuego({ juego: juegoInicial, onBack, onChanged }: DetalleJuegoProps) {
  const [juego, setJuego] = useState(juegoInicial);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fecha, setFecha] = useState(FECHA_HOY);
  const [duracion, setDuracion] = useState("60");
  const [avance, setAvance] = useState("0");
  const [guardandoPartida, setGuardandoPartida] = useState(false);
  const tema = temaJuego(juego.nombre);
  const logrosObtenidos = juego.logros.filter((logro) => logro.obtenido).length;
  const porcentajeLogros = juego.logros.length ? Math.round((logrosObtenidos / juego.logros.length) * 100) : 0;

  async function cargarDetalle() {
    setCargando(true);
    setError(null);
    try {
      const [nuevoResumen, nuevasPartidas] = await Promise.all([
        obtenerResumen(juego._id),
        listarPartidas(juego._id),
      ]);
      setResumen(nuevoResumen);
      setPartidas(nuevasPartidas);
    } catch (err) {
      setError(textoError(err));
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargarDetalle();
  }, [juego._id]);

  async function cambiarLogro(logroId: string, obtenido: boolean) {
    try {
      const actualizado = await marcarLogro(juego._id, logroId, obtenido);
      setJuego(actualizado);
      await onChanged();
    } catch (err) {
      setError(textoError(err));
    }
  }

  async function guardarPartida(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setGuardandoPartida(true);
    try {
      await crearPartida({
        videojuego: juego._id,
        fecha: new Date(`${fecha}T12:00:00`).toISOString(),
        duracionMinutos: Number(duracion),
        porcentajeAvance: Number(avance),
      });
      await cargarDetalle();
    } catch (err) {
      setError(textoError(err));
    } finally {
      setGuardandoPartida(false);
    }
  }

  return (
    <main className="page detail-page" style={estiloTema(tema)}>
      <button type="button" className="ghost back-button" onClick={onBack}>← Volver a la colección</button>
      <section className="detail-hero">
        <div className="detail-cover cover-slot">
          <img
            src={`/img/${slugPortada(juego.nombre)}.png`}
            alt={`Portada de ${juego.nombre}`}
            onError={(evento) => {
              evento.currentTarget.onerror = null;
              evento.currentTarget.src = `/img2/${(juego._id.charCodeAt(0) % 3) + 1}.svg`;
            }}
          />
        </div>
        <div className="detail-intro">
          <p className="eyebrow">Ficha del juego</p>
          <h1>{juego.nombre}</h1>
          <p className="detail-meta">{juego.genero} · {juego.plataforma} · {juego.estado}</p>
          <p className="detail-description">{juego.descripcion || "Este juego todavía no tiene descripción."}</p>
        </div>
      </section>

      {error ? <p className="error">{error}</p> : null}
      {cargando ? <p className="muted">Cargando progreso…</p> : null}

      <section className="detail-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Progreso calculado</p>
            <h2>Resumen de <em>{juego.nombre}</em></h2>
          </div>
        </div>
        <dl className="detail-stats">
          <div><dt>Horas jugadas</dt><dd>{resumen?.horasTotales ?? 0}</dd></div>
          <div><dt>Sesiones</dt><dd>{resumen?.cantidadPartidas ?? 0}</dd></div>
          <div><dt>Avance actual</dt><dd>{resumen?.avanceActual === null || resumen?.avanceActual === undefined ? "—" : `${resumen.avanceActual}%`}</dd></div>
          <div><dt>Última sesión</dt><dd>{resumen?.fechaUltimaSesion ? new Date(resumen.fechaUltimaSesion).toLocaleDateString("es-ES") : "—"}</dd></div>
        </dl>
      </section>

      <section className="detail-section">
        <p className="eyebrow">Hitos personales</p>
        <div className="detail-achievement-heading">
          <h2>Logros <em>{logrosObtenidos}/{juego.logros.length}</em></h2>
          <span>{porcentajeLogros}% completado</span>
        </div>
        <div className="progress-track" aria-label={`${porcentajeLogros}% de logros completados`}>
          <span style={{ width: `${porcentajeLogros}%` }} />
        </div>
        <ul className="detail-achievements">
          {juego.logros.map((logro) => (
            <li key={logro._id}>
              <label className="check">
                <input type="checkbox" checked={logro.obtenido} onChange={(evento) => void cambiarLogro(logro._id, evento.target.checked)} />
                <span><strong>{logro.nombre}</strong><small>{logro.descripcion}</small></span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="detail-section">
        <p className="eyebrow">Registro de sesiones</p>
        <h2>Añadir una <em>partida</em></h2>
        <form className="partida-form detail-partida-form" onSubmit={guardarPartida}>
          <label>Fecha<input type="date" value={fecha} onChange={(evento) => setFecha(evento.target.value)} /></label>
          <label>Minutos<input type="number" min="1" max="1440" value={duracion} onChange={(evento) => setDuracion(evento.target.value)} /></label>
          <label>Avance (%)<input type="number" min="0" max="100" value={avance} onChange={(evento) => setAvance(evento.target.value)} /></label>
          <button type="submit" disabled={guardandoPartida}>
            {guardandoPartida ? "Guardando…" : "Guardar partida"}
          </button>
        </form>
        <ul className="detail-sessions">
          {partidas.length === 0 ? <li className="muted">Todavía no hay sesiones registradas.</li> : null}
          {partidas.map((partida) => (
            <li key={partida._id}>
              <span>{new Date(partida.fecha).toLocaleDateString("es-ES")}</span>
              <span>{partida.duracionMinutos} min</span>
              <span>{partida.porcentajeAvance}% de avance</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

export function App() {
  const [juegos, setJuegos] = useState<Videojuego[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [nombre, setNombre] = useState("");
  const [genero, setGenero] = useState<Genero | "">("");
  const [descripcion, setDescripcion] = useState("");
  const [plataforma, setPlataforma] = useState<Plataforma>("PC");
  const [estado, setEstado] = useState<Estado>("jugando");
  const [logros, setLogros] = useState<LogroFormulario[]>([{ ...LOGRO_VACIO }]);
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<Estado | "">("");
  const [filtroPlataforma, setFiltroPlataforma] = useState<Plataforma | "">("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const [detalleCargando, setDetalleCargando] = useState(false);
  const [resumenes, setResumenes] = useState<Record<string, Resumen>>({});
  const [partidas, setPartidas] = useState<Record<string, Partida[]>>({});
  const [partidaFecha, setPartidaFecha] = useState(FECHA_HOY);
  const [partidaDuracion, setPartidaDuracion] = useState("60");
  const [partidaAvance, setPartidaAvance] = useState("0");
  const [detalleSeleccionado, setDetalleSeleccionado] = useState<string | null>(() => {
    const coincidencia = window.location.hash.match(/^#\/juego\/([^/]+)$/);
    return coincidencia ? decodeURIComponent(coincidencia[1]) : null;
  });
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editGenero, setEditGenero] = useState<Genero | "">("");
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editPlataforma, setEditPlataforma] = useState<Plataforma>("PC");
  const [editEstado, setEditEstado] = useState<Estado>("jugando");
  const bibliotecaRef = useRef<HTMLUListElement>(null);

  function desplazarBiblioteca(direccion: number) {
    bibliotecaRef.current?.scrollBy({ left: direccion * 360, behavior: "smooth" });
  }

  async function cargar(proximoEstado = filtroEstado, proximaPlataforma = filtroPlataforma) {
    setError(null);
    const lista = await listarVideojuegos({
      estado: proximoEstado,
      plataforma: proximaPlataforma,
    });
    setJuegos(lista);
  }

  useEffect(() => {
    setCargando(true);
    cargar()
      .catch((err: unknown) => setError(textoError(err)))
      .finally(() => setCargando(false));
    // Solo al montar. Los filtros recargan con el botón.
  }, []);

  useEffect(() => {
    const actualizarRuta = () => {
      const coincidencia = window.location.hash.match(/^#\/juego\/([^/]+)$/);
      setDetalleSeleccionado(coincidencia ? decodeURIComponent(coincidencia[1]) : null);
    };
    window.addEventListener("hashchange", actualizarRuta);
    return () => window.removeEventListener("hashchange", actualizarRuta);
  }, []);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setAviso(null);
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) {
      setError("El nombre es obligatorio.");
      return;
    }
    if (!genero) {
      setError("El género es obligatorio.");
      return;
    }
    const logrosLimpios = logros
      .map((logro) => ({
        nombre: logro.nombre.trim(),
        descripcion: logro.descripcion.trim(),
        obtenido: logro.obtenido,
      }))
      .filter((logro) => logro.nombre.length > 0);

    try {
      setGuardando(true);
      const creado = await crearVideojuego({
        nombre: nombreLimpio,
        genero,
        descripcion: descripcion.trim(),
        plataforma,
        estado,
        logros: logrosLimpios,
      });
      setNombre("");
      setGenero("");
      setDescripcion("");
      setPlataforma("PC");
      setEstado("jugando");
      setLogros([{ ...LOGRO_VACIO }]);
      setPlantillaSeleccionada("");
      setAviso(`Guardado en MongoDB: ${creado.nombre} (${creado._id}).`);
      await cargar();
    } catch (err) {
      setError(textoError(err));
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstado(id: string, nuevo: Estado) {
    setError(null);
    try {
      await actualizarEstado(id, nuevo);
      await cargar();
    } catch (err) {
      setError(textoError(err));
    }

  }

  function iniciarEdicion(juego: Videojuego) {
    setEditandoId(juego._id);
    setEditNombre(juego.nombre);
    setEditGenero(juego.genero);
    setEditDescripcion(juego.descripcion);
    setEditPlataforma(juego.plataforma);
    setEditEstado(juego.estado);
    setError(null);
  }

  async function guardarEdicion(id: string) {
    const nombreEditado = editNombre.trim();
    if (!nombreEditado) {
      setError("El nombre es obligatorio.");
      return;
    }
    if (!editGenero) {
      setError("El género es obligatorio.");
      return;
    }
    setError(null);
    setAviso(null);
    try {
      await actualizarVideojuego(id, {
        nombre: nombreEditado,
        genero: editGenero,
        descripcion: editDescripcion.trim(),
        plataforma: editPlataforma,
        estado: editEstado,
      });
      setEditandoId(null);
      setAviso("Cambios guardados en MongoDB.");
      await cargar();
    } catch (err) {
      setError(textoError(err));
    }
  }

  async function cambiarLogro(id: string, logroId: string, obtenido: boolean) {
    setError(null);
    try {
      await marcarLogro(id, logroId, obtenido);
      await cargar();
    } catch (err) {
      setError(textoError(err));
    }
  }

  async function borrar(id: string, nombreJuego: string) {
    if (!window.confirm(`¿Borrar ${nombreJuego}?`)) {
      return;
    }

    setError(null);
    try {
      await eliminarVideojuego(id);
      await cargar();
    } catch (err) {
      setError(textoError(err));
    }

  }

  async function abrirDetalle(id: string) {
    setDetalleId(id);
    setDetalleCargando(true);
    try {
      const [resumen, lista] = await Promise.all([obtenerResumen(id), listarPartidas(id)]);
      setResumenes((actuales) => ({ ...actuales, [id]: resumen }));
      setPartidas((actuales) => ({ ...actuales, [id]: lista }));
    } catch (err) {
      setError(textoError(err));
    } finally {
      setDetalleCargando(false);
    }
  }

  async function guardarPartida(id: string) {
    setError(null);
    try {
      await crearPartida({
        videojuego: id,
        fecha: new Date(`${partidaFecha}T12:00:00`).toISOString(),
        duracionMinutos: Number(partidaDuracion),
        porcentajeAvance: Number(partidaAvance),
      });
      await abrirDetalle(id);
      setAviso("Partida guardada.");
    } catch (err) {
      setError(textoError(err));
    }
  }

  const juegoDetalle = detalleSeleccionado
    ? juegos.find((juego) => juego._id === detalleSeleccionado)
    : undefined;

  if (juegoDetalle) {
    return (
      <DetalleJuego
        juego={juegoDetalle}
        onBack={() => { window.location.hash = ""; }}
        onChanged={cargar}
      />
    );
  }

  const juegoHero = juegos[heroIndex];
  const temaHero = temaJuego(juegoHero?.nombre ?? "");
  const cambiarHero = (direccion: number) => {
    if (juegos.length < 2) return;
    setHeroIndex((actual) => (actual + direccion + juegos.length) % juegos.length);
  };
  const posicionHero = (indice: number) => {
    if (juegos.length === 0) return "hero-card-hidden";
    const distancia = (indice - heroIndex + juegos.length) % juegos.length;
    if (distancia === 0) return "hero-card-active";
    if (distancia === 1) return "hero-card-right";
    if (distancia === juegos.length - 1) return "hero-card-left";
    return "hero-card-hidden";
  };

  return (
    <main className="page home-page" style={estiloTema(temaHero)}>
      <header
        className="hero"
        onWheel={(evento) => {
          if (Math.abs(evento.deltaY) < 8) return;
          evento.preventDefault();
          cambiarHero(evento.deltaY > 0 ? 1 : -1);
        }}
        onKeyDown={(evento) => {
          if (evento.key === "ArrowRight" || evento.key === "ArrowDown") cambiarHero(1);
          if (evento.key === "ArrowLeft" || evento.key === "ArrowUp") cambiarHero(-1);
        }}
        tabIndex={0}
        aria-label="Baraja de juegos de la colección. Usa las flechas o la rueda del mouse para cambiar."
      >
        <div>
          <p className="eyebrow">Archivo personal / 2024—25</p>
          <h1>Qué estoy<br /><em>jugando</em></h1>
          <div className="hero-actions">
            <a className="hero-link" href="#coleccion">Ver colección <span>↓</span></a>
            <span className="hero-count">{juegos.length} {juegos.length === 1 ? "juego" : "juegos"} guardados</span>
          </div>
        </div>
        <div className="hero-deck" aria-live="polite">
          {juegos.map((juego, indice) => (
            <button
              key={juego._id}
              type="button"
              className={`hero-card ${posicionHero(indice)}`}
              onClick={() => setHeroIndex(indice)}
              aria-label={`Seleccionar ${juego.nombre}`}
              aria-pressed={indice === heroIndex}
            >
              <img
                src={`/img/${slugPortada(juego.nombre)}.png`}
                alt=""
                aria-hidden="true"
                onError={(evento) => {
                  evento.currentTarget.onerror = null;
                  evento.currentTarget.src = `/img2/${(juego._id.charCodeAt(0) % 3) + 1}.svg`;
                }}
              />
              <span>{juego.nombre}</span>
            </button>
          ))}
          <div className="hero-deck-controls">
            <button type="button" onClick={() => cambiarHero(-1)} aria-label="Juego anterior">←</button>
            <span>{juegos.length ? `${heroIndex + 1} / ${juegos.length}` : "0 / 0"}</span>
            <button type="button" onClick={() => cambiarHero(1)} aria-label="Siguiente juego">→</button>
          </div>
        </div>
        <p className="lead">
          {juegoHero
            ? `Ahora estás viendo ${juegoHero.nombre}. Cambia de portada con la rueda del mouse.`
            : "Un registro vivo de partidas, plataformas y logros."}
        </p>
      </header>

      <details className="panel create-panel" open>
        <summary><span>01</span><strong>Añadir al archivo</strong><i>+</i></summary>
        <form className="panel-content" onSubmit={enviar}>
        <h2>Nuevo videojuego</h2>
        <label>
          Nombre
          <input
            value={nombre}
            onChange={(evento) => setNombre(evento.target.value)}
            placeholder="Hades"
            required
          />
        </label>
        <label>
          Género
          <select value={genero} onChange={(evento) => setGenero(evento.target.value as Genero)} required>
            <option value="">Selecciona un género</option>
            {GENEROS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label>
          Descripción
          <textarea
            value={descripcion}
            onChange={(evento) => setDescripcion(evento.target.value)}
            placeholder="Describe brevemente el videojuego."
            rows={3}
          />
        </label>
        <div className="fila">
          <label>
            Plataforma
            <select
              value={plataforma}
              onChange={(evento) => setPlataforma(evento.target.value as Plataforma)}
            >
              {PLATAFORMAS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            Estado
            <select value={estado} onChange={(evento) => setEstado(evento.target.value as Estado)}>
              {ESTADOS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        <fieldset>
          <legend>Logros <span>(opcional)</span></legend>
          <div className="logro-acciones">
            <label>
              Plantilla de logro
              <select value={plantillaSeleccionada} onChange={(evento) => setPlantillaSeleccionada(evento.target.value)}>
                <option value="">Selecciona una plantilla</option>
                {PLANTILLAS_LOGROS.map((plantilla) => (
                  <option key={plantilla.nombre} value={plantilla.nombre}>{plantilla.nombre}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="ghost"
              disabled={!plantillaSeleccionada}
              onClick={() => {
                const plantilla = PLANTILLAS_LOGROS.find((item) => item.nombre === plantillaSeleccionada);
                if (!plantilla) return;
                const filas = logros.some((item) => item.nombre.trim() === "")
                  ? logros.filter((item) => item.nombre.trim() !== "")
                  : logros;
                setLogros([...filas, { ...plantilla }]);
                setPlantillaSeleccionada("");
              }}
            >
              Añadir plantilla
            </button>
          </div>
          {logros.map((logro, indice) => (
            <div className="logro-fila" key={indice}>
              <input
                value={logro.nombre}
                onChange={(evento) => {
                  const copia = [...logros];
                  copia[indice] = { ...copia[indice], nombre: evento.target.value };
                  setLogros(copia);
                }}
                placeholder="Nombre del logro"
              />
              <input
                value={logro.descripcion}
                onChange={(evento) => {
                  const copia = [...logros];
                  copia[indice] = { ...copia[indice], descripcion: evento.target.value };
                  setLogros(copia);
                }}
                placeholder="Descripción"
              />
              <label className="check">
                <input
                  type="checkbox"
                  checked={logro.obtenido}
                  onChange={(evento) => {
                    const copia = [...logros];
                    copia[indice] = { ...copia[indice], obtenido: evento.target.checked };
                    setLogros(copia);
                  }}
                />
                Obtenido
              </label>
              <button
                type="button"
                className="remove-logro"
                aria-label={`Quitar logro ${logro.nombre || "sin nombre"}`}
                onClick={() => setLogros(logros.filter((_, posicion) => posicion !== indice))}
              >
                Quitar
              </button>
            </div>
          ))}
          <button
            type="button"
            className="ghost"
            onClick={() => setLogros([...logros, { ...LOGRO_VACIO }])}
          >
            Añadir logro personalizado
          </button>
        </fieldset>

        {error ? <p className="error">{error}</p> : null}
        {aviso ? <p className="aviso">{aviso}</p> : null}

        <button type="submit" disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar en MongoDB"}
        </button>
        </form>
      </details>

      <section className="library" id="coleccion">
        <div className="section-heading">
          <div>
            <p className="eyebrow">02 / Colección</p>
            <h2>En la base <em>diario_gamer</em></h2>
          </div>
        </div>
        <details className="filters">
          <summary>Filtrar colección <span>+</span></summary>
          <div className="fila">
          <label>
            Filtrar estado
            <select
              value={filtroEstado}
              onChange={(evento) => setFiltroEstado(evento.target.value as Estado | "")}
            >
              <option value="">todos</option>
              {ESTADOS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            Filtrar plataforma
            <select
              value={filtroPlataforma}
              onChange={(evento) => setFiltroPlataforma(evento.target.value as Plataforma | "")}
            >
              <option value="">todas</option>
              {PLATAFORMAS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="ghost"
            onClick={() => {
              setCargando(true);
              cargar()
                .catch((err: unknown) => setError(textoError(err)))
                .finally(() => setCargando(false));
            }}
          >
            Aplicar filtros
          </button>
          </div>
        </details>

        {cargando ? <p>Cargando…</p> : null}
        {!cargando && juegos.length === 0 ? <p>No hay videojuegos con ese filtro.</p> : null}

        <ul className="lista" ref={bibliotecaRef}>
          {juegos.map((juego) => (
            <li key={juego._id} className="game-card" style={estiloTema(temaJuego(juego.nombre))}>
              <button
                type="button"
                className="cover-slot cover-button"
                aria-label={`Ver detalle de ${juego.nombre}`}
                onClick={() => { window.location.hash = `/juego/${encodeURIComponent(juego._id)}`; }}
              >
                <img
                  src={`/img/${slugPortada(juego.nombre)}.png`}
                  alt={`Portada de ${juego.nombre}`}
                  onError={(evento) => {
                    evento.currentTarget.onerror = null;
                    evento.currentTarget.src = `/img2/${(juego._id.charCodeAt(0) % 3) + 1}.svg`;
                  }}
                />
              </button>
              <div className="game-body">
                {editandoId === juego._id ? (
                  <div className="edicion-juego">
                    <label>
                      Nombre
                      <input value={editNombre} onChange={(evento) => setEditNombre(evento.target.value)} />
                    </label>
                    <label>
                      Género
                      <select value={editGenero} onChange={(evento) => setEditGenero(evento.target.value as Genero)}>
                        <option value="">Selecciona un género</option>
                        {GENEROS.map((item) => <option key={item} value={item}>{item}</option>)}
                      </select>
                    </label>
                    <label>
                      Descripción
                      <textarea rows={3} value={editDescripcion} onChange={(evento) => setEditDescripcion(evento.target.value)} />
                    </label>
                    <div className="edicion-fila">
                      <label>
                        Plataforma
                        <select value={editPlataforma} onChange={(evento) => setEditPlataforma(evento.target.value as Plataforma)}>
                          {PLATAFORMAS.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                      </label>
                      <label>
                        Estado
                        <select value={editEstado} onChange={(evento) => setEditEstado(evento.target.value as Estado)}>
                          {ESTADOS.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                      </label>
                    </div>
                    <div className="edicion-acciones">
                      <button type="button" onClick={() => void guardarEdicion(juego._id)}>Guardar cambios</button>
                      <button type="button" className="ghost" onClick={() => setEditandoId(null)}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="juego-cabecera">
                      <div>
                        <button
                          type="button"
                          className="game-title"
                          onClick={() => { window.location.hash = `/juego/${encodeURIComponent(juego._id)}`; }}
                        >
                          {juego.nombre}
                        </button>
                        <span className="platform">{juego.genero} · {juego.plataforma}</span>
                        {juego.descripcion ? <p className="game-description">{juego.descripcion}</p> : null}
                      </div>
                      <div className="juego-acciones">
                        <button type="button" className="ghost editar" onClick={() => iniciarEdicion(juego)}>Editar</button>
                        <button type="button" className="peligro" onClick={() => void borrar(juego._id, juego.nombre)}>Borrar</button>
                      </div>
                    </div>
                    <label className="status-control">
                      Estado
                      <select value={juego.estado} onChange={(evento) => void cambiarEstado(juego._id, evento.target.value as Estado)}>
                        {ESTADOS.map((item) => <option key={item} value={item}>{item}</option>)}
                      </select>
                    </label>
                  </>
                )}
                <details className="achievement-dropdown">
                  <summary>Logros <span>{juego.logros.filter((logro) => logro.obtenido).length}/{juego.logros.length}</span></summary>
                  {juego.logros.length === 0 ? (
                    <p className="muted">Sin logros</p>
                  ) : (
                    <ul className="logros">
                      {juego.logros.map((logro) => (
                        <li key={logro._id}>
                          <label className="check">
                            <input
                              type="checkbox"
                              checked={logro.obtenido}
                              onChange={(evento) =>
                                void cambiarLogro(juego._id, logro._id, evento.target.checked)
                              }
                            />
                            <span>{logro.nombre}{logro.descripcion ? ` — ${logro.descripcion}` : ""}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                </details>
                <button type="button" className="ghost detail-toggle" onClick={() => { window.location.hash = `/juego/${encodeURIComponent(juego._id)}`; }}>
                  Ver ficha completa
                </button>
                {detalleId === juego._id ? (
                  <div className="detalle">
                    {detalleCargando ? <p className="muted">Cargando detalle…</p> : null}
                    {resumenes[juego._id] ? (
                      <dl className="resumen">
                        <div><dt>Horas</dt><dd>{resumenes[juego._id].horasTotales}</dd></div>
                        <div><dt>Sesiones</dt><dd>{resumenes[juego._id].cantidadPartidas}</dd></div>
                        <div><dt>Avance</dt><dd>{resumenes[juego._id].avanceActual === null ? "—" : `${resumenes[juego._id].avanceActual}%`}</dd></div>
                      </dl>
                    ) : null}
                    <div className="partida-form">
                      <label>Fecha<input type="date" value={partidaFecha} onChange={(evento) => setPartidaFecha(evento.target.value)} /></label>
                      <label>Minutos<input type="number" min="1" max="1440" value={partidaDuracion} onChange={(evento) => setPartidaDuracion(evento.target.value)} /></label>
                      <label>Avance (%)<input type="number" min="0" max="100" value={partidaAvance} onChange={(evento) => setPartidaAvance(evento.target.value)} /></label>
                      <button type="button" onClick={() => void guardarPartida(juego._id)}>Guardar partida</button>
                    </div>
                    {partidas[juego._id]?.length ? (
                      <ul className="partidas">
                        {partidas[juego._id].map((partida) => <li key={partida._id}>{new Date(partida.fecha).toLocaleDateString("es-ES")} · {partida.duracionMinutos} min · {partida.porcentajeAvance}%</li>)}
                      </ul>
                    ) : <p className="muted">Aún no hay partidas registradas.</p>}
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
