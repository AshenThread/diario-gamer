#!/usr/bin/env bash
# Auto-commit opt-in tras editar un archivo (agente o Tab). Si falla, no bloquea el editor.
#
# Desactivado salvo DIARIO_AUTO_COMMIT=1. Commitear en cada edición llenaba el
# historial, podía guardar trabajo a medias y tapaba los mensajes intencionales
# del repo (spec antes que el código, feat(E2): T-0x). Los commits ya publicados
# se dejan como están.
# Para una sesión: export DIARIO_AUTO_COMMIT=1 antes de abrir Cursor.
set -u

if [[ "${DIARIO_AUTO_COMMIT:-}" != "1" ]]; then
  exit 0
fi

input="$(cat || true)"

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "${ROOT}" ]]; then
  exit 0
fi
cd "${ROOT}" || exit 0

# Skip during rebase/merge/cherry-pick.
if [[ -d .git/rebase-merge || -d .git/rebase-apply || -f .git/MERGE_HEAD || -f .git/CHERRY_PICK_HEAD ]]; then
  exit 0
fi

file="$(printf '%s' "${input}" | jq -r '
  .file_path // .path // .filePath // .tool_input.file_path // .tool_input.path // empty
' 2>/dev/null || true)"

# Never touch .env / credential-looking paths from the edited file alone.
basename_file="$(basename -- "${file:-}")"
case "${basename_file}" in
  .env|.env.*|*.pem|*.key|credentials.json|secrets.json)
    exit 0
    ;;
esac

# Stage everything except secrets and local env files.
git add -A -- . \
  ':!.env' \
  ':!**/.env' \
  ':!.env.*' \
  ':!**/.env.*' \
  ':!*.pem' \
  ':!**/*.pem' \
  ':!credentials.json' \
  ':!**/credentials.json' \
  ':!secrets.json' \
  ':!**/secrets.json' \
  2>/dev/null || exit 0

if git diff --cached --quiet 2>/dev/null; then
  exit 0
fi

# Infer conventional message from staged paths (prefer edited file).
rel="${file}"
if [[ -n "${rel}" && "${rel}" == /* ]]; then
  rel="${rel#"${ROOT}/"}"
fi
if [[ -z "${rel}" ]]; then
  rel="$(git diff --cached --name-only | head -n 1 || true)"
fi
rel="${rel:-workspace}"

prefix="chore(auto)"
case "${rel}" in
  docs/specs/*|docs/*) prefix="docs" ;;
  .cursor/*|.claude/*|AGENTS.md|DESIGN.md|CLAUDE.md) prefix="chore(harness)" ;;
  backend/*) prefix="feat" ;;
  frontend/*) prefix="feat" ;;
esac

# Keep E2 ticket style when the path or status clearly points at E2 work.
if git diff --cached --name-only | grep -Eq 'Meta|meta|progreso|racha|E2|e2'; then
  if [[ "${prefix}" == "feat" ]]; then
    prefix="feat(E2)"
  elif [[ "${prefix}" == "docs" ]]; then
    prefix="docs(E2)"
  fi
fi

msg="${prefix}: update ${rel}"

git commit -m "$(cat <<EOF
${msg}

EOF
)" >/dev/null 2>&1 || true

exit 0
