# Spec — GET /health

## Contexto

La raíz de la API responde 404: no hay un documento de bienvenida. Hace falta
una ruta barata para saber si el proceso está vivo, sin abrir MongoDB. El
chequeo de salud ya desplegado en Render (`healthCheckPath: /api/videojuegos` en
`render.yaml`) sigue igual y continúa comprobando la API contra la base.

## DEBE

1. `GET /health` responde **200** con `{ "status": "ok" }`.
2. No consulta MongoDB ni lee `MONGODB_URI`.
3. Mantiene el contrato de `/api/*` y el **404** de cualquier ruta desconocida,
   incluida `GET /`.
4. Tiene un test HTTP (supertest sobre `crearApp`) que no necesita base de datos.

## NO DEBE

1. Cambiar `healthCheckPath` en `render.yaml`.
2. Devolver la URI de Mongo, el estado de la conexión o cualquier secreto.
3. Sustituir el 404 de `GET /` por la respuesta de `/health`.

## Criterio → verificación

| Criterio                        | Verificación                                     |
| ------------------------------- | ------------------------------------------------ |
| 200 y cuerpo `{ status: "ok" }` | Test HTTP de `GET /health`                       |
| Sin base de datos               | El test no llama a `conectarDB` ni a los modelos |
| `GET /` sigue en 404            | Test HTTP con código `NO_ENCONTRADO`             |
| Deploy de Render intacto        | `render.yaml` no cambia                          |
