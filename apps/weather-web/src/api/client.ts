import type {
  AuthTokens,
  Favorite,
  FavoriteInput,
  FavoriteWithWeather,
  Forecast,
  GeoLocation,
  User,
} from '@weather/core';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface TokenProvider {
  getAccessToken(): string | null;
  refresh(): Promise<string | null>;
}

let tokenProvider: TokenProvider | null = null;

export function setTokenProvider(provider: TokenProvider | null): void {
  tokenProvider = provider;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = tokenProvider?.getAccessToken();
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (res.status === 401 && tokenProvider) {
    const fresh = await tokenProvider.refresh();
    if (fresh) {
      return request<T>(path, init);
    }
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as any;
    throw new ApiError(res.status, body.error ?? res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function geocode(query: string): Promise<{ results: GeoLocation[] }> {
  return request(`/api/geocode?q=${encodeURIComponent(query)}`);
}

export function fetchForecast(location: GeoLocation): Promise<Forecast> {
  const params = new URLSearchParams({
    lat: String(location.latitude),
    lon: String(location.longitude),
    tz: location.timezone,
    name: location.name,
    country: location.country,
  });
  return request(`/api/forecast?${params}`);
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export const auth = {
  register(email: string, password: string): Promise<AuthResponse> {
    return request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  login(email: string, password: string): Promise<AuthResponse> {
    return request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  refresh(refreshToken: string): Promise<{ tokens: AuthTokens }> {
    return request('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },
  me(): Promise<User> {
    return request('/api/auth/me');
  },
};

export const favorites = {
  list(): Promise<{ favorites: FavoriteWithWeather[] }> {
    return request('/api/favorites');
  },
  add(input: FavoriteInput): Promise<{ favorite: Favorite }> {
    return request('/api/favorites', { method: 'POST', body: JSON.stringify(input) });
  },
  remove(id: string): Promise<void> {
    return request(`/api/favorites/${id}`, { method: 'DELETE' });
  },
};
