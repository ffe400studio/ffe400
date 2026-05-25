export const THEMES = [
  {
    id: 'cream', name: 'Cream',
    bg: '#fafaf9', inputBg: '#BFD9FB', divider: '#eaeae6',
    noticeBg: '#f5f5f2', ui: '#888884', meta: '#c8c8c4',
    btn: '#b0b0ac', sendText: '#7D91AA', inputPlaceholder: '#c0d4e8',
  },
  {
    id: 'warm', name: 'Warm',
    bg: '#fdf8f2', inputBg: '#e8c89c', divider: '#e4d4bc',
    noticeBg: '#f8f0e4', ui: '#7a5c3c', meta: '#c4a07c',
    btn: '#b49060', sendText: '#8a6840', inputPlaceholder: '#d4b888',
  },
  {
    id: 'sage', name: 'Sage',
    bg: '#f4f8f4', inputBg: '#b4d4c0', divider: '#d0e4d8',
    noticeBg: '#e8f4ec', ui: '#486858', meta: '#8cbca8',
    btn: '#74a890', sendText: '#4c7c68', inputPlaceholder: '#a4c8b4',
  },
  {
    id: 'dusk', name: 'Dusk',
    bg: '#f6f4f8', inputBg: '#c4b4d8', divider: '#dcd4e8',
    noticeBg: '#f0ecf8', ui: '#5c4878', meta: '#a898c4',
    btn: '#9484b4', sendText: '#644c88', inputPlaceholder: '#c0b4d4',
  },
]

export function applyTheme(themeId) {
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0]
  const r = document.documentElement.style
  r.setProperty('--color-bg', theme.bg)
  r.setProperty('--color-input-bg', theme.inputBg)
  r.setProperty('--color-divider', theme.divider)
  r.setProperty('--color-notice-bg', theme.noticeBg)
  r.setProperty('--color-ui', theme.ui)
  r.setProperty('--color-meta', theme.meta)
  r.setProperty('--color-btn', theme.btn)
  r.setProperty('--color-send-text', theme.sendText)
  r.setProperty('--color-input-placeholder', theme.inputPlaceholder)
  document.body.style.background = theme.bg
}
