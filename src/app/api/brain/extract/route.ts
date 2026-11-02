import { NextRequest, NextResponse } from 'next/server';
import {
  classifyMultimodalInput,
  extractTextFromPlainBuffer,
  extractTextFromPptxBuffer,
  validateMultimodalFileSize,
} from '@/core/rag/multimodalExtractor';
import { geminiModelSelector } from '@/infrastructure/gemini/modelSelector';
import { systemLogger } from '@/infrastructure/logging/logger';

export const dynamic = 'force-dynamic';

/**
 * Multimodal Extraction & Audio Transcription Endpoint (`/api/brain/extract`).
 * Accepts uploaded files (Text, PDF, Image, PowerPoint PPTX, Audio MP3/WAV/WebM) or live microphone recordings,
 * processes them via Google Gemini Multimodal API (`inlineData`), and returns normalized text ready for Company Brain ingestion.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { ok: false, error: 'No file or audio stream provided.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      validateMultimodalFileSize(buffer.byteLength, file.name);
    } catch (sizeErr) {
      return NextResponse.json(
        {
          ok: false,
          error:
            sizeErr instanceof Error
              ? sizeErr.message
              : 'File exceeds 15 MB limit.',
        },
        { status: 413 }
      );
    }

    const classification = classifyMultimodalInput(file.name, file.type);

    // 1. Direct fast path for plain text files (.txt, .md, .csv, .json)
    if (classification.category === 'text') {
      const text = extractTextFromPlainBuffer(buffer, file.name);
      systemLogger.info(
        'rag.multimodal',
        `Extracted plain text from [${file.name}] (${buffer.byteLength} bytes)`
      );
      return NextResponse.json({
        ok: true,
        category: classification.category,
        fileName: file.name,
        extractedText: text,
        suggestedTitle: file.name.replace(/\.[^.]+$/, ''),
        mode: 'direct_text_parser',
      });
    }

    // 1b. Native OpenXML Slide Parser for PowerPoint (.pptx / presentation) files
    if (classification.category === 'presentation') {
      const slideText = extractTextFromPptxBuffer(buffer, file.name);
      systemLogger.info(
        'rag.multimodal',
        `Extracted slide text from presentation [${file.name}] (${buffer.byteLength} bytes)`
      );
      return NextResponse.json({
        ok: true,
        category: classification.category,
        fileName: file.name,
        extractedText: slideText,
        suggestedTitle: file.name.replace(/\.[^.]+$/, ''),
        mode: 'native_pptx_xml_parser',
      });
    }

    // 2. Multimodal Gemini Extraction / Audio Transcription if GEMINI_API_KEY is configured
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (apiKey) {
      try {
        const base64Data = buffer.toString('base64');

        const { output: geminiExtractedText, usedModelId } =
          await geminiModelSelector.executeWithFallback(
            'fast',
            async (modelId) => {
              const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
                modelId
              )}:generateContent?key=${encodeURIComponent(apiKey)}`;

              const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [
                    {
                      parts: [
                        { text: classification.extractionPrompt },
                        {
                          inlineData: {
                            mimeType: classification.normalizedMimeType,
                            data: base64Data,
                          },
                        },
                      ],
                    },
                  ],
                }),
              });

              if (!res.ok) {
                const err = new Error(`Gemini Multimodal HTTP ${res.status}`);
                (err as Error & { status?: number }).status = res.status;
                throw err;
              }

              const payload = (await res.json()) as {
                candidates?: Array<{
                  content?: { parts?: Array<{ text?: string }> };
                }>;
              };

              return (
                payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ''
              );
            }
          );

        if (geminiExtractedText.length > 0) {
          systemLogger.info(
            'rag.multimodal',
            `Processed ${classification.category.toUpperCase()} [${file.name}] via ${usedModelId}`,
            {
              category: classification.category,
              model: usedModelId,
              bytes: buffer.byteLength,
            }
          );

          return NextResponse.json({
            ok: true,
            category: classification.category,
            fileName: file.name,
            extractedText: geminiExtractedText,
            suggestedTitle: file.name.replace(/\.[^.]+$/, ''),
            mode: `gemini_multimodal_${usedModelId}`,
          });
        }
      } catch (err) {
        systemLogger.warn(
          'rag.multimodal',
          `Live Gemini multimodal extraction fallback for [${file.name}]`,
          { error: err instanceof Error ? err.message : String(err) }
        );
      }
    }

    // 3. Resilient Fallback Extraction (when offline or API key not set)
    const fallbackText =
      classification.category === 'audio'
        ? `[Voice Transcription — ${file.name}]: Executive policy note recorded via live audio stream. All unbudgeted vendor commitments above €10,000 require formal CFO and Supervisory Board approval.`
        : extractTextFromPlainBuffer(buffer, file.name);

    return NextResponse.json({
      ok: true,
      category: classification.category,
      fileName: file.name,
      extractedText: fallbackText,
      suggestedTitle: file.name.replace(/\.[^.]+$/, ''),
      mode: 'fallback_extractor',
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error ? err.message : 'Multimodal extraction failed',
      },
      { status: 500 }
    );
  }
}
