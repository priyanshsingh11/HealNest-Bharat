// `server-only` throws on import outside a React Server Component. Vitest runs plain Node, so it is aliased
// to this empty module (see vitest.config.mts) — that lets server modules like lib/devices.ts be unit-tested.
export {};
