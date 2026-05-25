import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function toDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

export default function CalendarTab({ session, isAdmin }) {
  const [viewDate, setViewDate] = useState(new Date())
  const [events, setEvents] = useState([])
  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()))
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [saving, setSaving] = useState(false)

  const user = session.user
  const today = toDateStr(new Date())
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  useEffect(() => { fetchEvents() }, [])

  async function fetchEvents() {
    const { data } = await supabase
      .from('calendar_events')
      .select('*')
      .order('date')
      .order('created_at')
    if (data) setEvents(data)
  }

  async function addEvent() {
    if (!newTitle.trim()) return
    setSaving(true)
    const { data } = await supabase.from('calendar_events').insert({
      title: newTitle.trim(),
      description: newDesc.trim() || null,
      date: selectedDate,
      created_by: user.id,
    }).select().single()
    if (data) {
      setEvents(prev => [...prev, data].sort((a, b) => a.date.localeCompare(b.date) || a.created_at.localeCompare(b.created_at)))
      setNewTitle('')
      setNewDesc('')
      setShowForm(false)
    }
    setSaving(false)
  }

  async function deleteEvent(id) {
    setEvents(prev => prev.filter(e => e.id !== id))
    await supabase.from('calendar_events').delete().eq('id', id)
  }

  const eventsByDate = {}
  events.forEach(e => {
    if (!eventsByDate[e.date]) eventsByDate[e.date] = []
    eventsByDate[e.date].push(e)
  })

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
  }

  const selectedEvents = eventsByDate[selectedDate] || []
  const upcomingEvents = events.filter(e => e.date >= today)

  return (
    <div className="flex flex-col h-full">
      {/* 월 네비게이션 */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-divider shrink-0">
        <button
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="text-btn text-[13px] font-mono hover:text-ui transition-colors px-1"
        >←</button>
        <span className="text-ui text-[13px] font-mono">{year}년 {month + 1}월</span>
        <button
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="text-btn text-[13px] font-mono hover:text-ui transition-colors px-1"
        >→</button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* 달력 그리드 */}
        <div className="px-4 pt-3 pb-2">
          <div className="grid grid-cols-7 mb-1">
            {DAY_LABELS.map((d, i) => (
              <div key={d} className="text-center text-[10px] font-mono py-1"
                style={{ color: i === 0 ? '#aa8a7d' : i === 6 ? '#7D91AA' : '#c8c8c4' }}>
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((dateStr, i) => {
              if (!dateStr) return <div key={`e-${i}`} />
              const d = parseInt(dateStr.split('-')[2])
              const dayOfWeek = new Date(dateStr).getDay()
              const isToday = dateStr === today
              const isSelected = dateStr === selectedDate
              const hasEvents = !!eventsByDate[dateStr]?.length

              return (
                <button
                  key={dateStr}
                  onClick={() => { setSelectedDate(dateStr); setShowForm(false) }}
                  className="flex flex-col items-center py-0.5 transition-colors"
                >
                  <span
                    className="text-[12px] font-mono w-7 h-7 flex items-center justify-center"
                    style={{
                      color: isToday ? '#fff' : dayOfWeek === 0 ? '#aa8a7d' : dayOfWeek === 6 ? '#7D91AA' : '#888884',
                      backgroundColor: isToday ? '#888884' : isSelected ? '#eaeae6' : 'transparent',
                      borderRadius: 4,
                      fontWeight: isToday || isSelected ? 600 : 400,
                    }}
                  >
                    {d}
                  </span>
                  <div className="h-1 flex items-center justify-center">
                    {hasEvents && <div className="w-1 h-1 rounded-full" style={{ backgroundColor: isToday ? '#888884' : '#7D91AA' }} />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* 선택 날짜 이벤트 */}
        <div className="px-4 pt-1 pb-4 border-t border-divider">
          <div className="flex items-center justify-between py-2">
            <span className="text-[11px] font-mono text-ui font-medium">
              {selectedDate === today ? `오늘 (${selectedDate})` : selectedDate}
            </span>
            <button
              onClick={() => setShowForm(v => !v)}
              className="text-[10px] font-mono text-send-text hover:opacity-80 transition-opacity"
            >
              + 추가
            </button>
          </div>

          {showForm && (
            <div className="flex flex-col gap-2 mb-3 p-3 bg-white border border-divider" style={{ borderRadius: 4 }}>
              <input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addEvent()}
                placeholder="일정 제목"
                autoFocus
                className="bg-[#fafaf9] border border-divider text-[13px] font-mono text-ui placeholder-meta px-3 py-1.5 outline-none focus:border-[#c8c8c4]"
                style={{ borderRadius: 2 }}
              />
              <input
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="메모 (선택)"
                className="bg-[#fafaf9] border border-divider text-[12px] font-mono text-ui placeholder-meta px-3 py-1.5 outline-none focus:border-[#c8c8c4]"
                style={{ borderRadius: 2 }}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={addEvent}
                  disabled={saving || !newTitle.trim()}
                  className="bg-[#888884] text-white px-3 h-7 text-[11px] font-mono disabled:opacity-40 hover:opacity-80 transition-opacity"
                  style={{ borderRadius: 2 }}
                >
                  {saving ? '...' : '저장'}
                </button>
                <button
                  onClick={() => { setShowForm(false); setNewTitle(''); setNewDesc('') }}
                  className="text-[11px] font-mono text-meta hover:text-ui"
                >취소</button>
              </div>
            </div>
          )}

          {selectedEvents.length === 0 && !showForm && (
            <p className="text-meta text-[11px] font-mono py-3 text-center">등록된 일정이 없어요</p>
          )}

          <div className="flex flex-col gap-2">
            {selectedEvents.map(ev => (
              <div key={ev.id} className="flex items-start gap-2 p-3 bg-white border border-divider group" style={{ borderRadius: 4 }}>
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: '#7D91AA' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-mono text-ui">{ev.title}</p>
                  {ev.description && (
                    <p className="text-[11px] font-mono text-meta mt-0.5 whitespace-pre-wrap">{ev.description}</p>
                  )}
                </div>
                {isAdmin && (
                  <button
                    onClick={() => deleteEvent(ev.id)}
                    className="text-[10px] font-mono text-meta hover:text-[#aa8a7d] opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  >×</button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 다가오는 일정 */}
        {upcomingEvents.length > 0 && (
          <div className="px-4 pb-6 border-t border-divider pt-3">
            <p className="text-[9px] font-mono text-meta tracking-widest mb-2">다가오는 일정</p>
            <div className="flex flex-col gap-1">
              {upcomingEvents.slice(0, 8).map(ev => (
                <button
                  key={ev.id}
                  onClick={() => {
                    setSelectedDate(ev.date)
                    const d = new Date(ev.date + 'T00:00:00')
                    setViewDate(new Date(d.getFullYear(), d.getMonth(), 1))
                  }}
                  className="flex items-center gap-3 text-left px-2 py-1.5 hover:bg-white transition-colors"
                  style={{ borderRadius: 4 }}
                >
                  <span className="text-[10px] font-mono shrink-0" style={{ color: ev.date === today ? '#888884' : '#c8c8c4' }}>
                    {ev.date === today ? '오늘' : ev.date}
                  </span>
                  <span className="text-[12px] font-mono text-ui truncate">{ev.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
