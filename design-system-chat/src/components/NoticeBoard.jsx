import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

function formatDate(iso) {
  return new Date(iso).toLocaleString('ko-KR', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

export default function NoticeBoard({ userId, isAdmin }) {
  const [notices, setNotices] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [lightboxUrl, setLightboxUrl] = useState(null)
  const fileRef = useRef(null)

  useEffect(() => { fetchNotices() }, [])

  async function fetchNotices() {
    const { data } = await supabase.from('notices').select('*').order('created_at', { ascending: false })
    if (data) setNotices(data)
  }

  function handleDrop(e) {
    e.preventDefault()
    const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('image/'))
    if (!file) return
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function handlePaste(e) {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (!file) continue
        if (imagePreview) URL.revokeObjectURL(imagePreview)
        setImageFile(file)
        setImagePreview(URL.createObjectURL(file))
        break
      }
    }
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  function removeImage() {
    setImageFile(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
  }

  function cancelForm() {
    setShowForm(false)
    setTitle('')
    setContent('')
    setLinkUrl('')
    removeImage()
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() && !content.trim()) { setError('제목이나 내용을 입력해주세요.'); return }
    setSaving(true)
    setError('')
    let image_url = null
    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `notices/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('chat-images').upload(path, imageFile)
      if (!upErr) {
        const { data: urlData } = supabase.storage.from('chat-images').getPublicUrl(path)
        image_url = urlData.publicUrl
      }
    }
    const { error: insertErr } = await supabase.from('notices').insert({
      title: title.trim() || null,
      content: content.trim() || null,
      image_url,
      link_url: linkUrl.trim() || null,
      created_by: userId,
    })
    if (insertErr) { setError(insertErr.message); setSaving(false); return }
    cancelForm()
    setSaving(false)
    fetchNotices()
  }

  async function deleteNotice(id) {
    setNotices(prev => prev.filter(n => n.id !== id))
    await supabase.from('notices').delete().eq('id', id)
  }

  async function clearAll() {
    if (!window.confirm('모든 노티스를 삭제할까요?')) return
    setNotices([])
    await supabase.from('notices').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  }

  function exportNotices() {
    const lines = notices.map(n => {
      const time = new Date(n.created_at).toLocaleString('ko-KR')
      const parts = [`[${time}]`]
      if (n.title) parts.push(`제목: ${n.title}`)
      if (n.content) parts.push(n.content)
      if (n.link_url) parts.push(`링크: ${n.link_url}`)
      return parts.join('\n')
    })
    const blob = new Blob([lines.join('\n\n---\n\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `notices-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-full bg-bg">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 h-10 border-b border-divider shrink-0">
        <span className="text-ui text-[11px] font-mono tracking-widest">NOTICE</span>
        <div className="flex items-center gap-3">
          <button onClick={exportNotices} className="text-[10px] font-mono text-btn hover:text-ui transition-colors">
            export
          </button>
          {isAdmin && notices.length > 0 && (
            <button onClick={clearAll} className="text-[10px] font-mono text-meta hover:text-[#aa8a7d] transition-colors">
              clear all
            </button>
          )}
        </div>
      </div>

      {/* 목록 */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {notices.length === 0 && (
          <p className="text-meta text-[11px] font-mono text-center py-8">아직 노티스가 없어요</p>
        )}
        {notices.map(n => (
          <div key={n.id} className="border border-divider bg-white p-3 group" style={{ borderRadius: 4 }}>
            {n.title && (
              <p className="text-[13px] font-mono text-ui font-semibold leading-snug mb-2">{n.title}</p>
            )}
            {n.content && (
              <p className="text-[12px] font-mono text-ui leading-relaxed whitespace-pre-wrap mb-2">{n.content}</p>
            )}
            {n.image_url && (
              <button onClick={() => setLightboxUrl(n.image_url)} className="block mb-2 w-full">
                <img src={n.image_url} alt=""
                  className="w-full max-h-48 object-cover border border-divider hover:opacity-80 transition-opacity"
                  style={{ borderRadius: 2 }} />
              </button>
            )}
            {n.link_url && (
              <a href={n.link_url} target="_blank" rel="noopener noreferrer"
                className="block text-[11px] font-mono text-send-text hover:underline truncate mb-2">
                {n.link_url}
              </a>
            )}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-meta">{formatDate(n.created_at)}</span>
              {isAdmin && (
                <button onClick={() => deleteNotice(n.id)}
                  className="text-[10px] font-mono text-meta hover:text-[#aa8a7d] opacity-0 group-hover:opacity-100 transition-opacity">
                  ×
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 작성 영역 */}
      <div
        className="shrink-0 bg-input-bg px-4 pt-3 pb-3"
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
      >
        {showForm ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="제목"
              autoFocus
              className="bg-white border border-white/20 text-[13px] font-mono text-send-text placeholder-input-placeholder px-3 py-1.5 outline-none h-8"
              style={{ borderRadius: 2 }}
            />
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              onPaste={handlePaste}
              placeholder="내용 (선택) — 사진 붙여넣기 가능"
              rows={3}
              className="bg-white border border-white/20 text-[12px] font-mono text-send-text placeholder-input-placeholder px-3 py-2 outline-none resize-none"
              style={{ borderRadius: 2 }}
            />
            <input
              type="url"
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              placeholder="링크 URL (선택)"
              className="bg-white border border-white/20 text-[12px] font-mono text-send-text placeholder-input-placeholder px-3 py-1.5 outline-none h-8"
              style={{ borderRadius: 2 }}
            />
            {imagePreview && (
              <div className="flex items-center gap-2">
                <img src={imagePreview} alt="" className="h-10 w-10 object-cover border border-white/40" style={{ borderRadius: 2 }} />
                <button type="button" onClick={removeImage} className="text-[10px] font-mono text-[#7D91AA] hover:opacity-70">remove</button>
              </div>
            )}
            {error && <p className="text-[10px] font-mono text-[#aa8a7d]">{error}</p>}
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => fileRef.current?.click()}
                className="text-[11px] font-mono text-send-text hover:opacity-80">+ 사진</button>
              <input type="file" ref={fileRef} accept="image/*" onChange={handleFileChange} className="hidden" />
              <button type="submit" disabled={saving}
                className="bg-white px-3 h-7 text-[11px] font-mono text-send-text hover:bg-[#f0f4f8] border border-white/20 disabled:opacity-50 transition-colors"
                style={{ borderRadius: 2 }}>
                {saving ? '...' : 'post'}
              </button>
              <button type="button" onClick={cancelForm} className="text-[11px] font-mono text-meta hover:text-ui">cancel</button>
            </div>
          </form>
        ) : (
          <button onClick={() => setShowForm(true)} className="text-[11px] font-mono text-send-text hover:opacity-80">
            + new notice
          </button>
        )}
      </div>

      {lightboxUrl && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setLightboxUrl(null)}>
          <img src={lightboxUrl} alt="" className="max-w-full max-h-full object-contain p-4" />
        </div>
      )}
    </div>
  )
}
