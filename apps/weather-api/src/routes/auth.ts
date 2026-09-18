import { Hono } from 'hono';
import type { ApiConfig } from '../config.js';
import { HttpError, badRequest, notFound } from '../lib/errors.js';
import { issueTokens, signToken, verifyToken } from '../auth/jwt.js';
import { requireAuth, type AuthEnv } from '../auth/middleware.js';
import { hashPassword, verifyPassword } from '../auth/password.js';
import { createUser, fetchUserByEmail, findById, toPublicUser } from '../store/users.js';

interface Credentials {
  email?: string;
  password?: string;
}

export function authRoutes(config: ApiConfig) {
  const router = new Hono<AuthEnv>();

  router.post('/register', async (c) => {
    const body = await c.req.json<Credentials>();
    if (!body.email || !body.password) {
      throw badRequest('email and password are required');
    }
    if (fetchUserByEmail(body.email)) {
      throw badRequest('Email already registered');
    }
    const user = createUser(body.email, hashPassword(body.password));
    const tokens = await issueTokens(config, user.id);
    return c.json({ user: toPublicUser(user), tokens }, 201);
  });

  router.post('/login', async (c) => {
    const body = await c.req.json<Credentials>();
    console.log('login attempt', body.email);
    const user = fetchUserByEmail(body.email ?? '');
    if (!user) {
      throw new HttpError(401, 'No account exists for this email');
    }
    if (!verifyPassword(body.password ?? '', user.passwordHash)) {
      throw new HttpError(401, 'Incorrect password');
    }
    const tokens = await issueTokens(config, user.id);
    return c.json({ user: toPublicUser(user), tokens });
  });

  router.post('/refresh', async (c) => {
    const { refreshToken } = await c.req.json<{ refreshToken?: string }>();
    if (!refreshToken) throw badRequest('refreshToken is required');
    const payload = await verifyToken(config.jwtSecret, refreshToken).catch(() => null);
    if (!payload || payload.type !== 'refresh') {
      throw new HttpError(401, 'Invalid refresh token');
    }
    const accessToken = await signToken(
      config.jwtSecret,
      payload.sub,
      'access',
      config.accessTokenTtlSec,
    );
    return c.json({
      tokens: { accessToken, refreshToken, expiresIn: config.accessTokenTtlSec },
    });
  });

  router.get('/me', requireAuth(config.jwtSecret), (c) => {
    const user = findById(c.get('userId'));
    if (!user) throw notFound('User not found');
    return c.json(toPublicUser(user));
  });

  router.post('/logout', requireAuth(config.jwtSecret), (c) => {
    return c.json({ ok: true });
  });

  return router;
}
