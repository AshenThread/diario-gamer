# Bitácora del agente — E2 Metas y rachas

## 1. Diagnóstico del Proyecto 3

**Pedido:** explorar backend, frontend y docs para ver qué bloquea E2.  
**Bien:** identificó capas sólidas, resumen existente, Render listo; listó ausencia de Meta, tests, 409 y cascade.  
**Corrección:** se fijaron D1/D3 a pagar y se documentaron los 8 huecos en `docs/diagnostico.md`.

## 2. Harness SDD

**Pedido:** `AGENTS.md`, hooks, skill, `DESIGN.md`.  
**Bien:** reglas mínimas (no `.env`, specs obligatorias, tests) y DESIGN alineado al frontend existente.  
**Nota:** el hook Prettier de `.claude/settings.json` está pensado para Claude Code; en Cursor no se activó igual.

## 3. Huecos de producto

**Pedido:** resolver los 8 huecos de la ficha.  
**Bien:** el usuario aceptó defaults (racha viva con ayer, % > 100, hitos recalculados, cascade).  
**Paso a PRD:** reglas sin detalle técnico en `docs/prd/prd-e2-metas-y-rachas.md`.

## 4. Specs antes de código

**Pedido:** specs backend/frontend con tablas criterio→verificación.  
**Bien:** commits de specs (`8437909`) anteriores a implementación (`1668a3f`, `4be6843`).  
**Trazabilidad:** historial Git muestra docs → dominio → API → UI.

## 5. Dominio puro y Vitest

**Pedido:** funciones puras + tests primero.  
**Bien:** 15 tests verdes (semana Guayaquil, rachas, hitos, % > 100).  
**Detalle:** día de partida vía `Intl` `America/Guayaquil`; racha rota si último día < ayer.

## 6. Frontend monolítico

**Pedido:** sección progreso y formulario en la ficha.  
**Mal / fricción:** `App.tsx` reformateado a veces por tools externos; se restauró y se reemplazó `DetalleJuego` por script.  
**Bien:** build frontend OK; `metasApi.ts` separado; refresh tras crear/eliminar partida.

## 7. Deuda D1/D3

**Pedido:** cascade y eliminar partida.  
**Bien:** delete videojuego limpia partidas+metas; UI con confirmación para borrar sesión.  
**Diferido:** monolito `App.tsx`, índices DB, unificar errores de APIs cliente.

## 8. Cierre

**Pedido:** auditoría, deploy, PR.  
**Resultado:** `docs/AUDITORIA.md` con filas por criterio; PR a `main` listando tickets T-01…T-10.

## 9. Desviación de la spec (y cómo se detectó)

**Qué pasó:** en `progresoServicio` se pasó `meta.hitos` (subdocumentos de Mongoose) directo a `evaluarHitos`, que hace `...h`. La respuesta de `GET .../progreso-semanal` dejó de cumplir el contrato del PRD/spec (hitos con `descripcion`, `porcentajeObjetivo`, `alcanzado`) y filtró internos (`__parentArray`, `$__parent`, `_doc`).

**Cómo lo detecté:** al auditar las URLs públicas de Render, el JSON de progreso de Hades mostraba esos campos en lugar del arreglo limpio. La UI de «Esta semana» no podía mostrar bien las descripciones de hitos.

**Corrección:** mapear a objetos planos antes de `evaluarHitos` y dejar constancia en esta bitácora; el dominio puro no debe recibir documentos de ORM.
