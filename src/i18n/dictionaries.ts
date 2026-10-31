export type SupportedLocale = 'en' | 'de';

export const DEFAULT_LOCALE: SupportedLocale = 'en';
export const SUPPORTED_LOCALES: readonly SupportedLocale[] = ['en', 'de'];

export interface AppDictionary {
  meta: {
    localeCode: SupportedLocale;
    languageLabel: string;
    appName: string;
    tagline: string;
  };
  nav: {
    auditHub: string;
    knowledgeVault: string;
    aiRouter: string;
    systemCenter: string;
  };
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
  };
  metrics: {
    governanceScore: string;
    governanceDelta: string;
    indexedChunks: string;
    indexedSub: string;
    activeModel: string;
    modelRoutingMode: string;
  };
  ragSection: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    filterDepartment: string;
    filterSource: string;
    filterFramework: string;
    parentLabel: string;
    childChunksLabel: string;
    sampleDoc1Title: string;
    sampleDoc1Summary: string;
    sampleDoc2Title: string;
    sampleDoc2Summary: string;
  };
  aiSelectorSection: {
    title: string;
    subtitle: string;
    fastProfileLabel: string;
    fastProfileDesc: string;
    reasoningProfileLabel: string;
    reasoningProfileDesc: string;
    evaluateButton: string;
    statusReady: string;
  };
}

export const dictionaries: Record<SupportedLocale, AppDictionary> = {
  en: {
    meta: {
      localeCode: 'en',
      languageLabel: 'English',
      appName: 'MindMittel V2',
      tagline: 'AI-Driven Governance & Leadership Audit Engine',
    },
    nav: {
      auditHub: 'Audit Hub',
      knowledgeVault: 'RAG Vault',
      aiRouter: 'Gemini Router',
      systemCenter: 'System & Logs',
    },
    hero: {
      badge: 'ISO 37000 · COSO · DCGK Compliant Engine',
      title: 'Executive Governance Intelligence in Real Time',
      subtitle:
        'Audit leadership decisions, cross-examine board minutes with Parent-Child Vector RAG, and dynamically route workloads across optimal Google Gemini models.',
      primaryCta: 'Launch Governance Audit',
      secondaryCta: 'Inspect System Topology',
    },
    metrics: {
      governanceScore: 'Governance Alignment Index',
      governanceDelta: '+4.2% vs Q3 Board Baseline',
      indexedChunks: 'Parent-Child Vector Nodes',
      indexedSub: 'MongoDB Atlas 768-d Hybrid Index',
      activeModel: 'Dynamic Gemini Selection',
      modelRoutingMode: 'Auto-evaluated via /v1beta/models',
    },
    ragSection: {
      title: 'Parent-Child RAG Knowledge Vault',
      subtitle:
        'Precision retrieval on 400-token child embeddings paired with full 2,000-token parent document context and strict metadata filtering.',
      searchPlaceholder:
        'Ask a governance or compliance question (e.g., Q4 risk committee escalation policy)...',
      filterDepartment: 'Department: All',
      filterSource: 'Source: Upload & Slack',
      filterFramework: 'Framework: ISO 37000 / DCGK',
      parentLabel: 'Parent Document Context',
      childChunksLabel: 'Matched Child Vectors',
      sampleDoc1Title: 'Supervisory Board Audit Charter 2026',
      sampleDoc1Summary:
        'Defines escalation thresholds for executive risk sign-off, conflict-of-interest disclosures, and quarterly compliance attestation.',
      sampleDoc2Title: 'Executive Leadership Sync — Slack Archive #gov-council',
      sampleDoc2Summary:
        'Cross-functional alignment on AI vendor procurement controls and DACH regulatory reporting timelines.',
    },
    aiSelectorSection: {
      title: 'Dynamic Gemini Model Router',
      subtitle:
        'Zero hardcoded model strings. Queries Google Gemini API at runtime, scores stability & version tiers, and enforces automatic failover.',
      fastProfileLabel: 'Fast Profile (Flash Priority)',
      fastProfileDesc:
        'Optimized for low-latency chat, auto-tagging, and rapid document triage.',
      reasoningProfileLabel: 'Reasoning Profile (Pro Priority)',
      reasoningProfileDesc:
        'Optimized for multi-framework board audit synthesis and risk contradiction detection.',
      evaluateButton: 'Test Live Model Selection',
      statusReady: 'TTL Cache Active (6h) · 3-Tier Failover Ready',
    },
  },
  de: {
    meta: {
      localeCode: 'de',
      languageLabel: 'Deutsch',
      appName: 'MindMittel V2',
      tagline: 'KI-gestützte Governance- & Führungs-Audit-Engine',
    },
    nav: {
      auditHub: 'Audit-Zentrum',
      knowledgeVault: 'RAG-Archiv',
      aiRouter: 'Gemini-Router',
      systemCenter: 'System & Logs',
    },
    hero: {
      badge: 'ISO 37000 · COSO · DCGK Konforme Engine',
      title: 'Executive Governance-Intelligenz in Echtzeit',
      subtitle:
        'Prüfen Sie Führungsentscheidungen, analysieren Sie Vorstandsprotokolle mittels Parent-Child Vector RAG und routen Sie Anfragen dynamisch an optimale Google Gemini Modelle.',
      primaryCta: 'Governance-Audit starten',
      secondaryCta: 'Systemtopologie prüfen',
    },
    metrics: {
      governanceScore: 'Governance-Konformitätsindex',
      governanceDelta: '+4,2 % ggü. Q3 Vorstands-Baseline',
      indexedChunks: 'Parent-Child Vektor-Knoten',
      indexedSub: 'MongoDB Atlas 768-d Hybrid-Index',
      activeModel: 'Dynamische Gemini-Auswahl',
      modelRoutingMode: 'Automatisch geprüft über /v1beta/models',
    },
    ragSection: {
      title: 'Parent-Child RAG Wissensarchiv',
      subtitle:
        'Präzise Suche auf 400-Token Child-Vektoren kombiniert mit dem vollständigen 2.000-Token Parent-Dokumentkontext und strikten Metadaten-Filtern.',
      searchPlaceholder:
        'Governance- oder Compliance-Frage stellen (z. B. Eskalationsrichtlinie Risikoausschuss)...',
      filterDepartment: 'Abteilung: Alle',
      filterSource: 'Quelle: Upload & Slack',
      filterFramework: 'Rahmenwerk: ISO 37000 / DCGK',
      parentLabel: 'Parent-Dokumentkontext',
      childChunksLabel: 'Treffer Child-Vektoren',
      sampleDoc1Title: 'Prüfungscharta des Aufsichtsrats 2026',
      sampleDoc1Summary:
        'Definiert Eskalationsschwellen für Vorstandsrisiken, Offenlegung von Interessenkonflikten und Quartals-Compliance-Berichte.',
      sampleDoc2Title: 'Führungskräfte-Sync — Slack-Archiv #gov-council',
      sampleDoc2Summary:
        'Abteilungsübergreifende Abstimmung zu KI-Beschaffungskontrollen und DACH-Regulierungsfristen.',
    },
    aiSelectorSection: {
      title: 'Dynamischer Gemini-Modell-Router',
      subtitle:
        'Keine fest codierten Modellnamen. Fragt die Google Gemini API zur Laufzeit ab, bewertet Versionen & Stabilität und sichert automatisches Failover.',
      fastProfileLabel: 'Schnell-Profil (Flash-Priorität)',
      fastProfileDesc:
        'Optimiert für schnelle Antworten, Auto-Tagging und Dokumenten-Vorprüfung.',
      reasoningProfileLabel: 'Analyse-Profil (Pro-Priorität)',
      reasoningProfileDesc:
        'Optimiert für tiefgehende Vorstands-Audits und Widerspruchserkennung in Richtlinien.',
      evaluateButton: 'Live-Modellauswahl testen',
      statusReady: 'TTL-Cache aktiv (6 Std.) · 3-Stufen-Failover bereit',
    },
  },
};

export function getDictionary(locale?: string): AppDictionary {
  if (locale === 'de') {
    return dictionaries.de;
  }
  return dictionaries.en;
}
