import zlib from 'zlib';

export const MAX_MULTIMODAL_FILE_BYTES = 15 * 1024 * 1024; // 15 MB guard for Base64 inline payloads

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
 * Validates that an uploaded file or audio stream does not exceed the 15 MB inline processing limit.
 */
export function validateMultimodalFileSize(
  byteLength: number,
  fileName: string
): void {
  if (byteLength > MAX_MULTIMODAL_FILE_BYTES) {
    const sizeMb = (byteLength / (1024 * 1024)).toFixed(1);
    throw new Error(
      `File "${fileName}" (${sizeMb} MB) exceeds the maximum allowed upload size of 15 MB.`
    );
  }
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

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function extractDrawingMlTextNodes(xmlString: string): string[] {
  const matches: string[] = [];
  const tagRegex = /<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/gi;
  let match: RegExpExecArray | null = tagRegex.exec(xmlString);
  while (match !== null) {
    const cleaned = decodeXmlEntities(match[1]).trim();
    if (cleaned.length > 0) {
      matches.push(cleaned);
    }
    match = tagRegex.exec(xmlString);
  }
  return matches;
}

/**
 * Native PowerPoint (.pptx) Slide Text Extractor.
 * Parses OpenXML `<a:t>` text runs directly from uncompressed XML or ZIP-deflated `ppt/slides/slide*.xml` entries
 * without sending unsupported `.pptx` binary MIME types to Gemini `inlineData`.
 */
export function extractTextFromPptxBuffer(
  buffer: Buffer,
  fileName: string
): string {
  const collectedSegments: string[] = [];

  // 1. Check if buffer contains ZIP Local File Headers (PK\x03\x04 = 0x04034b50)
  let offset = 0;
  while (offset + 30 <= buffer.length) {
    const signature = buffer.readUInt32LE(offset);
    if (signature !== 0x04034b50) {
      offset += 1;
      continue;
    }

    const compressionMethod = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const fileNameLength = buffer.readUInt16LE(offset + 26);
    const extraFieldLength = buffer.readUInt16LE(offset + 28);
    const dataStart = offset + 30 + fileNameLength + extraFieldLength;

    if (dataStart > buffer.length) break;

    const entryName = buffer
      .subarray(offset + 30, offset + 30 + fileNameLength)
      .toString('utf-8');

    const dataEnd =
      compressedSize > 0
        ? Math.min(dataStart + compressedSize, buffer.length)
        : buffer.length;

    if (
      entryName.endsWith('.xml') &&
      (entryName.includes('slide') || entryName.includes('notes'))
    ) {
      try {
        const rawSlice = buffer.subarray(dataStart, dataEnd);
        const xmlBuf =
          compressionMethod === 8
            ? zlib.inflateRawSync(rawSlice)
            : compressionMethod === 0
              ? rawSlice
              : null;

        if (xmlBuf) {
          const nodes = extractDrawingMlTextNodes(xmlBuf.toString('utf-8'));
          if (nodes.length > 0) {
            collectedSegments.push(nodes.join(' '));
          }
        }
      } catch {
        // Continue scanning remaining entries if a single ZIP entry uses data descriptors
      }
    }

    offset = dataEnd > offset ? dataEnd : offset + 30;
  }

  // 2. Also scan raw UTF-8 buffer directly for <a:t>...</a:t> tags (handles uncompressed XML or test buffers)
  if (collectedSegments.length === 0) {
    const directNodes = extractDrawingMlTextNodes(buffer.toString('utf-8'));
    if (directNodes.length > 0) {
      collectedSegments.push(directNodes.join(' '));
    }
  }

  if (collectedSegments.length > 0) {
    return collectedSegments.join('\n\n').trim();
  }

  return extractTextFromPlainBuffer(buffer, fileName);
}
