import { describe, it, expect } from 'vitest';
import {
  classifyMultimodalInput,
  extractTextFromPlainBuffer,
  extractTextFromPptxBuffer,
  validateMultimodalFileSize,
  MAX_MULTIMODAL_FILE_BYTES,
} from '@/core/rag/multimodalExtractor';
import { dictionaries } from '@/i18n/dictionaries';
import fs from 'fs';
import path from 'path';

describe('Multimodal File & Audio Transcription Classifier & Workspace UX Rules', () => {
  const rootDir = path.resolve(__dirname, '../../../../');

  it('classifies text, PDF, image, presentation (PPTX), and audio MIME types accurately', () => {
    expect(
      classifyMultimodalInput('policy.pdf', 'application/pdf').category
    ).toBe('pdf');
    expect(
      classifyMultimodalInput('slide_deck.pptx', '').category
    ).toBe('presentation');
    expect(
      classifyMultimodalInput('board_photo.png', 'image/png').category
    ).toBe('image');
    expect(
      classifyMultimodalInput('voice_memo.webm', 'audio/webm').category
    ).toBe('audio');
    expect(
      classifyMultimodalInput('notes.txt', 'text/plain').category
    ).toBe('text');
  });

  it('extracts readable text from plain text / markdown buffers directly', () => {
    const sample = Buffer.from(
      'Section 1: All remote engineering laptops require full-disk encryption.',
      'utf-8'
    );
    const extracted = extractTextFromPlainBuffer(sample, 'security.txt');
    expect(extracted).toContain('full-disk encryption');
  });

  it('extracts structured slide text from PPTX XML <a:t> tags and enforces 15MB upload size guard', () => {
    const mockPptxXmlBuffer = Buffer.from(
      '<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><p:cSld><p:spTree><a:t>Q4 Supervisory Board Resolution</a:t><a:t>Unbudgeted software spend over €10,000 requires CFO sign-off.</a:t></p:spTree></p:cSld></p:sld>',
      'utf-8'
    );
    const slideText = extractTextFromPptxBuffer(
      mockPptxXmlBuffer,
      'board_deck.pptx'
    );
    expect(slideText).toContain('Q4 Supervisory Board Resolution');
    expect(slideText).toContain('requires CFO sign-off');

    expect(MAX_MULTIMODAL_FILE_BYTES).toBe(15 * 1024 * 1024);
    expect(() => validateMultimodalFileSize(1024, 'small.pdf')).not.toThrow();
    expect(() =>
      validateMultimodalFileSize(MAX_MULTIMODAL_FILE_BYTES + 100, 'huge.mp3')
    ).toThrow(/15 MB/i);
  });

  it('removes PHASE 1 and PHASE 2 labels from workspace UI and hides Launch Live App button when inside workspace', () => {
    const pageSource = fs.readFileSync(
      path.join(rootDir, 'src/app/page.tsx'),
      'utf-8'
    );
    const shellSource = fs.readFileSync(
      path.join(rootDir, 'src/components/layout/AppShell.tsx'),
      'utf-8'
    );

    expect(pageSource).not.toContain('PHASE 1 — INJECT KNOWLEDGE');
    expect(pageSource).not.toContain('PHASE 2 — DECISION AUDIT DASHBOARD');
    expect(shellSource).toContain("activeTab === 'overview'");
  });

  it('uses "Home" in header navigation to return to landing page, stacks Indexed Brain Documents below full-width ingestion form, and renders a live step-by-step audit progress checklist', () => {
    expect(dictionaries.en.nav.backToLanding).toBe('Home');
    expect(dictionaries.de.nav.backToLanding).toBe('Home');

    const pageSource = fs.readFileSync(
      path.join(rootDir, 'src/app/page.tsx'),
      'utf-8'
    );

    // Company Brain tab should NOT split into narrow lg:col-span-7 / lg:col-span-5 columns
    expect(pageSource).not.toContain('lg:col-span-7');
    expect(pageSource).not.toContain('lg:col-span-5');

    // Audit Executive Decision tab should include live step-by-step execution checklist
    expect(pageSource).toContain('AUDIT_PIPELINE_STEPS');
    expect(pageSource).toContain('auditCompletedSteps');
  });
});
