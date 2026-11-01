import { NextRequest, NextResponse } from 'next/server';
import {
  getVectorSearchDiagnosticStatus,
  ingestDocumentIntoBrain,
  listBrainDocuments,
  removeBrainDocument,
} from '@/infrastructure/rag/brainRepository';
import type { DocumentSourceType } from '@/core/rag/chunker';

export const dynamic = 'force-dynamic';

export async function GET() {
  const documents = await listBrainDocuments();
  return NextResponse.json({
    ok: true,
    documents,
    vectorSearchStatus: getVectorSearchDiagnosticStatus(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      title?: string;
      content?: string;
      department?: string;
      sourceType?: DocumentSourceType;
      tags?: string[];
      language?: 'en' | 'de';
    };

    if (!body.title?.trim() || !body.content?.trim()) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Both document title and content are required.',
        },
        { status: 400 }
      );
    }

    const result = await ingestDocumentIntoBrain({
      title: body.title,
      content: body.content,
      department: body.department ?? 'General',
      sourceType: body.sourceType ?? 'upload',
      tags: body.tags,
      language: body.language ?? 'en',
    });

    const documents = await listBrainDocuments();

    return NextResponse.json({
      ok: true,
      ingestion: result,
      documents,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to ingest document',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const parentId = request.nextUrl.searchParams.get('parentId');
  if (!parentId) {
    return NextResponse.json(
      { ok: false, error: 'parentId query parameter is required.' },
      { status: 400 }
    );
  }

  await removeBrainDocument(parentId);
  const documents = await listBrainDocuments();

  return NextResponse.json({
    ok: true,
    documents,
  });
}
