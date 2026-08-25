#!/bin/bash
set -euo pipefail

# Vercel's own Postgres storage product exposes the connection string under
# different env var names depending on which integration was connected
# (POSTGRES_PRISMA_URL, POSTGRES_URL, ...). Fall back through the common
# ones so the owner doesn't have to manually copy a value into a
# separately-named DATABASE_URL variable. Only export when unset AND a
# fallback is actually available — an empty export would block Prisma's
# own .env loading during local development.
if [ -z "${DATABASE_URL:-}" ]; then
  if [ -n "${POSTGRES_PRISMA_URL:-}" ]; then
    export DATABASE_URL="$POSTGRES_PRISMA_URL"; echo "[build] Using POSTGRES_PRISMA_URL for DATABASE_URL"
  elif [ -n "${POSTGRES_URL:-}" ]; then
    export DATABASE_URL="$POSTGRES_URL"; echo "[build] Using POSTGRES_URL for DATABASE_URL"
  elif [ -n "${POSTGRES_URL_NON_POOLING:-}" ]; then
    export DATABASE_URL="$POSTGRES_URL_NON_POOLING"; echo "[build] Using POSTGRES_URL_NON_POOLING for DATABASE_URL"
  elif [ -n "${DATABASE_URL_UNPOOLED:-}" ]; then
    export DATABASE_URL="$DATABASE_URL_UNPOOLED"; echo "[build] Using DATABASE_URL_UNPOOLED for DATABASE_URL"
  else
    echo "[build] No DATABASE_URL / POSTGRES_* connection string found in the environment."
  fi
fi

prisma generate
prisma migrate deploy
next build
