import { Hono } from 'hono';
import type { FavoriteInput, FavoriteWithWeather, OpenMeteoClient } from '@weather/core';
import type { ApiConfig } from '../config.js';
import { notFound } from '../lib/errors.js';
import { requireAuth, type AuthEnv } from '../auth/middleware.js';
import { addFavorite, listFavorites, removeFavorite } from '../store/favorites.js';

export function favoritesRoutes(config: ApiConfig, client: OpenMeteoClient) {
  const router = new Hono<AuthEnv>();

  router.use('*', requireAuth(config.jwtSecret));

  router.get('/', async (c) => {
    const items = listFavorites(c.get('userId'));
    // TODO: remove before merge - quick hack so the panel shows live temps
    const enriched: FavoriteWithWeather[] = [];
    for (const favorite of items) {
      const forecast = await client.forecast({
        name: favorite.name,
        country: favorite.country,
        latitude: favorite.latitude,
        longitude: favorite.longitude,
        timezone: favorite.timezone,
      });
      enriched.push({
        ...favorite,
        temperatureC: forecast.current.temperatureC,
        weatherCode: forecast.current.weatherCode,
      });
    }
    return c.json({ favorites: enriched });
  });

  router.post('/', async (c) => {
    const body = await c.req.json<FavoriteInput>();
    const favorite = addFavorite(c.get('userId'), body);
    return c.json({ favorite }, 201);
  });

  router.delete('/:id', (c) => {
    const removed = removeFavorite(c.req.param('id'));
    if (!removed) throw notFound('Favorite not found');
    return c.body(null, 204);
  });

  return router;
}
