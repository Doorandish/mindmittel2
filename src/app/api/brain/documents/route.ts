import { NextRequest, NextResponse } from 'next/server';
import {
  getVectorSearchDiagnosticStatus,
  ingestDocumentIntoBrain,
  listBrainDocumentConflicts,
  listBrainDocuments,
  removeBrainDocument,
  updateBrainDocument,
} from '@/infrastructure/rag/brainRepository';
import { withTenantApi } from '@/infrastructure/http/tenantRequestGuard';
import type { DocumentSourceType } from '@/core/rag/chunker';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return withTenantApi(request, async () => {
    const documents = await listBrainDocuments();
    const conflicts = await listBrainDocumentConflicts();
    return NextResponse.json({
      ok: true,
      documents,
      conflicts,
      vectorSearchStatus: getVectorSearchDiagnosticStatus(),
    });
  });
}

export async function POST(request: NextRequest) {
  return withTenantApi(request, async ({ session }) => {
    try {
      const body = (await request.json()) as {
        title?: string;
        content?: string;
        department?: string;
        sourceType?: DocumentSourceType;
        tags?: string[];
        language?: 'en' | 'de';
        createdByEmail?: string;
        createdByName?: string;
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
        createdByEmail: session?.sub ?? body.createdByEmail,
        createdByName: session?.name ?? body.createdByName,
      });

      const documents = await listBrainDocuments();
      const conflicts = await listBrainDocumentConflicts();

      return NextResponse.json({
        ok: true,
        ingestion: result,
        documents,
        conflicts,
      });
    } catch (err) {
      return NextResponse.json(
        {
          ok: false,
          error:
            err instanceof Error ? err.message : 'Failed to ingest document',
        },
        { status: 500 }
      );
    }
  });
}

export async function PUT(request: NextRequest) {
  return withTenantApi(request, async ({ session }) => {
    try {
      const body = (await request.json()) as {
        parentId?: string;
        title?: string;
        content?: string;
        department?: string;
        tags?: string[];
        updatedByEmail?: string;
        updatedByName?: string;
      };

      if (
        !body.parentId?.trim() ||
        !body.title?.trim() ||
        !body.content?.trim()
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'parentId, title, and content are required to update a document.',
          },
          { status: 400 }
        );
      }

      const updated = await updateBrainDocument({
        parentId: body.parentId,
        title: body.title,
        content: body.content,
        department: body.department ?? 'General',
        tags: body.tags,
        updatedByEmail: session?.sub ?? body.updatedByEmail,
        updatedByName: session?.name ?? body.updatedByName,
      });

      const documents = await listBrainDocuments();
      const conflicts = await listBrainDocumentConflicts();

      return NextResponse.json({
        ok: true,
        updated,
        documents,
        conflicts,
      });
    } catch (err) {
      return NextResponse.json(
        {
          ok: false,
          error:
            err instanceof Error ? err.message : 'Failed to update document',
        },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(request: NextRequest) {
  return withTenantApi(request, async () => {
    try {
      const parentId = request.nextUrl.searchParams.get('parentId');
      if (!parentId) {
        return NextResponse.json(
          { ok: false, error: 'parentId query parameter is required.' },
          { status: 400 }
        );
      }

      await removeBrainDocument(parentId);
      const documents = await listBrainDocuments();
      const conflicts = await listBrainDocumentConflicts();

      return NextResponse.json({
        ok: true,
        documents,
        conflicts,
      });
    } catch (err) {
      return NextResponse.json(
        {
          ok: false,
          error:
            err instanceof Error ? err.message : 'Failed to delete document',
        },
        { status: 403 }
      );
    }
  });
}
