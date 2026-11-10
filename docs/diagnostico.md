# Diagnóstico — Proyecto 3 → Épica E2

Fecha: 2026-11-10  
Rama de trabajo: `feature/e2-metas-rachas`  
Base: repositorio Diario de Progreso Gamer (Proyecto 3) en `main`.

## Estado del Proyecto 3

El diario responde «¿qué estoy jugando, cuánto tiempo le dedico y qué tan avanzado voy?».

| Área | Estado |
| --- | --- |
| Backend Express + TypeScript + Mongoose | Operativo |
| Modelos `Videojuego` y `Partida` | Completos |
| `GET /api/videojuegos/:id/resumen` | Completo |
| Capas modelos / servicios / controladores / rutas / middlewares | Conservadas |
| ErrorHandler 400 / 404 / 500 | Presente; **sin 409** |
| Frontend React + Vite (ficha `#/juego/:id`) | Operativo |
| Despliegue Render + MongoDB Atlas | Configurado (`render.yaml`) |
| Colección `Meta`, progreso semanal, rachas | **Ausentes** |
| Capa `dominio/` con funciones puras | **Ausente** |
| Tests automatizados | **Ausentes** |
| Harness SDD (`docs/`, `AGENTS.md`, hooks, `DESIGN.md`) | **Ausente** |

## Tabla de problemas

| ID | Problema | Severidad | Decisión |
| --- | --- | --- | --- |
| P1 | No existe modelo ni CRUD de Meta | Bloquea E2 | Implementar en E2 |
| P2 | No existe `GET …/progreso-semanal` | Bloquea E2 | Implementar en E2 |
| P3 | No hay funciones puras de dominio ni tests | Bloquea E2 / rúbrica | Implementar en E2 (Vitest) |
| P4 | `errorHandler` no distingue 409 Conflict | Bloquea E2 (meta duplicada) | Implementar con CRUD Meta |
| P5 | Eliminar videojuego deja partidas huérfanas | Deuda **D1** | **Pagar** en E2 (cascade partidas + metas) |
| P6 | Frontend no elimina partidas (API sí existe) | Deuda **D3** | **Pagar** en E2 (API client + UI + refresh) |
| P7 | Sin harness ni cadena SDD documentada | Bloquea proceso | Crear harness y docs |
| P8 | `App.tsx` monolítico y panel home de detalle muerto | Diferir | Deuda técnica (refactor grande, no bloquea E2) |
| P9 | Sin índices en `partidas.videojuego` / health check | Diferir | Deuda técnica (rendimiento / ops) |
| P10 | `partidasApi` y `videojuegosApi` manejan errores de forma distinta | Diferir | Deuda técnica (consistencia UX) |

## Decisiones tomadas

### Deuda a pagar en esta épica

1. **D1 (P5):** al eliminar un videojuego se eliminan sus partidas y sus metas (sin huérfanos).
2. **D3 (P6):** en la ficha del juego se puede eliminar una partida y se refresca resumen y progreso semanal.

### Huecos de la ficha E2 (reglas de negocio)

| # | Hueco | Decisión |
| --- | --- | --- |
| 1 | Racha y día de hoy | La racha sigue viva si el último día jugado es hoy o ayer (`America/Guayaquil`). Se rompe si es anterior a ayer. |
| 2 | Varias partidas el mismo día | Cuentan como un solo día jugado. |
| 3 | Partida que cruza medianoche | Pertenece al día de `Partida.fecha` (inicio registrado). |
| 4 | Cambio de meta a mitad de semana | El porcentaje se calcula con la meta activa actual (sin snapshot histórico). |
| 5 | Meta superada | `porcentajeHoras` puede superar 100 (p. ej. 140). |
| 6 | Hito ya alcanzado | Se recalcula; si el avance baja del objetivo, deja de estar alcanzado. No se persiste `alcanzado`. |
| 7 | Videojuego completado o abandonado | Puede tener meta activa. |
| 8 | Eliminar videojuego con meta | Se eliminan metas y partidas en cascada. |

### Qué se completa vs qué queda como deuda

- **Se completa:** E2 (metas, hitos, progreso semanal, rachas), harness SDD, D1, D3, 409, tests de dominio.
- **Queda como deuda:** P8, P9, P10 (ver backlog «Deuda técnica»).
