const TABS = [
  { id: 'chat', label: 'chat' },
  { id: 'notice', label: 'notice' },
  { id: 'board', label: 'board' },
  { id: 'calendar', label: 'cal' },
]

export default function TopBar({ tab, onTabChange, onExport }) {
  return (
    <div className="flex items-center justify-between px-5 h-10 border-b border-divider shrink-0 bg-bg">
      <div className="flex items-center gap-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            className="text-[11px] font-mono px-2 py-0.5 transition-colors"
            style={{
              color: tab === t.id ? '#888884' : '#c8c8c4',
              borderBottom: tab === t.id ? '1px solid #888884' : '1px solid transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'chat' && (
        <button onClick={onExport} className="text-btn text-[11px] font-mono hover:text-ui transition-colors">
          export
        </button>
      )}
    </div>
  )
}
