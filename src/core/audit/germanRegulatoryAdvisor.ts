import type {
  ExecutiveAuditReport,
  MatchedParentContextInput,
} from '@/core/audit/decisionEvaluator';

/**
 * German Regulatory & Betriebsrat Advisory (DACH Pre-Decision Check).
 *
 * Pure, deterministic functional core that screens a proposed management decision
 * against four statutory frameworks relevant to German companies, and measures whether
 * the internal Company Brain already contains a policy covering the decision topic.
 *
 * IMPORTANT: This is a pre-decision advisory signal (early-warning), not legal advice.
 */

export type GermanFramework = 'BETRVG' | 'DSGVO' | 'EU_AI_ACT' | 'NIS2';

export type RegulatoryCheckStatus = 'TRIGGERED' | 'REVIEW' | 'NOT_TRIGGERED';

export interface GermanRegulatoryCheck {
  framework: GermanFramework;
  label: string;
  legalReference: string;
  status: RegulatoryCheckStatus;
  matchedSignals: string[];
  findingEn: string;
  findingDe: string;
}

export type KnowledgeCoverageStatus =
  | 'COVERED_BY_BRAIN'
  | 'PARTIAL_COVERAGE'
  | 'KNOWLEDGE_GAP_DETECTED';

export interface CompanyBrainKnowledgeCoverage {
  status: KnowledgeCoverageStatus;
  overlappingTerms: string[];
  bestMatchTitle: string | null;
  suggestedTitle: string;
  suggestedDepartment: string;
  messageEn: string;
  messageDe: string;
}

export interface GermanRegulatoryAdvisory {
  checks: GermanRegulatoryCheck[];
  betriebsratInvolvementRequired: boolean;
  knowledgeCoverage: CompanyBrainKnowledgeCoverage;
  disclaimerEn: string;
  disclaimerDe: string;
}

interface SignalRule {
  label: string;
  pattern: RegExp;
}

/**
 * Note: German stems intentionally avoid `\b` because JavaScript treats umlauts
 * (ä, ö, ü, ß) as non-word characters in non-unicode regular expressions.
 */
const BETRVG_TRIGGER_RULES: SignalRule[] = [
  {
    label: '§87(1) Nr.6 — technical monitoring of behaviour/performance',
    pattern:
      /(\bmonitor|\btracking\b|\btrack employee|surveillance|keystroke|screen activity|productivity (tracking|score|analytics)|performance (tracking|monitoring|analytics)|\bgps\b|camera|überwach|ueberwach|leistungskontrolle|verhaltenskontrolle|leistungsüberwachung)/i,
  },
  {
    label: '§87(1) Nr.2/3 — working hours, shifts & overtime',
    pattern:
      /(working hours|work hours|\bshifts?\b|overtime|time tracking|time recording|core hours|on-call|arbeitszeit|schicht|überstunden|ueberstunden|zeiterfassung|rufbereitschaft)/i,
  },
  {
    label: '§87(1) Nr.14 — remote / mobile work arrangements',
    pattern:
      /(remote work|home ?office|mobile work|hybrid work|work from home|office days|mobiles arbeiten|mobile arbeit|telearbeit)/i,
  },
  {
    label: '§87(1) Nr.1 — workplace conduct rules',
    pattern:
      /(dress code|code of conduct|conduct rules|smoking ban|kleiderordnung|verhaltensregeln|betriebsordnung)/i,
  },
  {
    label: '§111 — operational change (Betriebsänderung)',
    pattern:
      /(\blayoffs?\b|redundanc|restructur|relocat|plant closure|site closure|mass dismissal|downsiz|betriebsänderung|betriebsaenderung|entlassung|standortschließung|umstrukturierung|stellenabbau)/i,
  },
];

const BETRVG_REVIEW_RULES: SignalRule[] = [
  {
    label: '§87(1) Nr.6 / §90 — new technical system for employees',
    pattern:
      /(roll ?out|introduce|deploy|implement|einführ|einfuehr).{0,40}(software|tool|system|platform|app|ki|ai)\b/i,
  },
];

/**
 * Personal data signal. A bare mention of "employees" is NOT personal data processing;
 * people-related words only count when combined with data/monitoring/evaluation context.
 */
const PERSONAL_DATA_RULE: SignalRule = {
  label: 'Processing of personal data',
  pattern:
    /(personal data|employee data|customer data|\bpii\b|health data|biometric|applicant|candidate|\bcv\b|résumé|resume|\bcrm\b|email addresses|personenbezogen|mitarbeiterdaten|kundendaten|bewerber|gesundheitsdaten|((employee|staff|customer|user|worker|mitarbeiter|kunden|beschäftigte)s?.{0,40}(monitor|track|data|activity|screen|performance|record|profil|location|überwach|ueberwach|daten|erfass))|((monitor|track|record|profil|überwach|ueberwach|erfass).{0,40}(employee|staff|customer|user|worker|mitarbeiter|kunden|beschäftigte)))/i,
};

const DSGVO_ESCALATION_RULES: SignalRule[] = [
  {
    label: 'Transfer to third parties / non-EU cloud',
    pattern:
      /(vendor|third[- ]party|external provider|cloud|\bus\b servers|outside the eu|non-eu|transfer|share with|dienstleister|drittland|weitergabe)/i,
  },
  {
    label: 'Systematic monitoring or profiling (Art. 35 DPIA)',
    pattern:
      /(\bmonitor|tracking|profil|screen|rank|score|surveillance|überwach|ueberwach|bewert)/i,
  },
  {
    label: 'Automated processing / AI on personal data (Art. 22)',
    pattern:
      /(\bai\b|artificial intelligence|machine learning|automated decision|algorithm|automatically|\bki\b|künstliche intelligenz|automatisiert)/i,
  },
];

const AI_USAGE_RULE: SignalRule = {
  label: 'Use of an AI system',
  pattern:
    /(\bai\b|artificial intelligence|machine learning|\bllm\b|chatbot|\bgpt|copilot|generative|neural|\bki\b|künstliche intelligenz|kuenstliche intelligenz|sprachmodell)/i,
};

const AI_HIGH_RISK_RULE: SignalRule = {
  label: 'Annex III Nr.4 — AI in employment (recruiting, promotion, termination, evaluation)',
  pattern:
    /(recruit|hiring|\bhire\b|applicant|candidate|job application|promotion|terminat|dismiss|performance evaluation|employee evaluation|credit scor|bewerb|einstellung|beförderung|befoerderung|kündigung|kuendigung|leistungsbeurteilung)/i,
};

const AI_TRANSPARENCY_RULE: SignalRule = {
  label: 'Art. 50 — transparency for chatbots & generated content',
  pattern:
    /(chatbot|customer[- ]facing|generated content|deepfake|synthetic|virtual assistant|kundenservice|generierte inhalte)/i,
};

const NIS2_WEAKENING_RULE: SignalRule = {
  label: 'Art. 21 — weakening of cybersecurity risk-management measures',
  pattern:
    /((disable|deactivat|remove|skip|bypass|turn off|waive|without).{0,30}(mfa|2fa|multi-factor|security review|patch|firewall|encryption|vpn|penetration test|access control|backup))|(admin (rights|access) (for|to) (all|external|vendor))|(deaktivier|umgeh|ohne).{0,30}(mfa|sicherheitsprüfung|firewall|verschlüsselung)/i,
};

const NIS2_SCOPE_RULE: SignalRule = {
  label: 'Art. 21(2)(d) — supply chain & ICT infrastructure',
  pattern:
    /(vendor|supplier|outsourc|\bsaas\b|cloud|data cent|infrastructure|network|remote access|it service provider|managed service|open[- ]source|production system|lieferant|dienstleister|rechenzentrum|infrastruktur|netzwerk)/i,
};

const STOPWORDS = new Set([
  'about', 'after', 'again', 'against', 'all', 'also', 'and', 'any', 'are', 'because',
  'been', 'before', 'being', 'between', 'both', 'but', 'can', 'could', 'does', 'doing',
  'each', 'for', 'from', 'further', 'have', 'having', 'here', 'into', 'its', 'just',
  'more', 'most', 'must', 'need', 'only', 'other', 'our', 'over', 'same', 'should',
  'some', 'such', 'than', 'that', 'the', 'their', 'them', 'then', 'there', 'these',
  'they', 'this', 'those', 'through', 'under', 'until', 'very', 'want', 'were', 'what',
  'when', 'where', 'which', 'while', 'who', 'will', 'with', 'would', 'your', 'team',
  'teams', 'company', 'decision', 'propose', 'proposal', 'introduce', 'allow', 'save',
  'time', 'week', 'weeks', 'days', 'per', 'new', 'wir', 'und', 'die', 'der', 'das',
  'eine', 'einen', 'mit', 'für', 'fuer', 'von', 'auf', 'ist', 'wollen', 'möchten',
  'moechten', 'unsere', 'unser', 'werden', 'sollen', 'alle',
]);

function collectSignals(text: string, rules: SignalRule[]): string[] {
  return rules.filter((r) => r.pattern.test(text)).map((r) => r.label);
}

function extractTopicTerms(text: string): string[] {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\u00c0-\u017f\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter((t) => t.length >= 4 && !STOPWORDS.has(t));
  return Array.from(new Set(tokens));
}

/**
 * Stem-tolerant lexical overlap (first 5 characters) between the decision topic
 * and the best matching Company Brain policy. Independent of the vector score scale
 * (Atlas `$vectorSearch` normalizes cosine scores differently than in-memory cosine).
 */
function computeTopicOverlap(
  decisionProposal: string,
  matchedParents: readonly MatchedParentContextInput[]
): { overlappingTerms: string[]; bestMatchTitle: string | null } {
  const decisionTerms = extractTopicTerms(decisionProposal);
  let best: { overlappingTerms: string[]; bestMatchTitle: string | null } = {
    overlappingTerms: [],
    bestMatchTitle: null,
  };

  for (const parent of matchedParents) {
    const parentStems = new Set(
      extractTopicTerms(`${parent.title} ${parent.fullParentContent}`).map((t) =>
        t.slice(0, 5)
      )
    );
    const overlap = decisionTerms.filter((t) => parentStems.has(t.slice(0, 5)));
    if (overlap.length > best.overlappingTerms.length) {
      best = { overlappingTerms: overlap, bestMatchTitle: parent.title };
    }
  }

  return best;
}

function buildSuggestedTitle(decisionProposal: string): string {
  const words = decisionProposal
    .replace(/[^\p{L}\p{N}\s&-]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8)
    .join(' ');
  return `Internal Policy: ${words}`.trim();
}

function suggestDepartment(checks: GermanRegulatoryCheck[]): string {
  const isActive = (fw: GermanFramework) =>
    checks.some((c) => c.framework === fw && c.status !== 'NOT_TRIGGERED');
  if (isActive('BETRVG') || isActive('DSGVO')) return 'HR & Legal';
  if (isActive('NIS2')) return 'Engineering';
  if (isActive('EU_AI_ACT')) return 'Executive Board';
  return 'Executive Board';
}

function evaluateBetrVG(text: string): GermanRegulatoryCheck {
  const triggered = collectSignals(text, BETRVG_TRIGGER_RULES);
  const review = triggered.length === 0 ? collectSignals(text, BETRVG_REVIEW_RULES) : [];
  const status: RegulatoryCheckStatus =
    triggered.length > 0 ? 'TRIGGERED' : review.length > 0 ? 'REVIEW' : 'NOT_TRIGGERED';
  const signals = triggered.length > 0 ? triggered : review;

  return {
    framework: 'BETRVG',
    label: 'Betriebsrat — Works Council Co-Determination',
    legalReference: 'BetrVG §87, §90, §111',
    status,
    matchedSignals: signals,
    findingEn:
      status === 'TRIGGERED'
        ? 'Co-determination right of the works council is likely triggered. The decision must not be implemented unilaterally; involve the Betriebsrat early and prepare a Betriebsvereinbarung.'
        : status === 'REVIEW'
        ? 'A new technical system is being introduced. Under BAG case law, any system objectively capable of monitoring employees may require works council approval — verify before rollout.'
        : 'No works council co-determination trigger detected in this decision.',
    findingDe:
      status === 'TRIGGERED'
        ? 'Mitbestimmungsrecht des Betriebsrats ist voraussichtlich betroffen. Keine einseitige Umsetzung — Betriebsrat frühzeitig einbinden und Betriebsvereinbarung vorbereiten.'
        : status === 'REVIEW'
        ? 'Einführung eines neuen technischen Systems. Nach BAG-Rechtsprechung kann jedes zur Überwachung objektiv geeignete System mitbestimmungspflichtig sein — vor Rollout prüfen.'
        : 'Kein Mitbestimmungstatbestand des Betriebsrats erkennbar.',
  };
}

function evaluateDSGVO(text: string): GermanRegulatoryCheck {
  const personal = PERSONAL_DATA_RULE.pattern.test(text);
  const escalations = personal ? collectSignals(text, DSGVO_ESCALATION_RULES) : [];
  const status: RegulatoryCheckStatus = !personal
    ? 'NOT_TRIGGERED'
    : escalations.length > 0
    ? 'TRIGGERED'
    : 'REVIEW';

  return {
    framework: 'DSGVO',
    label: 'DSGVO / GDPR — Data Protection',
    legalReference: 'DSGVO Art. 6, 22, 35, 88 · BDSG §26',
    status,
    matchedSignals: personal ? [PERSONAL_DATA_RULE.label, ...escalations] : [],
    findingEn:
      status === 'TRIGGERED'
        ? 'Personal data is processed in a high-risk way (third parties, monitoring, or automation). Involve the Data Protection Officer; a Data Protection Impact Assessment (DPIA) is likely required.'
        : status === 'REVIEW'
        ? 'Personal data is affected. Confirm the legal basis (Art. 6 DSGVO / §26 BDSG for employee data) and document it in the record of processing activities.'
        : 'No processing of personal data detected.',
    findingDe:
      status === 'TRIGGERED'
        ? 'Personenbezogene Daten werden risikoreich verarbeitet (Dritte, Überwachung oder Automatisierung). Datenschutzbeauftragten einbinden; eine Datenschutz-Folgenabschätzung (DSFA) ist wahrscheinlich erforderlich.'
        : status === 'REVIEW'
        ? 'Personenbezogene Daten sind betroffen. Rechtsgrundlage prüfen (Art. 6 DSGVO / §26 BDSG) und im Verarbeitungsverzeichnis dokumentieren.'
        : 'Keine Verarbeitung personenbezogener Daten erkennbar.',
  };
}

function evaluateEuAiAct(text: string): GermanRegulatoryCheck {
  const usesAi = AI_USAGE_RULE.pattern.test(text);
  const highRisk = usesAi && AI_HIGH_RISK_RULE.pattern.test(text);
  const transparency = usesAi && AI_TRANSPARENCY_RULE.pattern.test(text);
  const status: RegulatoryCheckStatus = !usesAi
    ? 'NOT_TRIGGERED'
    : highRisk
    ? 'TRIGGERED'
    : 'REVIEW';

  const signals = usesAi
    ? [
        AI_USAGE_RULE.label,
        ...(highRisk ? [AI_HIGH_RISK_RULE.label] : []),
        ...(transparency ? [AI_TRANSPARENCY_RULE.label] : []),
      ]
    : [];

  return {
    framework: 'EU_AI_ACT',
    label: 'EU AI Act — Artificial Intelligence Regulation',
    legalReference: 'EU AI Act Art. 4, 26, 50 · Annex III',
    status,
    matchedSignals: signals,
    findingEn:
      status === 'TRIGGERED'
        ? 'High-risk AI use case (employment context). As a deployer you need human oversight, logging, staff information and a risk assessment before go-live.'
        : status === 'REVIEW'
        ? 'AI system in use. Ensure AI literacy of affected staff (Art. 4) and transparency towards users where AI interacts with people or generates content (Art. 50).'
        : 'No AI system usage detected.',
    findingDe:
      status === 'TRIGGERED'
        ? 'Hochrisiko-KI-Anwendung (Beschäftigungskontext). Als Betreiber sind menschliche Aufsicht, Protokollierung, Information der Beschäftigten und Risikobewertung vor dem Einsatz erforderlich.'
        : status === 'REVIEW'
        ? 'KI-System im Einsatz. KI-Kompetenz der Beschäftigten sicherstellen (Art. 4) und Transparenz gegenüber Nutzern gewährleisten (Art. 50).'
        : 'Kein Einsatz von KI-Systemen erkennbar.',
  };
}

function evaluateNis2(text: string): GermanRegulatoryCheck {
  const weakening = NIS2_WEAKENING_RULE.pattern.test(text);
  const scope = NIS2_SCOPE_RULE.pattern.test(text);
  const status: RegulatoryCheckStatus = weakening
    ? 'TRIGGERED'
    : scope
    ? 'REVIEW'
    : 'NOT_TRIGGERED';

  return {
    framework: 'NIS2',
    label: 'NIS-2 — Cybersecurity & Supply Chain',
    legalReference: 'NIS-2 Directive Art. 20, 21 · BSIG (NIS2UmsuCG)',
    status,
    matchedSignals: [
      ...(weakening ? [NIS2_WEAKENING_RULE.label] : []),
      ...(scope ? [NIS2_SCOPE_RULE.label] : []),
    ],
    findingEn:
      status === 'TRIGGERED'
        ? 'The decision weakens mandatory cybersecurity risk-management measures. For NIS-2 entities, management bodies are personally accountable — obtain a CISO/IT security review first.'
        : status === 'REVIEW'
        ? 'The decision touches ICT infrastructure or suppliers. Verify supplier security requirements and incident-reporting obligations if your company is in NIS-2 scope.'
        : 'No cybersecurity or supply-chain impact detected.',
    findingDe:
      status === 'TRIGGERED'
        ? 'Die Entscheidung schwächt verpflichtende Maßnahmen des Cyber-Risikomanagements. Bei NIS-2-Einrichtungen haftet die Geschäftsleitung persönlich — vorab Prüfung durch CISO/IT-Sicherheit einholen.'
        : status === 'REVIEW'
        ? 'Die Entscheidung betrifft IT-Infrastruktur oder Lieferanten. Sicherheitsanforderungen an Lieferanten und Meldepflichten prüfen, falls Ihr Unternehmen unter NIS-2 fällt.'
        : 'Keine Auswirkungen auf Cybersicherheit oder Lieferkette erkennbar.',
  };
}

/**
 * Screens a proposed decision against BetrVG, DSGVO, EU AI Act and NIS-2,
 * and measures Company Brain coverage for the decision topic.
 */
export function evaluateGermanRegulatoryAdvisory(params: {
  decisionProposal: string;
  matchedParents: readonly MatchedParentContextInput[];
}): GermanRegulatoryAdvisory {
  const text = params.decisionProposal.trim();

  const checks: GermanRegulatoryCheck[] = [
    evaluateBetrVG(text),
    evaluateDSGVO(text),
    evaluateEuAiAct(text),
    evaluateNis2(text),
  ];

  const { overlappingTerms, bestMatchTitle } = computeTopicOverlap(
    text,
    params.matchedParents
  );

  const coverageStatus: KnowledgeCoverageStatus =
    overlappingTerms.length >= 3
      ? 'COVERED_BY_BRAIN'
      : overlappingTerms.length >= 1
      ? 'PARTIAL_COVERAGE'
      : 'KNOWLEDGE_GAP_DETECTED';

  const knowledgeCoverage: CompanyBrainKnowledgeCoverage = {
    status: coverageStatus,
    overlappingTerms,
    bestMatchTitle,
    suggestedTitle: buildSuggestedTitle(text),
    suggestedDepartment: suggestDepartment(checks),
    messageEn:
      coverageStatus === 'COVERED_BY_BRAIN'
        ? `Your Company Brain contains a related internal policy ("${bestMatchTitle}"). The advice above is grounded in your own rules.`
        : coverageStatus === 'PARTIAL_COVERAGE'
        ? `Only partial internal coverage found ("${bestMatchTitle}"). Consider documenting a dedicated policy for this topic after the decision.`
        : 'No internal policy covers this topic yet. The advisory relies on German statutory baselines only — record your final resolution in the Company Brain.',
    messageDe:
      coverageStatus === 'COVERED_BY_BRAIN'
        ? `Ihr Company Brain enthält eine passende interne Richtlinie („${bestMatchTitle}“). Die Empfehlung basiert auf Ihren eigenen Regeln.`
        : coverageStatus === 'PARTIAL_COVERAGE'
        ? `Nur teilweise interne Abdeckung gefunden („${bestMatchTitle}“). Dokumentieren Sie nach der Entscheidung eine eigene Richtlinie zu diesem Thema.`
        : 'Zu diesem Thema existiert noch keine interne Richtlinie. Die Empfehlung stützt sich nur auf gesetzliche Grundlagen — halten Sie Ihren finalen Beschluss im Company Brain fest.',
  };

  return {
    checks,
    betriebsratInvolvementRequired: checks.some(
      (c) => c.framework === 'BETRVG' && c.status === 'TRIGGERED'
    ),
    knowledgeCoverage,
    disclaimerEn:
      'Automated pre-decision advisory signal based on keyword and policy analysis. It does not replace legal counsel.',
    disclaimerDe:
      'Automatisierter Vorab-Hinweis auf Basis von Schlagwort- und Richtlinienanalyse. Ersetzt keine Rechtsberatung.',
  };
}

/**
 * Attaches the advisory to an Executive Audit Report and, if any statutory check is TRIGGERED,
 * prevents a CERTIFIED verdict (decision cannot be executed unilaterally) and adds the
 * corresponding risks and roadmap steps. Never upgrades a verdict.
 */
export function applyGermanAdvisoryToReport(
  report: ExecutiveAuditReport,
  advisory: GermanRegulatoryAdvisory,
  locale: 'en' | 'de' = 'en'
): ExecutiveAuditReport {
  const triggered = advisory.checks.filter((c) => c.status === 'TRIGGERED');

  if (triggered.length === 0) {
    return { ...report, germanAdvisory: advisory };
  }

  const statutoryCons = triggered.map((c) =>
    locale === 'de'
      ? `Gesetzliche Vorgabe betroffen: ${c.label} (${c.legalReference})`
      : `Statutory requirement triggered: ${c.label} (${c.legalReference})`
  );

  const statutorySteps = triggered.map((c) => {
    if (c.framework === 'BETRVG') {
      return locale === 'de'
        ? 'Betriebsrat vor Umsetzung informieren und Betriebsvereinbarung abschließen (BetrVG §87).'
        : 'Inform the Betriebsrat before implementation and conclude a works agreement (BetrVG §87).';
    }
    if (c.framework === 'DSGVO') {
      return locale === 'de'
        ? 'Datenschutzbeauftragten einbinden und Datenschutz-Folgenabschätzung durchführen.'
        : 'Involve the Data Protection Officer and complete a Data Protection Impact Assessment (DPIA).';
    }
    if (c.framework === 'EU_AI_ACT') {
      return locale === 'de'
        ? 'Menschliche Aufsicht, Protokollierung und Risikobewertung für das Hochrisiko-KI-System festlegen.'
        : 'Define human oversight, logging and a risk assessment for the high-risk AI system.';
    }
    return locale === 'de'
      ? 'Sicherheitsprüfung durch CISO/IT-Sicherheit vor Umsetzung einholen (NIS-2).'
      : 'Obtain a CISO / IT security review before implementation (NIS-2).';
  });

  const downgraded = report.verdict === 'CERTIFIED';

  return {
    ...report,
    verdict: downgraded ? 'CONDITIONAL' : report.verdict,
    alignmentScore: downgraded
      ? Math.min(report.alignmentScore, 74)
      : report.alignmentScore,
    cons: [...report.cons, ...statutoryCons],
    roadmap: [...report.roadmap, ...statutorySteps],
    germanAdvisory: advisory,
  };
}
