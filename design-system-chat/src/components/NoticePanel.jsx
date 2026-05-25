import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function NoticePanel({ onClose, activeNotice, userId, onNoticePosted }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  function removeImage() {
    setImageFile(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
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
      const { error: uploadError } = await supabase.storage.from('chat-images').upload(path, imageFile)
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('chat-images').getPublicUrl(path)
        image_url = urlData.publicUrl
      }
    }
    const { error: insertError } = await supabase.from('notices').insert({
      title: title.trim() || null,
      content: content.trim() || null,
      image_url,
      link_url: linkUrl.trim() || null,
      created_by: userId,
    })
    if (insertError) { setError(insertError.message); setSaving(false); return }
    setTitle('')
    setContent('')
    setLinkUrl('')
    removeImage()
    setSaving(false)
    onNoticePosted?.()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={onClose}>
      <div
        className="relative bg-bg border-l border-divider h-full w-80 flex flex-col shadow-lg"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 h-10 border-b border-divider shrink-0">
          <span className="text-ui text-[11px] font-mono tracking-widest">NOTICE</span>
          <button onClick={onClose} className="text-meta text-sm font-mono hover:text-ui">×</button>
        </div>

        {/* 현재 노티스 */}
        {activeNotice && (
          <div className="px-5 py-4 border-b border-divider bg-notice-bg">
            <p className="text-[9px] font-mono text-meta tracking-widest mb-3">CURRENT</p>
            {activeNotice.title && (
              <p className="text-[14px] font-mono text-ui font-semibold leading-snug mb-2">{activeNotice.title}</p>
            )}
            {activeNotice.content && (
              <p className="text-[12px] font-mono text-ui leading-relaxed whitespace-pre-wrap">{activeNotice.content}</p>
            )}
            {activeNotice.image_url && (
              <img
                src={activeNotice.image_url}
                alt=""
                className="mt-3 w-full max-h-48 object-contain border border-divider"
                style={{ borderRadius: 2 }}
              />
            )}
            {activeNotice.link_url && (
              <a
                href={activeNotice.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block text-[11px] font-mono text-send-text hover:underline truncate"
              >
                {activeNotice.link_url}
              </a>
            )}
          </div>
        )}

        {/* 새 노티스 작성 */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="text-[9px] font-mono text-meta tracking-widest mb-3">NEW NOTICE</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="제목"
              className="bg-white border border-divider text-[13px] font-mono text-ui placeholder-meta px-3 py-2 outline-none focus:border-[#c8c8c4]"
              style={{ borderRadius: 2 }}
            />
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="내용 (선택)"
              rows={4}
              className="bg-white border border-divider text-[12px] font-mono text-ui placeholder-meta px-3 py-2 outline-none focus:border-[#c8c8c4] resize-none"
              style={{ borderRadius: 2 }}
            />
            <input
              type="url"
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              placeholder="링크 URL (선택)"
              className="bg-white border border-divider text-[12px] font-mono text-ui placeholder-meta px-3 py-2 outline-none focus:border-[#c8c8c4]"
              style={{ borderRadius: 2 }}
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-[11px] font-mono text-btn hover:text-ui transition-colors"
              >
                + 사진
              </button>
              <input type="file" ref={fileRef} accept="image/*" onChange={handleFileChange} className="hidden" />
              {imagePreview && (
                <>
                  <img src={imagePreview} alt="" className="h-10 w-10 object-cover border border-divider" style={{ borderRadius: 2 }} />
                  <button type="button" onClick={removeImage} className="text-[10px] font-mono text-meta hover:text-ui">remove</button>
                </>
              )}
            </div>

            {error && <p className="text-[10px] font-mono text-[#aa8a7d]">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="bg-white border border-divider text-[11px] font-mono text-send-text py-2 hover:bg-[#f0f4f8] transition-colors disabled:opacity-50"
              style={{ borderRadius: 2 }}
            >
              {saving ? 'posting...' : 'post notice'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
