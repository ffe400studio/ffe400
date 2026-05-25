import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const COLORS = ['#7DAAA0', '#827DAA', '#84843A', '#AA7D8A', '#7D91AA', '#AA9A7D', '#A07DB8', '#7DB8A0']

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export default function Board({ session, isAdmin }) {
  const [view, setView] = useState('list')
  const [topics, setTopics] = useState([])
  const [posts, setPosts] = useState([])
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [showNewTopic, setShowNewTopic] = useState(false)
  const [newTopicTitle, setNewTopicTitle] = useState('')
  const [newTopicColor, setNewTopicColor] = useState(COLORS[0])
  const [showNewPost, setShowNewPost] = useState(false)
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostLink, setNewPostLink] = useState('')
  const [newPostImage, setNewPostImage] = useState(null)
  const [newPostImagePreview, setNewPostImagePreview] = useState(null)
  const [sending, setSending] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState(null)
  const fileRef = useRef(null)
  const user = session.user

  useEffect(() => { fetchTopics() }, [])

  async function fetchTopics() {
    const { data } = await supabase.from('board_topics').select('*').order('created_at')
    if (data) setTopics(data)
  }

  async function fetchPosts(topicId) {
    const { data } = await supabase.from('board_posts').select('*').eq('topic_id', topicId).order('created_at', { ascending: false })
    if (data) setPosts(data)
  }

  async function addTopic() {
    if (!newTopicTitle.trim()) return
    const { data } = await supabase.from('board_topics').insert({
      title: newTopicTitle.trim(), color: newTopicColor, created_by: user.id,
    }).select().single()
    if (data) {
      setTopics(prev => [...prev, data])
      setNewTopicTitle('')
      setShowNewTopic(false)
    }
  }

  async function deleteTopic(id) {
    if (!window.confirm('이 주제와 모든 글을 삭제할까요?')) return
    setTopics(prev => prev.filter(t => t.id !== id))
    await supabase.from('board_topics').delete().eq('id', id)
    if (selectedTopic?.id === id) { setView('list'); setSelectedTopic(null) }
  }

  async function addPost() {
    let image_url = null
    if (newPostImage) {
      const ext = newPostImage.name.split('.').pop()
      const path = `board/${user.id}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('chat-images').upload(path, newPostImage)
      if (!error) {
        const { data: urlData } = supabase.storage.from('chat-images').getPublicUrl(path)
        image_url = urlData.publicUrl
      }
    }
    if (!newPostContent.trim() && !newPostLink.trim() && !image_url) return
    setSending(true)
    const { data } = await supabase.from('board_posts').insert({
      topic_id: selectedTopic.id, content: newPostContent.trim() || null,
      link_url: newPostLink.trim() || null, image_url, created_by: user.id,
    }).select().single()
    if (data) {
      setPosts(prev => [data, ...prev])
      setNewPostContent('')
      setNewPostLink('')
      setNewPostImage(null)
      if (newPostImagePreview) URL.revokeObjectURL(newPostImagePreview)
      setNewPostImagePreview(null)
      setShowNewPost(false)
    }
    setSending(false)
  }

  async function deletePost(id) {
    setPosts(prev => prev.filter(p => p.id !== id))
    await supabase.from('board_posts').delete().eq('id', id)
  }

  function openTopic(topic) {
    setSelectedTopic(topic)
    setView('posts')
    setPosts([])
    fetchPosts(topic.id)
    setShowNewPost(false)
  }

  function handleBack() {
    setView('list')
    setSelectedTopic(null)
    setShowNewPost(false)
    setNewPostContent('')
    setNewPostLink('')
    setNewPostImage(null)
    setNewPostImagePreview(null)
  }

  function handlePaste(e) {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (!file) continue
        setNewPostImage(file)
        if (newPostImagePreview) URL.revokeObjectURL(newPostImagePreview)
        setNewPostImagePreview(URL.createObjectURL(file))
        break
      }
    }
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setNewPostImage(file)
    if (newPostImagePreview) URL.revokeObjectURL(newPostImagePreview)
    setNewPostImagePreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  if (view === 'posts' && selectedTopic) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-divider shrink-0">
          <button onClick={handleBack} className="text-btn text-[11px] font-mono hover:text-ui">← back</button>
          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: selectedTopic.color }} />
          <span className="text-ui text-[13px] font-mono flex-1 truncate">{selectedTopic.title}</span>
          {isAdmin && (
            <button onClick={() => deleteTopic(selectedTopic.id)} className="text-[10px] font-mono text-meta hover:text-[#aa8a7d] transition-colors">
              delete
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
          {posts.length === 0 && (
            <p className="text-meta text-[11px] font-mono text-center py-8">아직 글이 없어요</p>
          )}
          {posts.map(post => (
            <div key={post.id} className="border border-divider bg-white p-3 group relative" style={{ borderRadius: 4 }}>
              {post.content && (
                <p className="text-[13px] font-mono text-ui leading-relaxed whitespace-pre-wrap mb-2">{post.content}</p>
              )}
              {post.link_url && (
                <a href={post.link_url} target="_blank" rel="noopener noreferrer"
                  className="block text-[11px] font-mono text-[#7D91AA] hover:opacity-70 underline truncate mb-2">
                  {post.link_url}
                </a>
              )}
              {post.image_url && (
                <button onClick={() => setLightboxUrl(post.image_url)} className="block mb-2">
                  <img src={post.image_url} alt="" className="max-h-48 max-w-full object-cover border border-divider hover:opacity-80 transition-opacity" style={{ borderRadius: 2 }} />
                </button>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-meta">{formatDate(post.created_at)}</span>
                {isAdmin && (
                  <button onClick={() => deletePost(post.id)}
                    className="text-[10px] font-mono text-meta hover:text-[#aa8a7d] opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="shrink-0 bg-input-bg px-4 pt-3 pb-3">
          {showNewPost ? (
            <div className="flex flex-col gap-2">
              {newPostImagePreview && (
                <div className="flex items-center gap-2">
                  <img src={newPostImagePreview} alt="preview" className="h-14 w-14 object-cover border border-white/40" style={{ borderRadius: 2 }} />
                  <button onClick={() => { setNewPostImage(null); if (newPostImagePreview) URL.revokeObjectURL(newPostImagePreview); setNewPostImagePreview(null) }}
                    className="text-[10px] font-mono text-[#7D91AA] hover:opacity-70">remove</button>
                </div>
              )}
              <textarea
                value={newPostContent}
                onChange={e => setNewPostContent(e.target.value)}
                onPaste={handlePaste}
                placeholder="내용 (선택) — 사진 붙여넣기 가능"
                rows={2}
                className="bg-white text-[13px] font-mono text-send-text placeholder-input-placeholder px-3 py-2 outline-none border border-white/20 resize-none"
                style={{ borderRadius: 2 }}
              />
              <input
                value={newPostLink}
                onChange={e => setNewPostLink(e.target.value)}
                placeholder="링크 URL (선택)"
                className="bg-white text-[13px] font-mono text-send-text placeholder-input-placeholder px-3 py-1.5 outline-none border border-white/20 h-8"
                style={{ borderRadius: 2 }}
              />
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="bg-white w-7 h-7 flex items-center justify-center hover:bg-[#f0f4f8] border border-white/20 transition-colors"
                  style={{ borderRadius: 2 }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <rect x="1" y="2" width="10" height="8" rx="1" stroke="#7D91AA" strokeWidth="1"/>
                    <circle cx="4" cy="5" r="1" fill="#7D91AA"/>
                    <path d="M1 8.5L4 6L6.5 8L8.5 6.5L11 9" stroke="#7D91AA" strokeWidth="1" strokeLinejoin="round"/>
                  </svg>
                </button>
                <input type="file" ref={fileRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                <button onClick={addPost} disabled={sending}
                  className="bg-white px-3 h-7 text-[11px] font-mono text-send-text hover:bg-[#f0f4f8] border border-white/20 disabled:opacity-50 transition-colors"
                  style={{ borderRadius: 2 }}>
                  {sending ? '...' : 'post'}
                </button>
                <button onClick={() => { setShowNewPost(false); setNewPostContent(''); setNewPostLink('') }}
                  className="text-[11px] font-mono text-meta hover:text-ui">cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowNewPost(true)} className="text-[11px] font-mono text-send-text hover:opacity-80">
              + new post
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

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2">
        {topics.length === 0 && !showNewTopic && (
          <p className="text-meta text-[11px] font-mono text-center py-8">주제를 추가해보세요</p>
        )}
        {topics.map(topic => (
          <button
            key={topic.id}
            onClick={() => openTopic(topic)}
            className="flex items-center gap-3 px-4 py-3 bg-white border border-divider hover:bg-[#f5f5f2] transition-colors text-left w-full"
            style={{ borderRadius: 4 }}
          >
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: topic.color }} />
            <span className="text-[13px] font-mono text-ui flex-1">{topic.title}</span>
            <span className="text-[10px] font-mono text-meta">→</span>
          </button>
        ))}
      </div>

      <div className="shrink-0 bg-input-bg px-4 pt-3 pb-3">
        {showNewTopic ? (
          <div className="flex flex-col gap-2">
            <input
              value={newTopicTitle}
              onChange={e => setNewTopicTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTopic()}
              placeholder="주제 이름"
              autoFocus
              className="bg-white text-[13px] font-mono text-send-text placeholder-input-placeholder px-3 py-1.5 outline-none border border-white/20 h-8"
              style={{ borderRadius: 2 }}
            />
            <div className="flex items-center gap-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => setNewTopicColor(c)}
                  className="w-4 h-4 rounded-full transition-transform hover:scale-110"
                  style={{ backgroundColor: c, outline: newTopicColor === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }} />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={addTopic}
                className="bg-white px-3 h-7 text-[11px] font-mono text-send-text hover:bg-[#f0f4f8] border border-white/20 transition-colors"
                style={{ borderRadius: 2 }}>add</button>
              <button onClick={() => { setShowNewTopic(false); setNewTopicTitle('') }}
                className="text-[11px] font-mono text-meta hover:text-ui">cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowNewTopic(true)} className="text-[11px] font-mono text-send-text hover:opacity-80">
            + new topic
          </button>
        )}
      </div>
    </div>
  )
}
