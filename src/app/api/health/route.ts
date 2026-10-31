import { NextResponse } from 'next/server';
import { systemLogger } from '@/infrastructure/logging/logger';
import { COLLECTIONS, EMBEDDING_DIMENSIONS } from '@/infrastructure/db/schemas';

export const dynamic = 'force-dynamic';

export async function GET() {
  const hasGeminiKey = Boolean(
    process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0
  );
  const hasMongoUri = Boolean(
    process.env.MONGODB_URI &&
      (process.env.MONGODB_URI.startsWith('mongodb://') ||
        process.env.MONGODB_URI.startsWith('mongodb+srv://'))
  );

  const statusPayload = {
    status: 'ok',
    service: 'mindmittel2',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? 'development',
    components: {
      geminiApiConfigured: hasGeminiKey,
      mongoAtlasConfigured: hasMongoUri,
      databaseName: process.env.MONGODB_DB_NAME ?? 'mindmittel_v2',
      collections: Object.values(COLLECTIONS),
      vectorDimensions: EMBEDDING_DIMENSIONS,
    },
  };

  systemLogger.info('api.health', 'Health telemetry check executed', {
    geminiConfigured: hasGeminiKey,
    mongoConfigured: hasMongoUri,
  });

  return NextResponse.json(statusPayload, { status: 200 });
}
