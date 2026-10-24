import { FormEvent, useEffect, useRef, useState } from "react";
import { ErrorHttp, actualizarEstado, crearVideojuego, eliminarVideojuego, listarVideojuegos, marcarLogro } from "./api/videojuegosApi";
import { crearPartida, listarPartidas, obtenerResumen } from "./api/partidasApi";
import { ESTADOS, PLATAFORMAS, type Estado, type LogroFormulario, type Partida, type Plataforma, type Resumen, type Videojuego } from "./tipos";

const LOGRO_VACIO: LogroFormulario = { nombre: "", descripcion: "", obtenido: false };
const FECHA_HOY = new Date().toISOString().slice(0, 10);

function slugPortada(nombre: string): string {
  return nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
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

export function App() {
  const [juegos, setJuegos] = useState<Videojuego[]>([]);
  const [nombre, setNombre] = useState("");
  const [genero, setGenero] = useState("");
  const [plataforma, setPlataforma] = useState<Plataforma>("PC");
  const [estado, setEstado] = useState<Estado>("jugando");
  const [logros, setLogros] = useState<LogroFormulario[]>([{ ...LOGRO_VACIO }]);
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

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setAviso(null);
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) {
      setError("El nombre es obligatorio.");
      return;
    }
    if (!genero.trim()) {
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
        genero: genero.trim(),
        plataforma,
        estado,
        logros: logrosLimpios,
      });
      setNombre("");
      setGenero("");
      setPlataforma("PC");
      setEstado("jugando");
      setLogros([{ ...LOGRO_VACIO }]);
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

  return (
    <main className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Archivo personal / 2024—25</p>
          <h1>Qué estoy<br /><em>jugando</em></h1>
        </div>
        <p className="lead">
          Un registro vivo de partidas, plataformas y logros. Añade una entrada y deja que el
          archivo crezca contigo.
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
          <input
            value={genero}
            onChange={(evento) => setGenero(evento.target.value)}
            placeholder="Acción y aventura"
            required
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
            </div>
          ))}
          <button
            type="button"
            className="ghost"
            onClick={() => setLogros([...logros, { ...LOGRO_VACIO }])}
          >
            Añadir logro
          </button>
        </fieldset>

        {error ? <p className="error">{error}</p> : null}
        {aviso ? <p className="aviso">{aviso}</p> : null}

        <button type="submit" disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar en MongoDB"}
        </button>
        </form>
      </details>

      <section className="library">
        <div className="section-heading">
          <div>
            <p className="eyebrow">02 / Colección</p>
            <h2>En la base <em>diario_gamer</em></h2>
          </div>
          <div className="carousel-controls" aria-label="Controles de la colección">
            <button type="button" className="icon-button" aria-label="Videojuegos anteriores" onClick={() => desplazarBiblioteca(-1)}>←</button>
            <button type="button" className="icon-button" aria-label="Siguientes videojuegos" onClick={() => desplazarBiblioteca(1)}>→</button>
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
            <li key={juego._id}>
              <div className="cover-slot">
                <img
                  src={`/img/${slugPortada(juego.nombre)}.jpg`}
                  alt={`Portada de ${juego.nombre}`}
                  onError={(evento) => {
                    evento.currentTarget.onerror = null;
                    evento.currentTarget.src = `/img2/${(juego._id.charCodeAt(0) % 3) + 1}.svg`;
                  }}
                />
              </div>
              <div className="game-body">
                <div className="juego-cabecera">
                  <div>
                    <strong>{juego.nombre}</strong>
                    <span className="platform">{juego.genero} · {juego.plataforma}</span>
                  </div>
                  <button type="button" className="peligro" onClick={() => void borrar(juego._id, juego.nombre)}>
                    Borrar
                  </button>
                </div>
                <label className="status-control">
                  Estado
                  <select
                    value={juego.estado}
                    onChange={(evento) => void cambiarEstado(juego._id, evento.target.value as Estado)}
                  >
                    {ESTADOS.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </label>
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
                <button type="button" className="ghost detail-toggle" onClick={() => void abrirDetalle(juego._id)}>
                  {detalleId === juego._id ? "Actualizar detalle" : "Ver partidas y resumen"}
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
