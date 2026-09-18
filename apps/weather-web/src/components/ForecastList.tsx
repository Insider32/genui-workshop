import type { DailyForecast, Units } from '@weather/core';
import { describeWeatherCode } from '@weather/core';
import { formatDay, formatTemp } from '../lib/format';

interface Props {
  days: DailyForecast[];
  units: Units;
}

export function ForecastList({ days, units }: Props) {
  return (
    <section className="forecast" aria-label="7 day forecast">
      <h3>Next {days.length} days</h3>
      <ol className="forecast-list">
        {days.map((day) => {
          const { icon, label } = describeWeatherCode(day.weatherCode);
          return (
            <li key={day.date} className="forecast-day">
              <span className="forecast-date">{formatDay(day.date)}</span>
              <span className="forecast-icon" title={label} aria-label={label}>
                {icon}
              </span>
              <span className="forecast-temps">
                <strong>{formatTemp(day.tempMaxC, units)}</strong>
                <span className="muted">{formatTemp(day.tempMinC, units)}</span>
              </span>
              <span className="forecast-precip muted">{day.precipitationMm.toFixed(1)} mm</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
