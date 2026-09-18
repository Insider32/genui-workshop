import { useEffect, useState } from 'react';
import type { GeoLocation } from '@weather/core';
import { geocode } from '../api/client';

interface Props {
  onSelect: (location: GeoLocation) => void;
}

export function SearchBox({ onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoLocation[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const handle = setTimeout(() => {
      geocode(query)
        .then((r) => {
          setResults(r.results);
          setOpen(true);
        })
        .catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <div className="search">
      <label className="visually-hidden" htmlFor="location-search">
        Search for a location
      </label>
      <input
        id="location-search"
        type="search"
        placeholder="Search for a city…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        autoComplete="off"
      />
      {open && results.length > 0 && (
        <ul className="search-results" role="listbox">
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(r);
                  setQuery('');
                  setOpen(false);
                }}
              >
                <strong>{r.name}</strong>
                <span>
                  {r.admin1 ? `${r.admin1}, ` : ''}
                  {r.country}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
