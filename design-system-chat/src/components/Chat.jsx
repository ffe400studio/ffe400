import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import TopBar from './TopBar'
import NoticeBanner from './NoticeBanner'
import MessageList from './MessageList'
import InputArea from './InputArea'
import NoticeBoard from './NoticeBoard'
import Lightbox from './Lightbox'
import Board from './Board'

export default function Chat({ session }) {
  const [tab, setTab] = useState('chat')
  const [messages, setMessages] = useState([])
  const [latestNotice, setLatestNotice] = useState(null)
  const [showNoticeBoard, setShowNoticeBoard] = useState(false)
  const [splitPct, setSplitPct] = useState(58)
  const [showTime, setShowTime] = useState(true)
  const [lightboxUrl, setLightboxUrl] = useState(null)
  const [userSettings, setUserSettings] = useState({})
  const bottomRef = useRef(null)
  const messagesRef = useRef([])
  const isDragging = useRef(false)
  const containerRef = useRef(null)

  const user = session.user
  const isAdmin = user.user_metadata?.role === 'admin'
  const userInitial = isAdmin ? 'A' : 'B'

  // 드래그로 분할 비율 조절
  useEffect(() => {
    const onMove = (e) => {
      if (!isDragging.current || !containerRef.current) return
      e.preventDefault()
      const clientX = e.touches ? e.touches[0].clientX : e.clientX
      const rect = containerRef.current.getBoundingClientRect()
      const pct = ((clientX - rect.left) / rect.width) * 100
      setSplitPct(Math.max(25, Math.min(75, pct)))
    }
    const onUp = () => { isDragging.current = false }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    document.addEventListener('touchmove', onMove, { passive: false })
    document.addEventListener('touchend', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onUp)
    }
  }, [])

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })
    if (!data) return
    setMessages(prev => {
      const same =
        prev.length === data.length &&
        (data.length === 0 || prev[prev.length - 1]?.id === data[data.length - 1]?.id)
      if (same) return prev
      return data
    })
    messagesRef.current = data
  }, [])

  const fetchLatestNotice = useCallback(async () => {
    const { data } = await supabase
      .from('notices')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
    setLatestNotice(data?.[0] || null)
  }, [])

  const fetchUserSettings = useCallback(async () => {
    const { data } = await supabase.from('user_settings').select('*')
    if (data) {
      const map = {}
      data.forEach(s => { map[s.user_id] = s })
      setUserSettings(map)
    }
  }, [])

  useEffect(() => {
    fetchMessages()
    fetchLatestNotice()
    fetchUserSettings()
    const interval = setInterval(() => {
      fetchMessages()
      fetchLatestNotice()
    }, 3000)
    return () => clearInterval(interval)
  }, [fetchMessages, fetchLatestNotice, fetchUserSettings])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function saveUserColor(color) {
    setUserSettings(prev => ({ ...prev, [user.id]: { ...prev[user.id], text_color: color } }))
    await supabase.from('user_settings').upsert({ user_id: user.id, text_color: color })
  }

  async function sendMessage(content, imageFile) {
    let image_url = null
    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('chat-images').upload(path, imageFile)
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('chat-images').getPublicUrl(path)
        image_url = urlData.publicUrl
      }
    }
    if (!content && !image_url) return
    const { data } = await supabase
      .from('messages')
      .insert({ sender_id: user.id, content: content || null, image_url })
      .select()
      .single()
    if (data) {
      setMessages(prev => {
        if (prev.find(m => m.id === data.id)) return prev
        return [...prev, data]
      })
    }
  }

  async function deleteMessage(id) {
    setMessages(prev => prev.filter(m => m.id !== id))
    await supabase.from('messages').delete().eq('id', id)
  }

  async function clearAllMessages() {
    if (!window.confirm('모든 메시지를 삭제할까요?')) return
    setMessages([])
    await supabase.from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  }

  async function handleAIResponse(question, answer) {
    const { data: qData } = await supabase
      .from('messages')
      .insert({ sender_id: user.id, content: question, image_url: null, is_ai: false })
      .select().single()
    if (qData) setMessages(prev => [...prev, qData])
    const { data: aData } = await supabase
      .from('messages')
      .insert({ sender_id: user.id, content: answer, image_url: null, is_ai: true })
      .select().single()
    if (aData) setMessages(prev => [...prev, aData])
  }

  function exportChat() {
    const lines = messages.map(m => {
      const time = new Date(m.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
      const who = m.sender_id === 'ai' ? 'AI' : m.sender_id === user.id ? userInitial : (isAdmin ? 'B' : 'A')
      const text = m.content || (m.image_url ? '[image]' : '')
      return `[${time}] ${who}: ${text}`
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const ownColor = userSettings[user.id]?.text_color || null

  return (
    <div className="flex flex-col bg-bg overflow-hidden" style={{ height: '100dvh' }}>
      <TopBar
        tab={tab}
        onTabChange={setTab}
        showNoticeBoard={showNoticeBoard}
        onToggleNotice={() => setShowNoticeBoard(v => !v)}
        onExport={exportChat}
      />

      {tab === 'chat' && latestNotice && !showNoticeBoard && (
        <NoticeBanner notice={latestNotice} onClick={() => setShowNoticeBoard(true)} />
      )}

      <div className="flex flex-1 overflow-hidden" ref={containerRef}>
        {tab === 'chat' ? (
          <>
            {/* 채팅 영역 */}
            <div
              className="flex flex-col overflow-hidden min-w-0"
              style={{ width: showNoticeBoard ? `${splitPct}%` : '100%' }}
            >
              <MessageList
                messages={messages}
                currentUserId={user.id}
                isAdmin={isAdmin}
                showTime={showTime}
                onDelete={deleteMessage}
                onImageClick={setLightboxUrl}
                bottomRef={bottomRef}
                userSettings={userSettings}
              />
              <InputArea
                onSend={sendMessage}
                userInitial={userInitial}
                isAdmin={isAdmin}
                onExport={exportChat}
                showTime={showTime}
                onToggleTime={() => setShowTime(v => !v)}
                onClearAll={clearAllMessages}
                onAIResponse={handleAIResponse}
                ownColor={ownColor}
                onColorChange={saveUserColor}
              />
            </div>

            {/* 드래그 구분선 */}
            {showNoticeBoard && (
              <div
                className="w-[3px] shrink-0 bg-divider hover:bg-[#b0b0ac] transition-colors cursor-col-resize select-none"
                onMouseDown={() => { isDragging.current = true }}
                onTouchStart={() => { isDragging.current = true }}
              />
            )}

            {/* 노티스 보드 영역 */}
            {showNoticeBoard && (
              <div
                className="flex flex-col overflow-hidden min-w-0 border-l border-divider"
                style={{ width: `${100 - splitPct}%` }}
              >
                <NoticeBoard userId={user.id} isAdmin={isAdmin} />
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            <Board session={session} isAdmin={isAdmin} />
          </div>
        )}
      </div>

      {lightboxUrl && (
        <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}
    </div>
  )
}
