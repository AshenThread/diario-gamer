# Diario de Progreso Gamer

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

### Errores

El middleware central diferencia:

| Situación | Status | Código |
| --- | ---: | --- |
| Cuerpo, filtro o esquema inválido | 400 | `VALIDACION` |
| ObjectId inválido o `CastError` | 400 | `ID_INVALIDO` |
| Documento, logro o ruta inexistente | 404 | `NO_ENCONTRADO` |
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

Validación de compilación:

```bash
cd frontend && npm run build
cd ../backend && npm run typecheck && npm run build
```

## Despliegue público

El despliegue activo en Render está disponible en:

- Frontend: <https://diario-gamer-web-55fd.onrender.com/>
- Backend: <https://diario-gamer-api-3lsk.onrender.com/>

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
[`/.github/copilot-instructions.md`](./.github/copilot-instructions.md).

El proyecto fue dirigido por su propietario: definió la intención, los modelos,
la experiencia, la estética, las iteraciones y las conexiones entre frontend,
backend, MongoDB y Render. La IA se utilizó como apoyo para sugerencias
técnicas, visuales y de validación. La distribución declarada del proceso es
aproximadamente 90% dirección, decisiones, integración y revisión del
propietario, y 10% sugerencias asistidas por IA.

## Historial de trabajo

El repositorio conserva ramas de trabajo y pull requests integrados, entre
ellos:

- [PR #1 — entrega final del diario gamer](https://github.com/AshenThread/diario-gamer/pull/1)
- [PR #5 — tipografías temáticas](https://github.com/AshenThread/diario-gamer/pull/5)
- [PR #7 — glitch de código y copy personal](https://github.com/AshenThread/diario-gamer/pull/7)
