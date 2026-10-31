import { EMBEDDING_DIMENSIONS } from '@/infrastructure/db/schemas';
import { generateDeterministicSemanticEmbedding } from '@/core/rag/vectorMath';
import { systemLogger } from '@/infrastructure/logging/logger';

/**
 * Generates a 768-dimensional embedding vector using Google Gemini (`text-embedding-004`).
 * If the API key is not configured or the network fails, seamlessly falls back to the
 * deterministic 768-d semantic embedding engine so ingestion and search never fail.
 */
export async function generateGeminiEmbedding768(
  text: string
): Promise<{ vector: number[]; modelUsed: string }> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (apiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${encodeURIComponent(
        apiKey
      )}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/text-embedding-004',
          content: {
            parts: [{ text }],
          },
          outputDimensionality: EMBEDDING_DIMENSIONS,
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          embedding?: { values?: number[] };
        };
        const values = data.embedding?.values;
        if (Array.isArray(values) && values.length === EMBEDDING_DIMENSIONS) {
          return {
            vector: values,
            modelUsed: 'text-embedding-004',
          };
        }
      }
    } catch (err) {
      systemLogger.warn(
        'ai.embedding',
        `Live Gemini embedding call failed; using deterministic 768-d semantic vector fallback`,
        {
          error: err instanceof Error ? err.message : String(err),
        }
      );
    }
  }

  return {
    vector: generateDeterministicSemanticEmbedding(text),
    modelUsed: 'deterministic-semantic-768d',
  };
}
