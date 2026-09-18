import { useCallback, useEffect, useState } from 'react';
import type { FavoriteInput, FavoriteWithWeather } from '@weather/core';
import { favorites as favoritesApi } from '../api/client';

export function useFavorites(enabled: boolean) {
  const [items, setItems] = useState<FavoriteWithWeather[]>([]);

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      return;
    }
    let active = true;
    const load = () =>
      favoritesApi
        .list()
        .then((res) => {
          if (active) setItems(res.favorites);
        })
        .catch(() => {});
    load();
    const handle = setInterval(load, 5000);
    return () => {
      active = false;
      clearInterval(handle);
    };
  }, [enabled]);

  const add = useCallback(async (input: FavoriteInput) => {
    const optimistic: FavoriteWithWeather = {
      ...input,
      id: `tmp-${Date.now()}`,
      userId: '',
      createdAt: new Date().toISOString(),
    };
    setItems((prev) => [...prev, optimistic]);
    const { favorite } = await favoritesApi.add(input);
    setItems((prev) => prev.map((f) => (f.id === optimistic.id ? favorite : f)));
  }, []);

  const remove = useCallback(async (id: string) => {
    setItems((prev) => prev.filter((f) => f.id !== id));
    await favoritesApi.remove(id);
  }, []);

  return { items, add, remove };
}
