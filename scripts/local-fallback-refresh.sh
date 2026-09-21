#!/usr/bin/env bash
# Red de seguridad semanal del fork pi-commandcode-provider.
# 1) Re-arma el workflow de sync: en un fork GitHub lo desactiva por defecto.
# 2) Dispara el sync en la nube, para que un cron muerto no deje el catalogo viejo.
# 3) Actualiza la extension instalada en pi desde main del fork.
set -uo pipefail

REPO="rcharrisg/pi-commandcode-provider"
WORKFLOW="model-metadata.yml"
EXT="git:github.com/rcharrisg/pi-commandcode-provider@main"
STATE_DIR="${HOME}/.local/state/pi-commandcode"

mkdir -p "$STATE_DIR"
exec >>"$STATE_DIR/refresh.log" 2>&1
echo "=== $(date -Is) refresh start ==="

status=0

if gh workflow enable "$WORKFLOW" --repo "$REPO"; then
  echo "workflow ensure-enabled: ok"
else
  echo "workflow ensure-enabled: FAILED"
  status=1
fi

if gh workflow run "$WORKFLOW" --repo "$REPO"; then
  echo "dispatch: ok"
else
  echo "dispatch: FAILED"
  status=1
fi

if pi update --extension "$EXT"; then
  echo "pi update: ok"
else
  echo "pi update: FAILED"
  status=1
fi

if [ "$status" -ne 0 ] && command -v notify-send >/dev/null 2>&1; then
  notify-send -u critical "pi-commandcode-refresh fallo" "Revisa ~/.local/state/pi-commandcode/refresh.log"
fi

echo "=== $(date -Is) refresh done (status=$status) ==="
exit "$status"
