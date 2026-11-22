import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt =
  'MindMittel — KI-Entscheidungs- & Compliance-Berater für den deutschen Mittelstand';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background:
            'linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #064e3b 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top Brand Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '26px',
                fontWeight: 800,
                color: '#ffffff',
              }}
            >
              M
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em' }}>
              MindMittel
            </div>
          </div>

          <div
            style={{
              padding: '10px 20px',
              borderRadius: '999px',
              background: 'rgba(16, 185, 129, 0.18)',
              border: '1px solid rgba(52, 211, 153, 0.4)',
              color: '#6ee7b7',
              fontSize: '18px',
              fontWeight: 700,
            }}
          >
            Made for German Mittelstand
          </div>
        </div>

        {/* Center Value Proposition */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              fontSize: '52px',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.025em',
              maxWidth: '980px',
            }}
          >
            Prüfen Sie Management-Entscheidungen gegen Ihr Unternehmenswissen.
          </div>
          <div
            style={{
              fontSize: '24px',
              color: '#cbd5e1',
              lineHeight: 1.45,
              maxWidth: '920px',
            }}
          >
            Interne Richtlinien · BetrVG §87 · DSGVO · EU AI Act · NIS-2 — mit eigener Datenbank pro Firma und ohne KI-Training mit Ihren Daten.
          </div>
        </div>

        {/* Bottom Trust Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(148, 163, 184, 0.25)',
            paddingTop: '24px',
            fontSize: '20px',
            color: '#94a3b8',
          }}
        >
          <div style={{ color: '#e2e8f0', fontWeight: 700 }}>mindmittel.de</div>
          <div>Live-Demo: demo.mindmittel.de</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
