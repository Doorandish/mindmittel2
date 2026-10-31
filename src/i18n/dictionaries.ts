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
    whyMindMittel: string;
    howItWorks: string;
    features: string;
    systemCenter: string;
    launchApp: string;
    backToLanding: string;
  };
  hero: {
    badge: string;
    titleBlack1: string;
    titleBlue: string;
    titleBlack2: string;
    subtitle: string;
    primaryCta: string;
    trust1: string;
    trust2: string;
    trust3: string;
    mockupWindowTitle: string;
    mockupPhase1: string;
    mockupDoc1Title: string;
    mockupDoc1Sub: string;
    mockupDoc2Title: string;
    mockupDoc2Sub: string;
    mockupDoc3Title: string;
    mockupDoc3Sub: string;
    mockupStoredBadge: string;
    mockupPhase2: string;
    mockupDecisionLabel: string;
    mockupDecisionText: string;
    mockupReportHeader: string;
    mockupReportItem1: string;
    mockupReportItem2: string;
    mockupReportItem3: string;
    mockupCertifiedBadge: string;
  };
  problemSolution: {
    eyebrow: string;
    title: string;
    problemHeader: string;
    prob1Title: string;
    prob1Desc: string;
    prob2Title: string;
    prob2Desc: string;
    prob3Title: string;
    prob3Desc: string;
    solutionHeader: string;
    sol1Title: string;
    sol1Desc: string;
    sol2Title: string;
    sol2Desc: string;
    sol3Title: string;
    sol3Desc: string;
  };
  howItWorksSection: {
    eyebrow: string;
    titleBlack: string;
    titleBlue: string;
    step1Label: string;
    step1Title: string;
    step1Desc: string;
    step2Label: string;
    step2Title: string;
    step2Desc: string;
    step3Label: string;
    step3Title: string;
    step3Desc: string;
  };
  featuresSection: {
    eyebrow: string;
    title: string;
    subtitle: string;
    feat1Badge: string;
    feat1Title: string;
    feat1Desc: string;
    feat2Badge: string;
    feat2Title: string;
    feat2Desc: string;
    feat3Badge: string;
    feat3Title: string;
    feat3Desc: string;
    feat4Badge: string;
    feat4Title: string;
    feat4Desc: string;
  };
  ctaBanner: {
    badge: string;
    titleWhite: string;
    titleBlue: string;
    subtitle: string;
    buttonText: string;
  };
  footer: {
    description: string;
    productCol: string;
    companyCol: string;
    legalCol: string;
  };
  ragSection: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    autoRoutingNotice: string;
    filterDepartment: string;
    filterSource: string;
    filterAccess: string;
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
      appName: 'MindMittel',
      tagline: 'KNOWLEDGE & AI GOVERNANCE',
    },
    nav: {
      whyMindMittel: 'Why MindMittel',
      howItWorks: 'How It Works',
      features: 'Features',
      systemCenter: 'System & Logs',
      launchApp: 'Launch Live App',
      backToLanding: 'Home',
    },
    hero: {
      badge: 'Next-Gen AI Governance & Corporate Consulting',
      titleBlack1: 'Stop Guessing.',
      titleBlue: 'Audit Management',
      titleBlack2: 'Decisions in Real Time.',
      subtitle:
        'MindMittel V2 transforms scattered corporate policies, board minutes, and team communications into a centralized Company Brain—evaluating strategic decisions against company rules before risks happen.',
      primaryCta: 'Launch Live App',
      trust1: 'Real-time Audits',
      trust2: 'Parent-Child Vector Vault',
      trust3: 'English & German Reports',
      mockupWindowTitle: 'MindMittel V2 — Executive Audit Engine',
      mockupPhase1: 'PHASE 1 — INJECT & SLICE',
      mockupDoc1Title: 'Strategy & Board Note',
      mockupDoc1Sub:
        'Parent chunk (2,000 chars) + 4 Child vectors indexed in MongoDB Atlas',
      mockupDoc2Title: 'HR_Policy_2026.pdf',
      mockupDoc2Sub: 'Department: HR & Legal · Normalized tags & metadata ✓',
      mockupDoc3Title: 'Slack Connector #gov-council',
      mockupDoc3Sub: 'External source sync ready · SHA-256 deduplicated',
      mockupStoredBadge: 'Stored in Company Brain (mindmittel_v2)',
      mockupPhase2: 'PHASE 2 — AUTONOMOUS AUDIT',
      mockupDecisionLabel: 'Manager Decision Proposal:',
      mockupDecisionText:
        '"Approve €18,000 unbudgeted vendor contract without secondary board sign-off."',
      mockupReportHeader: 'Audit_Evaluation_2026.json',
      mockupReportItem1: 'Parent Context Matched (768-d Vector)',
      mockupReportItem2: 'Auto-Routed to Optimal Gemini Model',
      mockupReportItem3: 'Policy Contradiction & Actionable Roadmap',
      mockupCertifiedBadge: 'CERTIFIED',
    },
    problemSolution: {
      eyebrow: 'THE PROBLEM VS. THE SOLUTION',
      title: 'Why Traditional Management Falls Short',
      problemHeader: 'THE PROBLEM',
      prob1Title: 'Post-Mortem Auditing',
      prob1Desc:
        'Traditional governance catches policy violations months after decisions are made, when reversing course is costly and damaging.',
      prob2Title: 'Scattered Knowledge Across Silos',
      prob2Desc:
        'Valuable rules in PDFs, board minutes, and Slack channels remain disconnected—keyword search fails when wording differs.',
      prob3Title: 'Siloed & Context-Blind Decisions',
      prob3Desc:
        'Managers act on intuition rather than institutional memory, while standard AI tools hallucinate because they lack full document context.',
      solutionHeader: 'THE MINDMITTEL SOLUTION',
      sol1Title: 'Real-Time AI Gatekeeping',
      sol1Desc:
        'Every proposed decision is evaluated against the full Company Brain before execution—catching misalignment instantly.',
      sol2Title: 'Parent-Child Vector RAG on Atlas',
      sol2Desc:
        'Matches precise 400-character child vectors by meaning while retrieving the full 2,000-character parent document so context is never lost.',
      sol3Title: 'Autonomous Gemini Model Routing',
      sol3Desc:
        'Zero manual model picking. The system inspects query complexity and routes dynamically to the optimal Google Gemini model with automatic failover.',
    },
    howItWorksSection: {
      eyebrow: 'HOW IT WORKS',
      titleBlack: 'From Raw Data to Certified Audit in',
      titleBlue: '3 Steps',
      step1Label: 'STEP 01',
      step1Title: 'Inject Knowledge',
      step1Desc:
        'Managers and teams input corporate policies, notes, or external channel records—automatically tagged by department, source, and access level.',
      step2Label: 'STEP 02',
      step2Title: 'Propose a Decision',
      step2Desc:
        'Submit any management decision or question. MindMittel pre-filters by metadata, runs 768-d semantic vector search, and auto-selects the ideal Gemini model.',
      step3Label: 'STEP 03',
      step3Title: 'Instant Audit Report',
      step3Desc:
        'Receive an immediate, structured compliance evaluation backed by exact parent document citations, risk analysis, and next steps.',
    },
    featuresSection: {
      eyebrow: 'KEY FEATURES',
      title: 'Built for Enterprise-Grade Governance',
      subtitle:
        'Every capability is engineered to eliminate the gap between institutional knowledge and executive decision-making.',
      feat1Badge: 'GOVERNANCE',
      feat1Title: 'Real-Time Risk Prevention',
      feat1Desc:
        'Audit decisions before execution, not months later. Catch misalignment with internal company policies the instant a decision is proposed.',
      feat2Badge: 'VECTOR RAG',
      feat2Title: 'Parent-Child Semantic Memory',
      feat2Desc:
        'Powered by MongoDB Atlas Vector Search (mindmittel_v2). Combines granular 400-char vector matching with full 2,000-char parent context.',
      feat3Badge: 'AI POWERED',
      feat3Title: 'Autonomous Gemini Router',
      feat3Desc:
        'Queries the live Google Gemini catalog at runtime, scores version & stability tiers, and automatically routes between Flash and Pro models.',
      feat4Badge: 'OBSERVABILITY',
      feat4Title: 'Live System Topology & SSE Logs',
      feat4Desc:
        'Built-in /system engineering console featuring clickable technical deep-dive documentation and real-time Server-Sent Events log streaming.',
    },
    ctaBanner: {
      badge: 'Live Workspace Available Now',
      titleWhite: 'Ready to Experience Real-Time',
      titleBlue: 'Corporate Governance?',
      subtitle:
        'Open the interactive Audit & RAG Workspace right now to test autonomous Gemini routing and inspect the Parent-Child knowledge vault.',
      buttonText: 'Launch MindMittel Application',
    },
    footer: {
      description:
        'AI Governance Gatekeeper & Parent-Child Vector RAG Platform for modern enterprises.',
      productCol: 'PRODUCT',
      companyCol: 'ARCHITECTURE',
      legalCol: 'LANGUAGES',
    },
    ragSection: {
      title: 'Executive Audit & Parent-Child RAG Workspace',
      subtitle:
        'Enter a management decision or policy question below. The engine automatically determines whether to route to Gemini Flash (rapid lookup) or Gemini Pro (deep compliance audit).',
      searchPlaceholder:
        'Enter a decision to audit or ask a policy question (e.g., Can a department head approve a €15,000 vendor contract?)...',
      autoRoutingNotice:
        'Autonomous AI Routing Active: Request complexity is analyzed automatically.',
      filterDepartment: 'Department: All',
      filterSource: 'Source: Upload & Slack',
      filterAccess: 'Access: Internal & Board',
      parentLabel: 'Parent Document Context',
      childChunksLabel: 'Matched Child Vectors',
      sampleDoc1Title: 'Supervisory Board Audit Charter 2026',
      sampleDoc1Summary:
        'Defines approval thresholds for unbudgeted expenditures, conflict-of-interest disclosures, and quarterly departmental compliance reviews.',
      sampleDoc2Title: 'Executive Leadership Sync — Slack Archive #gov-council',
      sampleDoc2Summary:
        'Cross-functional alignment on AI vendor procurement controls, data security rules, and DACH reporting timelines.',
    },
  },
  de: {
    meta: {
      localeCode: 'de',
      languageLabel: 'Deutsch',
      appName: 'MindMittel',
      tagline: 'WISSEN & KI-GOVERNANCE',
    },
    nav: {
      whyMindMittel: 'Warum MindMittel',
      howItWorks: 'So funktioniert es',
      features: 'Funktionen',
      systemCenter: 'System & Logs',
      launchApp: 'Live-App starten',
      backToLanding: 'Home',
    },
    hero: {
      badge: 'KI-Governance & Unternehmensberatung der nächsten Generation',
      titleBlack1: 'Schluss mit Rätselraten.',
      titleBlue: 'Management-Entscheidungen',
      titleBlack2: 'in Echtzeit prüfen.',
      subtitle:
        'MindMittel V2 verwandelt verstreute Richtlinien, Protokolle und Team-Kommunikation in ein zentrales Company Brain – und prüft strategische Entscheidungen gegen Unternehmensregeln, bevor Risiken entstehen.',
      primaryCta: 'Live-App starten',
      trust1: 'Echtzeit-Audits',
      trust2: 'Parent-Child Vektor-Archiv',
      trust3: 'Berichte auf Deutsch & Englisch',
      mockupWindowTitle: 'MindMittel V2 — Executive Audit Engine',
      mockupPhase1: 'PHASE 1 — ERFASSEN & ZERLEGEN',
      mockupDoc1Title: 'Strategie- & Vorstandsnotiz',
      mockupDoc1Sub:
        'Parent-Abschnitt (2.000 Zeichen) + 4 Child-Vektoren in MongoDB Atlas',
      mockupDoc2Title: 'HR_Richtlinie_2026.pdf',
      mockupDoc2Sub: 'Abteilung: HR & Recht · Normalisierte Tags & Metadaten ✓',
      mockupDoc3Title: 'Slack-Connector #gov-council',
      mockupDoc3Sub: 'Externe Quellen-Synchronisation · SHA-256 dedupliziert',
      mockupStoredBadge: 'Gespeichert im Company Brain (mindmittel_v2)',
      mockupPhase2: 'PHASE 2 — AUTONOMES AUDIT',
      mockupDecisionLabel: 'Entscheidungsvorlage:',
      mockupDecisionText:
        '„Freigabe eines ungeplanten Lieferantenvertrags über 18.000 € ohne Zweitunterschrift."',
      mockupReportHeader: 'Audit_Auswertung_2026.json',
      mockupReportItem1: 'Parent-Kontext gefunden (768-d Vektor)',
      mockupReportItem2: 'Automatisch an optimales Gemini-Modell geroutet',
      mockupReportItem3: 'Richtlinien-Abgleich & Maßnahmenplan',
      mockupCertifiedBadge: 'ZERTIFIZIERT',
    },
    problemSolution: {
      eyebrow: 'DAS PROBLEM VS. DIE LÖSUNG',
      title: 'Warum klassisches Management an Grenzen stößt',
      problemHeader: 'DAS PROBLEM',
      prob1Title: 'Prüfung erst im Nachhinein',
      prob1Desc:
        'Klassische Governance entdeckt Richtlinienverstöße oft erst Monate nach einer Entscheidung, wenn Korrekturen teuer und schädlich sind.',
      prob2Title: 'Verstreutes Wissen in Silos',
      prob2Desc:
        'Wichtige Regeln in PDFs, Protokollen und Slack-Kanälen bleiben getrennt – einfache Stichwortsuche scheitert bei abweichenden Formulierungen.',
      prob3Title: 'Entscheidungen ohne Gesamtkontext',
      prob3Desc:
        'Führungskräfte entscheiden nach Bauchgefühl statt nach Unternehmenswissen, während Standard-KI-Chatbots ohne Dokumentkontext halluzinieren.',
      solutionHeader: 'DIE MINDMITTEL LÖSUNG',
      sol1Title: 'KI-Gatekeeping in Echtzeit',
      sol1Desc:
        'Jede Entscheidungsvorlage wird vor der Umsetzung gegen das gesamte Company Brain geprüft – Abweichungen werden sofort erkannt.',
      sol2Title: 'Parent-Child Vektor-RAG auf Atlas',
      sol2Desc:
        'Findet präzise 400-Zeichen-Vektoren nach Bedeutung und lädt gleichzeitig das vollständige 2.000-Zeichen-Hauptdokument für vollen Kontext.',
      sol3Title: 'Autonomes Gemini-Modell-Routing',
      sol3Desc:
        'Keine manuelle Modellauswahl. Das System analysiert die Anfragekomplexität und wählt dynamisch das optimale Google Gemini Modell.',
    },
    howItWorksSection: {
      eyebrow: 'SO FUNKTIONIERT ES',
      titleBlack: 'Von Rohdaten zum zertifizierten Audit in',
      titleBlue: '3 Schritten',
      step1Label: 'SCHRITT 01',
      step1Title: 'Wissen einspeisen',
      step1Desc:
        'Teams erfassen Richtlinien, Protokolle oder Kanal-Nachrichten – automatisch getaggt nach Abteilung, Quelle und Vertraulichkeitsstufe.',
      step2Label: 'SCHRITT 02',
      step2Title: 'Entscheidung einreichen',
      step2Desc:
        'Reichen Sie eine Entscheidung oder Frage ein. MindMittel filtert nach Metadaten, startet die 768-d Vektorsuche und wählt automatisch das beste Gemini-Modell.',
      step3Label: 'SCHRITT 03',
      step3Title: 'Sofortiger Audit-Bericht',
      step3Desc:
        'Erhalten Sie sofort eine strukturierte Bewertung inklusive direktem Quellenverweis auf das Hauptdokument sowie konkreten Handlungsempfehlungen.',
    },
    featuresSection: {
      eyebrow: 'KERNFUNKTIONEN',
      title: 'Entwickelt für erstklassige Unternehmensführung',
      subtitle:
        'Jede Funktion wurde entwickelt, um die Lücke zwischen Unternehmenswissen und Führungsentscheidungen zu schließen.',
      feat1Badge: 'GOVERNANCE',
      feat1Title: 'Risikoprävention in Echtzeit',
      feat1Desc:
        'Prüfen Sie Entscheidungen vor der Ausführung statt Monate später. Erkennen Sie Widersprüche zu internen Richtlinien sofort.',
      feat2Badge: 'VEKTOR-RAG',
      feat2Title: 'Semantisches Parent-Child Gedächtnis',
      feat2Desc:
        'Basierend auf MongoDB Atlas Vector Search (mindmittel_v2). Kombiniert präzise Detailtreffer mit dem vollen Kontext des Hauptdokuments.',
      feat3Badge: 'KI-ENGINE',
      feat3Title: 'Autonomer Gemini-Router',
      feat3Desc:
        'Fragt zur Laufzeit verfügbare Google Gemini Modelle ab, bewertet Versionen & Stabilität und routet automatisch zwischen Flash und Pro.',
      feat4Badge: 'OBSERVABILITY',
      feat4Title: 'Live-Systemtopologie & SSE-Logs',
      feat4Desc:
        'Integrierte /system Konsole mit interaktiver technischer Architekturdokumentation und Echtzeit-Log-Streaming per Server-Sent Events.',
    },
    ctaBanner: {
      badge: 'Live-Arbeitsbereich jetzt verfügbar',
      titleWhite: 'Bereit für Echtzeit-',
      titleBlue: 'Corporate Governance?',
      subtitle:
        'Öffnen Sie jetzt den interaktiven Audit- & RAG-Arbeitsbereich, um das autonome Gemini-Routing und das Parent-Child Wissensarchiv zu nutzen.',
      buttonText: 'MindMittel Anwendung starten',
    },
    footer: {
      description:
        'KI-Governance-Gatekeeper & Parent-Child Vektor-RAG-Plattform für moderne Unternehmen.',
      productCol: 'PRODUKT',
      companyCol: 'ARCHITEKTUR',
      legalCol: 'SPRACHEN',
    },
    ragSection: {
      title: 'Executive Audit & Parent-Child RAG-Arbeitsbereich',
      subtitle:
        'Geben Sie unten eine Entscheidungsvorlage oder Richtlinienfrage ein. Die Engine entscheidet automatisch, ob Gemini Flash (Schnellabfrage) oder Gemini Pro (Tiefen-Audit) genutzt wird.',
      searchPlaceholder:
        'Entscheidung prüfen oder Richtlinienfrage stellen (z. B. Darf ein Abteilungsleiter 15.000 € Lieferantenverträge freigeben?)...',
      autoRoutingNotice:
        'Autonomes KI-Routing aktiv: Die Komplexität Ihrer Anfrage wird automatisch erkannt.',
      filterDepartment: 'Abteilung: Alle',
      filterSource: 'Quelle: Upload & Slack',
      filterAccess: 'Zugriff: Intern & Vorstand',
      parentLabel: 'Parent-Dokumentkontext',
      childChunksLabel: 'Treffer Child-Vektoren',
      sampleDoc1Title: 'Prüfungscharta des Aufsichtsrats 2026',
      sampleDoc1Summary:
        'Definiert Freigabegrenzen für außerplanmäßige Ausgaben, Offenlegung von Interessenkonflikten und Quartals-Compliance-Berichte.',
      sampleDoc2Title: 'Führungskräfte-Sync — Slack-Archiv #gov-council',
      sampleDoc2Summary:
        'Abteilungsübergreifende Abstimmung zu KI-Beschaffungskontrollen, Datensicherheit und DACH-Berichtsfristen.',
    },
  },
};

export function getDictionary(locale?: string): AppDictionary {
  if (locale === 'de') {
    return dictionaries.de;
  }
  return dictionaries.en;
}
