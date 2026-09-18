import { Hono } from 'hono';
import type { Forecast, OpenMeteoClient } from '@weather/core';
import { TtlCache } from '../lib/cache.js';
import { badRequest } from '../lib/errors.js';

function parseCoordinate(raw: string | undefined, name: string, min: number, max: number): number {
  const value = Number(raw);
  if (raw === undefined || Number.isNaN(value) || value < min || value > max) {
    throw badRequest(`"${name}" must be a number between ${min} and ${max}`);
  }
  return value;
}

export function forecastRoutes(client: OpenMeteoClient, ttlMs: number) {
  const cache = new TtlCache<Forecast>(ttlMs);
  const router = new Hono();

  router.get('/', async (c) => {
    const latitude = parseCoordinate(c.req.query('lat'), 'lat', -90, 90);
    const longitude = parseCoordinate(c.req.query('lon'), 'lon', -180, 180);
    const timezone = c.req.query('tz') ?? 'auto';
    const name = c.req.query('name') ?? 'Unknown';
    const country = c.req.query('country') ?? '';

    const key = `${latitude.toFixed(3)},${longitude.toFixed(3)},${timezone}`;
    const forecast = await cache.getOrLoad(key, () =>
      client.forecast({ name, country, latitude, longitude, timezone }),
    );
    return c.json(forecast);
  });

  return router;
}
