import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { loadConfig } from '../config.js';
import { resetUsers } from '../store/users.js';

describe('auth routes', () => {
  const app = createApp({ config: loadConfig({ JWT_SECRET: 'test-secret' }) });

  beforeEach(() => {
    resetUsers();
  });

  it('registers and logs in a user', async () => {
    const register = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ada@example.com', password: 'hunter22' }),
    });
    expect(register.status).toBe(201);
    const registered = await register.json();
    expect(registered.user.email).toBe('ada@example.com');
    expect(registered.tokens.accessToken).toBeTypeOf('string');

    const login = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ada@example.com', password: 'hunter22' }),
    });
    expect(login.status).toBe(200);
    const body = await login.json();
    expect(body.tokens.refreshToken).toBeTypeOf('string');
  });
});
