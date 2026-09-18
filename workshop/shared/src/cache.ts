import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

/**
 * Every LLM output in this workshop is cached on disk and committed.
 * A script runs live only when a model is configured AND (the cache is
 * missing OR LIVE=1). That keeps the demo working offline.
 */
export function shouldRunLive(cachePath: string, hasModel: boolean): boolean {
  if (!hasModel) return false;
  if (process.env.LIVE === '1') return true;
  return !existsSync(cachePath);
}

export function readCache(cachePath: string): string | null {
  return existsSync(cachePath) ? readFileSync(cachePath, 'utf8') : null;
}

export function writeCache(cachePath: string, content: string): void {
  mkdirSync(dirname(cachePath), { recursive: true });
  writeFileSync(cachePath, content.endsWith('\n') ? content : `${content}\n`);
}

export function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

export function writeJson(path: string, value: unknown): void {
  writeCache(path, JSON.stringify(value, null, 2));
}
