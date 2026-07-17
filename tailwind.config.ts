import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'wm-bg': '#FAF8F3',
        'wm-card': '#FFFFFF',
        'wm-input': '#F8F7F4',
        'wm-accent': '#E85D5D',
        'wm-accent-light': 'rgba(232,93,93,0.08)',
        'wm-text': '#1A1A2E',
        'wm-text-secondary': '#6B7280',
        'wm-text-tertiary': '#9CA3AF',
        'wm-border': 'rgba(26,26,46,0.06)',
        'wm-chart-1': '#E85D5D',
        'wm-chart-2': '#2A9D8F',
        'wm-chart-3': '#264653',
      },
      fontFamily: {
        serif: ['Noto Serif SC', 'Source Han Serif SC', 'serif'],
        sans: ['Inter', '-apple-system', 'PingFang SC', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'monospace'],
      },
      borderRadius: {
        'wm-sm': '8px',
        'wm-md': '12px',
        'wm-lg': '16px',
        'wm-xl': '22px',
        'wm-full': '999px',
      },
      boxShadow: {
        'wm-sm': '0 1px 3px rgba(26,26,46,0.04)',
        'wm-md': '0 2px 8px rgba(26,26,46,0.06)',
        'wm-lg': '0 4px 16px rgba(26,26,46,0.08)',
        'wm-fab': '0 4px 20px rgba(232,93,93,0.25)',
      },
    },
  },
  plugins: [],
}

export default config
