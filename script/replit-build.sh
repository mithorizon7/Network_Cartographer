#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# Replit's major-only module can lag security releases. Ship the same verified
# runtime in the deployment snapshot that we use to install and build it.
version="$(tr -d '\r\n' < .nvmrc)"
case "$version:$(uname -s):$(uname -m)" in
  22.23.4:Linux:x86_64)
    arch=x64
    checksum=1805bcd35e6815559bd2eb97db438d3fdb0eb3a5e6a977b7c1badca76337e9ce
    ;;
  22.23.4:Linux:aarch64)
    arch=arm64
    checksum=6287aa46b6c375d816e63ae66d024fbbfd70404825aabdfdf898a970871d2f4b
    ;;
  *) echo "Unsupported deployment runtime/platform; review the official Node checksums." >&2; exit 1 ;;
esac

mkdir -p .runtime
temporary="$(mktemp -d .runtime/build.XXXXXXXX)"
trap 'rm -rf "$temporary"' EXIT
archive="node-v$version-linux-$arch.tar.xz"
curl --fail --silent --show-error --location --proto '=https' --tlsv1.2 \
  --retry 3 --connect-timeout 15 --max-time 180 \
  "https://nodejs.org/dist/v$version/$archive" -o "$temporary/$archive"
printf '%s  %s\n' "$checksum" "$temporary/$archive" | sha256sum --check --status
tar -xJf "$temporary/$archive" -C "$temporary"
rm -rf .runtime/node
mv "$temporary/node-v$version-linux-$arch" .runtime/node
export PATH="$PWD/.runtime/node/bin:$PATH"
unset NODE_OPTIONS NODE_EXTRA_CA_CERTS NODE_USE_SYSTEM_CA NODE_USE_ENV_PROXY
node --version
npm ci --ignore-scripts
npm audit --audit-level=moderate
npm run build
