/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        bg: '#fafaf9',
        'msg-a': '#7DAAA0',
        'msg-b': '#827DAA',
        'msg-ai': '#84843A',
        'meta': '#c8c8c4',
        'ui': '#888884',
        'btn': '#b0b0ac',
        'divider': '#eaeae6',
        'notice-bg': '#f5f5f2',
        'input-bg': '#BFD9FB',
        'send-text': '#7D91AA',
        'input-placeholder': '#c0d4e8',
      },
    },
  },
  plugins: [],
}
