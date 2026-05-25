export default function TopBar({ tab, onTabChange, showNoticeBoard, onToggleNotice, onExport }) {
  return (
    <div className="flex items-center justify-between px-5 h-10 border-b border-divider shrink-0 bg-bg">
      <div className="flex items-center gap-4">
        <span className="text-ui text-xs font-mono tracking-widest">Design System</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onTabChange('chat')}
            className="text-[11px] font-mono px-2 py-0.5 transition-colors"
            style={{
              color: tab === 'chat' ? '#888884' : '#c8c8c4',
              borderBottom: tab === 'chat' ? '1px solid #888884' : '1px solid transparent',
            }}
          >
            chat
          </button>
          <button
            onClick={() => onTabChange('board')}
            className="text-[11px] font-mono px-2 py-0.5 transition-colors"
            style={{
              color: tab === 'board' ? '#888884' : '#c8c8c4',
              borderBottom: tab === 'board' ? '1px solid #888884' : '1px solid transparent',
            }}
          >
            board
          </button>
          <button
            onClick={() => onTabChange('calendar')}
            className="text-[11px] font-mono px-2 py-0.5 transition-colors"
            style={{
              color: tab === 'calendar' ? '#888884' : '#c8c8c4',
              borderBottom: tab === 'calendar' ? '1px solid #888884' : '1px solid transparent',
            }}
          >
            cal
          </button>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {tab === 'chat' && (
          <button
            onClick={onExport}
            className="text-btn text-[11px] font-mono hover:text-ui transition-colors"
          >
            export
          </button>
        )}
        {tab === 'chat' && (
          <button
            onClick={onToggleNotice}
            className="text-[11px] font-mono transition-colors"
            style={{ color: showNoticeBoard ? '#888884' : '#b0b0ac' }}
          >
            notice
          </button>
        )}
      </div>
    </div>
  )
}
