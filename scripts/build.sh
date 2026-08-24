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
  fallback="${POSTGRES_PRISMA_URL:-${POSTGRES_URL:-${POSTGRES_URL_NON_POOLING:-${DATABASE_URL_UNPOOLED:-}}}}"
  if [ -n "$fallback" ]; then
    export DATABASE_URL="$fallback"
  fi
fi

prisma generate
prisma migrate deploy
next build
