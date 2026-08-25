// Vercel storage integrations (Vercel Postgres, and marketplace providers
// like Neon) don't always name the connection-string env var plain
// "DATABASE_URL" — Neon prefixes every variable with the database's own
// name (e.g. connecting a database named "jfdb" produces
// "JFDB_POSTGRES_URL", not "POSTGRES_URL"). Rather than hardcode one
// owner's prefix, search for any env var whose name *ends with* one of the
// known suffixes, in order of preference, and use the first one with an
// actual value.
const SUFFIXES_IN_PRIORITY_ORDER = [
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
];

export function resolveDatabaseUrl(env: NodeJS.ProcessEnv): string {
  if (env.DATABASE_URL) return env.DATABASE_URL;

  for (const suffix of SUFFIXES_IN_PRIORITY_ORDER) {
    for (const [key, value] of Object.entries(env)) {
      if (key.endsWith(suffix) && value) return value;
    }
  }

  return "";
}
