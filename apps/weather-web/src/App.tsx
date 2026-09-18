import { useEffect, useState } from 'react';
import type { GeoLocation, Units } from '@weather/core';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { LoginForm } from './auth/LoginForm';
import { CurrentConditions } from './components/CurrentConditions';
import { ForecastList } from './components/ForecastList';
import { SearchBox } from './components/SearchBox';
import { FavoritesPanel } from './favorites/FavoritesPanel';
import { useFavorites } from './favorites/useFavorites';
import { useForecast } from './hooks/useForecast';

export function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}

function Shell() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [units, setUnits] = useState<Units>('metric');
  const { forecast, loading, error } = useForecast(location);
  const { items, add, remove } = useFavorites(user !== null);

  const saved = location
    ? items.find((f) => f.latitude === location.latitude && f.longitude === location.longitude)
    : undefined;

  function toggleSave() {
    if (!location) return;
    if (saved) {
      remove(saved.id);
    } else {
      add({
        name: location.name,
        country: location.country,
        latitude: location.latitude,
        longitude: location.longitude,
        timezone: location.timezone,
      });
    }
  }

  return (
    <main className="app">
      <header className="app-header">
        <div className="app-title">
          <h1>Skylark</h1>
          {user && (
            <button type="button" className="link" onClick={logout}>
              Sign out
            </button>
          )}
        </div>
        <div className="app-controls">
          <SearchBox onSelect={setLocation} />
          <button
            type="button"
            className="units-toggle"
            onClick={() => setUnits(units === 'metric' ? 'imperial' : 'metric')}
            aria-label="Toggle units"
          >
            {units === 'metric' ? '°C' : '°F'}
          </button>
        </div>
      </header>

      <div className="layout">
        <div className="layout-main">
          {!location && <p className="empty">Search for a city to see the forecast.</p>}
          {loading && <p className="status">Loading forecast…</p>}
          {error && <p className="status error">{error}</p>}
          {forecast && (
            <>
              <CurrentConditions
                forecast={forecast}
                units={units}
                saved={user ? saved !== undefined : undefined}
                onSave={user ? toggleSave : undefined}
              />
              <ForecastList days={forecast.daily} units={units} />
            </>
          )}
        </div>
        <div className="layout-side">
          {user ? (
            <FavoritesPanel items={items} units={units} onSelect={setLocation} onRemove={remove} />
          ) : (
            <LoginForm />
          )}
        </div>
      </div>
    </main>
  );
}
