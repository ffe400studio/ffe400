import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center h-screen bg-bg">
      <div className="w-80">
        <p className="text-ui text-xs font-mono mb-8 tracking-widest uppercase">Design System</p>
        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="bg-white border border-divider text-xs font-mono text-[#7D91AA] placeholder-[#c0d4e8] px-3 py-2 outline-none focus:border-[#b0c8e0] rounded-sm"
            required
          />
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="bg-white border border-divider text-xs font-mono text-[#7D91AA] placeholder-[#c0d4e8] px-3 py-2 outline-none focus:border-[#b0c8e0] rounded-sm"
            required
          />
          {error && <p className="text-[10px] font-mono text-[#aa8a7d]">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-1 bg-white border border-divider text-xs font-mono text-send-text py-2 hover:bg-[#f0f4f8] transition-colors disabled:opacity-50 rounded-sm"
          >
            {loading ? 'signing in...' : 'sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
