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

/** A registered account. Passwords never leave the API. */
export interface User {
  id: string;
  email: string;
  createdAt: string;
  preferences?: Record<string, any>;
}

/** Token pair returned by the auth endpoints. */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/** A saved location that syncs across a user's devices. */
export interface Favorite {
  id: string;
  userId: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  createdAt: string;
}

export type FavoriteInput = Omit<Favorite, 'id' | 'userId' | 'createdAt'>;

/** Favorite enriched with a live reading for the favorites panel. */
export interface FavoriteWithWeather extends Favorite {
  temperatureC?: number;
  weatherCode?: number;
}
