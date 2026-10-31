import { describe, it, expect } from 'vitest';
import { validateEnv } from '@/config/env';

describe('Environment Configuration Validator (Zod)', () => {
  it('validates complete and valid environment variables', () => {
    const rawEnv = {
      GEMINI_API_KEY: 'AIzaSyTestKey123456',
      MONGODB_URI: 'mongodb+srv://user:pass@cluster0.mongodb.net/mindmittel_v2',
      MONGODB_DB_NAME: 'mindmittel_v2',
      NODE_ENV: 'development',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    };

    const parsed = validateEnv(rawEnv);
    expect(parsed.GEMINI_API_KEY).toBe('AIzaSyTestKey123456');
    expect(parsed.MONGODB_DB_NAME).toBe('mindmittel_v2');
    expect(parsed.NODE_ENV).toBe('development');
  });

  it('applies default database name mindmittel_v2 when omitted', () => {
    const rawEnv = {
      GEMINI_API_KEY: 'AIzaSyTestKey123456',
      MONGODB_URI: 'mongodb+srv://user:pass@cluster0.mongodb.net/',
    };

    const parsed = validateEnv(rawEnv);
    expect(parsed.MONGODB_DB_NAME).toBe('mindmittel_v2');
  });

  it('throws a descriptive error when GEMINI_API_KEY is missing or empty', () => {
    const rawEnv = {
      GEMINI_API_KEY: '',
      MONGODB_URI: 'mongodb+srv://user:pass@cluster0.mongodb.net/mindmittel_v2',
    };

    expect(() => validateEnv(rawEnv)).toThrow(/GEMINI_API_KEY/i);
  });

  it('throws a descriptive error when MONGODB_URI is invalid', () => {
    const rawEnv = {
      GEMINI_API_KEY: 'AIzaSyTestKey123456',
      MONGODB_URI: 'not-a-valid-mongo-uri',
    };

    expect(() => validateEnv(rawEnv)).toThrow(/MONGODB_URI/i);
  });
});
