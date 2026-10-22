#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ ! -x .runtime/node/bin/node ]]; then
  echo "Verified deployment runtime is missing; run the deployment build first." >&2
  exit 1
fi
unset NODE_OPTIONS NODE_EXTRA_CA_CERTS NODE_USE_SYSTEM_CA NODE_USE_ENV_PROXY
export NODE_ENV=production
exec .runtime/node/bin/node dist/index.cjs
