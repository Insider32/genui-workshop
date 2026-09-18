export interface ApiConfig {
  port: number;
  forecastCacheTtlMs: number;
  geocodeCacheTtlMs: number;
  jwtSecret: string;
  accessTokenTtlSec: number;
  refreshTokenTtlSec: number;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  return {
    port: Number(env.PORT ?? 8787),
    forecastCacheTtlMs: Number(env.FORECAST_CACHE_TTL_MS ?? 10 * 60 * 1000),
    geocodeCacheTtlMs: Number(env.GEOCODE_CACHE_TTL_MS ?? 24 * 60 * 60 * 1000),
    jwtSecret: env.JWT_SECRET ?? 'dev-secret-change-me',
    accessTokenTtlSec: Number(env.ACCESS_TOKEN_TTL_SEC ?? 60 * 60 * 24 * 30),
    refreshTokenTtlSec: Number(env.REFRESH_TOKEN_TTL_SEC ?? 60 * 60 * 24 * 90),
  };
}
