import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://mindmittel.de'),
  title: {
    default:
      'MindMittel — KI-Entscheidungs- & Compliance-Berater für den Mittelstand',
    template: '%s | MindMittel',
  },
  description:
    'Prüfen Sie Management-Entscheidungen vorab gegen interne Richtlinien sowie BetrVG §87, DSGVO, EU AI Act und NIS-2. Isolierte Datenbank pro Firma, kein KI-Training mit Ihren Daten.',
  keywords: [
    'MindMittel',
    'KI Governance Mittelstand',
    'Compliance Prüfung Management',
    'BetrVG §87 Betriebsrat Check',
    'DSGVO EU AI Act NIS-2',
    'Company Brain',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    alternateLocale: ['en_US'],
    url: 'https://mindmittel.de',
    siteName: 'MindMittel',
    title:
      'MindMittel — KI-Entscheidungs- & Compliance-Berater für den Mittelstand',
    description:
      'Prüfen Sie Management-Entscheidungen gegen Ihr Unternehmenswissen sowie BetrVG §87, DSGVO, EU AI Act und NIS-2 – mit eigener Datenbank pro Firma und ohne KI-Training.',
  },
  twitter: {
    card: 'summary_large_image',
    title:
      'MindMittel — KI-Entscheidungs- & Compliance-Berater für den Mittelstand',
    description:
      'Interne Richtlinien, BetrVG §87, DSGVO, EU AI Act & NIS-2 vorab prüfen – isolierte Datenbank pro Firma, kein KI-Training.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen font-sans antialiased text-slate-900 bg-slate-50">
        {children}
      </body>
    </html>
  );
}
