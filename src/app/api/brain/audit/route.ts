import { NextRequest, NextResponse } from 'next/server';
import {
  listAuditHistory,
  listBrainDocuments,
  removeAuditHistoryEntry,
  saveAuditReportToHistory,
  searchBrainByVectorSimilarity,
} from '@/infrastructure/rag/brainRepository';
import { inferProfileFromQuery } from '@/core/ai/modelRanking';
import { geminiModelSelector } from '@/infrastructure/gemini/modelSelector';
import {
  evaluateDecisionAgainstPoliciesHeuristic,
  filterRelevantCitations,
  type AuditVerdict,
  type ExecutiveAuditReport,
  type MatchedParentContextInput,
} from '@/core/audit/decisionEvaluator';
import {
  applyGermanAdvisoryToReport,
  evaluateGermanRegulatoryAdvisory,
  type GermanRegulatoryAdvisory,
} from '@/core/audit/germanRegulatoryAdvisor';
import { buildExecutiveAuditPrompt } from '@/core/audit/auditPromptBuilder';
import { systemLogger } from '@/infrastructure/logging/logger';
import { withTenantApi } from '@/infrastructure/http/tenantRequestGuard';
import { runWithHeartbeatStream } from '@/infrastructure/http/streamingResponse';
import { resolveEffectiveDepartmentFilter } from '@/core/auth/rbac';
import { resolveGeminiApiKey } from '@/infrastructure/tenancy/geminiKey';

export const dynamic = 'force-dynamic';

/**
 * Calls the dynamically selected Google Gemini model to synthesize a rich Executive Audit Report,
 * or falls back seamlessly to the deterministic heuristic evaluator if no API key is configured.
 */
async function callGeminiAuditSynthesis(params: {
  decisionProposal: string;
  matchedParents: readonly MatchedParentContextInput[];
  germanAdvisory: GermanRegulatoryAdvisory;
  modelId: string;
  locale: 'en' | 'de';
}): Promise<Partial<ExecutiveAuditReport> | null> {
  const apiKey = resolveGeminiApiKey();
  if (!apiKey) return null;

  const prompt = buildExecutiveAuditPrompt({
    decisionProposal: params.decisionProposal,
    matchedParents: params.matchedParents,
    locale: params.locale,
    germanAdvisory: params.germanAdvisory,
  });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    params.modelId
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    }),
    signal: AbortSignal.timeout(18_000),
  });

  if (!response.ok) {
    const err = new Error(`Gemini HTTP ${response.status}`);
    (err as Error & { status?: number }).status = response.status;
    throw err;
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawJson) return null;

  const parsed = JSON.parse(rawJson) as {
    verdict?: AuditVerdict;
    alignmentScore?: number;
    executiveSummary?: string;
    strategicEvaluation?: string;
    pros?: string[];
    cons?: string[];
    roadmap?: string[];
  };

  return parsed;
}

export async function GET(request: NextRequest) {
  return withTenantApi(request, async () => {
    const history = await listAuditHistory();
    return NextResponse.json({
      ok: true,
      history,
    });
  });
}

export async function POST(request: NextRequest) {
  return withTenantApi(request, async ({ session, userAccess }) =>
    runWithHeartbeatStream(request, async () => {
      try {
        const body = (await request.json()) as {
          decisionProposal?: string;
          departmentFilter?: string;
          locale?: 'en' | 'de';
          auditedByEmail?: string;
          auditedByName?: string;
          excludedParentIds?: string[];
        };

        const decisionProposal = body.decisionProposal?.trim();
        if (!decisionProposal) {
          return {
            status: 400,
            body: {
              ok: false,
              error:
                'Please enter a management decision or policy question to audit.',
            },
          };
        }

      const locale = body.locale === 'de' ? 'de' : 'en';
      const inferredProfile = inferProfileFromQuery(decisionProposal);
      const excludedParentIds = Array.isArray(body.excludedParentIds)
        ? body.excludedParentIds.filter(
            (id): id is string => typeof id === 'string' && id.trim().length > 0
          )
        : undefined;

      const effectiveAllowedDepts = resolveEffectiveDepartmentFilter(
        userAccess,
        body.departmentFilter
      );
      const hasGeminiKey = Boolean(resolveGeminiApiKey());

      // 1 & 2. Retrieve matching Parent documents (strictly scoped by RBAC allowedDepartments), resolve optimal Gemini model, and fetch excluded doc metadata in parallel
      const [rawMatchedParents, modelSelection, allDocsForDisclosure] =
        await Promise.all([
          searchBrainByVectorSimilarity({
            query: decisionProposal,
            departmentFilter: body.departmentFilter,
            allowedDepartments: effectiveAllowedDepts,
            topK: 3,
            excludedParentIds,
          }),
          hasGeminiKey
            ? geminiModelSelector.selectModel(inferredProfile).catch(() => null)
            : Promise.resolve(null),
          excludedParentIds && excludedParentIds.length > 0
            ? listBrainDocuments()
            : Promise.resolve([]),
        ]);

      const matchedParents = filterRelevantCitations(rawMatchedParents);
      const selectedModelId =
        modelSelection?.selectedModel.modelId ??
        (inferredProfile === 'reasoning'
          ? 'gemini-2.5-pro'
          : 'gemini-2.5-flash');

      // 3. Build baseline deterministic report & German regulatory pre-screen
      const baselineReport = evaluateDecisionAgainstPoliciesHeuristic({
        decisionProposal,
        matchedParents,
        selectedModelId,
        inferredProfile,
        locale,
      });

      const germanAdvisory = evaluateGermanRegulatoryAdvisory({
        decisionProposal,
        matchedParents,
      });

      // 4. Enhance with live Gemini synthesis only if model catalog selection succeeded in this request
      if (hasGeminiKey && modelSelection) {
        try {
          const { output: llmPartial, usedModelId } =
            await geminiModelSelector.executeWithFallback(
              inferredProfile,
              async (modelId) =>
                callGeminiAuditSynthesis({
                  decisionProposal,
                  matchedParents,
                  germanAdvisory,
                  modelId,
                  locale,
                })
            );

          if (llmPartial && llmPartial.executiveSummary) {
            baselineReport.verdict =
              llmPartial.verdict ?? baselineReport.verdict;
            baselineReport.alignmentScore =
              typeof llmPartial.alignmentScore === 'number'
                ? llmPartial.alignmentScore
                : baselineReport.alignmentScore;
            baselineReport.executiveSummary = llmPartial.executiveSummary;
            baselineReport.strategicEvaluation =
              llmPartial.strategicEvaluation ??
              baselineReport.strategicEvaluation;
            baselineReport.pros =
              Array.isArray(llmPartial.pros) && llmPartial.pros.length > 0
                ? llmPartial.pros
                : baselineReport.pros;
            baselineReport.cons =
              Array.isArray(llmPartial.cons) && llmPartial.cons.length > 0
                ? llmPartial.cons
                : baselineReport.cons;
            baselineReport.roadmap =
              Array.isArray(llmPartial.roadmap) && llmPartial.roadmap.length > 0
                ? llmPartial.roadmap
                : baselineReport.roadmap;
            baselineReport.selectedModelId = usedModelId;
          }
        } catch (err) {
          systemLogger.warn(
            'audit.engine',
            'Live Gemini synthesis fallback to deterministic policy audit engine',
            { error: err instanceof Error ? err.message : String(err) }
          );
        }
      } else if (hasGeminiKey && !modelSelection) {
        systemLogger.warn(
          'audit.engine',
          'Gemini model selection unavailable; skipped duplicate retry and used deterministic policy audit engine'
        );
      }

      // 5. Enforce German Regulatory & Betriebsrat Verdict Guard AFTER LLM synthesis so it cannot be overridden
      const finalReport = applyGermanAdvisoryToReport(
        baselineReport,
        germanAdvisory,
        locale
      );

      // 6. Record any intentionally excluded documents in the report for immutable audit transparency
      if (excludedParentIds && excludedParentIds.length > 0) {
        const excludedSet = new Set(excludedParentIds);
        const excludedDocs = allDocsForDisclosure
          .filter(
            (doc) =>
              excludedSet.has(doc.parentId) ||
              (doc.allParentIds ?? []).some((id) => excludedSet.has(id))
          )
          .map((doc) => ({
            parentId: doc.parentId,
            title: doc.title,
            department: doc.department,
            sourceType: doc.sourceType,
          }));
        if (excludedDocs.length > 0) {
          finalReport.excludedDocuments = excludedDocs;
        }
      }

      const savedEntry = await saveAuditReportToHistory({
        decisionProposal,
        departmentFilter: body.departmentFilter ?? 'all',
        auditedByEmail: session?.sub ?? body.auditedByEmail,
        auditedByName: session?.name ?? body.auditedByName,
        report: finalReport,
      });

      const history = await listAuditHistory();

      systemLogger.info(
        'audit.engine',
        `Completed Executive Audit by [${savedEntry.auditedByEmail}] -> Verdict: ${finalReport.verdict} (${finalReport.alignmentScore}%) via ${finalReport.selectedModelId}`,
        {
          auditId: savedEntry.auditId,
          verdict: finalReport.verdict,
          alignmentScore: finalReport.alignmentScore,
          model: finalReport.selectedModelId,
          matchedDocs: matchedParents.length,
          betriebsratRequired: germanAdvisory.betriebsratInvolvementRequired,
          knowledgeCoverage: germanAdvisory.knowledgeCoverage.status,
        }
      );

      return {
        body: {
          ok: true,
          report: finalReport,
          entry: savedEntry,
          history,
        },
      };
    } catch (err) {
      return {
        status: 500,
        body: {
          ok: false,
          error:
            err instanceof Error ? err.message : 'Audit evaluation failed',
        },
      };
    }
    })
  );
}

export async function DELETE(request: NextRequest) {
  return withTenantApi(request, async () => {
    const auditId = request.nextUrl.searchParams.get('auditId');
    if (!auditId) {
      return NextResponse.json(
        { ok: false, error: 'auditId query parameter is required.' },
        { status: 400 }
      );
    }

    await removeAuditHistoryEntry(auditId);
    const history = await listAuditHistory();

    return NextResponse.json({
      ok: true,
      history,
    });
  });
}
