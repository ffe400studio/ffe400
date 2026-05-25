import MessageItem from './MessageItem'

const DEFAULT_COLORS = { A: '#7DAAA0', B: '#827DAA', AI: '#84843A' }

function isSameDay(a, b) {
  const da = new Date(a)
  const db = new Date(b)
  return da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
}

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

function getMessageColor(msg, currentUserId, isAdmin, userSettings) {
  if (msg.is_ai) return DEFAULT_COLORS.AI
  const settings = userSettings[msg.sender_id]
  if (settings?.text_color) return settings.text_color
  const isOwn = msg.sender_id === currentUserId
  if (isAdmin) return isOwn ? DEFAULT_COLORS.A : DEFAULT_COLORS.B
  return isOwn ? DEFAULT_COLORS.B : DEFAULT_COLORS.A
}

export default function MessageList({ messages, currentUserId, isAdmin, showTime, onDelete, onImageClick, bottomRef, userSettings = {} }) {
  const rendered = []
  let lastDate = null

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    const msgDate = msg.created_at

    if (!lastDate || !isSameDay(lastDate, msgDate)) {
      rendered.push(
        <div key={`divider-${i}`} className="flex items-center gap-3 my-4 px-5">
          <div className="flex-1 h-px bg-divider" />
          <span className="text-meta text-[10px] font-mono shrink-0">{formatDate(msgDate)}</span>
          <div className="flex-1 h-px bg-divider" />
        </div>
      )
      lastDate = msgDate
    }

    rendered.push(
      <MessageItem
        key={msg.id}
        msg={msg}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        showTime={showTime}
        onDelete={onDelete}
        onImageClick={onImageClick}
        color={getMessageColor(msg, currentUserId, isAdmin, userSettings)}
      />
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4">
      {rendered}
      <div ref={bottomRef} />
    </div>
  )
}
