# Spec frontend — Meta y progreso semanal

## Contexto

En la ficha del videojuego (`DetalleJuego`) se muestra progreso semanal y se gestiona la meta. Cubre tickets T-06…T-09.

## DEBE

1. Mostrar sección de progreso semanal: barra de horas vs meta, días jugados vs días objetivo, racha actual, mejor racha, lista de hitos con estado alcanzado/no.
2. Formulario para crear y editar meta (horas, días, hitos) y acción para desactivar con confirmación.
3. Servicio `frontend/src/api/metasApi.ts` separado de los componentes.
4. Estados de carga, error y vacío; sin meta activa invita a crear una.
5. Al registrar, editar o eliminar una partida, volver a consultar el progreso semanal.
6. Estilos solo con variables / clases de `DESIGN.md` y `styles.css`; sin librerías de UI nuevas.
7. Permitir eliminar una partida desde la ficha (D3) y refrescar resumen + progreso.

## NO DEBE

1. Calcular rachas o semana en el cliente como fuente de verdad (usa el endpoint).
2. Introducir componentes de UI de terceros no autorizados en DESIGN.md.
3. Desactivar una meta sin confirmación.
4. Dejar la UI desactualizada tras mutar partidas.

## Criterio → verificación

| Criterio                            | Verificación                        |
| ----------------------------------- | ----------------------------------- |
| Sección progreso visible en detalle | Revisión UI / captura               |
| Barra y días vs meta                | Revisión con meta activa y partidas |
| Hitos con estado                    | Revisión al alcanzar / bajar avance |
| Vacío sin meta invita a crear       | Revisión UI                         |
| Formulario create/edit/desactivar   | Flujo manual + confirmación         |
| `metasApi.ts` separado              | Inspección de archivos              |
| Refresh tras crear/eliminar partida | Flujo manual                        |
| Estilos desde DESIGN                | Revisión diseño (tabla)             |
| Eliminar partida (D3)               | Flujo manual + API                  |

## Ticket → archivos

| Ticket | Archivos                                                                   |
| ------ | -------------------------------------------------------------------------- |
| T-06   | `frontend/src/App.tsx`, `frontend/src/styles.css`, `frontend/src/tipos.ts` |
| T-07   | `frontend/src/App.tsx`                                                     |
| T-08   | `frontend/src/api/metasApi.ts`, `frontend/src/App.tsx`                     |
| T-09   | `frontend/src/api/partidasApi.ts`, `frontend/src/App.tsx`                  |
