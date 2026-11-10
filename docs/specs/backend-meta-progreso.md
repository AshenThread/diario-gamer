# Spec backend — Meta y progreso semanal

## Contexto

Implementa Meta (colección referenciada a Videojuego con hitos embebidos) y el cálculo de progreso semanal / rachas / hitos en dominio puro. Cubre tickets T-01…T-05.

## DEBE

1. Exponer modelo Meta con: `videojuego` (ObjectId ref), `horasSemanales` (0 < n ≤ 100), `diasPorSemana` (entero 1–7), `activa` (default true), `hitos` (máx. 5, cada uno con `descripcion` y `porcentajeObjetivo` 1–100), `createdAt`/`updatedAt`.
2. CRUD: crear, obtener por id, listar por videojuego, actualizar, desactivar.
3. Al crear, validar que el videojuego exista; rechazar segunda meta activa del mismo juego con **409** y mensaje claro.
4. `GET /api/videojuegos/:id/progreso-semanal` con forma del PRD (semana, meta, horas, porcentajes, días, rachas, hitos).
5. Semana lunes–domingo en `America/Guayaquil`.
6. Calcular semana, días, rachas e hitos con funciones puras en `src/dominio/progreso.ts` (sin DB).
7. Racha viva si último día jugado es hoy o ayer; varias partidas/día = un día; día de partida = fecha registrada; porcentaje horas sin tope 100; hitos recalculados; sin meta → `meta: null`, `porcentajeHoras: null`.
8. Id inválido → 400; videojuego inexistente → 404.
9. Eliminar videojuego elimina partidas y metas asociadas.
10. `errorHandler` distingue 400, 404, 409 y 500.
11. Tests automatizados de dominio: al menos un test por criterio verificable sin DB.

## NO DEBE

1. Embebber Meta dentro de Videojuego.
2. Persistir el flag `alcanzado` de un hito.
3. Usar WebSockets para refrescar progreso.
4. Inventar notificaciones, rankings o historial gráfico.
5. Permitir más de una meta activa por videojuego.

## Criterio → verificación

| Criterio                                             | Verificación                                 |
| ---------------------------------------------------- | -------------------------------------------- |
| Validaciones Meta                                    | Test/schema o create inválido → 400          |
| Segunda meta activa                                  | curl/Thunder → 409                           |
| Progreso sin partidas                                | horas/días/rachas 0; hitos no alcanzados     |
| Progreso con ≥5 partidas días distintos y racha rota | valores coherentes con dominio               |
| Racha viva con ayer sí / hoy no                      | test puro dominio                            |
| Varias partidas mismo día                            | test puro → 1 día                            |
| porcentajeHoras > 100                                | test puro                                    |
| Hito recalculado                                     | test puro con avance bajo                    |
| Sin meta activa                                      | `meta: null`, `porcentajeHoras: null`        |
| Id inválido / no existe                              | 400 / 404                                    |
| Cascade delete                                       | tras DELETE videojuego, 0 partidas y 0 metas |
| Funciones dominio sin DB                             | Vitest sobre `progreso.ts`                   |

## Ticket → archivos

| Ticket | Archivos                                                                                                                                                            |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-01   | `backend/src/modelos/Meta.ts`                                                                                                                                       |
| T-02   | `backend/src/servicios/metaServicio.ts`, `controladores/metaControlador.ts`, `rutas/metaRutas.ts`, `app.ts`, `errores/erroresHttp.ts`, `middleware/errorHandler.ts` |
| T-03   | `backend/src/dominio/progreso.ts`, `backend/src/dominio/progreso.test.ts`, `backend/package.json` (script test)                                                     |
| T-04   | `backend/src/servicios/progresoServicio.ts` (o extensión), `controladores/…`, `rutas/videojuegoRutas.ts`                                                            |
| T-05   | `backend/src/servicios/videojuegoServicio.ts` (+ test o verificación documentada)                                                                                   |
