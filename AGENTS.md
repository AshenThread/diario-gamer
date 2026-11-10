# Diario de Progreso Gamer

Diario personal de videojuegos, partidas, metas semanales y rachas.
Épica activa: E2 · Metas y rachas.

## Stack

- Backend: Node ≥20, Express, TypeScript, Mongoose, MongoDB Atlas
- Frontend: React 18, TypeScript, Vite
- Deploy: Render (`render.yaml`) + Vitest en backend

## Estructura

```
backend/src/   config modelos servicios controladores rutas middleware dominio errores
frontend/src/  api App.tsx tipos.ts styles.css
docs/          diagnostico prd backlog specs AUDITORIA bitacora-agente
```

## Comandos

```bash
cd backend && npm run dev | npm test | npm run build | npm run seed
cd frontend && npm run dev | npm run build
```

## Convenciones

- Capas: modelo → servicio → controlador → ruta; dominio puro sin DB.
- Errores: `ErrorValidacion` 400, `ErrorIdInvalido` 400, `ErrorNoEncontrado` 404, `ErrorConflicto` 409.
- Commits de implementación nombran ticket: `feat(E2): T-03 …`.
- Specs en `docs/specs/` se commitean antes que el código.

## Reglas

1. Nunca leer ni modificar `.env`. Usar solo `.env.example`.
2. Ninguna funcionalidad nueva sin spec en `docs/specs/`.
3. Ejecutar los tests (`npm test` en backend) antes de dar una tarea por terminada.
4. No inventar producto fuera de la ficha / PRD.
5. Zona horaria de semana y rachas: `America/Guayaquil`.

## Frontend

Seguir `DESIGN.md`: tokens `--game-*`, tipografías por juego, sin librerías de UI no autorizadas. Secciones nuevas en la ficha usan `.detail-section`.
