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
    overview: string;
    knowledgeVault: string;
    systemCenter: string;
  };
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
  };
  problemSection: {
    eyebrow: string;
    title: string;
    description: string;
  };
  pillars: {
    pillar1Title: string;
    pillar1Desc: string;
    pillar2Title: string;
    pillar2Desc: string;
    pillar3Title: string;
    pillar3Desc: string;
  };
  workflowSection: {
    title: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
  };
  ragSection: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    autoRoutingNotice: string;
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
      overview: 'Overview',
      knowledgeVault: 'Audit & RAG Vault',
      systemCenter: 'System & Logs',
    },
    hero: {
      badge: 'ISO 37000 · COSO · DCGK Governance Engine',
      title: 'Eliminate Governance Blind Spots Across Your Organization',
      subtitle:
        'Board resolutions, compliance charters, and executive Slack decisions often live in disconnected silos. MindMittel V2 unifies them into a single auditable knowledge vault—detecting policy contradictions and answering leadership questions with verifiable citations.',
      primaryCta: 'Open Audit & RAG Vault',
      secondaryCta: 'System & Live Logs',
    },
    problemSection: {
      eyebrow: 'WHY MINDMITTEL V2 EXISTS',
      title: 'The Problem We Solve',
      description:
        'When executives make high-stakes operational or financial decisions, manually cross-checking hundreds of pages of board minutes, legal policies, and departmental chat threads is slow and error-prone. Standard keyword search fails when terminology differs across languages or departments, and generic AI chatbots hallucinate because they lack full document context.',
    },
    pillars: {
      pillar1Title: '1. Policy Contradiction & Compliance Auditing',
      pillar1Desc:
        'Automatically cross-examine new leadership proposals against corporate charters, ISO 37000, COSO, and German Corporate Governance Code (DCGK) rules before execution.',
      pillar2Title: '2. Parent-Child Semantic Vector Retrieval',
      pillar2Desc:
        'Searches by meaning—not just exact words—across English and German. Matches precise 400-character child vectors while feeding the full 2,000-character parent document to the AI so context is never lost.',
      pillar3Title: '3. Autonomous Gemini Model Routing',
      pillar3Desc:
        'Zero manual configuration. The engine analyzes your request complexity in real time—routing rapid lookups to Gemini Flash and deep multi-policy board audits to Gemini Pro with automatic failover.',
    },
    workflowSection: {
      title: 'How It Works in 3 Steps',
      step1Title: 'Ingest & Normalize',
      step1Desc:
        'Documents from uploads or external connectors (e.g. Slack) are tagged by department, access level, and framework, then sliced into linked Parent-Child chunks.',
      step2Title: 'Semantic Filter & Match',
      step2Desc:
        'MongoDB Atlas Vector Search pre-filters by organization and department permissions, then finds conceptually matching clauses using 768-dimensional embeddings.',
      step3Title: 'Verified Executive Audit',
      step3Desc:
        'The optimal Google Gemini model synthesizes a clear compliance answer backed by exact source document references.',
    },
    ragSection: {
      title: 'Governance Audit & Parent-Child RAG Vault',
      subtitle:
        'Ask a compliance or leadership question in English or German. The system automatically selects the optimal Gemini model and retrieves full parent document context.',
      searchPlaceholder:
        'Ask a governance question (e.g., What is our escalation threshold for unbudgeted expenses?)...',
      autoRoutingNotice:
        'Autonomous AI Routing Active: Simple queries auto-route to Gemini Flash · Complex compliance audits auto-route to Gemini Pro',
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
  },
  de: {
    meta: {
      localeCode: 'de',
      languageLabel: 'Deutsch',
      appName: 'MindMittel V2',
      tagline: 'KI-gestützte Governance- & Führungs-Audit-Engine',
    },
    nav: {
      overview: 'Überblick',
      knowledgeVault: 'Audit & RAG-Archiv',
      systemCenter: 'System & Logs',
    },
    hero: {
      badge: 'ISO 37000 · COSO · DCGK Governance-Engine',
      title: 'Beseitigen Sie blinde Flecken in Ihrer Unternehmensführung',
      subtitle:
        'Vorstandsbeschlüsse, Compliance-Richtlinien und Slack-Entscheidungen liegen oft in getrennten Silos. MindMittel V2 vereint sie in einem prüfbaren Wissensarchiv – erkennt Richtlinienwidersprüche und beantwortet Führungsfragen mit belegbaren Quellen.',
      primaryCta: 'Audit & RAG-Archiv öffnen',
      secondaryCta: 'System & Live-Logs',
    },
    problemSection: {
      eyebrow: 'WARUM MINDMITTEL V2 EXISTIERT',
      title: 'Das Problem, das wir lösen',
      description:
        'Wenn Führungskräfte weitreichende operative oder finanzielle Entscheidungen treffen, ist der manuelle Abgleich hunderter Seiten von Vorstandsprotokollen, Richtlinien und Chatverläufen langsam und fehleranfällig. Klassische Stichwortsuche scheitert bei unterschiedlichen Begriffen, und Standard-KI-Chatbots halluzinieren ohne den vollständigen Dokumentkontext.',
    },
    pillars: {
      pillar1Title: '1. Richtlinien- & Compliance-Prüfung',
      pillar1Desc:
        'Überprüfen Sie neue Entscheidungsvorlagen automatisch gegen Unternehmenssatzungen sowie ISO 37000, COSO und den Deutschen Corporate Governance Kodex (DCGK).',
      pillar2Title: '2. Semantische Parent-Child Vektorsuche',
      pillar2Desc:
        'Sucht nach Bedeutung statt nur nach exakten Wörtern – auf Englisch und Deutsch. Findet präzise 400-Zeichen-Abschnitte und liefert der KI den gesamten 2.000-Zeichen-Kontext des Hauptdokuments.',
      pillar3Title: '3. Autonomes Gemini-Modell-Routing',
      pillar3Desc:
        'Keine manuelle Modellauswahl nötig. Das System erkennt die Komplexität Ihrer Anfrage automatisch – schnelle Fragen gehen an Gemini Flash, komplexe Vorstands-Audits an Gemini Pro.',
    },
    workflowSection: {
      title: 'So funktioniert es in 3 Schritten',
      step1Title: 'Erfassen & Strukturieren',
      step1Desc:
        'Dokumente aus Uploads oder Quellen wie Slack werden nach Abteilung, Schutzklasse und Rahmenwerk getaggt und in verknüpfte Parent-Child-Abschnitte zerlegt.',
      step2Title: 'Semantisch Filtern & Finden',
      step2Desc:
        'MongoDB Atlas Vector Search filtert vorab nach Berechtigungen und findet inhaltlich passende Klauseln über 768-dimensionale Vektoren.',
      step3Title: 'Belegtes Governance-Audit',
      step3Desc:
        'Das optimal gewählte Google Gemini Modell erstellt eine fundierte Antwort inklusive direktem Verweis auf das Ursprungsdokument.',
    },
    ragSection: {
      title: 'Governance-Audit & Parent-Child RAG-Archiv',
      subtitle:
        'Stellen Sie eine Compliance- oder Führungsfrage auf Englisch oder Deutsch. Das System wählt automatisch das optimale Gemini-Modell und lädt den vollständigen Dokumentkontext.',
      searchPlaceholder:
        'Governance-Frage stellen (z. B. Wie hoch ist unsere Freigabegrenze für außerplanmäßige Ausgaben?)...',
      autoRoutingNotice:
        'Autonomes KI-Routing aktiv: Einfache Abfragen nutzen automatisch Gemini Flash · Komplexe Audits nutzen Gemini Pro',
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
  },
};

export function getDictionary(locale?: string): AppDictionary {
  if (locale === 'de') {
    return dictionaries.de;
  }
  return dictionaries.en;
}
