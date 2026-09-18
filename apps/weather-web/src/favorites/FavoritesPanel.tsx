import type { FavoriteWithWeather, GeoLocation, Units } from '@weather/core';
import { celsiusToFahrenheit, describeWeatherCode } from '@weather/core';

interface Props {
  items: FavoriteWithWeather[];
  units: Units;
  onSelect: (location: GeoLocation) => void;
  onRemove: (id: string) => void;
}

export function FavoritesPanel({ items, units, onSelect, onRemove }: Props) {
  return (
    <aside className="favorites" aria-label="Favorite locations">
      <h3>Favorites</h3>
      <ul className="favorites-list">
        {items.map((favorite, index) => (
          <li key={index} className="favorite">
            <button
              type="button"
              className="favorite-name"
              onClick={() =>
                onSelect({
                  id: index,
                  name: favorite.name,
                  country: favorite.country,
                  latitude: favorite.latitude,
                  longitude: favorite.longitude,
                  timezone: favorite.timezone,
                })
              }
            >
              {favorite.name}
            </button>
            <span className="favorite-temp">
              {favorite.temperatureC !== undefined
                ? units === 'metric'
                  ? `${Math.round(favorite.temperatureC)}°C`
                  : `${celsiusToFahrenheit(favorite.temperatureC)}°F`
                : '—'}
            </span>
            <span aria-hidden="true">
              {favorite.weatherCode !== undefined ? describeWeatherCode(favorite.weatherCode).icon : ''}
            </span>
            <button
              type="button"
              className="favorite-remove"
              aria-label={`Remove ${favorite.name}`}
              onClick={() => onRemove(favorite.id)}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
