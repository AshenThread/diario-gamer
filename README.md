# Diario de Progreso Gamer

API para responder tres preguntas: qué estoy jugando ahora, cuánto tiempo le he dedicado y qué tan avanzado voy. Una API es un programa que recibe peticiones HTTP y devuelve datos. Aquí los datos viajan en JSON, un texto que representa objetos con campos. El backend es este programa: guarda los videojuegos y responde. El frontend, la pantalla en React con el formulario para crear juegos, llega en la etapa 3. Hasta entonces los juegos se crean con una petición HTTP.

CRUD son las cuatro operaciones sobre esos datos: crear, leer, actualizar y borrar. Esta entrega deja escrita la base de la etapa 1 (este documento) y programada la etapa 2 (el CRUD de videojuegos).

## Piezas

Cada pieza tiene un trabajo. Mezclarlas hace que la URI, el esquema y el HTTP terminen en el mismo archivo.

- **MongoDB** guarda documentos dentro de colecciones. Un documento es un objeto con campos, del estilo de un JSON. Una colección es el grupo de documentos del mismo tipo.
- **MongoDB Atlas** es esa base de datos en la nube. La URI (la dirección completa, con usuario y contraseña) va en `.env`. El código no contiene esa cadena ni credenciales de ejemplo disfrazadas de reales.
- **Mongoose** es la librería del backend que define esquemas y habla con Atlas. Un esquema es la forma de un documento: campos, obligatoriedad y valores permitidos. El hosting de la base es Atlas.
- **Express** es el servidor HTTP de la API. Recibe la petición, la pasa por las capas y devuelve la respuesta.
- **TypeScript** es JavaScript con tipos: el editor avisa si un campo no coincide con el esquema antes de ejecutar.
- **Render** es el hosting de más adelante. Un servicio allí es un programa desplegado. Habrá dos: backend y frontend.

Las capas van en este orden:

1. **Ruta.** La URL más el método HTTP. El método es el verbo: GET lee, POST crea, PATCH cambia solo lo enviado, DELETE borra.
2. **Controlador.** Traduce esa petición a una llamada. No decide reglas.
3. **Servicio.** Las reglas: filtros, ids, errores y, en la etapa 3, el resumen de horas.
4. **Modelo.** El esquema de Mongoose.

`backend/src/config/env.ts` lee y valida `process.env`. Una variable de entorno es un valor que el proceso recibe al arrancar; en local sale del archivo `.env`. `process.env` es el objeto donde Node las deja. `backend/src/config/conexionDB.ts` llama a `mongoose.connect` con la URI que devuelve `env.ts` y no lee `process.env`.

La conexión se abre una vez al arrancar y Mongoose la reutiliza. El pool es el grupo de conexiones ya abiertas, para no repetir el enlace en cada consulta. El tamaño se queda en el default del driver: hay un solo proceso y todavía no hay una cifra de concurrencia medida.

```
backend/
  src/config/env.ts
  src/config/conexionDB.ts
  src/modelos/Videojuego.ts
  src/servicios/videojuegoServicio.ts
  src/controladores/videojuegoControlador.ts
  src/rutas/videojuegoRutas.ts
  src/middleware/requestId.ts
  src/middleware/logger.ts
  src/middleware/errorHandler.ts
  src/app.ts
  src/server.ts
  .env.example
```

## Esquema Videojuego

Un enum es una lista cerrada: el campo solo acepta una de esas opciones. `trim` quita espacios al inicio y al final antes de guardar.

| Campo | Reglas |
| --- | --- |
| nombre | string, obligatorio, trim |
| plataforma | enum: `PC`, `PlayStation`, `Xbox`, `Nintendo`, `Mobile`. Obligatoria: sin ella el diario no puede decir dónde lo juegas. |
| estado | enum: `pendiente`, `jugando`, `completado`, `abandonado`. Obligatorio: es la respuesta a qué estás jugando ahora. |
| logros | arreglo de subdocumentos. Un subdocumento es un objeto con su propia forma, guardado dentro del juego. No es un string suelto. |

Cada logro:

| Campo | Reglas |
| --- | --- |
| nombre | string, obligatorio, trim |
| descripcion | string, por defecto `""`, trim |
| obtenido | boolean (verdadero o falso), por defecto `false` |

Mongoose asigna `_id` al videojuego y a cada logro. Un ObjectId es el identificador de un documento: 24 caracteres hexadecimales (dígitos `0-9` y letras `a-f`). La colección se llama `videojuegos`. El modelo se llama `Videojuego`, que es el nombre que Partida usará en su `ref`.

Al crear, los campos de más se ignoran. El `_id` lo genera MongoDB. Si envías `logros` en un PATCH del juego, ese arreglo sustituye al anterior; para marcar uno solo usa el endpoint del logro.

```json
{
  "nombre": "Hades",
  "plataforma": "PC",
  "estado": "jugando",
  "logros": [
    {
      "nombre": "Primera huida",
      "descripcion": "Escapa una vez",
      "obtenido": false
    }
  ]
}
```

## Esquema Partida

Partida queda descrita aquí y se programa en la etapa 3. Cada sesión será un documento en su propia colección. Los cuatro campos son obligatorios: sin ellos el resumen no puede calcularse.

| Campo | Reglas |
| --- | --- |
| videojuego | ObjectId con `ref: "Videojuego"`. `ref` le dice a Mongoose a qué modelo apunta ese id. |
| fecha | Date, el tipo de fecha y hora. |
| duracionMinutos | número, mínimo 1, máximo 1440 (un día, en minutos). |
| porcentajeAvance | número, mínimo 0, máximo 100. |

Cuando exista, Mongoose también le pondrá `_id` a cada partida. Ese `_id` desempata el avance si dos sesiones comparten la fecha máxima.

## Por qué los logros se embeben y Partida se referencia

Embeber es guardar los logros dentro del documento del videojuego. Se embeben porque se leen siempre con el juego, no tienen colección propia y la lista es corta.

Referenciar es guardar en la partida solo el ObjectId del videojuego, con la partida en otra colección. Se referencia porque la lista crece sin límite y las partidas se consultan solas, por ejemplo para sumar minutos. MongoDB limita cada documento a 16 MB; dejar todas las sesiones futuras dentro del juego hincharía ese documento en cada lectura.

## Fórmula del resumen

El cálculo vive en el servicio. El controlador solo traducirá el HTTP. El frontend solo mostrará el número que el servicio ya redondeó. Hoy la fórmula está documentada y sin endpoint.

El status es el código numérico con el que el servidor resume el resultado. Si el videojuego no existe, el status es 404 (no encontrado).

Si el videojuego existe y no tiene partidas:

- `horasTotales`: 0
- `cantidadPartidas`: 0
- `fechaUltimaSesion`: null
- `avanceActual`: null

Si hay partidas:

- `horasTotales` = suma de `duracionMinutos` / 60, a 2 decimales, con `Math.round((suma / 60) * 100) / 100`.
- `cantidadPartidas` = cuántas partidas hay.
- `fechaUltimaSesion` = la fecha máxima.
- `avanceActual` = el `porcentajeAvance` de la partida con esa fecha máxima. Si varias empatan, gana el `_id` mayor.

Ejemplo: partidas de 50, 40 y 25 minutos. La suma es 115. `115 / 60 = 1.9166…`, por `100` es `191.666…`, `Math.round` da `192`, dividido entre `100` da **1.92** horas. `cantidadPartidas` es **3**. El **42** no sale de los minutos: es el `porcentajeAvance` guardado en la partida de 25 minutos, cuando esa es la más nueva del mismo día. `fechaUltimaSesion` es la fecha de esa misma partida. Si otra partida del mismo día empatara en fecha, el avance saldría de la que tenga el `_id` mayor.

## Cómo conectar Atlas

1. Entra en [MongoDB Atlas](https://www.mongodb.com/atlas) y crea un proyecto.
2. Crea un cluster. Un cluster es el grupo de servidores que guarda la base. El plan gratuito, llamado M0, alcanza para este diario.
3. En **Database Access** crea un usuario de base de datos, con contraseña propia (distinta de tu cuenta de Atlas) y permiso de lectura y escritura.
4. En **Network Access** permite tu IP actual. Network Access es la lista de direcciones desde las que Atlas acepta conexiones. Tu IP actual basta para trabajar en local. `0.0.0.0/0` abre el cluster a cualquier IP: hace falta cuando la IP cambia o, más adelante, en Render, y exige una contraseña fuerte porque la base queda alcanzable desde internet.
5. En **Connect → Drivers** copia la URI. Sustituye `<password>` por la contraseña de ese usuario. Si la contraseña tiene `@`, `#` o `/`, codifícala para URL (`@` pasa a ser `%40`). En el path (el tramo de la URI que nombra la base) deja `diario_gamer`.
6. Pega el resultado en `backend/.env` como `MONGODB_URI`. El archivo correcto está junto a `backend/package.json`, no en la raíz del repo.

## Cómo correr el backend en local

```bash
cd backend
cp .env.example .env
```

Edita `.env` y pon la URI real. Después:

```bash
npm install
npm run dev
```

`npm run dev` usa tsx, un ejecutor que corre TypeScript directamente y reinicia el proceso al guardar. La API escucha en `http://localhost:3000`. El puerto es el número de la puerta de red; lo marca `PORT`.

Si falta `MONGODB_URI`, está vacía o no empieza por `mongodb://` ni `mongodb+srv://`, el proceso termina antes de escuchar.

`npm run build` compila a `backend/dist`. `npm start` ejecuta ese JavaScript. `dist` queda fuera de git.

## .env.example

El archivo real es `backend/.env.example`. Cópialo a `backend/.env`. `.gitignore` es la lista de archivos que git no guarda; ahí está `.env`, así la URI no entra al repositorio.

```
MONGODB_URI=mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/diario_gamer?retryWrites=true&w=majority
PORT=3000
CORS_ORIGIN=http://localhost:5173
```

CORS es el permiso del navegador para que una página en otro origen (otro puerto) llame a esta API. `CORS_ORIGIN` es ese origen permitido. El formulario React todavía no existe; la variable ya se lee para no reabrir el arranque en la etapa 3. Si omites `PORT`, se usa `3000`. Si omites `CORS_ORIGIN`, se usa `http://localhost:5173`.

`<usuario>`, `<password>` y `<cluster>` son huecos para sustituir. No son una cuenta real.

## Etapa 2

Un endpoint es una ruta concreta: método más URL. La lista responde un arreglo JSON. Crear responde 201 (creado) con el documento y sus `_id`. Borrar responde 204 (sin cuerpo). Un filtro tiene que coincidir exactamente con el enum; si envías `estado` y `plataforma`, se cumplen los dos.

| Método | Ruta | Qué hace |
| --- | --- | --- |
| GET | `/api/videojuegos` | Lista. Filtros opcionales `?estado=` y `?plataforma=`. |
| GET | `/api/videojuegos/:id` | Devuelve un videojuego. |
| POST | `/api/videojuegos` | Crea el videojuego. |
| PATCH | `/api/videojuegos/:id` | Cambia solo `nombre`, `plataforma`, `estado` o `logros`, los que vengan en el cuerpo. |
| DELETE | `/api/videojuegos/:id` | Borra. Status 204. |
| PATCH | `/api/videojuegos/:id/logros/:logroId` | Cuerpo `{ "obtenido": true }` o `{ "obtenido": false }`. Devuelve el videojuego. |

### Middleware

Un middleware es una función que ve la petición, en orden, alrededor de la ruta. `asyncHandler` envuelve cada controlador: si la función async falla, el error sigue hacia el `errorHandler` en lugar de quedarse perdido.

1. `requestId` crea un identificador único de esa petición y lo devuelve en la cabecera `X-Request-Id`. Una cabecera es un dato que viaja junto a la respuesta, aparte del JSON.
2. `logger` escribe en consola método, URL, status y milisegundos cuando la respuesta termina.
3. `errorHandler` va al final y deja el fallo en uno de estos cuatro:

| Situación | Status | codigo |
| --- | --- | --- |
| El cuerpo, el filtro o el esquema no se cumple | 400 | `VALIDACION` |
| El id no tiene 24 caracteres hexadecimales | 400 | `ID_INVALIDO` |
| No existe el videojuego, el logro o la ruta | 404 | `NO_ENCONTRADO` |
| Cualquier otro fallo | 500 | `INESPERADO` |

El 500 guarda el detalle en la consola, junto al identificador de la petición, y al cliente le responde solo «Error inesperado». En validación puede venir `detalles`, un arreglo de frases.

```json
{
  "codigo": "NO_ENCONTRADO",
  "error": "Videojuego no encontrado",
  "status": 404,
  "requestId": "..."
}
```

Mongoose suele añadir `__v`, un contador interno de cambios simultáneos. Aquí `versionKey: false` lo deja fuera, y el JSON trae los campos del esquema más los `_id`.

### Probar con curl

`curl` es el comando de terminal que hace la petición HTTP. Con `npm run dev` en marcha y la URI ya puesta en `backend/.env`:

```bash
curl -s -X POST http://localhost:3000/api/videojuegos \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Hades","plataforma":"PC","estado":"jugando","logros":[{"nombre":"Primera huida","descripcion":"Escapa una vez","obtenido":false}]}'
```

Crea el videojuego y muestra el JSON, con el `_id` del juego y el del logro.

```bash
curl -s "http://localhost:3000/api/videojuegos?estado=jugando&plataforma=PC"
```

Lista los que están en jugando y en PC a la vez.

```bash
curl -s http://localhost:3000/api/videojuegos/ID_DEL_JUEGO
```

Devuelve ese videojuego.

```bash
curl -s -X PATCH http://localhost:3000/api/videojuegos/ID_DEL_JUEGO \
  -H "Content-Type: application/json" \
  -d '{"estado":"completado"}'
```

Cambia solo el estado. El nombre y los logros se quedan.

```bash
curl -s -X PATCH http://localhost:3000/api/videojuegos/ID_DEL_JUEGO/logros/ID_DEL_LOGRO \
  -H "Content-Type: application/json" \
  -d '{"obtenido":true}'
```

Marca ese logro como obtenido.

```bash
curl -s -i -X DELETE http://localhost:3000/api/videojuegos/ID_DEL_JUEGO
```

Borra el videojuego. La primera línea de la respuesta debe decir `204`.

Sustituye `ID_DEL_JUEGO` e `ID_DEL_LOGRO` por los valores que devolvió el POST.

## Siguiente: etapa 3

- Modelo Partida, con referencia a `Videojuego`, y sus rutas.
- Resumen en el servicio: 404 si el juego no existe; ceros y null si no hay partidas; si hay, la fórmula de arriba.
- Formulario en React para crear videojuegos.
- Despliegue en Render: un servicio para el backend y otro para el frontend.
