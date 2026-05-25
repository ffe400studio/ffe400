import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import TopBar from './TopBar'
import NoticeBanner from './NoticeBanner'
import MessageList from './MessageList'
import InputArea from './InputArea'
import NoticeBoard from './NoticeBoard'
import Lightbox from './Lightbox'
import Board from './Board'
import CalendarTab from './CalendarTab'
import SettingsBar from './SettingsBar'

export default function Chat({ session }) {
  const [tab, setTab] = useState('chat')
  const [showSettings, setShowSettings] = useState(false)
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('ds_theme') || 'cream')
  const [messages, setMessages] = useState([])
  const [latestNotice, setLatestNotice] = useState(null)
  const [todayEvents, setTodayEvents] = useState([])
  const [eventBannerDismissed, setEventBannerDismissed] = useState(false)
  const [showTime, setShowTime] = useState(true)
  const [lightboxUrl, setLightboxUrl] = useState(null)
  const [userSettings, setUserSettings] = useState({})
  const bottomRef = useRef(null)
  const messagesRef = useRef([])

  const user = session.user
  const isAdmin = user.user_metadata?.role === 'admin'
  const userInitial = isAdmin ? 'A' : 'B'

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
    fetchTodayEvents()
    const interval = setInterval(() => {
      fetchMessages()
      fetchLatestNotice()
    }, 3000)
    return () => clearInterval(interval)
  }, [fetchMessages, fetchLatestNotice, fetchUserSettings])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchTodayEvents() {
    const today = new Date().toISOString().slice(0, 10)
    const { data } = await supabase.from('calendar_events').select('*').eq('date', today).order('created_at')
    if (data) setTodayEvents(data)
  }

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
        onExport={exportChat}
        showSettings={showSettings}
        onToggleSettings={() => setShowSettings(v => !v)}
      />
      {showSettings && (
        <SettingsBar
          currentTheme={currentTheme}
          onThemeChange={setCurrentTheme}
          ownColor={ownColor}
          onColorChange={saveUserColor}
          userInitial={userInitial}
        />
      )}

      {tab === 'chat' && latestNotice && (
        <NoticeBanner notice={latestNotice} onClick={() => setTab('notice')} />
      )}

      {tab === 'chat' && todayEvents.length > 0 && !eventBannerDismissed && (
        <div className="flex items-center justify-between px-5 py-2 border-b border-divider shrink-0"
          style={{ backgroundColor: '#f0f4f8' }}>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-mono tracking-widest shrink-0" style={{ color: '#7D91AA' }}>TODAY</span>
            <span className="text-[11px] font-mono truncate" style={{ color: '#7D91AA' }}>
              {todayEvents.map(e => e.title).join(' · ')}
            </span>
          </div>
          <button
            onClick={() => setEventBannerDismissed(true)}
            className="text-[13px] font-mono ml-3 shrink-0 hover:opacity-60 transition-opacity"
            style={{ color: '#7D91AA' }}
          >×</button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {tab === 'chat' && (
          <div className="flex flex-col flex-1 overflow-hidden">
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
        )}
        {tab === 'notice' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <NoticeBoard userId={user.id} isAdmin={isAdmin} />
          </div>
        )}
        {tab === 'board' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <Board session={session} isAdmin={isAdmin} />
          </div>
        )}
        {tab === 'calendar' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <CalendarTab session={session} isAdmin={isAdmin} />
          </div>
        )}
      </div>

      {lightboxUrl && (
        <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}
    </div>
  )
}
