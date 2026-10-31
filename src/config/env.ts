import { z } from 'zod';

const envSchema = z.object({
  GEMINI_API_KEY: z
    .string({
      required_error: 'GEMINI_API_KEY is required in environment variables.',
    })
    .min(1, 'GEMINI_API_KEY cannot be empty.'),
  MONGODB_URI: z
    .string({
      required_error: 'MONGODB_URI is required in environment variables.',
    })
    .refine(
      (val) => val.startsWith('mongodb://') || val.startsWith('mongodb+srv://'),
      {
        message: 'MONGODB_URI must start with mongodb:// or mongodb+srv://',
      }
    ),
  MONGODB_DB_NAME: z.string().min(1).default('mindmittel_v2'),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  SYSTEM_DASHBOARD_TOKEN: z.string().optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

/**
 * Validates raw environment variables against the strict schema.
 * Throws a descriptive error listing missing or invalid keys.
 */
export function validateEnv(rawEnv: Record<string, string | undefined>): AppEnv {
  const result = envSchema.safeParse(rawEnv);

  if (!result.success) {
    const formattedIssues = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${formattedIssues}`);
  }

  return result.data;
}

let cachedEnv: AppEnv | null = null;

/**
 * Lazily retrieves validated environment variables at runtime.
 */
export function getEnv(): AppEnv {
  if (!cachedEnv) {
    cachedEnv = validateEnv(process.env);
  }
  return cachedEnv;
}
