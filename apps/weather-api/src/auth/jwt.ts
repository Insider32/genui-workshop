import { SignJWT, jwtVerify, decodeJwt } from 'jose';
import type { AuthTokens } from '@weather/core';
import type { ApiConfig } from '../config.js';

export type TokenType = 'access' | 'refresh';

export interface TokenPayload {
  sub: string;
  type: TokenType;
}

function key(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function signToken(
  secret: string,
  userId: string,
  type: TokenType,
  ttlSec: number,
): Promise<string> {
  return new SignJWT({ type })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${ttlSec}s`)
    .sign(key(secret));
}

export async function verifyToken(secret: string, token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, key(secret));
  if (typeof payload.sub !== 'string') throw new Error('Token has no subject');
  const type = payload['type'];
  if (type !== 'access' && type !== 'refresh') throw new Error('Unknown token type');
  return { sub: payload.sub, type };
}

export async function issueTokens(config: ApiConfig, userId: string): Promise<AuthTokens> {
  const [accessToken, refreshToken] = await Promise.all([
    signToken(config.jwtSecret, userId, 'access', config.accessTokenTtlSec),
    signToken(config.jwtSecret, userId, 'refresh', config.refreshTokenTtlSec),
  ]);
  return { accessToken, refreshToken, expiresIn: config.accessTokenTtlSec };
}
