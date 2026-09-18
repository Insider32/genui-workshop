import type { CurrentWeather, DailyForecast, Forecast, GeoLocation } from './types.js';

const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

interface GeocodeResponse {
  results?: Array<{
    id: number;
    name: string;
    country: string;
    admin1?: string;
    latitude: number;
    longitude: number;
    timezone: string;
  }>;
}

interface ForecastResponse {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
    is_day: number;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    weather_code: number[];
  };
}

export interface OpenMeteoClientOptions {
  fetchImpl?: typeof fetch;
}

/**
 * Thin client over the free Open-Meteo APIs. No API key required.
 */
export class OpenMeteoClient {
  private readonly fetchImpl: typeof fetch;

  constructor(options: OpenMeteoClientOptions = {}) {
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async geocode(query: string, limit = 5): Promise<GeoLocation[]> {
    const url = new URL(GEOCODE_URL);
    url.searchParams.set('name', query);
    url.searchParams.set('count', String(limit));
    url.searchParams.set('language', 'en');
    url.searchParams.set('format', 'json');

    const res = await this.fetchImpl(url);
    if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`);
    const data = (await res.json()) as GeocodeResponse;
    return (data.results ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      country: r.country,
      admin1: r.admin1,
      latitude: r.latitude,
      longitude: r.longitude,
      timezone: r.timezone,
    }));
  }

  async forecast(location: Forecast['location'], days = 7): Promise<Forecast> {
    const url = new URL(FORECAST_URL);
    url.searchParams.set('latitude', String(location.latitude));
    url.searchParams.set('longitude', String(location.longitude));
    url.searchParams.set('timezone', location.timezone);
    url.searchParams.set('forecast_days', String(days));
    url.searchParams.set(
      'current',
      'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day',
    );
    url.searchParams.set(
      'daily',
      'temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code',
    );

    const res = await this.fetchImpl(url);
    if (!res.ok) throw new Error(`Forecast failed: ${res.status}`);
    const data = (await res.json()) as ForecastResponse;

    const current: CurrentWeather = {
      temperatureC: data.current.temperature_2m,
      apparentTemperatureC: data.current.apparent_temperature,
      humidityPct: data.current.relative_humidity_2m,
      windKph: data.current.wind_speed_10m,
      weatherCode: data.current.weather_code,
      isDay: data.current.is_day === 1,
      observedAt: data.current.time,
    };

    const daily: DailyForecast[] = data.daily.time.map((date, i) => ({
      date,
      tempMaxC: data.daily.temperature_2m_max[i] ?? 0,
      tempMinC: data.daily.temperature_2m_min[i] ?? 0,
      precipitationMm: data.daily.precipitation_sum[i] ?? 0,
      weatherCode: data.daily.weather_code[i] ?? 0,
    }));

    return { location, current, daily, fetchedAt: new Date().toISOString() };
  }
}
