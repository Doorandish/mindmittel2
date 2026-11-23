import {
  computeCosineSimilarity,
  generateDeterministicSemanticEmbedding,
} from '@/core/rag/vectorMath';

export type LegalCorpusFramework = 'BETRVG' | 'DSGVO' | 'EU_AI_ACT' | 'NIS2';
export type LegalArticleSeverity =
  | 'PROHIBITED'
  | 'MANDATORY_GATE'
  | 'COMPLIANCE_DUTY';

export interface GermanStatutoryArticle {
  id: string;
  framework: LegalCorpusFramework;
  citation: string;
  titleDe: string;
  titleEn: string;
  legalTextSummaryDe: string;
  requiredArtifactDe: string;
  requiredArtifactEn: string;
  sanctionRiskDe: string;
  sanctionRiskEn: string;
  severity: LegalArticleSeverity;
  signalPatterns: readonly RegExp[];
  semanticKeywords: string;
}

export interface RetrievedGermanLegalArticle {
  id: string;
  framework: LegalCorpusFramework;
  citation: string;
  titleDe: string;
  titleEn: string;
  legalTextSummaryDe: string;
  requiredArtifactDe: string;
  requiredArtifactEn: string;
  sanctionRiskDe: string;
  sanctionRiskEn: string;
  severity: LegalArticleSeverity;
  relevanceScore: number;
}

/**
 * Curated German & EU Statutory Legal Corpus (Legal RAG Knowledge Base).
 * Covers the 20 highest-impact statutory provisions & BAG court principles encountered
 * by German Mittelstand executives across BetrVG, DSGVO/BDSG, EU AI Act, and NIS-2/BSIG.
 */
export const GERMAN_LEGAL_CORPUS: readonly GermanStatutoryArticle[] = [
  // ==================== BetrVG (Betriebsverfassungsgesetz) ====================
  {
    id: 'betrvg-87-1-6',
    framework: 'BETRVG',
    citation: 'BetrVG §87 Abs. 1 Nr. 6 (i.V.m. BAG-Rechtsprechung)',
    titleDe: 'Einführung und Anwendung technischer Überwachungseinrichtungen',
    titleEn: 'Technical Devices Capable of Monitoring Employee Behavior or Performance',
    legalTextSummaryDe:
      'Der Betriebsrat hat zwingend mitzubestimmen bei der Einführung und Anwendung technischer Einrichtungen, die dazu bestimmt sind, das Verhalten oder die Leistung der Arbeitnehmer zu überwachen. Nach ständiger BAG-Rechtsprechung genügt bereits die objektive technische Eignung zur Überwachung (z. B. Protokollierung, Nutzungsstatistiken, KI-Logs, ERP/CRM-Tracking) – eine tatsächliche Überwachungsabsicht des Arbeitgebers ist nicht erforderlich.',
    requiredArtifactDe: 'Betriebsvereinbarung (IT-Rahmen-BV oder Einzel-BV vor Produktivstart)',
    requiredArtifactEn: 'Works Agreement (IT Framework or Tool-Specific Betriebsvereinbarung before go-live)',
    sanctionRiskDe:
      'Unterlassungsanspruch des Betriebsrats (§23 Abs. 3 BetrVG, Ordnungsgeld bis 10.000 € pro Verstoß) sowie Beweisverwertungsverbot für gewonnene Daten.',
    sanctionRiskEn:
      'Works council injunctive relief (court-ordered rollout freeze, fines up to €10,000 per breach) and inadmissibility of collected evidence.',
    severity: 'MANDATORY_GATE',
    signalPatterns: [
      /(\bmonitor|\btracking\b|surveillance|keystroke|screen activity|productivity|performance (tracking|monitoring|analytics)|überwach|ueberwach|leistungskontrolle|verhaltenskontrolle|leistungsüberwachung)/i,
      /(roll ?out|introduce|deploy|implement|einführ|einfuehr).{0,40}(software|tool|system|platform|app|ki|ai|sap|crm|slack|teams)\b/i,
    ],
    semanticKeywords:
      'betrvg 87 6 betriebsrat technische einrichtung überwachung mitbestimmung software tool rollout mitarbeiter tracking logging analytics',
  },
  {
    id: 'betrvg-87-1-2-3',
    framework: 'BETRVG',
    citation: 'BetrVG §87 Abs. 1 Nr. 2 & Nr. 3',
    titleDe: 'Arbeitszeit, Schichtmodelle, Rufbereitschaft und Überstunden',
    titleEn: 'Working Hours, Shift Schedules, On-Call Duty & Overtime',
    legalTextSummaryDe:
      'Beginn und Ende der täglichen Arbeitszeit einschließlich der Pausen, die Verteilung der Arbeitszeit auf die einzelnen Wochentage sowie die vorübergehende Verkürzung oder Verlängerung der betriebsüblichen Arbeitszeit (Überstunden, Kurzarbeit, Schichtwechsel) unterliegen der zwingenden Mitbestimmung des Betriebsrats.',
    requiredArtifactDe: 'Betriebsvereinbarung zur Arbeitszeit / Überstunden-Regelung',
    requiredArtifactEn: 'Works Agreement on Working Hours / Overtime Approval',
    sanctionRiskDe:
      'Unwirksamkeit einseitiger Arbeitszeit- oder Überstundenanordnungen; Arbeitnehmer müssen unwirksamen Anweisungen nicht folgen.',
    sanctionRiskEn:
      'Unilateral shift or overtime directives are legally void and unenforceable against employees.',
    severity: 'MANDATORY_GATE',
    signalPatterns: [
      /(working hours|work hours|\bshifts?\b|overtime|time tracking|time recording|core hours|on-call|arbeitszeit|schicht|überstunden|ueberstunden|zeiterfassung|rufbereitschaft|kurzarbeit)/i,
    ],
    semanticKeywords:
      'betrvg 87 2 3 arbeitszeit schicht überstunden kernarbeitszeit zeiterfassung rufbereitschaft betriebsrat',
  },
  {
    id: 'betrvg-87-1-14',
    framework: 'BETRVG',
    citation: 'BetrVG §87 Abs. 1 Nr. 14',
    titleDe: 'Ausgestaltung von mobiler Arbeit (Homeoffice / Remote Work)',
    titleEn: 'Design and Rules for Mobile / Remote Work',
    legalTextSummaryDe:
      'Während das „Ob“ mobiler Arbeit beim Arbeitgeber liegt, unterliegt das „Wie“ (zeitlicher Umfang, Erreichbarkeit, Rückkehrpflichten ins Büro, Sicherheits- und Arbeitsmittelvorgaben, Workation im Ausland) der zwingenden Mitbestimmung des Betriebsrats.',
    requiredArtifactDe: 'Betriebsvereinbarung zu Mobilem Arbeiten / Homeoffice',
    requiredArtifactEn: 'Works Agreement on Mobile & Hybrid Work',
    sanctionRiskDe:
      'Blockade einseitiger Return-to-Office- oder Homeoffice-Richtlinien durch Einigungsstellenverfahren und Unterlassungsverfügung.',
    sanctionRiskEn:
      'Unilateral Return-to-Office or remote work policies can be blocked via conciliation board (Einigungsstelle) or injunction.',
    severity: 'MANDATORY_GATE',
    signalPatterns: [
      /(remote work|home ?office|mobile work|hybrid work|work from home|office days|return to office|workation|mobiles arbeiten|mobile arbeit|telearbeit|büropflicht)/i,
    ],
    semanticKeywords:
      'betrvg 87 14 homeoffice remote work mobiles arbeiten hybrid return to office büropflicht betriebsrat',
  },
  {
    id: 'betrvg-87-1-1',
    framework: 'BETRVG',
    citation: 'BetrVG §87 Abs. 1 Nr. 1',
    titleDe: 'Ordnung des Betriebs und Verhalten der Arbeitnehmer',
    titleEn: 'Workplace Order and Employee Conduct Rules',
    legalTextSummaryDe:
      'Verhaltensregeln, die das betriebliche Zusammenleben betreffen (z. B. Kleiderordnung, Ethik-/Compliance-Richtlinien, Whistleblowing-Verfahren, Rauch-/Alkoholverbot, private Internetnutzung), bedürfen der Zustimmung des Betriebsrats.',
    requiredArtifactDe: 'Betriebsvereinbarung zur Betriebsordnung / Verhaltenskodex',
    requiredArtifactEn: 'Works Agreement on Code of Conduct / Workplace Rules',
    sanctionRiskDe:
      'Einseitig erlassene Verhaltensrichtlinien sind unwirksam und können keine arbeitsrechtlichen Abmahnungen stützen.',
    sanctionRiskEn:
      'Unilaterally issued conduct rules are void and cannot justify formal employee warnings (Abmahnung).',
    severity: 'MANDATORY_GATE',
    signalPatterns: [
      /(dress code|code of conduct|conduct rules|smoking ban|whistleblow|kleiderordnung|verhaltensregeln|betriebsordnung|ethikrichtlinie)/i,
    ],
    semanticKeywords:
      'betrvg 87 1 betriebsordnung verhaltensregeln code of conduct kleiderordnung compliance richtlinie',
  },
  {
    id: 'betrvg-99',
    framework: 'BETRVG',
    citation: 'BetrVG §99 Abs. 1',
    titleDe: 'Mitbestimmung bei personellen Einzelmaßnahmen (Einstellung & Versetzung)',
    titleEn: 'Works Council Consent for Hiring, Transfers & Reclassifications (>20 Employees)',
    legalTextSummaryDe:
      'In Unternehmen mit in der Regel mehr als 20 wahlberechtigten Arbeitnehmern muss der Arbeitgeber vor jeder Einstellung, Eingruppierung, Umgruppierung oder Versetzung die Zustimmung des Betriebsrats einholen und die vollständigen Bewerbungsunterlagen vorlegen.',
    requiredArtifactDe: 'Formelle Anhörung & Zustimmungsantrag nach §99 BetrVG (1-Wochen-Frist)',
    requiredArtifactEn: 'Formal §99 BetrVG Consultation Notice (1-Week Statutory Window)',
    sanctionRiskDe:
      'Zustimmungsverweigerung des Betriebsrats und gerichtliches Aufhebungsverfahren nach §101 BetrVG (Zwangsgeld bis 250 €/Tag).',
    sanctionRiskEn:
      'Works council veto and court order to rescind the transfer/hire (§101 BetrVG, daily penalty up to €250).',
    severity: 'MANDATORY_GATE',
    signalPatterns: [
      /(versetzung|umgruppierung|eingruppierung|transfer employee|relocate staff|reclassif)/i,
    ],
    semanticKeywords:
      'betrvg 99 einstellung versetzung umgruppierung personalmaßnahme betriebsrat zustimmung',
  },
  {
    id: 'betrvg-111-112',
    framework: 'BETRVG',
    citation: 'BetrVG §111 & §112',
    titleDe: 'Betriebsänderung, Interessenausgleich und Sozialplan',
    titleEn: 'Operational Change, Balance of Interests & Social Plan',
    legalTextSummaryDe:
      'Bei geplanten Betriebsänderungen (Personalabbau/Entlassungen, Standortschließung, Verlagerung, tiefgreifende Umstrukturierung oder Outsourcing ganzer Abteilungen) in Unternehmen mit mehr als 20 Arbeitnehmern ist der Betriebsrat rechtzeitig und umfassend zu unterrichten; über Interessenausgleich und Sozialplan ist zu verhandeln.',
    requiredArtifactDe: 'Interessenausgleich & Sozialplan nach §§111–112 BetrVG',
    requiredArtifactEn: 'Balance of Interests (Interessenausgleich) & Social Plan (Sozialplan)',
    sanctionRiskDe:
      'Nachteilsausgleichsansprüche der betroffenen Arbeitnehmer (§113 BetrVG — Abfindungen bis 12–18 Monatsgehälter) und erhebliche Verzögerungen.',
    sanctionRiskEn:
      'Statutory severance compensation claims (§113 BetrVG, up to 12–18 monthly salaries) and severe rollout delays.',
    severity: 'MANDATORY_GATE',
    signalPatterns: [
      /(\blayoffs?\b|redundanc|restructur|relocat|plant closure|site closure|mass dismissal|downsiz|betriebsänderung|betriebsaenderung|entlassung|standortschließung|umstrukturierung|stellenabbau|sozialplan)/i,
    ],
    semanticKeywords:
      'betrvg 111 112 betriebsänderung umstrukturierung stellenabbau entlassung standortschließung sozialplan interessenausgleich',
  },

  // ==================== DSGVO & BDSG ====================
  {
    id: 'dsgvo-art-6-bdsg-26',
    framework: 'DSGVO',
    citation: 'DSGVO Art. 6 Abs. 1 & BDSG §26',
    titleDe: 'Rechtmäßigkeit der Verarbeitung & Beschäftigtendatenschutz',
    titleEn: 'Lawful Basis for Processing & German Employee Data Protection',
    legalTextSummaryDe:
      'Jede Verarbeitung personenbezogener Daten benötigt eine dokumentierte Rechtsgrundlage (Art. 6 Abs. 1 DSGVO). Für Mitarbeiterdaten gilt ergänzend §26 BDSG: Daten dürfen nur verarbeitet werden, soweit dies für die Begründung, Durchführung oder Beendigung des Beschäftigungsverhältnisses erforderlich ist; Einwilligungen im Arbeitsverhältnis sind wegen des Über-/Unterordnungsverhältnisses streng zu prüfen.',
    requiredArtifactDe: 'Eintrag im Verarbeitungsverzeichnis (VVT nach Art. 30 DSGVO) & Rechtsgrundlagenprüfung',
    requiredArtifactEn: 'Record of Processing Activities (RoPA / Art. 30 GDPR) & Lawful Basis Assessment',
    sanctionRiskDe:
      'Bußgelder bis 20 Mio. € oder 4 % des weltweiten Jahresumsatzes (Art. 83 Abs. 5 DSGVO) sowie Schadensersatz nach Art. 82 DSGVO.',
    sanctionRiskEn:
      'Administrative fines up to €20M or 4% of global annual turnover (Art. 83(5) GDPR) plus Art. 82 damages claims.',
    severity: 'COMPLIANCE_DUTY',
    signalPatterns: [
      /(personal data|employee data|customer data|\bpii\b|personenbezogen|mitarbeiterdaten|kundendaten|bewerber|beschäftigtendatenschutz)/i,
    ],
    semanticKeywords:
      'dsgvo art 6 bdsg 26 personenbezogene daten mitarbeiterdaten kundendaten rechtsgrundlage verarbeitungsverzeichnis datenschutz',
  },
  {
    id: 'dsgvo-art-9',
    framework: 'DSGVO',
    citation: 'DSGVO Art. 9 Abs. 1 & Abs. 2',
    titleDe: 'Verarbeitung besonderer Kategorien personenbezogener Daten',
    titleEn: 'Special Categories of Personal Data (Health & Biometrics)',
    legalTextSummaryDe:
      'Die Verarbeitung von Gesundheitsdaten, biometrischen Daten zur eindeutigen Identifizierung (z. B. Fingerabdruck, Gesichtserkennung), Gewerkschaftszugehörigkeit oder ethnischen Merkmalen ist grundsätzlich untersagt, sofern kein ausdrücklicher Ausnahmetatbestand nach Art. 9 Abs. 2 greift.',
    requiredArtifactDe: 'Spezifische Art.-9-Rechtsgrundlage, Schutzkonzept & Einbindung Datenschutzbeauftragter',
    requiredArtifactEn: 'Art. 9 Legal Exception Memo, Technical Safeguards & DPO Sign-Off',
    sanctionRiskDe:
      'Höchste Bußgeldkategorie bis 20 Mio. € oder 4 % des weltweiten Jahresumsatzes (Art. 83 Abs. 5 lit. a DSGVO).',
    sanctionRiskEn:
      'Highest GDPR fine tier up to €20M or 4% of global annual turnover (Art. 83(5)(a)).',
    severity: 'MANDATORY_GATE',
    signalPatterns: [
      /(health data|biometric|fingerprint|facial recognition|medical|sick leave|gesundheitsdaten|biometri|gesichtserkennung|fingerabdruck|krankheitsdaten)/i,
    ],
    semanticKeywords:
      'dsgvo art 9 gesundheitsdaten biometrische daten gesichtserkennung fingerabdruck besondere kategorien',
  },
  {
    id: 'dsgvo-art-22',
    framework: 'DSGVO',
    citation: 'DSGVO Art. 22 Abs. 1–3',
    titleDe: 'Automatisierte Entscheidungen im Einzelfall einschließlich Profiling',
    titleEn: 'Automated Individual Decision-Making Including Profiling',
    legalTextSummaryDe:
      'Betroffene Personen haben das Recht, nicht einer ausschließlich auf einer automatisierten Verarbeitung (einschließlich KI-Scoring oder Profiling) beruhenden Entscheidung unterworfen zu werden, die rechtliche Wirkung entfaltet oder sie erheblich beeinträchtigt (z. B. automatische Bewerberablehnung, Kündigung oder Kreditverweigerung). Menschliche Letztentscheidung (Human-in-the-Loop) ist erforderlich.',
    requiredArtifactDe: 'Human-in-the-Loop-Prozessdokumentation & Transparenzhinweis nach Art. 13 Abs. 2 lit. f',
    requiredArtifactEn: 'Human-in-the-Loop Review Procedure & Art. 13(2)(f) Logic Disclosure',
    sanctionRiskDe:
      'Bußgelder bis 20 Mio. € oder 4 % des weltweiten Jahresumsatzes sowie Unwirksamkeit der automatisierten Entscheidung.',
    sanctionRiskEn:
      'Fines up to €20M or 4% of global turnover and invalidation of automated decisions.',
    severity: 'MANDATORY_GATE',
    signalPatterns: [
      /(automated decision|auto[- ]?reject|scoring|profiling|automatisierte entscheidung|automatisch ablehnen|bewerber[- ]?ranking)/i,
    ],
    semanticKeywords:
      'dsgvo art 22 automatisierte entscheidung profiling scoring ki bewerber human in the loop',
  },
  {
    id: 'dsgvo-art-28',
    framework: 'DSGVO',
    citation: 'DSGVO Art. 28 Abs. 3',
    titleDe: 'Auftragsverarbeitungsvertrag (AVV / DPA) bei externen Dienstleistern',
    titleEn: 'Mandatory Data Processing Agreement (AVV / DPA) for Vendors',
    legalTextSummaryDe:
      'Werden personenbezogene Daten durch externe SaaS-, Cloud- oder KI-Dienstleister im Auftrag verarbeitet, ist vor Beginn der Datenverarbeitung zwingend ein schriftlicher bzw. elektronischer Auftragsverarbeitungsvertrag (AVV) inklusive technischer und organisatorischer Maßnahmen (TOMs) und Unterauftragsverarbeiter-Liste abzuschließen.',
    requiredArtifactDe: 'Unterzeichneter Auftragsverarbeitungsvertrag (AVV / DPA) inkl. TOMs',
    requiredArtifactEn: 'Signed Data Processing Agreement (DPA / AVV) including TOMs',
    sanctionRiskDe:
      'Bußgelder bis 10 Mio. € oder 2 % des weltweiten Jahresumsatzes (Art. 83 Abs. 4 lit. a DSGVO) und behördliche Untersagung.',
    sanctionRiskEn:
      'Fines up to €10M or 2% of global annual turnover (Art. 83(4)(a) GDPR) and regulatory suspension.',
    severity: 'MANDATORY_GATE',
    signalPatterns: [
      /(avv|\bdpa\b|vendor|third[- ]party|external provider|saas|cloud|dienstleister|auftragsverarbeitung|drittanbieter)/i,
    ],
    semanticKeywords:
      'dsgvo art 28 avv dpa auftragsverarbeitungsvertrag saas cloud vendor dienstleister toms',
  },
  {
    id: 'dsgvo-art-35',
    framework: 'DSGVO',
    citation: 'DSGVO Art. 35 Abs. 1 & Abs. 3',
    titleDe: 'Datenschutz-Folgenabschätzung (DSFA / DPIA)',
    titleEn: 'Data Protection Impact Assessment (DPIA / DSFA)',
    legalTextSummaryDe:
      'Hat eine Verarbeitung – insbesondere bei Verwendung neuer Technologien (wie KI-Systemen), systematischer Überwachung oder umfangreichem Profiling – voraussichtlich ein hohes Risiko für Rechte und Freiheiten natürlicher Personen, ist vorab zwingend eine Datenschutz-Folgenabschätzung (DSFA) unter Einbindung des Datenschutzbeauftragten durchzuführen.',
    requiredArtifactDe: 'Abgeschlossene Datenschutz-Folgenabschätzung (DSFA / DPIA) mit DSB-Stellungnahme',
    requiredArtifactEn: 'Completed Data Protection Impact Assessment (DPIA / DSFA) with DPO Review',
    sanctionRiskDe:
      'Bußgelder bis 10 Mio. € oder 2 % des weltweiten Jahresumsatzes (Art. 83 Abs. 4 DSGVO) und Untersagung des Produktivbetriebs.',
    sanctionRiskEn:
      'Fines up to €10M or 2% of global turnover and prohibition of system operation.',
    severity: 'MANDATORY_GATE',
    signalPatterns: [
      /(\bdpia\b|\bdsfa\b|systematic monitoring|profiling|surveillance|ai on (employee|customer)|überwach|folgenabschätzung)/i,
    ],
    semanticKeywords:
      'dsgvo art 35 dsfa dpia datenschutz folgenabschätzung hohes risiko ki überwachung datenschutzbeauftragter',
  },
  {
    id: 'dsgvo-art-44-49',
    framework: 'DSGVO',
    citation: 'DSGVO Art. 44–49 (Drittlandtransfer)',
    titleDe: 'Übermittlung personenbezogener Daten in Drittländer (z. B. USA)',
    titleEn: 'International Data Transfers Outside the EU/EEA (e.g., US Cloud)',
    legalTextSummaryDe:
      'Jede Übermittlung oder Zugriffsmöglichkeit auf personenbezogene Daten aus Ländern außerhalb der EU/des EWR (z. B. US-Cloud-Anbieter) erfordert ein gültiges Angemessenheitsbeschluss-Zertifikat (z. B. EU-US Data Privacy Framework) oder EU-Standardvertragsklauseln (SCCs) inklusive Transfer Impact Assessment (TIA) und ergänzender Schutzmaßnahmen.',
    requiredArtifactDe: 'EU-US DPF-Prüfung oder EU-Standardvertragsklauseln (SCCs) + Transfer Impact Assessment (TIA)',
    requiredArtifactEn: 'EU-US DPF Verification or EU Standard Contractual Clauses (SCCs) + Transfer Impact Assessment (TIA)',
    sanctionRiskDe:
      'Höchste Bußgeldkategorie bis 20 Mio. € oder 4 % des weltweiten Jahresumsatzes (Art. 83 Abs. 5 lit. c DSGVO).',
    sanctionRiskEn:
      'Highest GDPR fine tier up to €20M or 4% of global annual turnover (Art. 83(5)(c)).',
    severity: 'MANDATORY_GATE',
    signalPatterns: [
      /(\bus\b servers|\bus[- ]?cloud|outside the eu|non-eu|third country|drittland|usa|amerikanisch|transfer.*data|daten.*usa)/i,
    ],
    semanticKeywords:
      'dsgvo art 44 46 drittlandtransfer usa cloud scc standardvertragsklauseln tia data privacy framework eu',
  },

  // ==================== EU AI Act (VO (EU) 2024/1689) ====================
  {
    id: 'eu-ai-act-art-5',
    framework: 'EU_AI_ACT',
    citation: 'EU AI Act Art. 5 Abs. 1 (VO (EU) 2024/1689)',
    titleDe: 'Verbotene KI-Praktiken (u. a. Emotionserkennung am Arbeitsplatz)',
    titleEn: 'Prohibited AI Practices (Including Workplace Emotion Recognition)',
    legalTextSummaryDe:
      'Seit dem 2. Februar 2025 sind bestimmte KI-Praktiken in der EU absolut verboten – insbesondere KI-Systeme zur Ableitung von Emotionen natürlicher Personen am Arbeitsplatz (Art. 5 Abs. 1 lit. f, z. B. Stimmungsanalyse in Verkaufsgesprächen oder Kamera-Emotionsanalyse), Social Scoring sowie ungezieltes Auslesen von Gesichtsbildern.',
    requiredArtifactDe: 'Sofortiger Projektstopp bzw. vollständige Entfernung der verbotenen KI-Funktion',
    requiredArtifactEn: 'Immediate Stop-Work / Removal of Prohibited AI Capability',
    sanctionRiskDe:
      'Höchster Bußgeldrahmen des EU AI Act: bis zu 35 Mio. € oder 7 % des weltweiten Jahresumsatzes (Art. 99 Abs. 3 EU AI Act).',
    sanctionRiskEn:
      'Maximum EU AI Act penalty: up to €35M or 7% of global annual turnover (Art. 99(3)).',
    severity: 'PROHIBITED',
    signalPatterns: [
      /(emotion recognition|emotion analysis|sentiment.*employee|mood tracking|social scoring|emotionserkennung|stimmungsanalyse|stimmungserkennung|gefühlsanalyse|sozialkredit)/i,
    ],
    semanticKeywords:
      'eu ai act art 5 verbotene ki emotionserkennung stimmungsanalyse arbeitsplatz social scoring 35 mio',
  },
  {
    id: 'eu-ai-act-annex-3-art-26',
    framework: 'EU_AI_ACT',
    citation: 'EU AI Act Art. 26 & Anhang III Nr. 4',
    titleDe: 'Hochrisiko-KI im Beschäftigungskontext (Recruiting, Bewertung, Kündigung)',
    titleEn: 'High-Risk AI in Employment (Recruiting, Evaluation, Promotion & Termination)',
    legalTextSummaryDe:
      'KI-Systeme für die Einstellung/Auswahl von Bewerbern (CV-Screening, Ranking), Beförderungen, Kündigungen, Aufgabenverteilung oder Leistungs- und Verhaltensbewertung von Beschäftigten gelten als Hochrisiko-KI (Anhang III Nr. 4). Betreiber (Deployer) müssen nach Art. 26 u. a. menschliche Aufsicht sicherstellen, Protokolle mindestens 6 Monate aufbewahren und vorab den Betriebsrat bzw. die Beschäftigten informieren (Art. 26 Abs. 7).',
    requiredArtifactDe: 'Betreiber-Risikobewertung (Art. 26), Human-Oversight-Konzept, 6-Monats-Logging & Mitarbeiterinformation',
    requiredArtifactEn: 'Deployer Risk Assessment (Art. 26), Human Oversight Protocol, 6-Month Logs & Staff Notice',
    sanctionRiskDe:
      'Bußgelder bis zu 15 Mio. € oder 3 % des weltweiten Jahresumsatzes (Art. 99 Abs. 4 EU AI Act).',
    sanctionRiskEn:
      'Fines up to €15M or 3% of global annual turnover (Art. 99(4) EU AI Act).',
    severity: 'MANDATORY_GATE',
    signalPatterns: [
      /(recruit|hiring|\bhire\b|applicant|candidate|cv screening|promotion|terminat|dismiss|performance evaluation|employee evaluation|bewerb|einstellung|beförderung|kündigung|leistungsbeurteilung)/i,
    ],
    semanticKeywords:
      'eu ai act art 26 anhang iii hochrisiko ki recruiting bewerber auswahl leistungsbeurteilung kündigung menschliche aufsicht',
  },
  {
    id: 'eu-ai-act-art-4',
    framework: 'EU_AI_ACT',
    citation: 'EU AI Act Art. 4 (seit 02.02.2025 geltend)',
    titleDe: 'Verpflichtende KI-Kompetenz (AI Literacy) für Mitarbeitende',
    titleEn: 'Mandatory AI Literacy Obligation for Staff (In Force Since Feb 2025)',
    legalTextSummaryDe:
      'Alle Unternehmen, die KI-Systeme einsetzen (Betreiber), müssen bereits seit dem 2. Februar 2025 sicherstellen, dass ihre Beschäftigten und Beauftragten über ein ausreichendes Maß an KI-Kompetenz verfügen – abgestimmt auf ihre Vorkenntnisse, den Einsatzkontext und die Risiken des jeweiligen KI-Systems.',
    requiredArtifactDe: 'Dokumentiertes KI-Schulungs- und Richtlinienprogramm (KI-Kompetenznachweis)',
    requiredArtifactEn: 'Documented Staff AI Literacy Training & Usage Guideline',
    sanctionRiskDe:
      'Erhöhtes Haftungs- und Organisationsverschulden bei KI-Fehlern sowie aufsichtsrechtliche Maßnahmen.',
    sanctionRiskEn:
      'Elevated organizational liability for AI incidents and supervisory enforcement risk.',
    severity: 'COMPLIANCE_DUTY',
    signalPatterns: [
      /(\bai\b|artificial intelligence|\bllm\b|chatgpt|copilot|gemini|generative|\bki\b|künstliche intelligenz|sprachmodell)/i,
    ],
    semanticKeywords:
      'eu ai act art 4 ki kompetenz ai literacy schulung mitarbeiter ki nutzung richtlinie',
  },
  {
    id: 'eu-ai-act-art-50',
    framework: 'EU_AI_ACT',
    citation: 'EU AI Act Art. 50',
    titleDe: 'Transparenzpflichten für Chatbots und KI-generierte Inhalte',
    titleEn: 'Transparency Obligations for Chatbots & Synthetic Content',
    legalTextSummaryDe:
      'Natürliche Personen müssen klar und unmissverständlich darüber informiert werden, wenn sie mit einem KI-System (z. B. Kundenservice-Chatbot, Voicebot) interagieren oder wenn synthetische Audio-, Bild-, Video- oder Textinhalte (Deepfakes, automatisierte Berichte) durch KI erzeugt wurden.',
    requiredArtifactDe: 'Klarer KI-Transparenzhinweis im Interface & Kennzeichnung generierter Inhalte',
    requiredArtifactEn: 'Explicit UI AI Disclosure Notice & Machine-Readable Content Labeling',
    sanctionRiskDe:
      'Bußgelder bis zu 15 Mio. € oder 3 % des weltweiten Jahresumsatzes (Art. 99 Abs. 4 EU AI Act).',
    sanctionRiskEn:
      'Fines up to €15M or 3% of global annual turnover (Art. 99(4) EU AI Act).',
    severity: 'COMPLIANCE_DUTY',
    signalPatterns: [
      /(chatbot|voicebot|customer[- ]facing|generated content|deepfake|synthetic|virtual assistant|kundenservice|generierte inhalte)/i,
    ],
    semanticKeywords:
      'eu ai act art 50 transparenz chatbot kundenservice deepfake generierte inhalte kennzeichnung',
  },

  // ==================== NIS-2 & BSIG (NIS2UmsuCG) ====================
  {
    id: 'nis2-art-20-bsig-38',
    framework: 'NIS2',
    citation: 'NIS-2 Art. 20 & §38 BSIG (NIS2UmsuCG)',
    titleDe: 'Persönliche Haftung und Schulungspflicht der Geschäftsleitung',
    titleEn: 'Personal Management Body Liability & Mandatory Cybersecurity Training',
    legalTextSummaryDe:
      'Geschäftsleitungen besonders wichtiger und wichtiger Einrichtungen müssen Risikomanagementmaßnahmen billigen, deren Umsetzung überwachen und regelmäßig an Cybersicherheitsschulungen teilnehmen. Bei schuldhafter Pflichtverletzung haften Geschäftsführer gegenüber dem Unternehmen persönlich (§38 Abs. 2 BSIG) – ein Verzicht oder eine Delegation dieser Kernpflicht ist unzulässig.',
    requiredArtifactDe: 'Vorstands-/GF-Freigabeprotokoll für Sicherheitsentscheidungen & CISO-Risikobewertung',
    requiredArtifactEn: 'Executive Risk Sign-Off Record & CISO Security Assessment',
    sanctionRiskDe:
      'Persönliche Innenhaftung der Geschäftsführung (§38 BSIG) sowie Bußgelder bis 10 Mio. € bzw. 2 % Weltjahresumsatz (Art. 34 NIS-2).',
    sanctionRiskEn:
      'Personal liability of managing directors (§38 BSIG) plus fines up to €10M or 2% of global turnover.',
    severity: 'MANDATORY_GATE',
    signalPatterns: [
      /((disable|deactivat|remove|skip|bypass|turn off|waive|without).{0,30}(mfa|2fa|multi-factor|security review|patch|firewall|encryption|vpn|penetration test|access control|backup))|(admin (rights|access) (for|to) (all|external|vendor))|(deaktivier|umgeh|ohne).{0,30}(mfa|sicherheitsprüfung|firewall|verschlüsselung)/i,
    ],
    semanticKeywords:
      'nis2 art 20 bsig 38 geschäftsführer haftung cybersicherheit mfa firewall verschlüsselung sicherheitsprüfung ciso',
  },
  {
    id: 'nis2-art-21-bsig-30',
    framework: 'NIS2',
    citation: 'NIS-2 Art. 21 Abs. 2 & §30 BSIG',
    titleDe: 'Verpflichtende Cybersicherheits-Risikomanagementmaßnahmen',
    titleEn: 'Mandatory Cybersecurity Risk-Management Measures (MFA, Encryption, Patching)',
    legalTextSummaryDe:
      'Betroffene Einrichtungen müssen dem Stand der Technik entsprechende technische und organisatorische Maßnahmen umsetzen – darunter Multi-Faktor-Authentifizierung (MFA), Verschlüsselung, Schwachstellen-/Patch-Management, Backup-Konzepte und strenge Zugriffskontrollen. Eine Abschwächung bestehender Sicherheitskontrollen widerspricht direkt §30 BSIG.',
    requiredArtifactDe: 'CISO-Freigabe, dokumentiertes Ausnahmerisiko & kompensierende Sicherheitskontrollen',
    requiredArtifactEn: 'CISO Security Sign-Off, Documented Risk Exception & Compensating Controls',
    sanctionRiskDe:
      'Bußgelder bis 10 Mio. € oder 2 % des weltweiten Jahresumsatzes (besonders wichtige Einrichtungen) bzw. 7 Mio. € / 1,4 % (wichtige Einrichtungen).',
    sanctionRiskEn:
      'Fines up to €10M / 2% global turnover (essential entities) or €7M / 1.4% (important entities).',
    severity: 'MANDATORY_GATE',
    signalPatterns: [
      /(mfa|2fa|multi-factor|encryption|firewall|backup|zero[- ]trust|vpn|patch|penetration test|verschlüsselung|zugriffskontrolle)/i,
    ],
    semanticKeywords:
      'nis2 art 21 bsig 30 risikomanagement mfa verschlüsselung backup firewall zugriffskontrolle sicherheit',
  },
  {
    id: 'nis2-art-21-2-d',
    framework: 'NIS2',
    citation: 'NIS-2 Art. 21 Abs. 2 lit. d (Lieferkettensicherheit)',
    titleDe: 'Sicherheit der Lieferkette & ICT-Dienstleister',
    titleEn: 'Supply Chain & ICT Vendor Security Governance',
    legalTextSummaryDe:
      'Unternehmen im NIS-2-Anwendungsbereich müssen Cybersicherheitsrisiken in ihrer gesamten Lieferkette und bei direkten IT-/Cloud-/Managed-Service-Anbietern bewerten, vertraglich absichern (Sicherheits-SLAs, ISO 27001 / BSI C5) und regelmäßig überprüfen.',
    requiredArtifactDe: 'Lieferanten-Sicherheitsprüfung (ISO 27001 / BSI C5) & Sicherheits-SLA im Vertrag',
    requiredArtifactEn: 'Vendor Security Assessment (ISO 27001 / BSI C5) & Contractual Security SLA',
    sanctionRiskDe:
      'Aufsichtsrechtliche Anordnungen des BSI und Bußgelder bei ungesicherten Drittanbieter-Schnittstellen.',
    sanctionRiskEn:
      'BSI supervisory orders and fines for unvetted third-party ICT supply-chain exposure.',
    severity: 'COMPLIANCE_DUTY',
    signalPatterns: [
      /(vendor|supplier|outsourc|\bsaas\b|cloud|data cent|infrastructure|managed service|it service provider|lieferant|dienstleister|rechenzentrum)/i,
    ],
    semanticKeywords:
      'nis2 lieferkette supply chain ict dienstleister saas cloud iso 27001 bsi c5 sicherheitsprüfung',
  },
  {
    id: 'nis2-art-23-bsig-32',
    framework: 'NIS2',
    citation: 'NIS-2 Art. 23 & §32 BSIG',
    titleDe: 'Mehrstufige BSI-Meldepflicht (24h Frühwarnung / 72h Meldung)',
    titleEn: 'Mandatory Multi-Stage BSI Incident Reporting (24h Early Warning / 72h Report)',
    legalTextSummaryDe:
      'Erhebliche Sicherheitsvorfälle müssen innerhalb von 24 Stunden als Frühwarnung und innerhalb von 72 Stunden als formelle Vorfallmeldung an das Bundesamt für Sicherheit in der Informationstechnik (BSI) gemeldet werden; ein Abschlussbericht folgt binnen eines Monats.',
    requiredArtifactDe: 'Incident-Response-Plan mit 24h/72h BSI-Meldekette & Lieferanten-Meldepflicht',
    requiredArtifactEn: 'Incident Response Plan with 24h/72h BSI Notification Workflow',
    sanctionRiskDe:
      'Bußgelder und behördliche Nachprüfungen durch das BSI bei verspäteter oder unterlassener Meldung.',
    sanctionRiskEn:
      'BSI fines and mandatory security audits for delayed or omitted incident notifications.',
    severity: 'COMPLIANCE_DUTY',
    signalPatterns: [
      /(incident|data breach|ransomware|cyber[- ]?attack|outage|security breach|sicherheitsvorfall|datenpanne|meldepflicht|bsi)/i,
    ],
    semanticKeywords:
      'nis2 art 23 bsig 32 meldepflicht bsi 24 stunden 72 stunden sicherheitsvorfall incident response',
  },
];

// Precompute deterministic 768-d vectors once at module load for fast Legal RAG scoring
const CORPUS_VECTORS = new Map<string, number[]>(
  GERMAN_LEGAL_CORPUS.map((article) => [
    article.id,
    generateDeterministicSemanticEmbedding(
      `${article.framework} ${article.citation} ${article.titleDe} ${article.titleEn} ${article.semanticKeywords}`
    ),
  ])
);

/**
 * Retrieves the top matching German & EU statutory articles for a proposed management decision
 * using hybrid Regex Signal + 768-d Semantic Cosine Retrieval, strictly honoring Company Profile toggles.
 */
export function retrieveRelevantGermanLegalArticles(params: {
  decisionProposal: string;
  companyProfile?: { hasBetriebsrat?: boolean; nis2Applicable?: boolean };
  maxArticles?: number;
}): RetrievedGermanLegalArticle[] {
  const text = params.decisionProposal.trim();
  if (!text) return [];

  const hasBetriebsrat = params.companyProfile?.hasBetriebsrat ?? true;
  const nis2Applicable = params.companyProfile?.nis2Applicable ?? true;
  const maxArticles = params.maxArticles ?? 4;

  const queryVector = generateDeterministicSemanticEmbedding(text);

  const scored: RetrievedGermanLegalArticle[] = [];

  for (const article of GERMAN_LEGAL_CORPUS) {
    if (article.framework === 'BETRVG' && !hasBetriebsrat) continue;
    if (article.framework === 'NIS2' && !nis2Applicable) continue;

    let patternHits = 0;
    for (const pattern of article.signalPatterns) {
      if (pattern.test(text)) {
        patternHits += 1;
      }
    }

    const articleVec = CORPUS_VECTORS.get(article.id) ?? [];
    const semanticScore = computeCosineSimilarity(queryVector, articleVec);

    // Require either an explicit legal pattern match OR strong semantic similarity
    if (patternHits === 0 && semanticScore < 0.28) {
      continue;
    }

    const severityBonus =
      article.severity === 'PROHIBITED'
        ? 0.45
        : article.severity === 'MANDATORY_GATE'
          ? 0.1
          : 0;

    const combinedScore = Number(
      (patternHits * 0.65 + semanticScore + severityBonus).toFixed(4)
    );

    scored.push({
      id: article.id,
      framework: article.framework,
      citation: article.citation,
      titleDe: article.titleDe,
      titleEn: article.titleEn,
      legalTextSummaryDe: article.legalTextSummaryDe,
      requiredArtifactDe: article.requiredArtifactDe,
      requiredArtifactEn: article.requiredArtifactEn,
      sanctionRiskDe: article.sanctionRiskDe,
      sanctionRiskEn: article.sanctionRiskEn,
      severity: article.severity,
      relevanceScore: combinedScore,
    });
  }

  return scored
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxArticles);
}
