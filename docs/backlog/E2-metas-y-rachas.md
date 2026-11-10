# E2 · Metas y rachas — Historias, criterios y tickets

## Historias

### H1 — Definir meta del videojuego

**Como** jugador del diario, **quiero** fijar horas y días por semana y una lista corta de hitos **para** saber qué me propongo con ese juego.

**Criterios**

1. DADO un videojuego existente SIN meta activa CUANDO creo una meta válida con horas, días e hitos ENTONCES queda activa y asociada a ese juego.
2. DADO un videojuego CON meta activa CUANDO intento crear otra meta activa ENTONCES el sistema lo rechaza con conflicto y un mensaje claro.
3. DADO una meta existente CUANDO la actualizo o la desactivo con confirmación ENTONCES refleja los cambios y deja de contar como activa si se desactivó.
4. DADO un videojuego completado o abandonado CUANDO creo o mantengo una meta ENTONCES se permite (no se bloquea por estado).

### H2 — Ver progreso semanal y rachas

**Como** jugador, **quiero** ver en el detalle del juego cómo voy esta semana y mi racha **para** saber si cumplo lo propuesto y si soy constante.

**Criterios**

1. DADO un videojuego con partidas en la semana actual y meta activa CUANDO abro el progreso semanal ENTONCES veo horas, porcentaje, días jugados vs objetivo, racha actual, mejor racha e hitos con estado.
2. DADO un videojuego sin meta activa CUANDO consulto el progreso ENTONCES meta y porcentaje de horas son nulos, pero sí veo horas, días y rachas, e invitación a crear meta.
3. DADO un videojuego sin partidas CUANDO consulto el progreso ENTONCES horas, días y rachas son 0 y ningún hito está alcanzado.
4. DADO partidas en días consecutivos hasta ayer (sin partida hoy) CUANDO veo la racha ENTONCES la racha actual sigue viva.
5. DADO varias partidas el mismo día CUANDO se cuentan los días ENTONCES ese día cuenta una sola vez.
6. DADO un avance actual ≥ objetivo de un hito CUANDO se evalúan hitos ENTONCES ese hito aparece alcanzado; si luego el avance baja, deja de estarlo.
7. DADO horas de la semana mayores que la meta CUANDO se calcula el porcentaje ENTONCES puede superar 100.

### H3 — Mantener integridad al registrar y borrar

**Como** jugador, **quiero** que al registrar o borrar partidas y al borrar un juego los datos de meta y progreso sigan coherentes **para** no ver información huérfana o desactualizada.

**Criterios**

1. DADO una partida creada, editada o eliminada CUANDO vuelve la ficha ENTONCES el progreso semanal se vuelve a consultar.
2. DADO un videojuego con partidas y metas CUANDO lo elimino ENTONCES no quedan partidas ni metas huérfanas.

## Tickets

| ID   | Tipo     | Descripción                                        | DoD                                                             | Depende    |
| ---- | -------- | -------------------------------------------------- | --------------------------------------------------------------- | ---------- |
| T-01 | backend  | Modelo Meta + validaciones Mongoose                | Schema con validaciones de ficha; timestamps                    | —          |
| T-02 | backend  | CRUD Meta + 409 segunda activa                     | Crear, get, listar por juego, actualizar, desactivar; 409 claro | T-01       |
| T-03 | backend  | Dominio puro `progreso.ts` + tests Vitest          | Funciones puras; ≥1 test por criterio sin DB; `npm test` verde  | —          |
| T-04 | backend  | `GET /api/videojuegos/:id/progreso-semanal`        | Respuesta según PRD; 400/404; sin meta / sin partidas           | T-01, T-03 |
| T-05 | backend  | Cascade delete videojuego → partidas + metas (D1)  | Criterio + verificación; sin huérfanos                          | T-01       |
| T-06 | frontend | Sección progreso semanal + hitos en detalle        | Barra, días, rachas, hitos; estados carga/error/vacío           | T-04, T-08 |
| T-07 | frontend | Formulario meta create/edit/desactivar             | Validación UI; confirmación al desactivar                       | T-02, T-08 |
| T-08 | frontend | `metasApi.ts` + refresh tras mutaciones de partida | Servicio separado; refetch progreso                             | T-02, T-04 |
| T-09 | frontend | Deuda D3: eliminar partida en ficha                | Client + botón + refresh resumen/progreso                       | T-08       |
| T-10 | proceso  | Auditoría, bitácora, deploy, PR                    | `AUDITORIA.md`, URLs, PR con tickets                            | T-01…T-09  |

## Deuda técnica (diferida)

| ID  | Problema                                      | Motivo para diferir                                    |
| --- | --------------------------------------------- | ------------------------------------------------------ |
| P8  | `App.tsx` monolítico / panel home muerto      | No bloquea E2; refactor grande sin valor de meta/racha |
| P9  | Sin índices DB / health check                 | Ops; volumen actual bajo                               |
| P10 | Manejo de errores distinto entre APIs cliente | Cosmético; se puede unificar después                   |
