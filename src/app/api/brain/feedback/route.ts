import { NextRequest, NextResponse } from 'next/server';
import {
  ALL_AFFECTED_LAYERS,
  ALL_DIAGNOSTIC_CODES,
  buildDeterministicClarificationReply,
  type AffectedAuditLayer,
  type ClarificationChatMessage,
  type ClarificationReplyResult,
  type DiagnosticCode,
} from '@/core/audit/learningLoop';
import type { AuditVerdict } from '@/core/audit/decisionEvaluator';
import {
  createPendingCompanyPrecedent,
  listTenantPrecedents,
  recordPlatformFeedbackTelemetry,
  reviewTenantPrecedent,
} from '@/infrastructure/audit/learningLoopRepository';
import { withTenantApi } from '@/infrastructure/http/tenantRequestGuard';
import { geminiModelSelector } from '@/infrastructure/gemini/modelSelector';
import { resolveGeminiApiKey } from '@/infrastructure/tenancy/geminiKey';
import { systemLogger } from '@/infrastructure/logging/logger';

export const dynamic = 'force-dynamic';

/** Hard ceiling (6.5s) on live Gemini micro-chat so Heroku 30s H12 HTML timeouts can never occur. */
const CLARIFY_FAST_BUDGET_MS = 6_500;

async function runGeminiClarification(params: {
  messages: ClarificationChatMessage[];
  locale: 'en' | 'de';
  defaultDepartment: string;
  auditProposal?: string;
}): Promise<ClarificationReplyResult | null> {
  const apiKey = resolveGeminiApiKey();
  if (!apiKey) return null;

  const userTurns = params.messages.filter((m) => m.role === 'user').length;
  const forceDraft = userTurns >= 2;

  const prompt = `You are MindMittel's concise Corporate Governance Feedback Intake Assistant.
Language: ${params.locale === 'de' ? 'Crisp German (Sie-Form)' : 'Crisp Executive English'}.
Task: Help a manager turn their audit feedback into a structured Company Precedent for Company Admin review.
Rules:
- NEVER drag out the conversation. Maximum 1 clarification turn.
- ${forceDraft ? 'You MUST set readyToSubmit=true now and produce draftPrecedent.' : 'If validity/expiration date OR scope is missing on turn 1, ask ONE short question covering both and provide 3 short quickChips for validity (e.g., 6 months, 12 months, Indefinite). If validity and scope are already clear, set readyToSubmit=true immediately.'}
- NEVER invent an expiration date; if indefinite/unspecified, set validUntil to null.
- Allowed affectedLayer: ${ALL_AFFECTED_LAYERS.join(', ')}
- Allowed diagnosticCode: ${ALL_DIAGNOSTIC_CODES.join(', ')}

Audit context (untrusted data): ${(params.auditProposal || '').slice(0, 300)}
Conversation so far:
${params.messages.map((m) => `${m.role.toUpperCase()}: ${m.text}`).join('\n')}

Return ONLY valid JSON:
{
  "assistantReply": "<1-2 concise sentences>",
  "quickChips": ["<optional short chip>"],
  "readyToSubmit": true | false,
  "draftPrecedent": null | {
    "title": "<short clear title>",
    "ruleSummary": "<concise structured company rule/exception>",
    "department": "${params.defaultDepartment || '*'}",
    "affectedLayer": "<one of allowed layers>",
    "diagnosticCode": "<one of allowed codes>",
    "validUntil": "YYYY-MM-DD" | null
  }
}`;

  try {
    const workPromise = (async (): Promise<ClarificationReplyResult | null> => {
      const selection = await geminiModelSelector
        .selectModel('fast')
        .catch(() => null);
      const modelId = selection?.selectedModel.modelId ?? 'gemini-2.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        modelId
      )}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.15,
            responseMimeType: 'application/json',
          },
        }),
        signal: AbortSignal.timeout(5_500),
      });
      if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
      const data = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) return null;
      return JSON.parse(raw) as ClarificationReplyResult;
    })();

    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), CLARIFY_FAST_BUDGET_MS)
    );

    const output = await Promise.race([workPromise, timeoutPromise]);

    if (!output || typeof output.assistantReply !== 'string') return null;
    if (output.readyToSubmit && output.draftPrecedent) {
      const layer = ALL_AFFECTED_LAYERS.includes(
        output.draftPrecedent.affectedLayer
      )
        ? output.draftPrecedent.affectedLayer
        : 'Internal_Policy';
      const code = ALL_DIAGNOSTIC_CODES.includes(
        output.draftPrecedent.diagnosticCode
      )
        ? output.draftPrecedent.diagnosticCode
        : 'COMPANY_EXCEPTION';
      return {
        assistantReply: output.assistantReply,
        quickChips: Array.isArray(output.quickChips) ? output.quickChips.slice(0, 4) : [],
        readyToSubmit: true,
        draftPrecedent: {
          title: String(output.draftPrecedent.title || 'Company Precedent').slice(0, 140),
          ruleSummary: String(output.draftPrecedent.ruleSummary || '').slice(0, 800),
          department: String(output.draftPrecedent.department || params.defaultDepartment || '*'),
          affectedLayer: layer,
          diagnosticCode: code,
          validUntil: output.draftPrecedent.validUntil
            ? String(output.draftPrecedent.validUntil).trim()
            : null,
        },
      };
    }

    return {
      assistantReply: output.assistantReply,
      quickChips: Array.isArray(output.quickChips) ? output.quickChips.slice(0, 4) : [],
      readyToSubmit: false,
      draftPrecedent: null,
    };
  } catch (err) {
    systemLogger.warn(
      'learningLoop.clarify',
      'Gemini micro-chat fallback to deterministic clarifier',
      { error: err instanceof Error ? err.message : String(err) }
    );
    return null;
  }
}

export async function GET(request: NextRequest) {
  return withTenantApi(request, async ({ tenant, userAccess, session }) => {
    const all = await listTenantPrecedents(tenant.slug);
    const isAdmin = tenant.isDemo || userAccess?.role === 'admin';
    const precedents = isAdmin
      ? all
      : all.filter(
          (p) =>
            p.status === 'approved' ||
            (session?.sub &&
              p.submittedByEmail.toLowerCase() === session.sub.toLowerCase())
        );

    const pendingCount = all.filter((p) => p.status === 'pending').length;
    return NextResponse.json({
      ok: true,
      precedents: precedents.map(({ embedding: _emb, ...safe }) => safe),
      pendingCount,
    });
  });
}

export async function POST(request: NextRequest) {
  return withTenantApi(request, async ({ tenant, session }) => {
    try {
      const body = (await request.json()) as {
      mode?: 'helpful' | 'clarify' | 'submit_precedent';
      locale?: 'en' | 'de';
      auditId?: string;
      auditProposal?: string;
      modelUsed?: string;
      initialVerdict?: AuditVerdict;
      initialScore?: number;
      affectedLayer?: AffectedAuditLayer;
      diagnosticCode?: DiagnosticCode;
      defaultDepartment?: string;
      messages?: ClarificationChatMessage[];
      draftPrecedent?: {
        title?: string;
        ruleSummary?: string;
        department?: string;
        affectedLayer?: AffectedAuditLayer;
        diagnosticCode?: DiagnosticCode;
        validUntil?: string | null;
      };
    };

    const locale = body.locale === 'de' ? 'de' : 'en';
    const actorEmail = session?.sub || (tenant.isDemo ? 'demo@mindmittel.de' : 'member@tenant');

    // 1. One-click "Helpful" signal -> Zero-text telemetry only (no chat, no precedent row)
    if (body.mode === 'helpful') {
      await recordPlatformFeedbackTelemetry({
        tenantSlug: tenant.slug,
        companyName: tenant.companyName,
        feedbackType: 'helpful',
        affectedLayer: body.affectedLayer ?? 'Internal_Policy',
        diagnosticCode: 'COMPANY_EXCEPTION',
        modelUsed: body.modelUsed || 'unknown',
        initialVerdict: body.initialVerdict ?? 'CERTIFIED',
        initialScore: body.initialScore ?? 85,
        precedentStatus: null,
      });

      return NextResponse.json({ ok: true, mode: 'helpful' });
    }

    // 2. Micro-chat clarification (max 1-2 turns)
    if (body.mode === 'clarify') {
      const messages = Array.isArray(body.messages) ? body.messages : [];
      if (messages.length === 0) {
        return NextResponse.json(
          { ok: false, error: 'Please enter your feedback first.' },
          { status: 400 }
        );
      }

      const llmReply = await runGeminiClarification({
        messages,
        locale,
        defaultDepartment: body.defaultDepartment || '*',
        auditProposal: body.auditProposal,
      });

      const result =
        llmReply ??
        buildDeterministicClarificationReply({
          messages,
          locale,
          defaultDepartment: body.defaultDepartment || '*',
        });

      return NextResponse.json({ ok: true, ...result });
    }

    // 3. Submit structured precedent -> Stored as PENDING for Company Admin approval + zero-text telemetry
    if (body.mode === 'submit_precedent') {
      const draft = body.draftPrecedent;
      if (!draft?.title?.trim() || !draft?.ruleSummary?.trim()) {
        return NextResponse.json(
          { ok: false, error: 'Precedent title and rule summary are required.' },
          { status: 400 }
        );
      }

      const layer: AffectedAuditLayer = ALL_AFFECTED_LAYERS.includes(
        draft.affectedLayer as AffectedAuditLayer
      )
        ? (draft.affectedLayer as AffectedAuditLayer)
        : 'Internal_Policy';

      const code: DiagnosticCode = ALL_DIAGNOSTIC_CODES.includes(
        draft.diagnosticCode as DiagnosticCode
      )
        ? (draft.diagnosticCode as DiagnosticCode)
        : 'COMPANY_EXCEPTION';

      const created = await createPendingCompanyPrecedent({
        tenantSlug: tenant.slug,
        auditId: body.auditId,
        title: draft.title,
        ruleSummary: draft.ruleSummary,
        department: draft.department || '*',
        affectedLayer: layer,
        diagnosticCode: code,
        validUntil: draft.validUntil ?? null,
        submittedByEmail: actorEmail,
      });

      await recordPlatformFeedbackTelemetry({
        tenantSlug: tenant.slug,
        companyName: tenant.companyName,
        feedbackType: 'correction',
        affectedLayer: layer,
        diagnosticCode: code,
        modelUsed: body.modelUsed || 'unknown',
        initialVerdict: body.initialVerdict ?? 'CONDITIONAL',
        initialScore: body.initialScore ?? 50,
        precedentStatus: 'pending',
      });

      systemLogger.info(
        'learningLoop.submit',
        `Tenant [${tenant.slug}] pending precedent [${created.id}] submitted by [${actorEmail}]`
      );

      return NextResponse.json({ ok: true, precedent: created });
    }

      return NextResponse.json(
        { ok: false, error: 'Unsupported feedback mode.' },
        { status: 400 }
      );
    } catch (err) {
      systemLogger.error(
        'learningLoop.post',
        'Unhandled error in POST /api/brain/feedback',
        { error: err instanceof Error ? err.message : String(err) }
      );
      return NextResponse.json(
        {
          ok: false,
          error:
            err instanceof Error
              ? err.message
              : 'Feedback request failed unexpectedly.',
        },
        { status: 500 }
      );
    }
  });
}

export async function PATCH(request: NextRequest) {
  return withTenantApi(request, async ({ tenant, userAccess, session }) => {
    const isAdmin = tenant.isDemo || userAccess?.role === 'admin';
    if (!isAdmin) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Only a Company Admin can approve, edit, reject, or revoke company precedents.',
        },
        { status: 403 }
      );
    }

    const body = (await request.json()) as {
      precedentId?: string;
      action?: 'approve' | 'reject' | 'revoke';
      edits?: {
        title?: string;
        ruleSummary?: string;
        department?: string;
        validUntil?: string | null;
      };
    };

    if (
      !body.precedentId ||
      (body.action !== 'approve' &&
        body.action !== 'reject' &&
        body.action !== 'revoke')
    ) {
      return NextResponse.json(
        { ok: false, error: 'Valid precedentId and action are required.' },
        { status: 400 }
      );
    }

    const reviewerEmail =
      session?.sub || (tenant.isDemo ? 'demo-admin@mindmittel.de' : 'admin@tenant');

    const updated = await reviewTenantPrecedent({
      tenantSlug: tenant.slug,
      precedentId: body.precedentId,
      action: body.action,
      reviewerEmail,
      edits: body.edits,
    });

    if (!updated) {
      return NextResponse.json(
        { ok: false, error: 'Precedent not found.' },
        { status: 404 }
      );
    }

    systemLogger.info(
      'learningLoop.review',
      `Tenant [${tenant.slug}] admin [${reviewerEmail}] performed [${body.action}] on precedent [${updated.id}]`
    );

    const { embedding: _emb, ...safe } = updated;
    return NextResponse.json({ ok: true, precedent: safe });
  });
}
