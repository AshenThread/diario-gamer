# PRD — Diario de Progreso Gamer · Épica E2: Metas y rachas

## Problema

La persona ya registra videojuegos y partidas, pero no sabe si está cumpliendo lo que se propuso esta semana ni si es constante. Juega mucho un fin de semana y luego abandona el juego semanas enteras.

## Usuarios

La misma persona que usa el Diario de Progreso Gamer para registrar sus videojuegos y partidas (uso personal, un solo usuario).

## Objetivo y métrica de éxito

Pregunta que responde E2: «¿estoy cumpliendo lo que me propuse esta semana y cuántos días seguidos llevo jugando?»

**Éxito:** en un mes, la persona cumple su meta semanal al menos 3 de 4 semanas.

## Alcance

- Fijar una meta por videojuego: horas por semana y días por semana.
- Lista corta de hitos de avance ligados a la meta (p. ej. «Llegar al 50 %»).
- En el detalle del juego: progreso de la semana actual, racha actual, mejor racha e hitos alcanzados.
- Crear, consultar, actualizar y desactivar metas.
- Un videojuego tiene como máximo una meta activa.

## No-alcance

- Notificaciones y recordatorios
- Metas compartidas entre usuarios
- Rankings
- Gráficos históricos de semanas pasadas

## Reglas de negocio

### Meta e hitos

- Cada videojuego puede tener una meta activa con `horasSemanales` (> 0, máx. 100) y `diasPorSemana` (entero 1–7).
- Una meta tiene hasta 5 hitos `{ descripcion, porcentajeObjetivo }` (objetivo entre 1 y 100).
- Un hito está alcanzado cuando el porcentaje de avance actual del juego es ≥ su objetivo.
- El estado «alcanzado» no se guarda: se calcula a partir del avance actual.

### Semana y progreso

- La semana va de lunes a domingo en hora de Ecuador (`America/Guayaquil`).
- Horas de la semana = suma de duraciones de partidas de esa semana ÷ 60 (un decimal).
- Días jugados = días distintos de la semana con al menos una partida.
- Porcentaje de horas = horas de la semana / horas de la meta × 100 (entero).
- Sin meta activa: se muestran horas, días y rachas; meta y porcentaje de horas son nulos.
- Sin partidas: horas, días y rachas en 0; ningún hito alcanzado.

### Racha

- Racha = días consecutivos con al menos una partida de ese videojuego.
- Se calculan racha actual y mejor racha sobre todo el historial.

### Huecos resueltos

| #   | Situación                        | Regla                                                                                        |
| --- | -------------------------------- | -------------------------------------------------------------------------------------------- |
| 1   | Hoy sin partida pero ayer sí     | La racha sigue viva (último día = hoy o ayer). Se rompe si el último día es anterior a ayer. |
| 2   | Varias partidas el mismo día     | Cuentan como un solo día jugado.                                                             |
| 3   | Partida que cruza medianoche     | Pertenece al día de la fecha de inicio registrada.                                           |
| 4   | Cambio de meta a mitad de semana | El progreso se calcula con la meta activa actual.                                            |
| 5   | Meta superada                    | El porcentaje de horas puede superar 100 %.                                                  |
| 6   | Hito y avance que baja           | El hito deja de estar alcanzado si el avance actual queda por debajo del objetivo.           |
| 7   | Juego completado o abandonado    | Puede tener meta activa.                                                                     |
| 8   | Eliminar videojuego con meta     | Se eliminan sus metas y partidas; no quedan huérfanos.                                       |

## Supuestos

- El usuario registra la fecha de inicio de cada partida de forma fiable.
- Un solo usuario; no hay autenticación multi-usuario en esta épica.
- El avance actual del juego sigue siendo el de la partida más reciente (regla del Proyecto 3).

## Puntos abiertos

Ninguno bloqueante. Quedan fuera de producto (deuda técnica / UX): refactor del monolito frontend e índices de base de datos.
