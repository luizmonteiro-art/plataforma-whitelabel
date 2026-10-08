'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, AlertCircle, ShieldCheck } from 'lucide-react'
import { getSupabaseBrowser, supabaseConfigured } from '@/lib/supabase-browser'
import { ModsLogo } from '@/components/brand/ModsLogo'

export default function SuperadminLoginPage() {
  const router = useRouter()
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
      if (process.env.NODE_ENV !== 'production') {
        router.push('/superadmin')
      } else {
        setError('Login indisponivel: configuracao do servidor ausente. Verifique o Supabase.')
        setLoading(false)
      }
      return
    }

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError('E-mail ou senha incorretos.')
      setLoading(false)
      return
    }
    router.push('/superadmin')
  }

  return (
    <div className="min-h-screen bg-[#07130f] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-[28rem] h-[28rem] bg-[#79e2ad]/[0.08] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-[28rem] h-[28rem] bg-[#315e4d]/[0.12] rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mb-5 flex justify-center"><ModsLogo width={188} priority /></div>
          <h1 className="text-xl font-bold text-white tracking-tight">Central de controle</h1>
          <p className="text-sm text-zinc-500 flex items-center justify-center gap-1.5 mt-1">
            <ShieldCheck size={12} className="text-[#79e2ad]/70" />
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
                placeholder="seu@email.com"
                className="w-full bg-[#0d211b] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#79e2ad]/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Senha</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input
                  type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="********"
                  className="w-full bg-[#0d211b] border border-white/[0.08] rounded-xl pl-10 pr-12 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#79e2ad]/50 transition-all"
                />
                <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors">
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full py-3 bg-[#79e2ad] hover:bg-[#9decc2] disabled:opacity-60 text-[#0b1b16] font-bold rounded-full transition-all hover:shadow-lg hover:shadow-[#79e2ad]/20 text-sm flex items-center justify-center gap-2 mt-2"
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
