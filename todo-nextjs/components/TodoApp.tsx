'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { supabase } from '@/lib/supabase';

type FilterType = 'all' | 'active' | 'completed';
type Priority = 'high' | 'medium' | 'low';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  priority: Priority;
  due_date: string;
  tags: string[];
  position: number;
  image_url?: string | null;
}

const PRIORITY_LABEL: Record<Priority, string> = { high: '높음', medium: '보통', low: '낮음' };

const TAG_PRESET_COLORS = [
  '#6c63ff', '#2196f3', '#4caf50', '#ff9800',
  '#f44336', '#e91e63', '#009688', '#795548',
];

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [tagColors, setTagColors] = useState<Record<string, string>>({});
  const [colorPickerKey, setColorPickerKey] = useState<string | null>(null);
  const colorPickerRef = useRef<HTMLDivElement | null>(null);

  // Image states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved === 'true') setDarkMode(true);
    const savedColors = localStorage.getItem('tagColors');
    if (savedColors) setTagColors(JSON.parse(savedColors));
    fetchTodos();
  }, []);

  useEffect(() => {
    if (!colorPickerKey) return;
    function handleClickOutside(e: MouseEvent) {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setColorPickerKey(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [colorPickerKey]);

  useEffect(() => {
    document.body.style.background = darkMode ? '#121212' : '#f0f2f5';
  }, [darkMode]);

  // Close lightbox on Escape key
  useEffect(() => {
    if (!lightboxUrl) return;
    function handleKeyUp(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape') setLightboxUrl(null);
    }
    document.addEventListener('keyup', handleKeyUp);
    return () => document.removeEventListener('keyup', handleKeyUp);
  }, [lightboxUrl]);

  function updateTagColor(tag: string, color: string) {
    setTagColors(prev => {
      const next = { ...prev, [tag]: color };
      localStorage.setItem('tagColors', JSON.stringify(next));
      return next;
    });
  }

  function toggleDarkMode() {
    setDarkMode(prev => {
      localStorage.setItem('darkMode', String(!prev));
      return !prev;
    });
  }

  async function fetchTodos() {
    const { data } = await supabase
      .from('todos')
      .select('*')
      .order('position', { ascending: true });
    if (data) setTodos(data as Todo[]);
    setLoading(false);
  }

  // ── Image helpers ──────────────────────────────────

  function processImageFile(file: File) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      alert('JPG, PNG, GIF, WebP 형식만 지원합니다.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      alert('파일 크기는 최대 5MB까지 가능합니다.');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function clearImageSelection() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function uploadImage(file: File): Promise<string | null> {
    const ext = file.name.split('.').pop() ?? 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;

    const { data, error } = await supabase.storage
      .from('todo-images')
      .upload(fileName, file, { contentType: file.type });

    if (error) {
      console.error('이미지 업로드 에러:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('todo-images')
      .getPublicUrl(data.path);

    return publicUrl;
  }

  async function deleteImageFromStorage(imageUrl: string) {
    try {
      const parts = imageUrl.split('/todo-images/');
      if (parts.length < 2) return;
      await supabase.storage.from('todo-images').remove([parts[1]]);
    } catch (e) {
      console.error('이미지 삭제 에러:', e);
    }
  }

  // ── Image drag-and-drop (input section) ────────────

  function handleImageDragEnter(e: React.DragEvent) {
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      setIsDraggingImage(true);
    }
  }

  function handleImageDragOver(e: React.DragEvent) {
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  }

  function handleImageDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDraggingImage(false);
    }
  }

  function handleImageDrop(e: React.DragEvent) {
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      setIsDraggingImage(false);
      const file = e.dataTransfer.files[0];
      if (file) processImageFile(file);
    }
  }

  // ── CRUD ───────────────────────────────────────────

  async function addTodo() {
    const text = input.trim();
    if (!text) return;
    const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
    const position = todos.length > 0 ? Math.max(...todos.map(t => t.position)) + 1 : 0;

    setUploading(true);
    let image_url: string | null = null;
    if (imageFile) {
      image_url = await uploadImage(imageFile);
    }
    setUploading(false);

    const { error } = await supabase
      .from('todos')
      .insert({ text, completed: false, priority, due_date: dueDate || null, tags, position, image_url });

    if (error) { console.error('Supabase 에러:', error); return; }
    await fetchTodos();
    setInput('');
    setTagInput('');
    setDueDate('');
    setPriority('medium');
    clearImageSelection();
  }

  async function toggleTodo(id: number) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    const completed = !todo.completed;
    await supabase.from('todos').update({ completed }).eq('id', id);
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed } : t));
  }

  async function deleteTodo(id: number) {
    const todo = todos.find(t => t.id === id);
    if (todo?.image_url) {
      await deleteImageFromStorage(todo.image_url);
    }
    await supabase.from('todos').delete().eq('id', id);
    setTodos(prev => prev.filter(t => t.id !== id));
  }

  async function clearCompleted() {
    const completedTodos = todos.filter(t => t.completed);
    if (completedTodos.length === 0) return;

    // Delete images from storage
    await Promise.all(
      completedTodos
        .filter(t => t.image_url)
        .map(t => deleteImageFromStorage(t.image_url!))
    );

    const completedIds = completedTodos.map(t => t.id);
    await supabase.from('todos').delete().in('id', completedIds);
    setTodos(prev => prev.filter(t => !t.completed));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') addTodo();
  }

  function startEdit(todo: Todo) {
    setEditingId(todo.id);
    setEditingText(todo.text);
  }

  async function submitEdit(id: number) {
    const text = editingText.trim();
    if (text) {
      await supabase.from('todos').update({ text }).eq('id', id);
      setTodos(prev => prev.map(t => t.id === id ? { ...t, text } : t));
    }
    setEditingId(null);
  }

  function handleEditKeyDown(e: KeyboardEvent<HTMLInputElement>, id: number) {
    if (e.key === 'Enter') submitEdit(id);
    if (e.key === 'Escape') setEditingId(null);
  }

  function handleDragStart(id: number) {
    setDragId(id);
  }

  function handleDragOver(e: React.DragEvent, id: number) {
    e.preventDefault();
    setDragOverId(id);
  }

  async function handleDrop(targetId: number) {
    if (dragId === null || dragId === targetId) {
      setDragId(null);
      setDragOverId(null);
      return;
    }
    const next = [...todos];
    const fromIdx = next.findIndex(t => t.id === dragId);
    const toIdx = next.findIndex(t => t.id === targetId);
    const [item] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, item);

    const updated = next.map((t, i) => ({ ...t, position: i }));
    setTodos(updated);

    // position 일괄 업데이트
    await Promise.all(
      updated.map(t => supabase.from('todos').update({ position: t.position }).eq('id', t.id))
    );

    setDragId(null);
    setDragOverId(null);
  }

  function handleDragEnd() {
    setDragId(null);
    setDragOverId(null);
  }

  const filtered = todos.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const remainCount = todos.filter(t => !t.completed).length;

  return (
    <div className={`container${darkMode ? ' dark' : ''}`}>
      <div className="title-row">
        <h1 className="title">오늘 할 일</h1>
        <button className="dark-toggle" onClick={toggleDarkMode} title="다크모드 전환">
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>

      <div
        className={`input-section${isDraggingImage ? ' image-dropzone-active' : ''}`}
        onDragEnter={handleImageDragEnter}
        onDragOver={handleImageDragOver}
        onDragLeave={handleImageDragLeave}
        onDrop={handleImageDrop}
      >
        <div className="input-row">
          <input
            type="text"
            className="todo-input"
            placeholder="할 일을 입력하세요..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
          <button className="add-btn" onClick={addTodo} disabled={uploading}>
            {uploading ? '...' : '추가'}
          </button>
        </div>

        <div className="extra-inputs">
          <select
            className="priority-select"
            value={priority}
            onChange={e => setPriority(e.target.value as Priority)}
          >
            <option value="high">🔴 높음</option>
            <option value="medium">🟡 보통</option>
            <option value="low">🟢 낮음</option>
          </select>

          <input
            type="date"
            className="date-input"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
          />

          <input
            type="text"
            className="tag-input"
            placeholder="태그 (쉼표로 구분)"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
          />

          <button
            className="image-attach-btn"
            onClick={() => fileInputRef.current?.click()}
            title="이미지 첨부 (JPG·PNG·GIF·WebP, 최대 5MB)"
            type="button"
          >
            📎
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden-file-input"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) processImageFile(file);
            }}
          />
        </div>

        {/* 이미지 미리보기 */}
        {imagePreview && (
          <div className="image-preview-container" data-testid="image-preview">
            <img src={imagePreview} alt="첨부 이미지 미리보기" className="image-preview-thumb" />
            <span className="image-preview-name">{imageFile?.name}</span>
            <button
              className="image-preview-remove"
              onClick={clearImageSelection}
              title="이미지 제거"
              type="button"
              aria-label="이미지 제거"
            >
              ×
            </button>
          </div>
        )}

        {/* 드래그 안내 */}
        {isDraggingImage && (
          <div className="image-drop-indicator" data-testid="drop-indicator">
            이미지를 여기에 놓으세요
          </div>
        )}

        {tagInput.trim() && (
          <div className="tag-preview-row">
            <span className="tag-preview-label">색상 지정</span>
            {tagInput.split(',').map(t => t.trim()).filter(Boolean).map(tag => {
              const pickerKey = `input-${tag}`;
              const isOpen = colorPickerKey === pickerKey;
              const color = tagColors[tag];
              return (
                <span key={tag} className="tag-color-wrapper">
                  <span
                    className="tag"
                    style={color ? { backgroundColor: color + '26', color } : undefined}
                    onClick={() => setColorPickerKey(isOpen ? null : pickerKey)}
                    title="클릭하여 색상 지정"
                  >
                    #{tag}
                  </span>
                  {isOpen && (
                    <div className="color-picker-popup" ref={colorPickerRef}>
                      {TAG_PRESET_COLORS.map(c => (
                        <button
                          key={c}
                          className={`color-swatch${color === c ? ' selected' : ''}`}
                          style={{ background: c }}
                          onClick={() => { updateTagColor(tag, c); setColorPickerKey(null); }}
                        />
                      ))}
                      <input
                        type="color"
                        className="color-custom-input"
                        value={color || '#6c63ff'}
                        onChange={e => updateTagColor(tag, e.target.value)}
                        title="직접 색상 선택"
                      />
                    </div>
                  )}
                </span>
              );
            })}
          </div>
        )}
      </div>

      <div className="filters">
        {(['all', 'active', 'completed'] as FilterType[]).map(f => (
          <button
            key={f}
            className={`filter-btn${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? '전체' : f === 'active' ? '진행 중' : '완료'}
          </button>
        ))}
      </div>

      <ul className="todo-list">
        {loading ? (
          <li className="empty-msg">불러오는 중...</li>
        ) : filtered.length === 0 ? (
          <li className="empty-msg">할 일이 없어요 🎉</li>
        ) : (
          filtered.map(todo => (
            <li
              key={todo.id}
              className={[
                'todo-item',
                todo.completed ? 'completed' : '',
                dragOverId === todo.id ? 'drag-over' : '',
                dragId === todo.id ? 'dragging' : '',
              ].filter(Boolean).join(' ')}
              draggable
              onDragStart={() => handleDragStart(todo.id)}
              onDragOver={e => handleDragOver(e, todo.id)}
              onDrop={() => handleDrop(todo.id)}
              onDragEnd={handleDragEnd}
            >
              <span className="drag-handle" title="드래그하여 순서 변경">⠿</span>
              <span className={`priority-dot priority-${todo.priority}`} title={PRIORITY_LABEL[todo.priority]} />
              <input
                type="checkbox"
                className="todo-check"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
              />
              <div className="todo-content">
                {editingId === todo.id ? (
                  <input
                    className="edit-input"
                    value={editingText}
                    onChange={e => setEditingText(e.target.value)}
                    onKeyDown={e => handleEditKeyDown(e, todo.id)}
                    onBlur={() => submitEdit(todo.id)}
                    autoFocus
                  />
                ) : (
                  <span
                    className="todo-text"
                    onDoubleClick={() => !todo.completed && startEdit(todo)}
                    title="더블클릭하여 수정"
                  >
                    {todo.text}
                  </span>
                )}
                {(todo.due_date || todo.tags.length > 0) && (
                  <div className="todo-meta">
                    {todo.due_date && (
                      <span className={`due-date${isOverdue(todo) ? ' overdue' : ''}`}>
                        📅 {formatDate(todo.due_date)}
                      </span>
                    )}
                    {todo.tags.map(tag => {
                      const pickerKey = `${todo.id}-${tag}`;
                      const isOpen = colorPickerKey === pickerKey;
                      const color = tagColors[tag];
                      return (
                        <span key={tag} className="tag-color-wrapper">
                          <span
                            className="tag"
                            style={color ? { backgroundColor: color + '26', color } : undefined}
                            onClick={() => setColorPickerKey(isOpen ? null : pickerKey)}
                            title="클릭하여 색상 변경"
                          >
                            #{tag}
                          </span>
                          {isOpen && (
                            <div className="color-picker-popup" ref={colorPickerRef}>
                              {TAG_PRESET_COLORS.map(c => (
                                <button
                                  key={c}
                                  className={`color-swatch${color === c ? ' selected' : ''}`}
                                  style={{ background: c }}
                                  onClick={() => { updateTagColor(tag, c); setColorPickerKey(null); }}
                                />
                              ))}
                              <input
                                type="color"
                                className="color-custom-input"
                                value={color || '#6c63ff'}
                                onChange={e => updateTagColor(tag, e.target.value)}
                                title="직접 색상 선택"
                              />
                            </div>
                          )}
                        </span>
                      );
                    })}
                  </div>
                )}
                {/* 첨부 이미지 썸네일 */}
                {todo.image_url && (
                  <div className="todo-image-wrap">
                    <img
                      src={todo.image_url}
                      alt="첨부 이미지"
                      className="todo-image"
                      onClick={() => setLightboxUrl(todo.image_url!)}
                      title="클릭하여 확대"
                    />
                  </div>
                )}
              </div>
              <button className="delete-btn" onClick={() => deleteTodo(todo.id)}>×</button>
            </li>
          ))
        )}
      </ul>

      <div className="footer">
        <span className="remain-count">{remainCount}개 남음</span>
        <button className="clear-btn" onClick={clearCompleted}>완료 항목 삭제</button>
      </div>

      {/* 이미지 라이트박스 */}
      {lightboxUrl && (
        <div
          className="lightbox-overlay"
          onClick={() => setLightboxUrl(null)}
          data-testid="lightbox"
        >
          <button
            className="lightbox-close"
            onClick={() => setLightboxUrl(null)}
            aria-label="닫기"
          >
            ×
          </button>
          <img
            src={lightboxUrl}
            alt="첨부 이미지 확대"
            className="lightbox-img"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function isOverdue(todo: Todo) {
  if (!todo.due_date || todo.completed) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(todo.due_date + 'T00:00:00') < today;
}
