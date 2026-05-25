import { useRef } from 'react'
import { THEMES, applyTheme } from '../lib/themes'

export default function SettingsBar({ currentTheme, onThemeChange, ownColor, onColorChange, userInitial }) {
  const colorRef = useRef(null)
  const displayColor = ownColor || (userInitial === 'A' ? '#7DAAA0' : '#827DAA')

  function handleThemeChange(themeId) {
    localStorage.setItem('ds_theme', themeId)
    applyTheme(themeId)
    onThemeChange(themeId)
  }

  return (
    <div className="shrink-0 border-b border-divider bg-bg px-5 py-2.5 flex items-center gap-5">
      {/* 테마 */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-mono text-meta tracking-widest">THEME</span>
        <div className="flex items-center gap-1.5">
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => handleThemeChange(t.id)}
              title={t.name}
              className="w-5 h-5 rounded-full transition-transform hover:scale-110 shrink-0"
              style={{
                background: `linear-gradient(135deg, ${t.bg} 50%, ${t.inputBg} 50%)`,
                outline: currentTheme === t.id ? `2px solid var(--color-ui)` : '2px solid transparent',
                outlineOffset: 2,
              }}
            />
          ))}
        </div>
      </div>

      <div className="w-px h-4 bg-divider shrink-0" />

      {/* 포인트 컬러 */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-mono text-meta tracking-widest">MY COLOR</span>
        <button
          onClick={() => colorRef.current?.click()}
          className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
          title="내 텍스트 색상"
        >
          <div className="w-4 h-4 rounded-full border border-divider" style={{ backgroundColor: displayColor }} />
          <span className="text-[11px] font-mono" style={{ color: displayColor }}>
            {userInitial === 'A' ? 'user_a' : 'user_b'}
          </span>
        </button>
        <input
          type="color"
          ref={colorRef}
          value={displayColor}
          onChange={e => onColorChange(e.target.value)}
          className="hidden"
        />
      </div>
    </div>
  )
}
