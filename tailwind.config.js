/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#01A2AD', dark: '#007C85', light: '#EFFDFA' },
        navy: '#1B2A47',
        canvas: '#F9FBFC',
        'surface-hover': '#EFF1F5',
        ink: { primary: '#1B2A47', secondary: '#475569', muted: '#64748B' },
        line: '#DBE4EF',
        'line-strong': '#CBD5E1',
        success: { DEFAULT: '#01A2AD', light: '#D1F4EF' },
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      minHeight: {
        table: '18rem',
        'table-lg': '21rem',
      },
    },
  },
  plugins: [],
};
