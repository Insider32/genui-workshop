import { Hono } from 'hono';
import type { GeoLocation, OpenMeteoClient } from '@weather/core';
import { TtlCache } from '../lib/cache.js';
import { badRequest } from '../lib/errors.js';

export function geocodeRoutes(client: OpenMeteoClient, ttlMs: number) {
  const cache = new TtlCache<GeoLocation[]>(ttlMs);
  const router = new Hono();

  router.get('/', async (c) => {
    const q = c.req.query('q')?.trim();
    if (!q || q.length < 2) throw badRequest('Query "q" must be at least 2 characters');
    const results = await cache.getOrLoad(q.toLowerCase(), () => client.geocode(q));
    return c.json({ results });
  });

  return router;
}
