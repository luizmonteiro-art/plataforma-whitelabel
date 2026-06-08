'use client'

import { useState } from 'react'
import { Hexagon, Eye, EyeOff, Lock, AlertCircle, ShieldCheck } from 'lucide-react'
import { getSupabaseBrowser, supabaseConfigured } from '@/lib/supabase-browser'

export default function SuperadminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = getSupabaseBrowser()
    if (!supabase || !supabaseConfigured) {
      window.location.href = '/superadmin'
      return
    }

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError('E-mail ou senha incorretos.')
      setLoading(false)
      return
    }
    window.location.href = '/superadmin'
  }

  return (
    <div className="min-h-screen bg-[#0a0d0a] flex items-center justify-center p-4">
      {/* glow MODUS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-[28rem] h-[28rem] bg-green-500/[0.06] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-[28rem] h-[28rem] bg-emerald-500/[0.04] rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400/20 to-emerald-600/20 border border-green-500/30 shadow-[0_0_28px_rgba(34,197,94,0.3)]">
              <Hexagon size={28} className="text-green-400 fill-green-400/20" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Super<span className="text-green-400">admin</span></h1>
          <p className="text-sm text-zinc-500 flex items-center justify-center gap-1.5 mt-1">
            <ShieldCheck size={12} className="text-green-500/60" />
            Painel da plataforma
          </p>
        </div>

        <div className="rounded-3xl bg-[#0f120f] border border-white/[0.08] p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                <AlertCircle size={14} className="flex-shrink-0" /> {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">E-mail</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="luiz@plataforma.com"
                className="w-full bg-[#161a16] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500/40 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Senha</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input
                  type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  className="w-full bg-[#161a16] border border-white/[0.08] rounded-xl pl-10 pr-12 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500/40 transition-all"
                />
                <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors">
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full py-3 bg-green-500 hover:bg-green-400 disabled:opacity-60 text-black font-bold rounded-full transition-all hover:shadow-lg hover:shadow-green-500/25 text-sm flex items-center justify-center gap-2 mt-2"
            >
              {loading
                ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Entrando...</>
                : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
