import { NextRequest, NextResponse } from 'next/server';
import {
  listAuditHistory,
  removeAuditHistoryEntry,
  saveAuditReportToHistory,
  searchBrainByVectorSimilarity,
} from '@/infrastructure/rag/brainRepository';
import { inferProfileFromQuery } from '@/core/ai/modelRanking';
import { geminiModelSelector } from '@/infrastructure/gemini/modelSelector';
import {
  evaluateDecisionAgainstPoliciesHeuristic,
  type AuditVerdict,
  type ExecutiveAuditReport,
} from '@/core/audit/decisionEvaluator';
import { systemLogger } from '@/infrastructure/logging/logger';

export const dynamic = 'force-dynamic';

/**
 * Calls the dynamically selected Google Gemini model to synthesize a rich Executive Audit Report,
 * or falls back seamlessly to the deterministic heuristic evaluator if no API key is configured.
 */
async function callGeminiAuditSynthesis(params: {
  decisionProposal: string;
  matchedContextText: string;
  modelId: string;
  locale: 'en' | 'de';
}): Promise<Partial<ExecutiveAuditReport> | null> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;

  const langInstruction =
    params.locale === 'de'
      ? 'Respond entirely in formal German (Deutsch).'
      : 'Respond entirely in clear executive English.';

  const prompt = `You are the MindMittel V2 Executive Governance & Leadership Audit Engine.
${langInstruction}
Evaluate the following proposed management decision against the retrieved Company Brain parent documents.

Proposed Management Decision:
"${params.decisionProposal}"

Retrieved Company Brain Context (Parent Documents):
${params.matchedContextText}

Return ONLY valid JSON with this exact structure:
{
  "verdict": "CERTIFIED" | "CONDITIONAL" | "POLICY_CONFLICT",
  "alignmentScore": <number between 10 and 99>,
  "executiveSummary": "<2-sentence executive verdict summary>",
  "strategicEvaluation": "<detailed policy cross-examination referencing specific clauses>",
  "pros": ["<advantage 1>", "<advantage 2>"],
  "cons": ["<risk or violation 1>", "<risk or violation 2>"],
  "roadmap": ["<step 1>", "<step 2>", "<step 3>"]
}`;

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

export async function GET() {
  const history = await listAuditHistory();
  return NextResponse.json({
    ok: true,
    history,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      decisionProposal?: string;
      departmentFilter?: string;
      locale?: 'en' | 'de';
      auditedByEmail?: string;
      auditedByName?: string;
    };

    const decisionProposal = body.decisionProposal?.trim();
    if (!decisionProposal) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Please enter a management decision or policy question to audit.',
        },
        { status: 400 }
      );
    }

    const locale = body.locale === 'de' ? 'de' : 'en';
    const inferredProfile = inferProfileFromQuery(decisionProposal);

    // 1. Retrieve matching Parent documents via 768-d Child Vector similarity
    const matchedParents = await searchBrainByVectorSimilarity({
      query: decisionProposal,
      departmentFilter: body.departmentFilter,
      topK: 3,
    });

    // 2. Select optimal Gemini model dynamically
    let selectedModelId =
      inferredProfile === 'reasoning' ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
    try {
      const selection = await geminiModelSelector.selectModel(inferredProfile);
      selectedModelId = selection.selectedModel.modelId;
    } catch {
      // Fallback to canonical model ID if offline
    }

    // 3. Build baseline deterministic report
    const baselineReport = evaluateDecisionAgainstPoliciesHeuristic({
      decisionProposal,
      matchedParents,
      selectedModelId,
      inferredProfile,
      locale,
    });

    // 4. Enhance with live Gemini synthesis if API key is present
    if (process.env.GEMINI_API_KEY?.trim()) {
      try {
        const contextText = matchedParents
          .map(
            (m, i) =>
              `[Document ${i + 1}: ${m.title} | Dept: ${m.department}]\n${m.fullParentContent}`
          )
          .join('\n\n');

        const { output: llmPartial, usedModelId } =
          await geminiModelSelector.executeWithFallback(
            inferredProfile,
            async (modelId) =>
              callGeminiAuditSynthesis({
                decisionProposal,
                matchedContextText: contextText,
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
            llmPartial.strategicEvaluation ?? baselineReport.strategicEvaluation;
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
    }

    const savedEntry = await saveAuditReportToHistory({
      decisionProposal,
      departmentFilter: body.departmentFilter ?? 'all',
      auditedByEmail: body.auditedByEmail,
      auditedByName: body.auditedByName,
      report: baselineReport,
    });

    const history = await listAuditHistory();

    systemLogger.info(
      'audit.engine',
      `Completed Executive Audit by [${savedEntry.auditedByEmail}] -> Verdict: ${baselineReport.verdict} (${baselineReport.alignmentScore}%) via ${baselineReport.selectedModelId}`,
      {
        auditId: savedEntry.auditId,
        verdict: baselineReport.verdict,
        alignmentScore: baselineReport.alignmentScore,
        model: baselineReport.selectedModelId,
        matchedDocs: matchedParents.length,
      }
    );

    return NextResponse.json({
      ok: true,
      report: baselineReport,
      entry: savedEntry,
      history,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'Audit evaluation failed',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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
}
