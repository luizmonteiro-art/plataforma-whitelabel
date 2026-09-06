'use client'

import Link from 'next/link'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Shield, Lock, AlertCircle } from 'lucide-react'
import { getSupabaseBrowser, supabaseConfigured } from '@/lib/supabase-browser'

function getSafeNextPath(rawNext: string | null) {
  if (!rawNext) return '/admin/dashboard'
  if (!rawNext.startsWith('/') || rawNext.startsWith('//')) return '/admin/dashboard'
  return rawNext
}

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const nextPath = getSafeNextPath(searchParams.get('next'))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = getSupabaseBrowser()

    if (!supabase || !supabaseConfigured) {
      if (process.env.NODE_ENV !== 'production') {
        window.location.href = nextPath
      } else {
        setError('Login indisponivel: configuracao do servidor ausente. Contate o suporte.')
        setLoading(false)
      }
      return
    }

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Email ou senha incorretos.')
      setLoading(false)
      return
    }

    window.location.href = nextPath
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--accent)]/[0.04] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--accent)]/[0.03] rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <span className="flex h-[90px] w-[90px] items-center justify-center rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 drop-shadow-[0_0_28px_color-mix(in_srgb,var(--accent)_30%,transparent)]">
              <Shield size={40} className="text-[var(--accent)]" />
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mb-1">Painel da Loja</h1>
          <p className="text-sm text-zinc-500 flex items-center justify-center gap-1.5">
            <Shield size={12} className="text-[var(--accent)]/60" />
            Acesso administrativo
          </p>
        </div>

        <div className="rounded-2xl bg-[#141414] border border-white/[0.08] p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                <AlertCircle size={14} className="flex-shrink-0" />
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--accent)]/40 focus:bg-[#202020] transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Senha</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="********"
                  className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl pl-10 pr-12 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--accent)]/40 focus:bg-[#202020] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors"
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[var(--accent)] hover:bg-[var(--accent)] disabled:opacity-60 text-black font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-[var(--accent)]/25 text-sm flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Entrando...</>
              ) : (
                'Entrar no painel'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-700 mt-6">
          <Link href="/" className="hover:text-zinc-400 transition-colors">Voltar a loja</Link>
        </p>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
