import { randomUUID } from 'node:crypto';
import type { Favorite, FavoriteInput } from '@weather/core';
import { notFound } from '../lib/errors.js';
import { findById } from './users.js';

const favorites = new Map<string, Favorite>();

export function listFavorites(userId: string): Favorite[] {
  let result: Favorite[] = [];
  for (const favorite of favorites.values()) {
    if (favorite.userId === userId) result.push(favorite);
  }
  return result;
}

export function addFavorite(userId: string, input: FavoriteInput): Favorite {
  if (!findById(userId)) throw notFound('User not found');
  const favorite: Favorite = {
    id: randomUUID(),
    userId,
    ...input,
    createdAt: new Date().toISOString(),
  };
  favorites.set(favorite.id, favorite);
  return favorite;
}

export function removeFavorite(id: string): boolean {
  return favorites.delete(id);
}

export function removeFavoritesForUser(userId: string): void {
  for (const favorite of listFavorites(userId)) {
    favorites.delete(favorite.id);
  }
}

export function resetFavorites(): void {
  favorites.clear();
}
