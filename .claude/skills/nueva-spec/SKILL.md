---
name: nueva-spec
description: Crea una spec en docs/specs/ con DEBE/NO DEBE, criterio→verificación y ticket→archivos.
disable-model-invocation: true
---

# /nueva-spec

Crear o completar un archivo en `docs/specs/<nombre>.md` con:

1. Contexto y alcance (sin inventar producto fuera del PRD).
2. Reglas **DEBE** / **NO DEBE**.
3. Tabla **criterio → verificación** (test, curl o revisión UI).
4. Tabla **ticket → archivos**.

Antes de escribir código que implemente la spec, commitear solo el archivo de spec.
