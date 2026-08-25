#!/bin/bash
set -euo pipefail

# Same resolution as lib/resolveDatabaseUrl.ts, reimplemented in bash since
# this runs before any Node code: Vercel storage integrations don't always
# name the connection-string env var plain DATABASE_URL (Neon, for example,
# prefixes every variable with the database's own name — connecting one
# named "jfdb" produces JFDB_POSTGRES_URL, not POSTGRES_URL). Search for any
# env var whose name ends with a known suffix, in order of preference.
find_by_suffix() {
  local suffix="$1"
  local name
  for name in $(compgen -e); do
    if [[ "$name" == *"$suffix" ]]; then
      local value="${!name}"
      if [ -n "$value" ]; then
        printf '%s' "$value"
        return 0
      fi
    fi
  done
  return 1
}

if [ -z "${DATABASE_URL:-}" ]; then
  for suffix in DATABASE_URL POSTGRES_PRISMA_URL POSTGRES_URL DATABASE_URL_UNPOOLED POSTGRES_URL_NON_POOLING; do
    if resolved="$(find_by_suffix "$suffix")"; then
      export DATABASE_URL="$resolved"
      echo "[build] Using a *_${suffix} variable for DATABASE_URL"
      break
    fi
  done
  if [ -z "${DATABASE_URL:-}" ]; then
    echo "[build] No DATABASE_URL / POSTGRES_* connection string found in the environment."
  fi
fi

prisma generate
prisma migrate deploy
next build
