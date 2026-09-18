/** A resolved place, as returned by the geocoder. */
export interface GeoLocation {
  id: number;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

/** Current observed conditions for a location. */
export interface CurrentWeather {
  temperatureC: number;
  apparentTemperatureC: number;
  humidityPct: number;
  windKph: number;
  weatherCode: number;
  isDay: boolean;
  observedAt: string;
}

/** One day of the daily forecast. */
export interface DailyForecast {
  date: string;
  tempMaxC: number;
  tempMinC: number;
  precipitationMm: number;
  weatherCode: number;
}

/** Full forecast payload served by the API. */
export interface Forecast {
  location: Pick<GeoLocation, 'name' | 'country' | 'latitude' | 'longitude' | 'timezone'>;
  current: CurrentWeather;
  daily: DailyForecast[];
  fetchedAt: string;
}

export type Units = 'metric' | 'imperial';
