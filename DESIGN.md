# DESIGN.md — Diario de Progreso Gamer

Identidad visual del frontend existente (`frontend/src/styles.css` + `temaJuego()` en `App.tsx`).
E2 reutiliza estos tokens; no introduce un sistema nuevo.

## Colores

Variables por juego (inyectadas en `.page`):

| Token             | Rol                     |
| ----------------- | ----------------------- |
| `--game-ink`      | Texto principal         |
| `--game-accent`   | Acento / barras / focos |
| `--game-paper`    | Fondo de página         |
| `--game-contrast` | Contraste sobre acentos |
| `--page-paper`    | Fallback global         |

Fallback por defecto: ink `#171717`, accent `#c9a227`, paper `#fbf7ea`.

## Tipografía

- Cuerpo: Arial / Helvetica (legible, no compite con el título).
- Títulos de juego: fuente temática por slug (`Orbitron`, `Roboto Slab`, `Cinzel`, `Quicksand`, `IM Fell English SC`, `Crimson Pro`) vía `--game-title-font`.
- Clases: `.glitch-title`, `.section-heading`, `.eyebrow`.

## Espaciado

- Página: padding `34px` / horizontal `clamp(20px, 5vw, 72px)` / inferior `96px`.
- Secciones de ficha: `.detail-section` con ritmo vertical consistente.
- Stats: `.detail-stats` en rejilla; barras `.progress-track`.

## Componentes

- Hero y baraja en home; ficha de detalle con `.detail-page`.
- Formularios `.partida-form` (inputs, botones nativos).
- Estados: `.error`, `.aviso`, `.muted`.
- E2: progreso semanal e hitos dentro de `.detail-section`; barra de horas con `.progress-track`.

## Tono de los textos

Directo, en segunda persona o impersonal corto («Esta semana», «Sin meta activa»). Sin jerga de marketing ni emojis decorativos.

## Accesibilidad

- `focus-visible` con outline 2px negro.
- Contraste ink/paper por tema.
- Controles nativos (`button`, `input`, `select`) con `font: inherit`.
- Confirmación explícita antes de desactivar meta o eliminar partida.

## No hacemos

- Librerías de UI (Material, Chakra, shadcn, etc.).
- Cards con sombra multi-capa en el hero de detalle.
- Notificaciones, rankings ni gráficos históricos (fuera de alcance E2).
- Tokens o paletas que no pasen por estas variables.
