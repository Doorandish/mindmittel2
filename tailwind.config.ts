import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        glass: {
          surface: 'rgba(255, 255, 255, 0.08)',
          surfaceHover: 'rgba(255, 255, 255, 0.13)',
          border: 'rgba(255, 255, 255, 0.18)',
          highlight: 'rgba(255, 255, 255, 0.32)',
        },
      },
      boxShadow: {
        'liquid-glass':
          '0 12px 40px -8px rgba(0, 0, 0, 0.45), inset 0 1px 0 0 rgba(255, 255, 255, 0.22)',
        'liquid-pill':
          '0 8px 24px -4px rgba(15, 23, 42, 0.55), inset 0 1px 0 0 rgba(255, 255, 255, 0.28)',
      },
      backdropBlur: {
        xs: '2px',
        '2xl': '40px',
        '3xl': '64px',
      },
    },
  },
  plugins: [],
};

export default config;
