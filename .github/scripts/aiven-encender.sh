#!/usr/bin/env bash
# Si el MySQL gratis de Aiven está apagado (POWEROFF), lo enciende por la API y espera a que quede RUNNING.
# Aiven apaga los servicios gratis por inactividad y un SELECT 1 periódico no lo evita: hay que encenderlo.
# Requiere AIVEN_TOKEN (token personal de Aiven), AIVEN_PROJECT y AIVEN_SERVICE.
# Salida: 0 si queda encendido (o no hay token), 1 si no se pudo.
set -euo pipefail

API="${AIVEN_API:-https://api.aiven.io/v1}"
ESPERA_MAX="${AIVEN_ESPERA_MAX:-900}"   # segundos esperando RUNNING; el arranque tarda unos minutos
PAUSA="${AIVEN_PAUSA:-20}"

if [ -z "${AIVEN_TOKEN:-}" ] || [ -z "${AIVEN_PROJECT:-}" ] || [ -z "${AIVEN_SERVICE:-}" ]; then
  echo "::warning::Faltan AIVEN_TOKEN, AIVEN_PROJECT o AIVEN_SERVICE: no se puede encender Aiven automáticamente."
  exit 0
fi

URL="$API/project/$AIVEN_PROJECT/service/$AIVEN_SERVICE"
aiven() { curl -fsS --max-time 30 -H "Authorization: aivenv1 $AIVEN_TOKEN" -H "Content-Type: application/json" "$@"; }
estado() { aiven "$URL" | jq -r '.service.state'; }

actual=$(estado)
echo "Aiven $AIVEN_SERVICE: $actual"
[ "$actual" = "RUNNING" ] && exit 0

if [ "$actual" = "POWEROFF" ]; then
  echo "::warning::Aiven estaba apagado; encendiéndolo."
  aiven -X PUT -d '{"powered": true}' "$URL" > /dev/null
fi

# REBUILDING/REBALANCING: ya está arrancando, solo esperar
fin=$(( $(date +%s) + ESPERA_MAX ))
while [ "$(date +%s)" -lt "$fin" ]; do
  sleep "$PAUSA"
  actual=$(estado)
  echo "Aiven $AIVEN_SERVICE: $actual"
  [ "$actual" = "RUNNING" ] && exit 0
done

echo "::error::Aiven no llegó a RUNNING en ${ESPERA_MAX}s (último estado: $actual)."
exit 1
