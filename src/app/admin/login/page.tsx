'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Eye, EyeOff, Shield, Lock } from 'lucide-react'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    // Define cookie e faz reload completo para o servidor reconhecer
    document.cookie = 'admin_session=demo; path=/; max-age=86400'
    window.location.href = '/admin/dashboard'
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/[0.04] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/[0.03] rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/mcelllogo.jpeg"
              alt="M CELL"
              height={90}
              width={90}
              className="object-contain rounded-2xl drop-shadow-[0_0_28px_rgba(34,197,94,0.4)]"
              priority
            />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mb-1">
            M <span className="text-green-400">CELL</span>
          </h1>
          <p className="text-sm text-zinc-500 flex items-center justify-center gap-1.5">
            <Shield size={12} className="text-green-500/60" />
            Painel Administrativo
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-[#141414] border border-white/[0.08] p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="admin@mcell.com"
                className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500/40 focus:bg-[#202020] transition-all"
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
                  placeholder="••••••••"
                  className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl pl-10 pr-12 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500/40 focus:bg-[#202020] transition-all"
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
              className="w-full py-3 bg-green-500 hover:bg-green-400 disabled:opacity-60 text-black font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-green-500/25 text-sm flex items-center justify-center gap-2 mt-2"
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
          <a href="/" className="hover:text-zinc-400 transition-colors">← Voltar à loja</a>
        </p>
      </div>
    </div>
  )
}
