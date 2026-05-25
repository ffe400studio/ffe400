import { useState, useEffect } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'

const STORAGE_KEY = 'ds_gemini_api_key'

export default function AIPanel({ onClose, onAIResponse }) {
  const [tab, setTab] = useState('ask')
  const [apiKey, setApiKey] = useState('')
  const [savedKey, setSavedKey] = useState(() => localStorage.getItem(STORAGE_KEY) || '')
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setSavedKey(localStorage.getItem(STORAGE_KEY) || '')
  }, [])

  function saveKey() {
    if (!apiKey.trim()) return
    localStorage.setItem(STORAGE_KEY, apiKey.trim())
    setSavedKey(apiKey.trim())
    setApiKey('')
  }

  function deleteKey() {
    localStorage.removeItem(STORAGE_KEY)
    setSavedKey('')
    setApiKey('')
  }

  async function handleAsk(e) {
    e.preventDefault()
    if (!question.trim() || !savedKey) return
    setLoading(true)
    setError('')
    try {
      const genAI = new GoogleGenerativeAI(savedKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })
      const result = await model.generateContent(question.trim())
      const answer = result.response.text()
      onAIResponse(question.trim(), answer)
      setQuestion('')
    } catch (err) {
      setError(err.message || 'API error')
    }
    setLoading(false)
  }

  return (
    <div className="w-72 border-l border-divider bg-bg flex flex-col shrink-0">
      <div className="flex items-center justify-between px-4 h-10 border-b border-divider shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTab('api')}
            className={`text-[11px] font-mono transition-colors ${tab === 'api' ? 'text-ui' : 'text-btn hover:text-ui'}`}
          >
            api key
          </button>
          <button
            onClick={() => setTab('ask')}
            className={`text-[11px] font-mono transition-colors ${tab === 'ask' ? 'text-ui' : 'text-btn hover:text-ui'}`}
          >
            ask ai
          </button>
        </div>
        <button onClick={onClose} className="text-meta text-xs font-mono hover:text-ui">×</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {tab === 'api' && (
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-mono text-meta">
              {savedKey ? `key saved: ${savedKey.slice(0, 8)}...` : 'no key saved'}
            </p>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="AIza..."
              className="bg-white border border-divider text-[11px] font-mono text-ui placeholder-meta px-3 py-2 outline-none focus:border-[#c8c8c4]"
              style={{ borderRadius: 2 }}
            />
            <div className="flex gap-2">
              <button
                onClick={saveKey}
                disabled={!apiKey.trim()}
                className="flex-1 bg-white border border-divider text-[11px] font-mono text-send-text py-1.5 hover:bg-[#f0f4f8] transition-colors disabled:opacity-40"
                style={{ borderRadius: 2 }}
              >
                save
              </button>
              {savedKey && (
                <button
                  onClick={deleteKey}
                  className="flex-1 bg-white border border-divider text-[11px] font-mono text-[#aa8a7d] py-1.5 hover:bg-[#faf0ee] transition-colors"
                  style={{ borderRadius: 2 }}
                >
                  delete
                </button>
              )}
            </div>
          </div>
        )}

        {tab === 'ask' && (
          <form onSubmit={handleAsk} className="flex flex-col gap-3">
            {!savedKey && (
              <p className="text-[10px] font-mono text-[#aa8a7d]">
                api key tab에서 키를 저장해주세요.
              </p>
            )}
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="ask anything..."
              rows={5}
              disabled={!savedKey}
              className="bg-white border border-divider text-[12px] font-mono text-ui placeholder-meta px-3 py-2 outline-none focus:border-[#c8c8c4] resize-none disabled:opacity-50"
              style={{ borderRadius: 2 }}
            />
            {error && <p className="text-[10px] font-mono text-[#aa8a7d]">{error}</p>}
            <button
              type="submit"
              disabled={loading || !savedKey || !question.trim()}
              className="bg-white border border-divider text-[11px] font-mono text-send-text py-1.5 hover:bg-[#f0f4f8] transition-colors disabled:opacity-40"
              style={{ borderRadius: 2 }}
            >
              {loading ? 'thinking...' : 'ask'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
