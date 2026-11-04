import { NextRequest, NextResponse } from 'next/server';
import {
  getConnectorsList,
  listBrainDocumentConflicts,
  listBrainDocuments,
  saveConnectorConfig,
  syncConnectorDataIntoBrain,
  toggleConnectorById,
} from '@/infrastructure/rag/brainRepository';

export const dynamic = 'force-dynamic';

export async function GET() {
  const connectors = await getConnectorsList();
  return NextResponse.json({
    ok: true,
    connectors,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      action: 'configure' | 'toggle' | 'sync';
      connectorId?: string;
      apiSecret?: string;
      targetScope?: string;
      enabled?: boolean;
      userEmail?: string;
      userName?: string;
    };

    const connectorId = body.connectorId?.trim();
    const userEmail =
      body.userEmail?.trim().toLowerCase() || 'executive@mindmittel.de';

    if (!connectorId) {
      return NextResponse.json(
        { ok: false, error: 'connectorId is required.' },
        { status: 400 }
      );
    }

    if (body.action === 'configure') {
      const connectors = await saveConnectorConfig({
        connectorId,
        apiSecret: body.apiSecret ?? '',
        targetScope: body.targetScope,
        userEmail,
      });

      return NextResponse.json({
        ok: true,
        connectors,
      });
    }

    if (body.action === 'toggle') {
      const connectors = await toggleConnectorById({
        connectorId,
        enabled: Boolean(body.enabled),
        userEmail,
      });

      return NextResponse.json({
        ok: true,
        connectors,
      });
    }

    if (body.action === 'sync') {
      const syncResult = await syncConnectorDataIntoBrain({
        connectorId,
        userEmail,
        userName: body.userName,
      });
      const documents = await listBrainDocuments();
      const conflicts = await listBrainDocumentConflicts();

      return NextResponse.json({
        ok: true,
        connectors: syncResult.connectors,
        syncedTitle: syncResult.syncedTitle,
        childVectorCount: syncResult.childVectorCount,
        unchanged: syncResult.unchanged,
        message: syncResult.message,
        documents,
        conflicts,
      });
    }

    return NextResponse.json(
      { ok: false, error: 'Unsupported connector action.' },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'Connector action failed',
      },
      { status: 400 }
    );
  }
}
