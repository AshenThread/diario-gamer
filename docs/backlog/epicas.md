# Épicas

## E1 · Diario de progreso (Proyecto 3)

**Objetivo:** responder «¿qué estoy jugando, cuánto tiempo le dedico y qué tan avanzado voy?».

**Alcance:**

- CRUD de videojuegos con logros embebidos.
- CRUD de partidas referenciadas.
- Resumen calculado (`horasTotales`, `cantidadPartidas`, `fechaUltimaSesion`, `avanceActual`).
- Frontend: biblioteca, ficha de detalle, registro de sesiones.
- Despliegue en Render con MongoDB Atlas.

**Estado:** entregado en `main`. Mantiene modelo Videojuego/Partida, capas y resumen salvo arreglos puntuales del diagnóstico.

## E2 · Metas y rachas

**Objetivo:** responder «¿estoy cumpliendo lo que me propuse esta semana y cuántos días seguidos llevo jugando?».

**Alcance:**

- Meta por videojuego (horas/semana, días/semana, hitos, activa).
- Progreso semanal (lunes–domingo, Ecuador) con horas, días, porcentaje, rachas e hitos.
- CRUD de meta; una sola meta activa por juego; 409 si se intenta otra.
- Dominio puro con tests; UI en el detalle del juego.
- Cascade al eliminar videojuego; eliminar partida en ficha (deuda D1/D3).

**No-alcance:** notificaciones, metas compartidas, rankings, gráficos históricos.

**Detalle:** [E2-metas-y-rachas.md](./E2-metas-y-rachas.md)
