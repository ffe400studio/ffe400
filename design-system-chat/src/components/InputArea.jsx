import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { GoogleGenerativeAI } from '@google/generative-ai'

const GEMINI_KEY = 'ds_gemini_api_key'

export default function InputArea({
  onSend, userInitial, isAdmin, onExport, onNotice,
  showTime, onToggleTime, onClearAll, onAIResponse,
  ownColor, onColorChange,
}) {
  const [text, setText] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [sending, setSending] = useState(false)
  const [aiMode, setAiMode] = useState(false)
  const [showKeyInput, setShowKeyInput] = useState(false)
  const [keyInput, setKeyInput] = useState('')
  const [savedKey, setSavedKey] = useState(() => localStorage.getItem(GEMINI_KEY) || '')
  const [aiError, setAiError] = useState('')
  const fileRef = useRef(null)
  const colorRef = useRef(null)

  const displayColor = ownColor || (userInitial === 'A' ? '#7DAAA0' : '#827DAA')

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
        e.preventDefault()
        break
      }
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e)
    }
  }

  function toggleAiMode() {
    setAiMode(v => !v)
    setAiError('')
    setShowKeyInput(false)
    setText('')
  }

  function saveKey() {
    if (!keyInput.trim()) return
    localStorage.setItem(GEMINI_KEY, keyInput.trim())
    setSavedKey(keyInput.trim())
    setKeyInput('')
    setShowKeyInput(false)
  }

  function deleteKey() {
    localStorage.removeItem(GEMINI_KEY)
    setSavedKey('')
    setShowKeyInput(false)
  }

  async function handleSend(e) {
    e.preventDefault()
    setAiError('')

    if (aiMode) {
      if (!text.trim() || sending) return
      if (!savedKey) { setShowKeyInput(true); return }
      setSending(true)
      try {
        const genAI = new GoogleGenerativeAI(savedKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })
        const result = await model.generateContent(text.trim())
        const answer = result.response.text()
        await onAIResponse(text.trim(), answer)
        setText('')
      } catch (err) {
        setAiError(err.message?.includes('API key') ? 'API 키를 확인해주세요.' : '오류가 발생했어요.')
      }
      setSending(false)
    } else {
      if ((!text.trim() && !imageFile) || sending) return
      setSending(true)
      await onSend(text.trim(), imageFile)
      setText('')
      removeImage()
      setSending(false)
    }
  }

  return (
    <div className="shrink-0 bg-input-bg px-4 pt-3 pb-3">

      {showKeyInput && (
        <div className="mb-2 flex items-center gap-2">
          <input
            type="password"
            value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && saveKey()}
            placeholder="Gemini API key (AIza...)"
            className="flex-1 bg-white border border-white/30 text-[11px] font-mono text-send-text placeholder-input-placeholder px-3 py-1.5 outline-none h-7"
            style={{ borderRadius: 2 }}
            autoFocus
          />
          <button
            onClick={saveKey}
            disabled={!keyInput.trim()}
            className="bg-white border border-white/20 text-[11px] font-mono text-send-text px-2 h-7 hover:bg-[#f0f4f8] disabled:opacity-40"
            style={{ borderRadius: 2 }}
          >
            save
          </button>
          {savedKey && (
            <button onClick={deleteKey} className="text-[11px] font-mono text-[#c0a0a0] hover:opacity-70">
              delete
            </button>
          )}
          <button onClick={() => setShowKeyInput(false)} className="text-meta text-xs font-mono hover:text-ui">×</button>
        </div>
      )}

      {imagePreview && (
        <div className="mb-2 flex items-center gap-2">
          <img src={imagePreview} alt="preview" className="h-14 w-14 object-cover border border-white/40" style={{ borderRadius: 2 }} />
          <button onClick={removeImage} className="text-[10px] font-mono text-[#7D91AA] hover:text-[#5a6d7a]">remove</button>
        </div>
      )}

      <form onSubmit={handleSend} className="flex items-center gap-2">
        {!aiMode && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="shrink-0 bg-white w-7 h-7 flex items-center justify-center hover:bg-[#f0f4f8] transition-colors border border-white/20"
            style={{ borderRadius: 2 }}
            title="attach image"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="1" y="2" width="10" height="8" rx="1" stroke="#7D91AA" strokeWidth="1"/>
              <circle cx="4" cy="5" r="1" fill="#7D91AA"/>
              <path d="M1 8.5L4 6L6.5 8L8.5 6.5L11 9" stroke="#7D91AA" strokeWidth="1" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        <input type="file" ref={fileRef} onChange={handleFileChange} accept="image/*" className="hidden" />

        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={aiMode ? 'ask ai...' : 'message'}
          className={`flex-1 bg-white text-[13px] font-mono text-send-text placeholder-input-placeholder px-3 py-1.5 outline-none border h-8 transition-colors ${
            aiMode ? 'border-[#d4d4a0]/80' : 'border-white/20'
          }`}
          style={{ borderRadius: 2 }}
        />

        <button
          type="submit"
          disabled={sending}
          className="shrink-0 bg-white px-3 h-8 text-[11px] font-mono text-send-text hover:bg-[#f0f4f8] transition-colors disabled:opacity-50 border border-white/20"
          style={{ borderRadius: 2 }}
        >
          {sending ? '...' : aiMode ? 'ask' : 'send'}
        </button>
      </form>

      {aiError && (
        <p className="text-[10px] font-mono text-[#aa8a7d] mt-1">{aiError}</p>
      )}

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono" style={{ color: '#7D91AA' }}>
            {userInitial === 'A' ? 'user_a' : 'user_b'}
          </span>

          {/* 텍스트 컬러 선택 */}
          <button
            type="button"
            onClick={() => colorRef.current?.click()}
            className="w-3 h-3 rounded-full border border-white/40 transition-transform hover:scale-125"
            style={{ backgroundColor: displayColor }}
            title="내 텍스트 색상"
          />
          <input
            type="color"
            ref={colorRef}
            value={displayColor}
            onChange={e => onColorChange(e.target.value)}
            className="hidden"
          />

          <button
            onClick={toggleAiMode}
            className="text-[10px] font-mono transition-colors hover:opacity-80"
            style={{ color: aiMode ? '#84843A' : '#7D91AA' }}
          >
            {aiMode ? 'ai on' : 'ask ai'}
          </button>
          {aiMode && (
            <button
              onClick={() => setShowKeyInput(v => !v)}
              className="text-[10px] font-mono hover:opacity-80 transition-opacity"
              style={{ color: savedKey ? '#7D91AA' : '#c0a0a0' }}
            >
              {savedKey ? 'key ✓' : 'api key'}
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onExport} className="text-[10px] font-mono hover:opacity-80 transition-opacity" style={{ color: '#7D91AA' }}>
            export
          </button>
          <button onClick={onNotice} className="text-[10px] font-mono hover:opacity-80 transition-opacity" style={{ color: '#7D91AA' }}>
            + notice
          </button>
          {isAdmin && (
            <button onClick={onToggleTime} className="text-[10px] font-mono hover:opacity-80 transition-opacity" style={{ color: '#7D91AA' }}>
              time {showTime ? 'on' : 'off'}
            </button>
          )}
          {isAdmin && (
            <button onClick={onClearAll} className="text-[10px] font-mono hover:opacity-80 transition-opacity" style={{ color: '#c0a0a0' }}>
              clear all
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
