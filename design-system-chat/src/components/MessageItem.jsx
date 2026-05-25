import { useState } from 'react'

function getInitial(msg, currentUserId, isAdmin) {
  if (msg.is_ai) return 'AI'
  if (msg.sender_id === currentUserId) return isAdmin ? 'A' : 'B'
  return isAdmin ? 'B' : 'A'
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export default function MessageItem({ msg, currentUserId, isAdmin, showTime, onDelete, onImageClick, color }) {
  const [hovered, setHovered] = useState(false)
  const initial = getInitial(msg, currentUserId, isAdmin)
  const time = formatTime(msg.created_at)

  return (
    <div
      className="flex items-start gap-2 py-[2px] group relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="text-[11px] font-mono w-5 shrink-0 pt-[1px]" style={{ color: '#c8c8c4' }}>
        {initial}
      </span>

      <div className="flex-1 min-w-0">
        {msg.content && (
          <span className="text-[13px] font-mono leading-relaxed break-words" style={{ color, whiteSpace: 'pre-wrap' }}>
            {msg.content}
          </span>
        )}
        {msg.image_url && (
          <button onClick={() => onImageClick(msg.image_url)} className="block mt-1">
            <img
              src={msg.image_url}
              alt="attachment"
              className="max-h-40 max-w-xs object-cover border border-divider hover:opacity-80 transition-opacity"
              style={{ borderRadius: 2 }}
            />
          </button>
        )}
      </div>

      {showTime && (
        <span className="text-[10px] font-mono shrink-0 pt-[2px]" style={{ color: '#c8c8c4' }}>
          {time}
        </span>
      )}

      {isAdmin && hovered && !msg.is_ai && (
        <button
          onClick={() => onDelete(msg.id)}
          className="shrink-0 text-[10px] font-mono text-[#c8c8c4] hover:text-[#aa8a7d] transition-colors pt-[2px] ml-1"
          title="delete"
        >
          ×
        </button>
      )}
    </div>
  )
}
