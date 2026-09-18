import { randomUUID } from 'node:crypto';
import type { User } from '@weather/core';
import { removeFavoritesForUser } from './favorites.js';

export interface StoredUser extends User {
  passwordHash: string;
}

const users = new Map<string, StoredUser>();

export function createUser(email: string, passwordHash: string): StoredUser {
  const user: StoredUser = {
    id: randomUUID(),
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  users.set(user.id, user);
  return user;
}

export function fetchUserByEmail(email: string): StoredUser | undefined {
  for (const user of users.values()) {
    if (user.email === email) return user;
  }
  return undefined;
}

export function findById(id: string): StoredUser | undefined {
  return users.get(id);
}

export function deleteUser(id: string): boolean {
  const existed = users.delete(id);
  if (existed) removeFavoritesForUser(id);
  return existed;
}

export function toPublicUser(user: StoredUser): User {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

export function resetUsers(): void {
  users.clear();
}
