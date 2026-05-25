export default function NoticeBanner({ notice, onClick }) {
  const preview = notice.title || notice.content || ''
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-5 py-2 bg-notice-bg border-b border-divider hover:bg-[#eeeee8] transition-colors text-left shrink-0"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-meta text-[10px] font-mono tracking-widest shrink-0">NOTICE</span>
        <span className="text-ui text-[11px] font-mono truncate">{preview}</span>
      </div>
      <span className="text-meta text-[11px] font-mono ml-3 shrink-0">›</span>
    </button>
  )
}
