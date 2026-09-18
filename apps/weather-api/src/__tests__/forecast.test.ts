import { describe, expect, it } from 'vitest';
import { OpenMeteoClient } from '@weather/core';
import { createApp } from '../app.js';
import { loadConfig } from '../config.js';

function fakeFetch(payload: unknown): typeof fetch {
  return (async () => new Response(JSON.stringify(payload), { status: 200 })) as typeof fetch;
}

const forecastPayload = {
  current: {
    time: '2026-09-18T12:00',
    temperature_2m: 21.5,
    apparent_temperature: 20.1,
    relative_humidity_2m: 55,
    wind_speed_10m: 12,
    weather_code: 2,
    is_day: 1,
  },
  daily: {
    time: ['2026-09-18'],
    temperature_2m_max: [24],
    temperature_2m_min: [15],
    precipitation_sum: [0],
    weather_code: [2],
  },
};

describe('GET /api/forecast', () => {
  const client = new OpenMeteoClient({ fetchImpl: fakeFetch(forecastPayload) });
  const app = createApp({ config: loadConfig({}), client });

  it('returns a normalised forecast', async () => {
    const res = await app.request('/api/forecast?lat=37.98&lon=23.72&tz=Europe/Athens&name=Athens');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.current.temperatureC).toBe(21.5);
    expect(body.daily).toHaveLength(1);
    expect(body.location.name).toBe('Athens');
  });

  it('rejects out-of-range coordinates', async () => {
    const res = await app.request('/api/forecast?lat=999&lon=0');
    expect(res.status).toBe(400);
  });

  it('serves the second request from cache', async () => {
    let calls = 0;
    const counting = new OpenMeteoClient({
      fetchImpl: (async () => {
        calls += 1;
        return new Response(JSON.stringify(forecastPayload));
      }) as typeof fetch,
    });
    const cachedApp = createApp({ config: loadConfig({}), client: counting });
    await cachedApp.request('/api/forecast?lat=1&lon=1');
    await cachedApp.request('/api/forecast?lat=1&lon=1');
    expect(calls).toBe(1);
  });
});
