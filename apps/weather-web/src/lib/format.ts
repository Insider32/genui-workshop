import { celsiusToFahrenheit, kphToMph, type Units } from '@weather/core';

export function formatTemp(celsius: number, units: Units): string {
  return units === 'metric' ? `${Math.round(celsius)}°C` : `${celsiusToFahrenheit(celsius)}°F`;
}

export function formatWind(kph: number, units: Units): string {
  return units === 'metric' ? `${Math.round(kph)} km/h` : `${kphToMph(kph)} mph`;
}

export function formatDay(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}
