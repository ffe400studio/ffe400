/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        bg: 'var(--color-bg)',
        'msg-a': '#7DAAA0',
        'msg-b': '#827DAA',
        'msg-ai': '#84843A',
        'meta': 'var(--color-meta)',
        'ui': 'var(--color-ui)',
        'btn': 'var(--color-btn)',
        'divider': 'var(--color-divider)',
        'notice-bg': 'var(--color-notice-bg)',
        'input-bg': 'var(--color-input-bg)',
        'send-text': 'var(--color-send-text)',
        'input-placeholder': 'var(--color-input-placeholder)',
      },
    },
  },
  plugins: [],
}
