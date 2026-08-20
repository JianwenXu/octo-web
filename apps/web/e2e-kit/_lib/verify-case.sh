#!/usr/bin/env bash
set -euo pipefail

# Run one case through the kit stability gate.
# Usage: e2e/_lib/verify-case.sh --grep='@C7' [--config=e2e/playwright.ci.config.ts]

GREP=""
CONFIG=""
REPEAT_EACH="3"
EXTRA=()

for arg in "$@"; do
  case "$arg" in
    --grep=*) GREP="${arg#*=}" ;;
    --config=*) CONFIG="${arg#*=}" ;;
    --repeat-each=*) REPEAT_EACH="${arg#*=}" ;;
    --) shift; EXTRA+=("$@") ; break ;;
    *) EXTRA+=("$arg") ;;
  esac
done

if [ -z "$GREP" ]; then
  echo "缺少 --grep=<case tag>，例如 --grep='@C7'" >&2
  exit 2
fi

CMD=(pnpm exec playwright test --grep "$GREP" --repeat-each="$REPEAT_EACH" --workers=1)
[ -n "$CONFIG" ] && CMD+=(--config "$CONFIG")
CMD+=("${EXTRA[@]}")

echo "[e2e verify] ${CMD[*]}"
"${CMD[@]}"
echo "[e2e verify] $GREP: ${REPEAT_EACH}/${REPEAT_EACH} runs passed"
