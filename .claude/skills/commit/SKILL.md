---
name: commit
description: Prepara un commit con mensaje que nombra el ticket E2 cuando aplica.
disable-model-invocation: true
---

# /commit

1. `git status` y `git diff` para revisar el alcance.
2. No incluir `.env` ni secretos.
3. Mensaje conciso; si es implementación E2: `feat(E2): T-0X descripción`.
4. Specs y docs de proceso: `docs: …` o `chore(harness): …`.
5. Un commit por ticket o por fase documentada.
