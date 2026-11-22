import type { MetadataRoute } from 'next';
import {
  DEFAULT_ROOT_DOMAIN,
  resolveHostZone,
} from '@/core/tenancy/hostResolver';

/**
 * Computes host-aware robots.txt directives:
 * - On `mindmittel.de` / `www.mindmittel.de` (marketing zone): allows Google, Bing, and AI search bots
 *   (`OAI-SearchBot`, `PerplexityBot`, `ClaudeBot`, `Google-Extended`) while blocking internal admin/API paths.
 * - On `admin.mindmittel.de` and all customer tenant subdomains (`*.mindmittel.de`): strictly disallows all crawling
 *   so private customer workspaces and the control plane are never indexed.
 */
export function buildRobotsForHost(
  rawHost: string,
  rootDomain: string = DEFAULT_ROOT_DOMAIN
): MetadataRoute.Robots {
  const zone = resolveHostZone(rawHost, rootDomain);

  if (zone.zone !== 'marketing') {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

  return {
    rules: [
      {
        userAgent: [
          '*',
          'Googlebot',
          'Bingbot',
          'OAI-SearchBot',
          'PerplexityBot',
          'ClaudeBot',
          'Google-Extended',
        ],
        allow: '/',
        disallow: ['/api/', '/admin/', '/system/'],
      },
    ],
    sitemap: `https://${rootDomain}/sitemap.xml`,
    host: `https://${rootDomain}`,
  };
}

/**
 * Structured Schema.org JSON-LD graph (`Organization`, `SoftwareApplication`, `FAQPage`)
 * embedded on `mindmittel.de` for Google Rich Snippets and AI Search Engines (GEO).
 */
export const MARKETING_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://mindmittel.de/#organization',
      name: 'MindMittel',
      url: 'https://mindmittel.de',
      logo: 'https://mindmittel.de/images/mindmittel-logo.svg',
      description:
        'KI-gestützte Entscheidungs- & Compliance-Governance-Plattform für den deutschen Mittelstand.',
      areaServed: ['DE', 'AT', 'CH'],
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://mindmittel.de/#software',
      name: 'MindMittel',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: 'https://mindmittel.de',
      publisher: { '@id': 'https://mindmittel.de/#organization' },
      inLanguage: ['de', 'en'],
      description:
        'Prüft Management-Entscheidungen vor der Umsetzung gegen interne Unternehmensrichtlinien sowie BetrVG §87, DSGVO, EU AI Act und NIS-2 – mit strikter Mandantentrennung und ohne KI-Training mit Unternehmensdaten.',
      featureList: [
        'Company Brain für interne Richtlinien, PDFs, Präsentationen und Besprechungsnotizen',
        'Automatische Konflikterkennung zwischen widersprüchlichen Unternehmensrichtlinien',
        'Vorab-Prüfung auf BetrVG §87/§111 (Betriebsrat), DSGVO, EU AI Act und NIS-2',
        'Strikte Mandantentrennung mit eigener Datenbank pro Unternehmen und Zero AI Training',
        'Rollen- und abteilungsbasierte Zugriffskontrolle (RBAC) sowie A4-PDF-Vorstandsberichte',
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://mindmittel.de/#faq',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Was genau macht MindMittel für Unternehmen im deutschen Mittelstand?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'MindMittel bündelt verstreute Unternehmensrichtlinien, Vorstandsbeschlüsse und Protokolle in einem isolierten Company Brain und prüft neue Management-Entscheidungen vorab auf interne Regelkonflikte sowie gesetzliche Risiken nach BetrVG, DSGVO, EU AI Act und NIS-2.',
          },
        },
        {
          '@type': 'Question',
          name: 'Werden unsere Unternehmensdaten zum Training von KI-Modellen verwendet?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Nein. Unternehmensdaten werden niemals zum Training von KI-Modellen verwendet. Jedes Unternehmen erhält eine strikt isolierte Datenbank sowie auf Wunsch einen eigenen Enterprise-API-Schlüssel.',
          },
        },
        {
          '@type': 'Question',
          name: 'Wann warnt MindMittel vor einer Pflicht zur Einbindung des Betriebsrats (BetrVG §87)?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'MindMittel erkennt automatisch Vorhaben mit Bezug zu technischer Leistungs- oder Verhaltenskontrolle (§87 Abs. 1 Nr. 6), Arbeitszeiten und Überstunden (Nr. 2/3), mobilem Arbeiten (Nr. 14) sowie Betriebsänderungen (§111) und warnt die Geschäftsführung vor einer einseitigen Umsetzung.',
          },
        },
        {
          '@type': 'Question',
          name: 'Kann ich MindMittel unverbindlich testen?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ja. Eine offene Live-Demo mit realistischen Beispiel-Richtlinien ist jederzeit ohne Registrierung unter https://demo.mindmittel.de verfügbar.',
          },
        },
      ],
    },
  ],
} as const;
