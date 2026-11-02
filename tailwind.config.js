/** @type {import('tailwindcss').Config} */

// Semantic tokens resolve to the CSS custom properties defined in src/index.css,
// so Tailwind utilities and hand-written CSS share one source of truth.
const token = (name) => `rgb(var(${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand — clinical teal, matches the <meta name="theme-color"> and the
        // teal-* utilities already used across the app.
        primary: {
          DEFAULT: token('--color-primary'),
          soft: token('--color-primary-soft'),
          strong: token('--color-primary-strong'),
          fg: token('--color-primary-fg'),
        },
        accent: {
          DEFAULT: token('--color-accent'),
          soft: token('--color-accent-soft'),
          fg: token('--color-accent-fg'),
        },
        surface: {
          DEFAULT: token('--color-surface'),
          sunken: token('--color-surface-sunken'),
          raised: token('--color-surface-raised'),
        },
        ink: {
          DEFAULT: token('--color-ink'),
          muted: token('--color-ink-muted'),
          subtle: token('--color-ink-subtle'),
        },
        hairline: token('--color-hairline'),

        // Clinical urgency scale — these carry medical meaning, so they are
        // named by intent rather than by hue.
        urgency: {
          low: token('--color-urgency-low'),
          medium: token('--color-urgency-medium'),
          high: token('--color-urgency-high'),
          critical: token('--color-urgency-critical'),
        },
      },

      fontFamily: {
        // Figtree carries Latin; Noto Sans covers the 12 Indic scripts the
        // language switcher offers and Inter remains as a local fallback.
        sans: [
          'Figtree',
          'Inter',
          'Noto Sans',
          'Noto Sans Devanagari',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif',
        ],
        numeric: ['Figtree', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        // Clinical data readouts need tighter tracking than body copy.
        'stat-sm': ['1.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'stat': ['2.25rem', { lineHeight: '1.05', letterSpacing: '-0.025em', fontWeight: '700' }],
        'stat-lg': ['3rem', { lineHeight: '1', letterSpacing: '-0.03em', fontWeight: '800' }],
      },

      boxShadow: {
        // `xs` and `2xs` are Tailwind v4 names that this v3 project already uses
        // in 35 places; without them those elements render completely flat.
        '2xs': '0 1px 0 0 rgb(15 23 42 / 0.04)',
        xs: '0 1px 2px 0 rgb(15 23 42 / 0.05)',

        // Soft, low-contrast elevation — avoids the heavy drop shadows that
        // read as consumer-app rather than clinical.
        card: '0 1px 2px -1px rgb(15 23 42 / 0.06), 0 4px 16px -4px rgb(15 23 42 / 0.08)',
        'card-hover': '0 2px 4px -2px rgb(15 23 42 / 0.08), 0 12px 28px -8px rgb(15 23 42 / 0.14)',
        focus: '0 0 0 3px rgb(var(--color-primary) / 0.35)',
      },

      scale: {
        // active:scale-98 is used on the primary CTAs; v3 stops at 95.
        98: '.98',
      },

      borderRadius: {
        card: '0.875rem',
      },

      transitionDuration: {
        DEFAULT: '200ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      keyframes: {
        wavePulse: {
          '0%': { height: '4px' },
          '50%': { height: '22px' },
          '100%': { height: '8px' },
        },
        slideIn: {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        riseIn: {
          from: { transform: 'translateY(8px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'slide-in': 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'rise-in': 'riseIn 0.35s cubic-bezier(0.4, 0, 0.2, 1) both',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
};
