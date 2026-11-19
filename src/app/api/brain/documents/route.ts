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
import {
  canAccessDepartment,
  canEditDocuments,
  type TenantUserAccessProfile,
} from '@/core/auth/rbac';

export const dynamic = 'force-dynamic';

function filterDocsForUser<T extends { department: string }>(
  docs: T[],
  userAccess: TenantUserAccessProfile
): T[] {
  return docs.filter((d) => canAccessDepartment(userAccess, d.department));
}

export async function GET(request: NextRequest) {
  return withTenantApi(request, async ({ userAccess }) => {
    const allDocuments = await listBrainDocuments();
    const documents = filterDocsForUser(allDocuments, userAccess);
    const allowedTitles = new Set(documents.map((d) => d.title));
    const allConflicts = await listBrainDocumentConflicts();
    const conflicts = allConflicts.filter(
      (c) =>
        allowedTitles.has(c.newerDocument.title) &&
        allowedTitles.has(c.existingDocument.title)
    );
    return NextResponse.json({
      ok: true,
      documents,
      conflicts,
      vectorSearchStatus: getVectorSearchDiagnosticStatus(),
    });
  });
}

export async function POST(request: NextRequest) {
  return withTenantApi(request, async ({ session, userAccess }) => {
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

      const targetDept = body.department ?? 'executive-board';
      if (!canEditDocuments(userAccess, targetDept)) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'Insufficient permissions: you do not have edit access to this department.',
            code: 'FORBIDDEN_DEPARTMENT',
          },
          { status: 403 }
        );
      }

      const result = await ingestDocumentIntoBrain({
        title: body.title,
        content: body.content,
        department: targetDept,
        sourceType: body.sourceType ?? 'upload',
        tags: body.tags,
        language: body.language ?? 'en',
        createdByEmail: session?.sub ?? body.createdByEmail,
        createdByName: session?.name ?? body.createdByName,
      });

      const documents = filterDocsForUser(
        await listBrainDocuments(),
        userAccess
      );
      const allowedTitles = new Set(documents.map((d) => d.title));
      const conflicts = (await listBrainDocumentConflicts()).filter(
        (c) =>
        allowedTitles.has(c.newerDocument.title) &&
        allowedTitles.has(c.existingDocument.title)
      );

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
  return withTenantApi(request, async ({ session, userAccess }) => {
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

      const targetDept = body.department ?? 'executive-board';
      if (!canEditDocuments(userAccess, targetDept)) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'Insufficient permissions: you do not have edit access to this department.',
            code: 'FORBIDDEN_DEPARTMENT',
          },
          { status: 403 }
        );
      }

      const updated = await updateBrainDocument({
        parentId: body.parentId,
        title: body.title,
        content: body.content,
        department: targetDept,
        tags: body.tags,
        updatedByEmail: session?.sub ?? body.updatedByEmail,
        updatedByName: session?.name ?? body.updatedByName,
      });

      const documents = filterDocsForUser(
        await listBrainDocuments(),
        userAccess
      );
      const allowedTitles = new Set(documents.map((d) => d.title));
      const conflicts = (await listBrainDocumentConflicts()).filter(
        (c) =>
        allowedTitles.has(c.newerDocument.title) &&
        allowedTitles.has(c.existingDocument.title)
      );

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
  return withTenantApi(request, async ({ userAccess }) => {
    try {
      const parentId = request.nextUrl.searchParams.get('parentId');
      if (!parentId) {
        return NextResponse.json(
          { ok: false, error: 'parentId query parameter is required.' },
          { status: 400 }
        );
      }

      const existingDocs = await listBrainDocuments();
      const targetDoc = existingDocs.find(
        (d) =>
          d.parentId === parentId || (d.allParentIds ?? []).includes(parentId)
      );
      if (
        !canEditDocuments(userAccess, targetDoc?.department)
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'Insufficient permissions: you do not have delete access to this department.',
            code: 'FORBIDDEN_DEPARTMENT',
          },
          { status: 403 }
        );
      }

      await removeBrainDocument(parentId);
      const documents = filterDocsForUser(
        await listBrainDocuments(),
        userAccess
      );
      const allowedTitles = new Set(documents.map((d) => d.title));
      const conflicts = (await listBrainDocumentConflicts()).filter(
        (c) =>
        allowedTitles.has(c.newerDocument.title) &&
        allowedTitles.has(c.existingDocument.title)
      );

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
