import type { Forecast, GeoLocation } from '@weather/core';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(res.status, body.error ?? res.statusText);
  }
  return (await res.json()) as T;
}

export function geocode(query: string): Promise<{ results: GeoLocation[] }> {
  return request(`/api/geocode?q=${encodeURIComponent(query)}`);
}

export function fetchForecast(location: GeoLocation): Promise<Forecast> {
  const params = new URLSearchParams({
    lat: String(location.latitude),
    lon: String(location.longitude),
    tz: location.timezone,
    name: location.name,
    country: location.country,
  });
  return request(`/api/forecast?${params}`);
}
