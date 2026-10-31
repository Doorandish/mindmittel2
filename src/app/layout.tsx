import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MindMittel V2 — AI Governance & Leadership Audit Engine',
  description:
    'Enterprise AI Governance & Leadership Audit Platform with Parent-Child Vector RAG, MongoDB Atlas Vector Search, and Dynamic Google Gemini Routing.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#050814',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
