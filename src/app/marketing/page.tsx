'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  Building2,
  CheckCircle2,
  CloudCog,
  Cpu,
  Database,
  Eye,
  FileText,
  GitBranch,
  Link2,
  Lock,
  MailCheck,
  MessageSquare,
  Scale,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import { buildZoneUrl } from '@/core/tenancy/hostResolver';
import { MARKETING_JSON_LD } from '@/core/seo/seoPolicies';
import type { SupportedLocale } from '@/i18n/dictionaries';

const LANDING_COPY = {
  de: {
    nav: {
      howItWorks: 'Funktionsweise',
      businessValue: 'Unternehmenswert',
      dataSovereignty: 'Datensouveränität',
      liveDemo: 'Live-Demo',
      launchDemo: 'Live-Demo starten',
    },
    hero: {
      eyebrow: 'KI-Entscheidungs- & Compliance-Berater für den deutschen Mittelstand',
      headlineLead: 'Schluss mit Bauchgefühl. Prüfen Sie jede Management-Entscheidung gegen Ihr',
      headlineAccent: 'Unternehmenswissen',
      subtitle:
        'MindMittel bündelt verstreute Richtlinien, Vorstandsbeschlüsse und Besprechungsnotizen in einem geschützten Company Brain – und warnt die Geschäftsführung vor Widersprüchen, Freigabegrenzen sowie Arbeits- und Datenschutzrisiken, bevor Verträge unterschrieben werden.',
      primaryCta: 'Live-Demo entdecken (demo.mindmittel.de)',
      secondaryCta: 'Funktionsweise',
      workspaceLabel: 'Ihren dedizierten Unternehmens-Workspace öffnen',
      workspaceStatus: 'Privater Workspace aktiv',
      workspaceButton: 'Workspace öffnen',
      workspaceHint: 'Verifizierte Firmen-E-Mail erforderlich • Eigene Unternehmensumgebung',
      workspaceIsolation: 'Strikte Mandantentrennung',
      workspacePlaceholder: 'ihrefirma',
      workspaceError: 'Bitte geben Sie eine gültige Unternehmens-Subdomain ein (z. B. bosch).',
      trust1: 'Eigene Datenbank pro Firma',
      trust2: 'Zugang nur per Firmen-E-Mail',
      trust3: 'Kein KI-Training mit Ihren Daten',
    },
    diagram: {
      header: 'LIVE GOVERNANCE- & PRÜFFLUSS',
      badge: 'Echtzeit-Validierung',
      sourcesLabel: 'WISSENSQUELLEN DES UNTERNEHMENS',
      src1Title: 'Dokumente & Audio',
      src1Sub: 'PDF, Folien, Sprache',
      src2Title: 'Team-Tools',
      src2Sub: 'Slack, Teams, Notion',
      src3Title: 'Cloud & Meetings',
      src3Sub: 'Drive, Zoom, Meet',
      zoneLabel: 'ISOLIERTE UNTERNEHMENSUMGEBUNG • KEIN DATENABFLUSS',
      engineTitle: 'MindMittel Engine',
      engineSub: 'Konfliktprüfung • Deutsches Recht • Kein KI-Training',
      auditTitle: 'Vorstandsprüfung',
      auditBadge: 'FREIGABEBEREIT',
      pill1: 'Quellenbelege',
      pill2: 'Risiko-Score',
      pill3: 'Maßnahmenplan',
      footerText: 'Live-Prüffluss — 0 widersprüchliche Richtlinien • DSGVO & Betriebsrat geprüft',
      footerBadge: 'Geprüft',
    },
    workflow: {
      eyebrow: 'ABLAUF FÜR DIE GESCHÄFTSFÜHRUNG',
      title: 'Vom verstreuten Wissen zu sicheren Entscheidungen',
      subtitle:
        'Wie MindMittel unstrukturierte Unternehmensinformationen in klare, rechtssichere Führungsgrundlagen verwandelt.',
      steps: [
        {
          tag: '01 / PHASE',
          title: 'Unternehmenswissen vernetzen',
          desc: 'Übernehmen Sie PDFs, Präsentationen, Sprachaufnahmen sowie bestehende Tools wie Teams, Slack oder Drive – ganz ohne manuelles Kopieren.',
        },
        {
          tag: '02 / PHASE',
          title: 'Widersprüche früh erkennen',
          desc: 'Erkennen Sie automatisch, wenn neue Vorschläge oder Abteilungsregeln bestehenden Vorstandsbeschlüssen widersprechen.',
        },
        {
          tag: '03 / PHASE',
          title: 'Deutsche Compliance-Prüfung',
          desc: 'Jede Entscheidung wird automatisch gegen deutsche Datenschutzvorgaben (DSGVO) und Mitbestimmungsregeln des Betriebsrats geprüft.',
        },
        {
          tag: '04 / PHASE',
          title: 'Lückenloser Prüfbericht',
          desc: 'Erhalten Sie eine sofortige Bewertung mit exakten Dokumentzitaten und einem klaren Fahrplan für die Freigabe.',
        },
      ],
      bar1: '✓ Kein Datenabfluss zwischen Unternehmen',
      bar2: '✓ Kein KI-Training mit Firmendaten',
      bar3: '✓ Deutsche Compliance integriert',
    },
    value: {
      eyebrow: 'ORGANISATORISCHE KLARHEIT & RISIKOKONTROLLE',
      title: 'Zentrale Herausforderungen im Unternehmen lösen',
      subtitle:
        'Speziell entwickelt für Geschäftsführung, Aufsichtsräte und Compliance-Verantwortliche im Mittelstand.',
      cards: [
        {
          title: 'Ein zentrales Unternehmensgedächtnis',
          desc: 'Durchsuchen Sie Richtlinien, Präsentationen und protokollierte Vorstandssitzungen in Sekunden mit klaren Zusammenfassungen.',
        },
        {
          title: 'Nahtlose Anbindung Ihrer Tools',
          desc: 'Bleibt automatisch auf dem aktuellen Stand mit Slack, Microsoft Teams, Notion, Confluence, Google Drive, Zoom & Meet.',
        },
        {
          title: 'Widersprüche rechtzeitig verhindern',
          desc: 'Deckt gegensätzliche Regeln zwischen Finanzen, HR und Betrieb auf, bevor teure Fehlentscheidungen entstehen.',
          warningLabel: 'Konfliktwarnung:',
          warningText:
            'Widerspruch zwischen Reiserichtlinie der Zentrale und Tochtergesellschaft erkannt.',
        },
        {
          title: 'Für deutsche Governance gebaut',
          desc: 'Weist rechtzeitig auf CFO-Freigabegrenzen, DSGVO-Anforderungen und Beteiligungspflichten des Betriebsrats hin.',
        },
        {
          title: 'Ihr eigener Unternehmens-Workspace',
          desc: 'Jede Organisation erhält unter ihrfirma.mindmittel.de eine eigene Datenbank in Deutschland sowie einen eigenen Enterprise-API-Schlüssel ohne Modelltraining.',
        },
        {
          title: 'Volle Transparenz für Entscheider',
          desc: 'Jede Prüfung wird dem verantwortlichen Manager zugeordnet und nachvollziehbar begründet – niemals eine Blackbox.',
        },
      ],
    },
    sovereignty: {
      eyebrow: 'DATENSOUVERÄNITÄT & DATENSCHUTZ',
      title: 'Unternehmenssicherheit ohne Komplexität',
      subtitle:
        'Konzipiert für höchste deutsche Compliance-Ansprüche, strenge Vertraulichkeit und volle Kontrolle über Ihre Unternehmensdaten.',
      partitionTitle: 'Visuelle Trennungsarchitektur',
      publicTitle: 'Öffentliche Website & Vorschau',
      publicBadge: 'Zustandslos',
      publicDesc:
        'Öffentlicher Testbereich. Hier werden niemals vertrauliche Unternehmensdaten gespeichert.',
      boundaryLabel: 'Strikte Sicherheitsgrenze pro Unternehmen',
      privateTitle: 'Dedizierter Unternehmens-Workspace',
      privateBadge: 'SOUVERÄN',
      privateDesc:
        'Vollständig getrennte Datenhaltung, eigener Kundenbereich und volle Datensouveränität.',
      cards: [
        {
          title: 'Dedizierte private Datenbank',
          desc: 'Ihre Richtlinien und Prüfberichte liegen in einer vollständig getrennten Datenbank – niemals vermischt mit anderen Firmen.',
        },
        {
          title: 'Zugang nur per Firmen-E-Mail',
          desc: 'Der Zutritt zu Ihrer Subdomain ist strikt auf verifizierte Mitarbeiter Ihrer offiziellen E-Mail-Domain per 6-stelligem Einmalcode beschränkt.',
        },
        {
          title: 'Kein KI-Training mit Unternehmensdaten',
          desc: 'Ihre Richtlinien, Verträge und Entscheidungsprotokolle werden niemals zum Trainieren von KI-Modellen verwendet – geschützt durch Enterprise-API-Verträge und eigene Mandantenschlüssel.',
        },
        {
          title: 'Null Datenabfluss zwischen Mandanten',
          desc: 'Strenge Bereichsgrenzen sorgen dafür, dass Strategiepapiere und Vorstandsbeschlüsse ausschließlich in Ihrer Organisation bleiben.',
        },
      ],
    },
    cta: {
      badge: 'Datensouveränität in Deutschland & der EU',
      title: 'Bereit für schnellere und sicherere Führungsentscheidungen?',
      subtitle:
        'Testen Sie MindMittel sofort in unserer öffentlichen Live-Demo oder aktivieren Sie Ihren eigenen geschützten Unternehmens-Workspace.',
      button: 'Live-Demo starten (demo.mindmittel.de)',
      footnote:
        'DSGVO-orientiert • Mandantengetrennt • Kein KI-Training mit Kundendaten • Ansbach, Bayern',
    },
    footer: {
      tagline:
        'Souveräne Multi-Tenant-Governance-Plattform für den deutschen Mittelstand.',
      trust: 'Datensicherheit',
      impressum: 'Impressum',
      privacy: 'Datenschutz (DSGVO)',
      copyright: '© 2026 MindMittel. Alle Rechte vorbehalten. Ansbach, Bayern, Deutschland.',
    },
  },
  en: {
    nav: {
      howItWorks: 'How It Works',
      businessValue: 'Business Value',
      dataSovereignty: 'Data Sovereignty',
      liveDemo: 'Live Demo',
      launchDemo: 'Launch Live Demo',
    },
    hero: {
      eyebrow: 'AI Decision & Compliance Advisor for German Mittelstand',
      headlineLead: 'Stop Guessing. Validate Every Management Decision Against Your',
      headlineAccent: 'Company Knowledge',
      subtitle:
        'MindMittel turns your scattered policies, board resolutions, and meeting notes into one trusted Company Brain—alerting leadership to policy conflicts, financial thresholds, and German labor or privacy risks before decisions are signed.',
      primaryCta: 'Explore Live Demo (demo.mindmittel.de)',
      secondaryCta: 'How It Works',
      workspaceLabel: 'Access your dedicated company workspace',
      workspaceStatus: 'Private Workspace Active',
      workspaceButton: 'Open Company Workspace',
      workspaceHint: 'Verified corporate email domain required • Dedicated workspace',
      workspaceIsolation: 'Strict Company Isolation',
      workspacePlaceholder: 'yourcompany',
      workspaceError: 'Please enter a valid company subdomain (e.g. bosch).',
      trust1: 'Dedicated Company Database',
      trust2: 'Verified Corporate Email Access',
      trust3: 'Zero AI Training on Your Data',
    },
    diagram: {
      header: 'LIVE GOVERNANCE & AUDIT FLOW',
      badge: 'Real-Time Validation',
      sourcesLabel: 'COMPANY KNOWLEDGE SOURCES',
      src1Title: 'Documents & Audio',
      src1Sub: 'PDF, Slides, Voice',
      src2Title: 'Team Tools',
      src2Sub: 'Slack, Teams, Notion',
      src3Title: 'Cloud & Meetings',
      src3Sub: 'Drive, Zoom, Meet',
      zoneLabel: 'ISOLATED COMPANY ENVIRONMENT • ZERO DATA LEAKAGE',
      engineTitle: 'MindMittel Engine',
      engineSub: 'Conflict Check • German Law Guard • Zero AI Training',
      auditTitle: 'Executive Audit',
      auditBadge: 'READY FOR SIGN-OFF',
      pill1: 'Policy Citations',
      pill2: 'Risk Score',
      pill3: 'Action Plan',
      footerText: 'Live Governance Flow — 0 Conflicting Policies • DSGVO & Works Council Checked',
      footerBadge: 'Audited',
    },
    workflow: {
      eyebrow: 'EXECUTIVE DECISION WORKFLOW',
      title: 'From Scattered Knowledge to Confident Decisions',
      subtitle:
        'How MindMittel transforms unstructured company information into clear, legally compliant leadership decisions.',
      steps: [
        {
          tag: '01 / STAGE',
          title: 'Connect Your Knowledge',
          desc: 'Import PDFs, presentations, voice recordings, and existing tools like Teams, Slack, or Drive without manual copy-pasting.',
        },
        {
          tag: '02 / STAGE',
          title: 'Spot Contradictions Early',
          desc: 'Automatically detect when new proposals or department guidelines conflict with existing board rules.',
        },
        {
          tag: '03 / STAGE',
          title: 'German Compliance Check',
          desc: 'Every decision is cross-checked against German privacy (DSGVO) and Works Council (Betriebsrat) requirements.',
        },
        {
          tag: '04 / STAGE',
          title: 'Clear Audit Trail',
          desc: 'Receive an instant verdict with exact document citations and a clear roadmap for leadership approval.',
        },
      ],
      bar1: '✓ Zero Cross-Company Leakage',
      bar2: '✓ Zero AI Training on Company Data',
      bar3: '✓ German Compliance Built-In',
    },
    value: {
      eyebrow: 'ORGANIZATIONAL CLARITY & RISK CONTROL',
      title: 'Solving Core Organizational Challenges',
      subtitle:
        'Purpose-built to give managing directors, supervisory boards, and compliance officers total certainty.',
      cards: [
        {
          title: 'One Unified Company Brain',
          desc: 'Search across policies, slides, and recorded board meetings in seconds with contextual summaries.',
        },
        {
          title: 'Effortless Tool Integration',
          desc: 'Automatically stays up to date with Slack, Microsoft Teams, Notion, Confluence, Google Drive, Zoom & Meet without extra manual work.',
        },
        {
          title: 'Policy Conflict Prevention',
          desc: 'Catches contradicting rules across Finance, HR, and Operations before costly mistakes happen.',
          warningLabel: 'Conflict Warning:',
          warningText:
            'Policy contradiction detected between HQ Travel Directive & Subsidiary Guideline.',
        },
        {
          title: 'Built for German Governance',
          desc: 'Flags CFO approval thresholds, DSGVO data rules, and Betriebsrat co-determination triggers before signing.',
        },
        {
          title: 'Your Own Branded Workspace',
          desc: 'Each organization receives yourcompany.mindmittel.de with its own isolated database in Germany and dedicated enterprise API keys with zero model training.',
        },
        {
          title: 'Full Executive Transparency',
          desc: 'Every audit is attributed to the responsible manager with clear step-by-step reasoning—never a black box.',
        },
      ],
    },
    sovereignty: {
      eyebrow: 'DATA SOVEREIGNTY & PRIVACY',
      title: 'Enterprise Security Without Complexity',
      subtitle:
        'Engineered specifically to satisfy German corporate governance standards, confidentiality laws, and strict internal compliance.',
      partitionTitle: 'Visual Partition Architecture',
      publicTitle: 'Public Sandbox & Website',
      publicBadge: 'Stateless',
      publicDesc:
        'Public exploration environment. No company data is ever received or stored here.',
      boundaryLabel: 'Strict Sovereign Perimeter Boundary',
      privateTitle: 'Dedicated Company Workspace',
      privateBadge: 'SOVEREIGN',
      privateDesc:
        'Completely isolated storage, dedicated customer workspace, and full sovereignty.',
      cards: [
        {
          title: 'Dedicated Private Database',
          desc: "Your company's policies and audit reports live in a completely separate database—never mixed with other organizations.",
        },
        {
          title: 'Corporate Email-Only Entry',
          desc: 'Access to your subdomain is strictly restricted to verified employees with your official company email domain via a 6-digit one-time code.',
        },
        {
          title: 'Zero AI Training on Company Data',
          desc: 'Your policies, contracts, and executive audit logs are never used to train AI models—protected by enterprise API terms and dedicated tenant keys.',
        },
        {
          title: 'Zero Cross-Company Leakage',
          desc: 'Strict workspace boundaries ensure internal strategies and board documents remain strictly inside your organization.',
        },
      ],
    },
    cta: {
      badge: 'German & EU Data Sovereignty',
      title: 'Ready to Make Faster, Safer Executive Decisions?',
      subtitle:
        'Test MindMittel immediately in our public preview or activate your dedicated company workspace.',
      button: 'Launch Live Demo (demo.mindmittel.de)',
      footnote:
        'DSGVO Ready • Tenant-Isolated • Zero AI Training on Customer Data • Ansbach, Germany',
    },
    footer: {
      tagline:
        'Sovereign Multi-Tenant Governance Platform for German Mittelstand.',
      trust: 'Trust & Compliance',
      impressum: 'Imprint (Impressum)',
      privacy: 'Privacy (DSGVO)',
      copyright: '© 2026 MindMittel. All rights reserved. Ansbach, Bavaria, Germany.',
    },
  },
} as const;

export default function MarketingLandingPage() {
  const [locale, setLocale] = useState<SupportedLocale>('de');
  const [workspaceSlug, setWorkspaceSlug] = useState<string>('bosch');
  const [slugError, setSlugError] = useState<string | null>(null);

  const copy = LANDING_COPY[locale];

  function navigateToZone(slug: string | null) {
    if (typeof window === 'undefined') return;
    const targetUrl = buildZoneUrl(
      slug,
      window.location.host,
      window.location.protocol
    );
    window.location.href = targetUrl;
  }

  function handleOpenCompanyWorkspace(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = workspaceSlug
      .trim()
      .toLowerCase()
      .replace(/\.mindmittel\.de$/i, '')
      .replace(/[^a-z0-9-]/g, '');

    if (!cleaned || cleaned.length < 2) {
      setSlugError(copy.hero.workspaceError);
      return;
    }
    setSlugError(null);
    navigateToZone(cleaned);
  }

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] antialiased flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(MARKETING_JSON_LD) }}
      />
      <style>{`
        @keyframes flowDash {
          to { stroke-dashoffset: -24px; }
        }
        .flow-line {
          stroke-dasharray: 6 6;
          animation: flowDash 1.2s linear infinite;
          stroke: #2563eb;
          stroke-width: 2.5;
        }
        .flow-line-horizontal {
          stroke-dasharray: 5 5;
          animation: flowDash 1s linear infinite;
          stroke: #059669;
          stroke-width: 2;
        }
        @keyframes pulseDot {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.25); opacity: 1; }
        }
        .pulsing-dot {
          animation: pulseDot 2s ease-in-out infinite;
        }
      `}</style>

      {/* Sticky Top Navigation */}
      <header className="fixed top-0 left-0 w-full z-50 bg-white/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-slate-200/70">
        <div className="h-16 max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <a
              href="#"
              className="flex items-center gap-3 focus:outline-none"
            >
              <img
                src="/images/mindmittel-logo.svg"
                alt="MindMittel Logo"
                className="h-10 w-10 object-contain"
              />
              <span className="text-xl font-extrabold tracking-tight text-[#131b2e]">
                MindMittel
              </span>
            </a>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            <a
              href="#how-it-works"
              className="px-3 py-1.5 rounded text-[13px] font-medium text-[#434655] hover:bg-[#eaedff] hover:text-[#131b2e] transition-all"
            >
              {copy.nav.howItWorks}
            </a>
            <a
              href="#business-value"
              className="px-3 py-1.5 rounded text-[13px] font-medium text-[#434655] hover:bg-[#eaedff] hover:text-[#131b2e] transition-all"
            >
              {copy.nav.businessValue}
            </a>
            <a
              href="#data-sovereignty"
              className="px-3 py-1.5 rounded text-[13px] font-medium text-[#434655] hover:bg-[#eaedff] hover:text-[#131b2e] transition-all"
            >
              {copy.nav.dataSovereignty}
            </a>
            <button
              type="button"
              onClick={() => navigateToZone('demo')}
              className="px-3 py-1.5 rounded text-[13px] font-medium text-[#434655] hover:bg-[#eaedff] hover:text-[#131b2e] transition-all"
            >
              {copy.nav.liveDemo}
            </button>
          </nav>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center rounded bg-[#f2f3ff] px-1 py-0.5 text-[#434655]">
              <button
                type="button"
                onClick={() => setLocale('de')}
                className={`px-2 py-1 rounded font-mono text-[11px] uppercase font-semibold transition-all ${
                  locale === 'de'
                    ? 'bg-white text-[#131b2e] shadow-sm'
                    : 'text-[#434655] hover:text-[#131b2e]'
                }`}
              >
                DE
              </button>
              <span className="px-1 font-mono text-[11px] text-[#737686]">|</span>
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={`px-2 py-1 rounded font-mono text-[11px] uppercase font-semibold transition-all ${
                  locale === 'en'
                    ? 'bg-white text-[#131b2e] shadow-sm'
                    : 'text-[#434655] hover:text-[#131b2e]'
                }`}
              >
                EN
              </button>
            </div>

            <button
              type="button"
              onClick={() => navigateToZone('demo')}
              className="inline-flex items-center justify-center h-9 px-4 rounded bg-[#2563eb] hover:bg-[#004ac6] text-white text-[13px] font-semibold tracking-tight transition-all shadow-sm gap-1.5"
            >
              <span>{copy.nav.launchDemo}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="w-full pt-16 flex-1">
        {/* HERO SECTION */}
        <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-8 pt-8 pb-12 sm:pt-10 sm:pb-14 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center relative z-10">
            {/* Left 6 Columns */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              <div className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full bg-[#f2f3ff] shadow-sm border border-[#c3c6d7]/50">
                <span className="w-2 h-2 rounded-full bg-[#006c4a] pulsing-dot" />
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#131b2e] font-semibold">
                  {copy.hero.eyebrow}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#131b2e] tracking-tight max-w-2xl leading-[1.15]">
                {copy.hero.headlineLead}{' '}
                <span className="text-[#004ac6] underline decoration-[#2563eb]/30 decoration-wavy decoration-2">
                  {copy.hero.headlineAccent}
                </span>
                .
              </h1>

              <p className="text-base text-[#434655] max-w-xl leading-relaxed">
                {copy.hero.subtitle}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => navigateToZone('demo')}
                  className="inline-flex items-center justify-center h-11 px-6 rounded bg-[#004ac6] hover:bg-[#2563eb] text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all gap-2"
                >
                  <span>{copy.hero.primaryCta}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center h-11 px-4 rounded bg-[#eaedff] hover:bg-[#e2e7ff] text-[#131b2e] text-sm font-semibold transition-colors gap-1.5"
                >
                  <span>{copy.hero.secondaryCta}</span>
                  <ArrowDown className="w-4 h-4 text-[#434655]" />
                </a>
              </div>

              {/* Company Subdomain Launcher */}
              <form
                onSubmit={handleOpenCompanyWorkspace}
                className="mt-2 p-4 bg-white rounded-xl shadow-sm border border-[#c3c6d7]/50"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-[11px] uppercase text-[#434655] font-semibold">
                    {copy.hero.workspaceLabel}
                  </span>
                  <span className="font-mono text-[11px] text-[#006c4a] flex items-center gap-1.5 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#006c4a]" />
                    {copy.hero.workspaceStatus}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                  <div className="flex-1 flex items-center bg-[#f2f3ff] px-3 py-2 rounded font-mono text-xs text-[#131b2e] focus-within:ring-2 focus-within:ring-[#004ac6] focus-within:bg-white transition-all">
                    <span className="text-[#737686] select-none">https://</span>
                    <input
                      type="text"
                      aria-label="Company subdomain"
                      value={workspaceSlug}
                      onChange={(e) => setWorkspaceSlug(e.target.value)}
                      placeholder={copy.hero.workspacePlaceholder}
                      className="bg-transparent text-[#004ac6] font-semibold outline-none px-1 w-28 sm:w-36"
                    />
                    <span className="text-[#131b2e] select-none font-medium">
                      .mindmittel.de
                    </span>
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center h-10 px-4 rounded bg-[#131b2e] hover:bg-[#004ac6] text-white text-[13px] font-semibold transition-colors shrink-0 shadow-sm gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{copy.hero.workspaceButton}</span>
                  </button>
                </div>

                {slugError && (
                  <p className="mt-2 text-xs text-rose-600 font-semibold">
                    {slugError}
                  </p>
                )}

                <div className="mt-2.5 flex items-center justify-between text-[#434655] font-mono text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#004ac6]" />
                    {copy.hero.workspaceHint}
                  </span>
                  <span className="hidden md:inline text-[#737686]">
                    {copy.hero.workspaceIsolation}
                  </span>
                </div>
              </form>

              {/* 3 Trust Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <div className="flex items-center gap-2 p-2.5 rounded bg-white/90 border border-[#c3c6d7]/50 shadow-sm">
                  <Database className="w-4 h-4 text-[#006c4a] shrink-0" />
                  <span className="text-[12.5px] font-medium text-[#131b2e]">
                    {copy.hero.trust1}
                  </span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded bg-white/90 border border-[#c3c6d7]/50 shadow-sm">
                  <MailCheck className="w-4 h-4 text-[#006c4a] shrink-0" />
                  <span className="text-[12.5px] font-medium text-[#131b2e]">
                    {copy.hero.trust2}
                  </span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded bg-white/90 border border-[#c3c6d7]/50 shadow-sm">
                  <Cpu className="w-4 h-4 text-[#006c4a] shrink-0" />
                  <span className="text-[12.5px] font-medium text-[#131b2e]">
                    {copy.hero.trust3}
                  </span>
                </div>
              </div>
            </div>

            {/* Right 6 Columns: Optimized Executive Audit Visual */}
            <div className="lg:col-span-6 w-full flex items-center justify-center">
              <div className="relative w-full max-w-[560px] lg:max-w-[620px] mx-auto">
                <img
                  src="/images/hero-executive-audit.webp"
                  alt={
                    locale === 'de'
                      ? 'MindMittel Live Vorstandsprüfung: Risiko-Score 42/100, BetrVG-Warnung, DSGVO & EU AI Act Prüfung mit Quellenbelegen aus PDF, DOCX, Drive, Slack, Teams, Notion, Confluence, Zoom und Meet'
                      : 'MindMittel Live Executive Audit: Risk Score 42/100, BetrVG alert, GDPR & EU AI Act verification with source citations from PDF, DOCX, Drive, Slack, Teams, Notion, Confluence, Zoom and Meet'
                  }
                  width={928}
                  height={928}
                  fetchPriority="high"
                  decoding="async"
                  className="w-full h-auto block select-none"
                  style={{
                    maskImage:
                      'radial-gradient(ellipse 96% 96% at 50% 50%, black 82%, transparent 100%)',
                    WebkitMaskImage:
                      'radial-gradient(ellipse 96% 96% at 50% 50%, black 82%, transparent 100%)',
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* WORKFLOW SECTION */}
        <section id="how-it-works" className="w-full bg-white py-14 sm:py-16 border-y border-slate-200/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div className="max-w-3xl mb-8">
              <div className="font-mono text-[11px] uppercase tracking-wider text-[#004ac6] font-semibold mb-1">
                {copy.workflow.eyebrow}
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#131b2e] tracking-tight">
                {copy.workflow.title}
              </h2>
              <p className="text-base text-[#434655] mt-2">
                {copy.workflow.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {copy.workflow.steps.map((step, idx) => {
                const badgeStyles = [
                  'text-[#004ac6] bg-[#dbe1ff]',
                  'text-[#006c4a] bg-[#85f8c4]',
                  'text-[#824500] bg-[#ffdcc3]',
                  'text-[#131b2e] bg-[#dae2fd]',
                ][idx];
                const StepIcon = [Link2, SlidersHorizontal, Scale, CheckCircle2][idx];
                return (
                  <div
                    key={step.tag}
                    className="flex flex-col bg-[#faf8ff] p-5 rounded-xl border border-[#c3c6d7]/50 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded ${badgeStyles}`}
                      >
                        {step.tag}
                      </span>
                      <StepIcon className="w-5 h-5 text-[#434655]" />
                    </div>
                    <h3 className="text-base font-semibold text-[#131b2e] mb-1.5">
                      {step.title}
                    </h3>
                    <p className="text-[13px] text-[#434655] leading-relaxed flex-1">
                      {step.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 p-4 bg-[#faf8ff] rounded-lg border border-[#c3c6d7]/50">
              <div className="flex flex-wrap items-center justify-between font-mono text-xs text-[#434655] gap-2">
                <span className="text-[#006c4a] font-semibold">{copy.workflow.bar1}</span>
                <span className="text-[#737686] hidden sm:inline">|</span>
                <span className="text-[#004ac6] font-semibold">{copy.workflow.bar2}</span>
                <span className="text-[#737686] hidden sm:inline">|</span>
                <span className="text-[#131b2e] font-semibold">{copy.workflow.bar3}</span>
              </div>
            </div>
          </div>
        </section>

        {/* BUSINESS CAPABILITIES BENTO GRID */}
        <section id="business-value" className="w-full py-14 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div className="max-w-3xl mb-8">
              <div className="font-mono text-[11px] uppercase tracking-wider text-[#004ac6] font-semibold mb-1">
                {copy.value.eyebrow}
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#131b2e] tracking-tight">
                {copy.value.title}
              </h2>
              <p className="text-base text-[#434655] mt-2">
                {copy.value.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {copy.value.cards.map((card, idx) => {
                const iconWrapStyles = [
                  'bg-[#dbe1ff] text-[#004ac6]',
                  'bg-[#85f8c4] text-[#006c4a]',
                  'bg-[#ffdad6] text-[#ba1a1a]',
                  'bg-[#ffdcc3] text-[#824500]',
                  'bg-[#dbe1ff] text-[#004ac6]',
                  'bg-[#85f8c4] text-[#006c4a]',
                ][idx];
                const CardIcon = [
                  GitBranch,
                  CloudCog,
                  AlertTriangle,
                  Scale,
                  Building2,
                  Eye,
                ][idx];
                return (
                  <div
                    key={card.title}
                    className="bg-white rounded-xl p-6 border border-[#c3c6d7]/50 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div
                        className={`w-9 h-9 rounded flex items-center justify-center mb-3 ${iconWrapStyles}`}
                      >
                        <CardIcon className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-semibold text-[#131b2e] mb-2">
                        {card.title}
                      </h3>
                      <p className="text-[13px] text-[#434655] leading-relaxed">
                        {card.desc}
                      </p>
                    </div>
                    {'warningLabel' in card && card.warningLabel && (
                      <div className="p-2.5 bg-[#f2f3ff] rounded font-mono text-[11px] text-[#131b2e]">
                        <span className="text-[#ba1a1a] font-semibold">
                          {card.warningLabel}{' '}
                        </span>
                        {card.warningText}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* DATA SOVEREIGNTY SECTION */}
        <section id="data-sovereignty" className="w-full bg-white py-14 sm:py-16 border-y border-slate-200/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div className="max-w-3xl mb-8">
              <div className="font-mono text-[11px] uppercase tracking-wider text-[#006c4a] font-semibold mb-1">
                {copy.sovereignty.eyebrow}
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#131b2e] tracking-tight">
                {copy.sovereignty.title}
              </h2>
              <p className="text-base text-[#434655] mt-2">
                {copy.sovereignty.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 bg-[#faf8ff] p-6 rounded-xl border border-[#c3c6d7]/50 shadow-sm">
                <div className="font-mono text-[11px] uppercase text-[#434655] font-semibold mb-4">
                  {copy.sovereignty.partitionTitle}
                </div>

                <div className="p-4 rounded bg-[#f2f3ff] mb-3 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] font-bold text-[#131b2e]">
                      {copy.sovereignty.publicTitle}
                    </span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#e2e7ff] text-[#434655]">
                      {copy.sovereignty.publicBadge}
                    </span>
                  </div>
                  <div className="font-mono text-xs text-[#737686]">
                    mindmittel.de &amp; demo.mindmittel.de
                  </div>
                  <p className="text-xs text-[#434655] mt-1">
                    {copy.sovereignty.publicDesc}
                  </p>
                </div>

                <div className="my-2 py-2 flex items-center justify-center">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#131b2e] text-white font-mono text-[10px] uppercase tracking-wider shadow-sm">
                    <Shield className="w-3.5 h-3.5 text-[#85f8c4]" />
                    <span>{copy.sovereignty.boundaryLabel}</span>
                  </div>
                </div>

                <div className="p-4 rounded bg-[#004ac6]/5 border border-[#004ac6]/25 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] font-bold text-[#004ac6]">
                      {copy.sovereignty.privateTitle}
                    </span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#85f8c4] text-[#002114] font-bold">
                      {copy.sovereignty.privateBadge}
                    </span>
                  </div>
                  <div className="font-mono text-xs text-[#004ac6] font-semibold">
                    &lt;company&gt;.mindmittel.de
                  </div>
                  <p className="text-xs text-[#434655] mt-1">
                    {copy.sovereignty.privateDesc}
                  </p>
                </div>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {copy.sovereignty.cards.map((item, idx) => {
                  const iconStyle = [
                    'bg-[#dbe1ff] text-[#004ac6]',
                    'bg-[#85f8c4] text-[#006c4a]',
                    'bg-[#ffdcc3] text-[#824500]',
                    'bg-[#dae2fd] text-[#131b2e]',
                  ][idx];
                  const Icon = [Database, MailCheck, Cpu, Shield][idx];
                  return (
                    <div
                      key={item.title}
                      className="p-5 rounded-xl bg-[#faf8ff] border border-[#c3c6d7]/50 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div
                        className={`w-8 h-8 rounded flex items-center justify-center mb-3 ${iconStyle}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-semibold text-[#131b2e] mb-1">
                        {item.title}
                      </h4>
                      <p className="text-[13px] text-[#434655] leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* DARK ENTERPRISE FOOTER CTA */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-8 my-12">
          <div className="relative rounded-2xl bg-[#283044] text-[#eef0ff] p-7 sm:p-12 overflow-hidden shadow-2xl">
            <div className="relative z-10 max-w-3xl flex flex-col gap-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 self-start">
                <span className="w-2 h-2 rounded-full bg-[#85f8c4] pulsing-dot" />
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#85f8c4] font-semibold">
                  {copy.cta.badge}
                </span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
                {copy.cta.title}
              </h2>

              <p className="text-base text-slate-300 max-w-2xl leading-relaxed">
                {copy.cta.subtitle}
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigateToZone('demo')}
                  className="inline-flex items-center justify-center h-12 px-6 rounded bg-[#2563eb] hover:bg-[#004ac6] text-white text-sm font-semibold transition-all shadow-lg gap-2"
                >
                  <span>{copy.cta.button}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 pt-4 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-slate-300 border-t border-white/15">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#85f8c4]" />
                  <span>{copy.cta.footnote}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200/80 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2.5">
                <img
                  src="/images/mindmittel-logo.svg"
                  alt="MindMittel Logo"
                  className="h-8 w-8 object-contain"
                />
                <span className="text-base font-extrabold tracking-tight text-[#131b2e]">
                  MindMittel
                </span>
              </div>
              <p className="text-xs text-[#434655]">{copy.footer.tagline}</p>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs text-[#434655]">
              <a
                href="#data-sovereignty"
                className="hover:text-[#131b2e] transition-colors"
              >
                {copy.footer.trust}
              </a>
              <a
                href="#data-sovereignty"
                className="hover:text-[#131b2e] transition-colors"
              >
                {copy.footer.impressum}
              </a>
              <a
                href="#data-sovereignty"
                className="hover:text-[#131b2e] transition-colors"
              >
                {copy.footer.privacy}
              </a>
              <button
                type="button"
                onClick={() => navigateToZone('admin')}
                className="hover:text-[#131b2e] font-mono transition-colors"
              >
                admin.mindmittel.de
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-mono text-[#434655]">
            {copy.footer.copyright}
          </div>
        </div>
      </footer>
    </div>
  );
}
