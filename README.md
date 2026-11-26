# Diario de Progreso Gamer

## Para quien revise el repo

Diario personal de videojuegos, usado como muestra de ingeniería de software: una API REST en Express y TypeScript con MongoDB, y un cliente en React. Ahí se registran juegos, sesiones, metas semanales y rachas. Este cambio añade una ruta para saber si el proceso está vivo, tests por encima del dominio, integración continua y un hook del agente más seguro. Juegos, sesiones, metas y rachas siguen como los define el PRD.

### Stack

- **API:** Node.js ≥ 20, Express 5, TypeScript, Mongoose, MongoDB Atlas
- **Web:** React 18, TypeScript, Vite
- **Tests:** Vitest. Las reglas de dominio corren sin base de datos; los tests HTTP y de servicio simulan la frontera del servicio o Mongoose
- **Despliegue:** servicio web y sitio estático en Render ([`render.yaml`](./render.yaml))
- **Semana y rachas:** `America/Guayaquil`

### Arquitectura

```text
Navegador (React + Vite)
        |  VITE_API_URL
        v
crearApp — requestId, logger, CORS, JSON
        |-- GET /health                         vivo, sin base de datos
        |-- /api/videojuegos | /api/partidas | /api/metas
        v
controladores → servicios → modelos Mongoose → MongoDB
                    |
                    +→ dominio/progreso.ts      horas, rachas e hitos, funciones puras
        |
        v
errorHandler → 400 VALIDACION o ID_INVALIDO, 404 NO_ENCONTRADO,
               409 CONFLICTO, 500 INESPERADO
```

Los modelos no guardan las reglas de negocio, los servicios no escriben HTTP y `dominio/` no importa Mongoose. La web es un sitio estático y usa el hash en la URL para que la ficha de un juego funcione sin rewrites del servidor.

### Cómo correrlo y probarlo

MongoDB hace falta para arrancar la API. `npm test` no abre una base de datos.

```bash
cd backend
cp .env.example .env   # MONGODB_URI en local; nunca commitear .env
npm ci
npm test               # Vitest
npm run typecheck      # tsc --noEmit
npm run dev            # http://localhost:3001

cd ../frontend
cp .env.example .env   # VITE_API_URL=http://localhost:3001
npm ci
npm run dev            # http://localhost:5174
npm run build          # tsc + Vite
```

El chequeo estático es el compilador de TypeScript. GitHub Actions ([`.github/workflows/ci.yml`](./.github/workflows/ci.yml)) corre el typecheck y los tests del backend, y el build de producción del frontend, en cada pull request y en `main`.

### Demo en vivo

- App: https://diario-gamer-web-55fd.onrender.com/
- API: https://diario-gamer-api-3lsk.onrender.com
- Ruta que el health check de Render ya consulta: https://diario-gamer-api-3lsk.onrender.com/api/videojuegos
- Vida del proceso, cuando esta rama esté desplegada: https://diario-gamer-api-3lsk.onrender.com/health

`GET /` responde 404 (ruta desconocida). `GET /health` devuelve `{ "status": "ok" }` y no consulta MongoDB. [`render.yaml`](./render.yaml) mantiene `healthCheckPath: /api/videojuegos`.

### Cómo está armado el trabajo con el agente

Metas semanales y rachas siguieron un ciclo con spec. Una regla de producto se puede seguir desde el PRD hasta un test:

1. **PRD** — reglas de producto, sin detalle de implementación: [`docs/prd/prd-e2-metas-y-rachas.md`](./docs/prd/prd-e2-metas-y-rachas.md)
2. **Specs** — se commitean antes del código que las implementa: [`docs/specs/`](./docs/specs/)
3. **Reglas del agente** — [`AGENTS.md`](./AGENTS.md) (capas, tipos de error, no tocar `.env`, zona horaria, tests antes de cerrar una tarea)
4. **Hooks de Cursor** — [`.cursor/hooks.json`](./.cursor/hooks.json). `.cursor/hooks/auto-commit.sh` solo commitea si `DIARIO_AUTO_COMMIT=1`. Sin esa variable, un commit por cada edición llenaba el historial y podía guardar trabajo a medias. Los commits ya publicados se dejaron como estaban.
5. **Tests** — casos puros de dominio en `backend/src/dominio/progreso.test.ts`, más tests HTTP y de servicio que siguen siendo deterministas sin MongoDB.

Una retrospectiva corta, con una desviación de spec vista en el JSON público, está en [`docs/bitacora-agente.md`](./docs/bitacora-agente.md). Lo que sigue es la documentación original del proyecto.

---

Diario personal para registrar videojuegos, sesiones de juego, horas,
porcentaje de avance y logros. El proyecto combina una API REST en Express
con TypeScript, MongoDB mediante Mongoose y una interfaz React con Vite.

## Intención

La aplicación responde tres preguntas de mi diario:

1. ¿Qué estoy jugando?
2. ¿Cuánto tiempo le he dedicado?
3. ¿Qué tan avanzado voy?

La interfaz usa una identidad visual distinta por juego: portadas locales,
fondos monocromáticos, tipografías temáticas, baraja interactiva y una ficha
de progreso.

## Arquitectura

El backend conserva la separación:

```text
backend/src/
  config/
  modelos/
  servicios/
  controladores/
  rutas/
  middleware/
```

- **Modelo:** esquema y validaciones de Mongoose.
- **Servicio:** reglas de negocio, filtros y resumen calculado.
- **Controlador:** traducción entre HTTP y servicios.
- **Ruta:** método HTTP y URL.
- **Middleware:** request id, logger, CORS, JSON y errores.

El frontend está en `frontend/src/` y consume la API mediante servicios
TypeScript. La navegación de detalle usa hash para funcionar en un Static
Site de Render sin depender de rewrites del servidor.

## Modelo de datos

### Videojuego

Colección: `videojuegos`.

| Campo | Tipo y validación |
| --- | --- |
| `nombre` | `String`, obligatorio, con `trim` |
| `genero` | `String`, obligatorio, enum predefinido |
| `descripcion` | `String`, opcional, por defecto `""` |
| `plataforma` | enum: `PC`, `PlayStation`, `Xbox`, `Nintendo`, `Mobile` |
| `estado` | enum: `pendiente`, `jugando`, `completado`, `abandonado` |
| `logros` | arreglo de subdocumentos embebidos |

Cada logro embebido tiene `_id`, `nombre`, `descripcion` y `obtenido`.

### Partida

Colección: `partidas`.

| Campo | Tipo y validación |
| --- | --- |
| `videojuego` | `ObjectId`, `ref: "Videojuego"`, obligatorio |
| `fecha` | `Date`, obligatorio |
| `duracionMinutos` | `Number`, mínimo `1`, máximo `1440` |
| `porcentajeAvance` | `Number`, mínimo `0`, máximo `100` |

### Decisión embebido + referenciado

Los **logros se embeben** porque pertenecen directamente a la ficha del juego,
se leen junto con él y forman una lista acotada. Cada logro puede actualizarse
sin crear una colección adicional.

Las **partidas se referencian** porque pueden crecer indefinidamente y deben
consultarse, ordenarse y agregarse sin aumentar el documento del videojuego.
La referencia usa `ObjectId` y `ref: "Videojuego"`. La API utiliza `populate`
para devolver la relación cuando se listan o crean partidas.

## Fórmula del resumen

La lógica vive en
[`backend/src/servicios/partidaServicio.ts`](./backend/src/servicios/partidaServicio.ts),
no en React.

```text
horasTotales = round((sumatoria de duracionMinutos / 60) * 100) / 100
cantidadPartidas = número total de partidas
fechaUltimaSesion = fecha máxima
avanceActual = porcentajeAvance de la partida más reciente
```

Si dos partidas empatan en fecha, gana la que tenga el `_id` mayor. Si no
existen partidas, el servicio devuelve:

```json
{
  "horasTotales": 0,
  "cantidadPartidas": 0,
  "fechaUltimaSesion": null,
  "avanceActual": null
}
```

Después de guardar una nueva partida, la ficha vuelve a consultar partidas y
resumen, por lo que los datos se actualizan inmediatamente.

## API REST

### Estado del servicio

| Método | Ruta | Función |
| --- | --- | --- |
| GET | `/health` | Liveness. Responde `{ "status": "ok" }` sin consultar MongoDB. |

`GET /` responde 404. El `healthCheckPath` de Render sigue en `/api/videojuegos`.

### Videojuegos

| Método | Ruta | Función |
| --- | --- | --- |
| GET | `/api/videojuegos` | Lista con filtros opcionales |
| POST | `/api/videojuegos` | Crea un videojuego |
| GET | `/api/videojuegos/:id` | Obtiene un videojuego |
| PATCH | `/api/videojuegos/:id` | Actualiza campos del videojuego |
| DELETE | `/api/videojuegos/:id` | Elimina un videojuego |
| PATCH | `/api/videojuegos/:id/logros/:logroId` | Actualiza `obtenido` |

### Partidas y resumen

| Método | Ruta | Función |
| --- | --- | --- |
| GET | `/api/partidas` | Lista partidas con `populate` |
| POST | `/api/partidas` | Registra una sesión |
| DELETE | `/api/partidas/:id` | Elimina una sesión |
| GET | `/api/videojuegos/:id/partidas` | Lista sesiones de un juego |
| GET | `/api/videojuegos/:id/resumen` | Devuelve el resumen calculado |
| GET | `/api/videojuegos/:id/progreso-semanal` | Progreso semanal, rachas e hitos |
| GET | `/api/videojuegos/:id/metas` | Lista metas del videojuego |

### Metas (E2)

| Método | Ruta | Función |
| --- | --- | --- |
| POST | `/api/metas` | Crea una meta (409 si ya hay una activa) |
| GET | `/api/metas/:id` | Obtiene una meta |
| PATCH | `/api/metas/:id` | Actualiza meta / hitos / activa |
| POST | `/api/metas/:id/desactivar` | Desactiva la meta |

### Errores

El middleware central diferencia:

| Situación | Status | Código |
| --- | ---: | --- |
| Cuerpo, filtro o esquema inválido | 400 | `VALIDACION` |
| ObjectId inválido o `CastError` | 400 | `ID_INVALIDO` |
| Documento, logro o ruta inexistente | 404 | `NO_ENCONTRADO` |
| Conflicto de negocio (p. ej. meta activa duplicada) | 409 | `CONFLICTO` |
| Error no previsto | 500 | `INESPERADO` |

Cada respuesta de error incluye `requestId`; los detalles de validación se
devuelven en el campo `detalles`.

## Configuración local

Requisitos: Node.js 20 o superior, npm y MongoDB Atlas o MongoDB local.

Variables:

- [`backend/.env.example`](./backend/.env.example)
- [`frontend/.env.example`](./frontend/.env.example)

Comandos de desarrollo:

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

En otra terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

El seed es idempotente y carga los siete juegos y sus sesiones iniciales:

```bash
cd backend && npm run seed
```

Validación de compilación. `npm test` no abre MongoDB: el dominio es puro y
los tests de rutas y servicios sustituyen Mongoose.

```bash
cd frontend && npm run build
cd ../backend && npm test && npm run typecheck && npm run build
```

En cada pull request y en `main`, el workflow [`.github/workflows/ci.yml`](./.github/workflows/ci.yml)
ejecuta ese typecheck, los tests del backend y el build del frontend.

Documentación SDD de E2: [`docs/`](./docs/) (diagnóstico, PRD, backlog, specs, [AUDITORIA](./docs/AUDITORIA.md)).

## Cómo trabajamos con el agente

El Proyecto 4 se construyó con un agente de IA dentro de un harness SDD. La
cadena seguida fue:

```text
diagnóstico → harness → PRD → épica → historias → criterios → tickets → specs → código + tests → auditoría → demo
```

### Harness

| Pieza | Dónde |
| --- | --- |
| Prompt / reglas del repo | [`AGENTS.md`](./AGENTS.md), [`CLAUDE.md`](./CLAUDE.md) |
| Identidad visual | [`DESIGN.md`](./DESIGN.md) |
| Skills | [`.agents/skills/frontend-design/`](./.agents/skills/frontend-design/), [`.claude/skills/`](./.claude/skills/) |
| Hooks | [`.cursor/hooks.json`](./.cursor/hooks.json), [`.claude/settings.json`](./.claude/settings.json) |
| Instrucciones Copilot (legado P3) | [`.github/copilot-instructions.md`](./.github/copilot-instructions.md) |

Reglas clave del harness: no tocar `.env` (solo `.env.example`), no código sin
spec en `docs/specs/`, tests de dominio verdes antes de cerrar un ticket, zona
`America/Guayaquil` para semana y rachas.

El hook `.cursor/hooks/auto-commit.sh` solo crea commits si
`DIARIO_AUTO_COMMIT=1`. Por defecto no commitea: un commit en cada edición
llenaba el historial de mensajes genéricos y podía guardar trabajo a medias.
Los commits ya publicados se dejaron como estaban.

### Flujo seguido

1. Diagnóstico del Proyecto 3 y deuda D1/D3 → [`docs/diagnostico.md`](./docs/diagnostico.md)
2. Harness (AGENTS, skills, hooks, DESIGN)
3. PRD de producto sin detalle técnico → [`docs/prd/prd-e2-metas-y-rachas.md`](./docs/prd/prd-e2-metas-y-rachas.md)
4. Épicas e historias → [`docs/backlog/epicas.md`](./docs/backlog/epicas.md), [`docs/backlog/E2-metas-y-rachas.md`](./docs/backlog/E2-metas-y-rachas.md)
5. Specs backend/frontend **antes** del código → [`docs/specs/`](./docs/specs/)
6. Dominio puro + Vitest, luego Meta CRUD, progreso-semanal, UI en la ficha
7. Auditoría criterio a criterio → [`docs/AUDITORIA.md`](./docs/AUDITORIA.md)
8. Bitácora del agente (aciertos, fricciones, una desviación de spec) → [`docs/bitacora-agente.md`](./docs/bitacora-agente.md)

En Git, cada spec se commitó antes que su implementación (`docs(specs)` →
`feat(E2): T-03` → API → UI). La épica entró a `main` por
[PR #9](https://github.com/AshenThread/diario-gamer/pull/9) y
[PR #10](https://github.com/AshenThread/diario-gamer/pull/10).

### Demo (fase 10)

En la URL pública: crear meta con hitos → registrar partidas → ver progreso y
racha → alcanzar un hito → provocar 409 de meta duplicada → trazar un criterio
PRD → historia → ticket → spec → test → código → auditoría.

## Despliegue público

El despliegue activo en Render está disponible en:

- Frontend: [https://diario-gamer-web-55fd.onrender.com/](https://diario-gamer-web-55fd.onrender.com/)
- Backend / API: [https://diario-gamer-api-3lsk.onrender.com](https://diario-gamer-api-3lsk.onrender.com)

El frontend público consume la API pública mediante `VITE_API_URL`. El backend
usa `CORS_ORIGIN` con el origen del Static Site. Las credenciales de MongoDB y
las variables privadas de Render no están en el repositorio.

La infraestructura declarativa está en [`render.yaml`](./render.yaml).

## Tipografías por juego

Se usan equivalentes libres de Google Fonts, no tipografías propietarias:

| Juego | Tipografía |
| --- | --- |
| Cyberpunk 2077 | Orbitron |
| Hades | Cinzel |
| Celeste | Quicksand |
| Hollow Knight / Silksong | IM Fell English SC |
| Genshin Impact | Crimson Pro |
| Red Dead Redemption 2 | Roboto Slab |

Se aplican a títulos y cartas; el texto de lectura mantiene una fuente general.

## Proceso de colaboración

La configuración de agentes, skills, prompt base y criterios de colaboración
está en
[`/.github/copilot-instructions.md`](./.github/copilot-instructions.md)
y se complementa con el harness de la sección anterior.

El proyecto fue dirigido por su propietario: definió la intención, los modelos,
la experiencia, la estética, las iteraciones y las conexiones entre frontend,
backend, MongoDB y Render. La IA se utilizó como apoyo para sugerencias
técnicas, visuales y de validación. La distribución declarada del proceso es
aproximadamente 90% dirección, decisiones, integración y revisión del
propietario, y 10% sugerencias asistidas por IA.

## Historial de trabajo

El repositorio conserva ramas de trabajo y pull requests integrados, entre
ellos:

- [PR #9 — feat(E2): Metas y rachas](https://github.com/AshenThread/diario-gamer/pull/9)
- [PR #10 — Feature/e2 metas rachas (harness Cursor)](https://github.com/AshenThread/diario-gamer/pull/10)
- [PR #1 — entrega final del diario gamer](https://github.com/AshenThread/diario-gamer/pull/1)
- [PR #5 — tipografías temáticas](https://github.com/AshenThread/diario-gamer/pull/5)
- [PR #7 — glitch de código y copy personal](https://github.com/AshenThread/diario-gamer/pull/7)
