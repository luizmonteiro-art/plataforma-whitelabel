'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export function BackButton({ label = 'Voltar' }: { label?: string }) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors group"
    >
      <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
      {label}
    </button>
  )
}
