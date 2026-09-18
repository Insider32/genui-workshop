import { useState } from 'react';
import type { GeoLocation, Units } from '@weather/core';
import { CurrentConditions } from './components/CurrentConditions';
import { ForecastList } from './components/ForecastList';
import { SearchBox } from './components/SearchBox';
import { useForecast } from './hooks/useForecast';

export function App() {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [units, setUnits] = useState<Units>('metric');
  const { forecast, loading, error } = useForecast(location);

  return (
    <main className="app">
      <header className="app-header">
        <h1>Skylark</h1>
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

      {!location && <p className="empty">Search for a city to see the forecast.</p>}
      {loading && <p className="status">Loading forecast…</p>}
      {error && <p className="status error">{error}</p>}
      {forecast && (
        <>
          <CurrentConditions forecast={forecast} units={units} />
          <ForecastList days={forecast.daily} units={units} />
        </>
      )}
    </main>
  );
}
