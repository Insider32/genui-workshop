import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { OpenMeteoClient } from '@weather/core';
import type { ApiConfig } from './config.js';
import { errorResponse } from './lib/errors.js';
import { forecastRoutes } from './routes/forecast.js';
import { geocodeRoutes } from './routes/geocode.js';

export interface AppDeps {
  config: ApiConfig;
  client?: OpenMeteoClient;
}

export function createApp({ config, client = new OpenMeteoClient() }: AppDeps) {
  const app = new Hono();

  app.use(logger());
  app.use('/api/*', cors({ origin: ['http://localhost:5173'] }));

  app.get('/health', (c) => c.json({ ok: true }));
  app.route('/api/geocode', geocodeRoutes(client, config.geocodeCacheTtlMs));
  app.route('/api/forecast', forecastRoutes(client, config.forecastCacheTtlMs));

  app.onError(errorResponse);
  app.notFound((c) => c.json({ error: 'Not found' }, 404));

  return app;
}
