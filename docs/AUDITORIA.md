# Auditoría E2 · Metas y rachas

Fecha: 2026-11-10  
Rama: `feature/e2-metas-rachas`  
Specs: [backend-meta-progreso.md](./specs/backend-meta-progreso.md), [frontend-meta-progreso.md](./specs/frontend-meta-progreso.md)

## Spec backend

| Criterio                        | Cómo se verificó                         | Resultado | Evidencia                                                 |
| ------------------------------- | ---------------------------------------- | --------- | --------------------------------------------------------- |
| Validaciones Meta               | Modelo + servicio; typecheck             | OK        | `backend/src/modelos/Meta.ts`, `metaServicio.ts`          |
| Segunda meta activa → 409       | `ErrorConflicto` + errorHandler          | OK        | `erroresHttp.ts`, `errorHandler.ts`, `metaServicio.crear` |
| Progreso sin partidas           | Dominio + contrato endpoint              | OK        | tests `rachaActual`/`mejorRacha` 0; servicio              |
| ≥5 días / racha rota            | Tests dominio + casos racha              | OK        | `progreso.test.ts`                                        |
| Racha viva ayer sí / hoy no     | Test puro                                | OK        | `progreso.test.ts` «sigue viva…»                          |
| Varias partidas mismo día = 1   | Test puro                                | OK        | `diasJugadosSemana`                                       |
| porcentajeHoras > 100           | Test puro                                | OK        | `porcentajeHoras(7,5) === 140`                            |
| Hito recalculado                | Test puro                                | OK        | `evaluarHitos` con avance 40                              |
| Sin meta → meta/porcentaje null | Contrato servicio                        | OK        | `progresoServicio.ts`                                     |
| Id inválido / no existe         | 400 / 404 vía errores existentes         | OK        | `progresoServicio`, `metaServicio`                        |
| Cascade delete                  | `Partida.deleteMany` + `Meta.deleteMany` | OK        | `videojuegoServicio.eliminar` (D1)                        |
| Dominio sin DB                  | Vitest 15 tests                          | OK        | `npm test` verde                                          |

## Spec frontend

| Criterio                          | Cómo se verificó                   | Resultado | Evidencia                            |
| --------------------------------- | ---------------------------------- | --------- | ------------------------------------ |
| Sección progreso en detalle       | Código + build                     | OK        | `DetalleJuego` sección «Esta semana» |
| Barra y días vs meta              | UI con `.progress-track` / stats   | OK        | `App.tsx`, `styles.css`              |
| Hitos con estado                  | Lista `.meta-hitos`                | OK        | `App.tsx`                            |
| Vacío sin meta invita a crear     | `.aviso` + CTA                     | OK        | `App.tsx`                            |
| Formulario create/edit/desactivar | Form + `confirm`                   | OK        | `guardarMeta`, `onDesactivarMeta`    |
| `metasApi.ts` separado            | Archivo dedicado                   | OK        | `frontend/src/api/metasApi.ts`       |
| Refresh tras partida              | `cargarDetalle` tras create/delete | OK        | `guardarPartida`, `borrarPartida`    |
| Estilos DESIGN.md                 | Tokens `--game-*`, sin libs UI     | OK        | tabla revisión abajo                 |
| Eliminar partida (D3)             | Client + botón                     | OK        | `eliminarPartida`, UI                |

## Revisión de diseño vs DESIGN.md

| Punto DESIGN                          | Observación                                | Acción               |
| ------------------------------------- | ------------------------------------------ | -------------------- |
| Tokens `--game-*`                     | Sección semanal reutiliza ink/accent/paper | Cumple               |
| `.detail-section` / `.progress-track` | Misma estructura que resumen y logros      | Cumple               |
| Sin libs UI                           | Solo HTML/CSS/React                        | Cumple               |
| Confirmación destructiva              | Desactivar meta y eliminar partida         | Cumple               |
| Tipografía cuerpo Arial               | Conservada (identidad existente)           | Cumple / intencional |
| Borde lateral en stats/hitos          | Lenguaje ya usado en `.detail-stats`       | Cumple / intencional |

## Tickets

| Ticket      | Estado                        |
| ----------- | ----------------------------- |
| T-01 … T-09 | Hechos                        |
| T-10        | Hecho con este documento + PR |

## Deuda pagada

- **D1:** cascade al eliminar videojuego.
- **D3:** eliminar partida en ficha + refresh.
