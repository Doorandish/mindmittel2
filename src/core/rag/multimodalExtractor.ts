export type MultimodalInputCategory =
  | 'text'
  | 'pdf'
  | 'image'
  | 'presentation'
  | 'audio';

export interface MultimodalClassification {
  category: MultimodalInputCategory;
  normalizedMimeType: string;
  extractionPrompt: string;
}

/**
 * Pure function that classifies an uploaded file or live voice recording
 * into a multimodal processing category and builds the appropriate Gemini extraction prompt.
 */
export function classifyMultimodalInput(
  fileName: string,
  mimeType: string
): MultimodalClassification {
  const lowerName = fileName.toLowerCase().trim();
  const lowerMime = mimeType.toLowerCase().trim();

  if (
    lowerMime.startsWith('audio/') ||
    /\.(mp3|wav|webm|ogg|m4a|aac|flac)$/.test(lowerName)
  ) {
    return {
      category: 'audio',
      normalizedMimeType: lowerMime || 'audio/webm',
      extractionPrompt:
        'Transcribe this corporate audio or voice dictation accurately into clean, structured text suitable for indexing into an enterprise governance knowledge base. Output only the transcribed text.',
    };
  }

  if (
    lowerMime === 'application/pdf' ||
    lowerName.endsWith('.pdf')
  ) {
    return {
      category: 'pdf',
      normalizedMimeType: 'application/pdf',
      extractionPrompt:
        'Extract all policy clauses, headings, and key rules from this PDF document into clean, structured plain text for enterprise RAG indexing.',
    };
  }

  if (
    lowerMime.startsWith('image/') ||
    /\.(png|jpg|jpeg|webp|gif)$/.test(lowerName)
  ) {
    return {
      category: 'image',
      normalizedMimeType: lowerMime || 'image/png',
      extractionPrompt:
        'Perform high-accuracy OCR and extract all text, tables, and governance diagrams from this image into structured plain text.',
    };
  }

  if (
    lowerMime.includes('presentation') ||
    lowerMime.includes('powerpoint') ||
    /\.(ppt|pptx|key)$/.test(lowerName)
  ) {
    return {
      category: 'presentation',
      normalizedMimeType:
        lowerMime ||
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      extractionPrompt:
        'Extract all slide titles, bullet points, and strategic notes from this presentation into clean, structured text.',
    };
  }

  return {
    category: 'text',
    normalizedMimeType: 'text/plain',
    extractionPrompt:
      'Normalize and structure this text document for enterprise RAG indexing.',
  };
}

/**
 * Extracts readable UTF-8 text from plain text, markdown, CSV, or raw binary buffers
 * (such as readable XML/text segments inside PPTX/PDF when running in offline fallback mode).
 */
export function extractTextFromPlainBuffer(
  buffer: Buffer,
  fileName: string
): string {
  const rawUtf8 = buffer.toString('utf-8');
  const lowerName = fileName.toLowerCase();

  if (/\.(txt|md|csv|json|log)$/.test(lowerName)) {
    return rawUtf8.trim();
  }

  // Extract printable ASCII/Latin/German text runs for binary containers in offline mode
  const printableRuns = rawUtf8
    .replace(/[^\x20-\x7E\u00C0-\u017F\n\r]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (printableRuns.length > 40) {
    return printableRuns.slice(0, 4000);
  }

  return `Extracted content from ${fileName} (${buffer.byteLength} bytes).`;
}
