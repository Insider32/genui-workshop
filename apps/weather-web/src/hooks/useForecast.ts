import { useEffect, useState } from 'react';
import type { Forecast, GeoLocation } from '@weather/core';
import { fetchForecast } from '../api/client';

interface State {
  forecast: Forecast | null;
  loading: boolean;
  error: string | null;
}

export function useForecast(location: GeoLocation | null): State {
  const [state, setState] = useState<State>({ forecast: null, loading: false, error: null });

  useEffect(() => {
    if (!location) return;
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetchForecast(location)
      .then((forecast) => {
        if (!cancelled) setState({ forecast, loading: false, error: null });
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ forecast: null, loading: false, error: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [location]);

  return state;
}
