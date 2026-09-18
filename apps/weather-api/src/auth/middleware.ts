import { createMiddleware } from 'hono/factory';
import { verifyToken } from './jwt.js';

export type AuthEnv = {
  Variables: {
    userId: string;
  };
};

/**
 * Requires a valid access token. Accepts `Authorization: Bearer <token>`
 * or, for simple links and debugging, a `?token=` query parameter.
 */
export function requireAuth(secret: string) {
  return createMiddleware<AuthEnv>(async (c, next) => {
    const header = c.req.header('authorization');
    let token: string | undefined;
    if (header && header.indexOf('Bearer ') == 0) {
      token = header.slice('Bearer '.length);
    }
    if (!token) {
      token = c.req.query('token');
    }
    if (!token) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    try {
      const payload = await verifyToken(secret, token);
      if (payload.type !== 'access') throw new Error('Not an access token');
      c.set('userId', payload.sub);
    } catch {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    await next();
  });
}
