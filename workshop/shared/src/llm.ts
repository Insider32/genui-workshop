import { resolve } from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { Output, generateText, type LanguageModel } from 'ai';
import type { z } from 'zod';
import { REPO_ROOT } from './paths.js';

loadDotenv({ path: resolve(REPO_ROOT, '.env'), quiet: true });

/**
 * Provider-agnostic model selection, driven entirely by environment variables:
 *
 *   LLM_PROVIDER   anthropic | openai | google | openai-compatible   (default: anthropic)
 *   LLM_MODEL      model id for that provider                        (default: claude-sonnet-5 for anthropic)
 *   LLM_API_KEY    the key                                           (falls back to the provider's own env var)
 *   LLM_BASE_URL   only for openai-compatible, e.g. the workshop gateway
 *
 * When no key is present, `readLlmConfig()` returns null and every script
 * falls back to its committed cached output.
 */
export type ProviderName = 'anthropic' | 'openai' | 'google' | 'openai-compatible';

export interface LlmConfig {
  provider: ProviderName;
  model: string;
  apiKey: string;
  baseURL?: string;
}

const PROVIDERS: ProviderName[] = ['anthropic', 'openai', 'google', 'openai-compatible'];

const DEFAULT_MODEL: Partial<Record<ProviderName, string>> = {
  anthropic: 'claude-sonnet-5',
};

const FALLBACK_KEY_VAR: Record<ProviderName, string | undefined> = {
  anthropic: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
  google: 'GOOGLE_GENERATIVE_AI_API_KEY',
  'openai-compatible': undefined,
};

export function readLlmConfig(env: NodeJS.ProcessEnv = process.env): LlmConfig | null {
  const provider = (env.LLM_PROVIDER ?? 'anthropic') as ProviderName;
  if (!PROVIDERS.includes(provider)) {
    throw new Error(`LLM_PROVIDER must be one of ${PROVIDERS.join(', ')} (got "${provider}")`);
  }

  const fallbackVar = FALLBACK_KEY_VAR[provider];
  const apiKey = env.LLM_API_KEY ?? (fallbackVar ? env[fallbackVar] : undefined);
  if (!apiKey) return null;

  const model = env.LLM_MODEL ?? DEFAULT_MODEL[provider];
  if (!model) {
    throw new Error(`LLM_MODEL is required for provider "${provider}"`);
  }

  const baseURL = env.LLM_BASE_URL;
  if (provider === 'openai-compatible' && !baseURL) {
    throw new Error('LLM_BASE_URL is required for provider "openai-compatible"');
  }

  return { provider, model, apiKey, baseURL };
}

export function createModel(config: LlmConfig): LanguageModel {
  switch (config.provider) {
    case 'anthropic':
      return createAnthropic({ apiKey: config.apiKey, baseURL: config.baseURL })(config.model);
    case 'openai':
      return createOpenAI({ apiKey: config.apiKey, baseURL: config.baseURL })(config.model);
    case 'google':
      return createGoogleGenerativeAI({ apiKey: config.apiKey, baseURL: config.baseURL })(config.model);
    case 'openai-compatible':
      return createOpenAICompatible({
        name: 'workshop-gateway',
        apiKey: config.apiKey,
        baseURL: config.baseURL!,
      }).chatModel(config.model);
  }
}

export function describeLlm(config: LlmConfig | null): string {
  if (!config) return 'no model configured (cached mode)';
  return `${config.provider}/${config.model}${config.baseURL ? ` via ${config.baseURL}` : ''}`;
}

export interface GenerateTextOptions {
  model: LanguageModel;
  system: string;
  prompt: string;
  maxOutputTokens?: number;
}

/** Phase 2: prose in, prose out. */
export async function generateMarkdown(options: GenerateTextOptions): Promise<string> {
  const result = await generateText({
    model: options.model,
    system: options.system,
    prompt: options.prompt,
    maxOutputTokens: options.maxOutputTokens ?? 16000,
  });
  return result.text;
}

export interface GenerateStructuredOptions<S extends z.ZodTypeAny> extends GenerateTextOptions {
  schema: S;
  schemaName: string;
  schemaDescription?: string;
}

/**
 * Phase 3 and 4: schema-constrained output. The schema is the contract
 * between the model and the renderer; nothing gets through that does not
 * validate against it.
 */
export async function generateStructured<S extends z.ZodTypeAny>(
  options: GenerateStructuredOptions<S>,
): Promise<z.infer<S>> {
  const result = await generateText({
    model: options.model,
    system: options.system,
    prompt: options.prompt,
    maxOutputTokens: options.maxOutputTokens ?? 16000,
    output: Output.object({
      schema: options.schema,
      name: options.schemaName,
      description: options.schemaDescription,
    }),
  });
  if (result.output === undefined) {
    throw new Error('Model returned no structured output');
  }
  return options.schema.parse(result.output) as z.infer<S>;
}
