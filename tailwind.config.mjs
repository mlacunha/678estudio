const token = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        canvas: token('canvas'),
        surface: {
          DEFAULT: token('surface'),
          muted: token('surface-muted'),
          raised: token('surface-raised'),
          hover: token('surface-hover'),
        },
        line: token('line'),
        control: token('control'),
        ink: {
          DEFAULT: token('ink'),
          secondary: token('ink-secondary'),
          muted: token('ink-muted'),
        },
        accent: {
          DEFAULT: token('accent'),
          strong: token('accent-strong'),
        },
        action: {
          DEFAULT: token('action'),
          hover: token('action-hover'),
        },
        'on-action': token('on-action'),
        'on-media': token('on-media'),
        'media-badge': token('media-badge'),
        scrim: token('scrim'),
        success: {
          DEFAULT: token('success'),
          surface: token('success-surface'),
          hover: token('success-hover'),
        },
        danger: token('danger'),
      },
    },
  },
  plugins: [],
};

