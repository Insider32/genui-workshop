import type { Forecast, Units } from '@weather/core';
import { describeWeatherCode } from '@weather/core';
import { formatTemp, formatWind } from '../lib/format';

interface Props {
  forecast: Forecast;
  units: Units;
}

export function CurrentConditions({ forecast, units }: Props) {
  const { current, location } = forecast;
  const { label, icon } = describeWeatherCode(current.weatherCode);

  return (
    <section className="current" aria-label="Current conditions">
      <header>
        <h2>
          {location.name}
          {location.country ? <span className="muted">, {location.country}</span> : null}
        </h2>
      </header>
      <div className="current-main">
        <span className="current-icon" aria-hidden="true">
          {icon}
        </span>
        <span className="current-temp">{formatTemp(current.temperatureC, units)}</span>
        <span className="current-label">{label}</span>
      </div>
      <dl className="current-details">
        <div>
          <dt>Feels like</dt>
          <dd>{formatTemp(current.apparentTemperatureC, units)}</dd>
        </div>
        <div>
          <dt>Humidity</dt>
          <dd>{current.humidityPct}%</dd>
        </div>
        <div>
          <dt>Wind</dt>
          <dd>{formatWind(current.windKph, units)}</dd>
        </div>
      </dl>
    </section>
  );
}
