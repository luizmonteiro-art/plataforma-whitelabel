'use client'

import React, { useState, useEffect } from 'react'
import { Settings, Save, Smartphone, Clock, Phone, Palette, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { getStoreConfig, updateStoreConfig, type StoreConfig } from '@/lib/db'
import { useAdminStore } from '@/contexts/AdminStore'

type FieldItem = { key: keyof StoreConfig; label: string; placeholder: string; multiline?: boolean }

const PRESET_COLORS = ['#22c55e', '#3b82f6', '#f97316', '#8b5cf6', '#ef4444', '#ec4899', '#06b6d4', '#eab308']

export default function ConfiguracoesAdminPage() {
  const { storeId } = useAdminStore()
  const [config, setConfig] = useState<Partial<StoreConfig>>({
    store_name: '',
    whatsapp: '',
    phone: '',
    address: '',
    instagram: '',
    hours_weekday: '08:00 - 18:00',
    hours_saturday: '08:00 - 13:00',
    accent_color: '#22c55e',
    about: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'saved' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    getStoreConfig(storeId)
      .then(data => {
        if (data) setConfig(data)
        setStatus('idle')
      })
      .catch(() => {
        setStatus('error')
        setErrorMsg('Erro ao carregar configurações. Verifique a conexão com o Supabase.')
      })
  }, [storeId])

  const handleSave = async () => {
    setStatus('saving')
    try {
      await updateStoreConfig(storeId, config)
      setStatus('saved')
      // Atualiza a cor no tema ao vivo
      if (config.accent_color) {
        document.documentElement.style.setProperty('--accent', config.accent_color)
      }
      setTimeout(() => setStatus('idle'), 2500)
    } catch (e) {
      setStatus('error')
      setErrorMsg(e instanceof Error ? e.message : 'Erro ao salvar')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  const set = (key: keyof StoreConfig, value: string) =>
    setConfig(c => ({ ...c, [key]: value }))

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-3 text-zinc-500 py-12">
        <Loader2 size={18} className="animate-spin" />
        Carregando configurações...
      </div>
    )
  }

  const fields: { section: string; icon: React.ElementType; items: FieldItem[] }[] = [
    { section: 'Identidade da loja', icon: Smartphone, items: [
      { key: 'store_name' as const, label: 'Nome da loja', placeholder: 'M CELL' },
      { key: 'about' as const,      label: 'Descrição / Sobre', placeholder: 'Descreva sua loja...', multiline: true },
    ]},
    { section: 'Contato', icon: Phone, items: [
      { key: 'whatsapp' as const,  label: 'WhatsApp (somente números)', placeholder: '11999999999' },
      { key: 'phone' as const,     label: 'Telefone exibido',           placeholder: '(11) 99999-9999' },
      { key: 'instagram' as const, label: 'Instagram',                  placeholder: '@sualoja' },
      { key: 'address' as const,   label: 'Endereço',                   placeholder: 'Rua, Número — Bairro, Cidade/UF' },
    ]},
    { section: 'Horários', icon: Clock, items: [
      { key: 'hours_weekday' as const,  label: 'Segunda a Sexta', placeholder: '08:00 - 18:00' },
      { key: 'hours_saturday' as const, label: 'Sábado',          placeholder: '08:00 - 13:00' },
    ]},
  ]

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Dados da loja, horários e identidade visual — salvo no banco de dados</p>
      </div>

      {status === 'error' && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          <AlertCircle size={14} /> {errorMsg}
        </div>
      )}

      {fields.map(({ section, icon: Icon, items }) => (
        <div key={section} className="rounded-2xl bg-[#141414] border border-white/[0.06] overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.04]">
            <Icon size={14} className="text-green-400" />
            <h3 className="text-sm font-semibold text-white">{section}</h3>
          </div>
          <div className="p-5 space-y-4">
            {items.map(({ key, label, placeholder, multiline }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">{label}</label>
                {multiline ? (
                  <textarea
                    value={(config[key] as string) ?? ''}
                    onChange={e => set(key, e.target.value)}
                    placeholder={placeholder}
                    rows={3}
                    className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500/40 resize-none transition-all"
                  />
                ) : (
                  <input
                    value={(config[key] as string) ?? ''}
                    onChange={e => set(key, e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500/40 transition-all"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Cor da marca */}
      <div className="rounded-2xl bg-[#141414] border border-white/[0.06] overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.04]">
          <Palette size={14} className="text-green-400" />
          <h3 className="text-sm font-semibold text-white">Cor da marca</h3>
        </div>
        <div className="p-5">
          <label className="block text-xs font-medium text-zinc-400 mb-3">Cor de destaque — aplicada em botões, badges e destaques da vitrine</label>
          <div className="flex items-center gap-4 flex-wrap">
            <input
              type="color"
              value={config.accent_color ?? '#22c55e'}
              onChange={e => set('accent_color', e.target.value)}
              className="w-12 h-12 rounded-xl border border-white/[0.08] cursor-pointer bg-transparent p-1 flex-shrink-0"
            />
            <div>
              <p className="text-sm font-mono text-white">{config.accent_color ?? '#22c55e'}</p>
              <p className="text-xs text-zinc-600 mt-0.5">Clique para abrir o seletor de cor</p>
            </div>
            <div className="ml-auto flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => set('accent_color', color)}
                  title={color}
                  className="w-7 h-7 rounded-lg border-2 transition-all hover:scale-110"
                  style={{
                    backgroundColor: color,
                    borderColor: config.accent_color === color ? 'white' : 'transparent',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Preview da cor */}
      <div
        className="rounded-2xl p-5 border"
        style={{
          background: `${config.accent_color}12`,
          borderColor: `${config.accent_color}30`,
        }}
      >
        <p className="text-xs text-zinc-400 mb-3">Preview — como ficará na vitrine:</p>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-white"
            style={{ backgroundColor: config.accent_color ?? '#22c55e' }}
          >
            Ver produto
          </button>
          <button
            className="px-5 py-2.5 rounded-xl font-bold text-sm border"
            style={{
              borderColor: config.accent_color ?? '#22c55e',
              color: config.accent_color ?? '#22c55e',
            }}
          >
            Agendar serviço
          </button>
          <span
            className="px-3 py-1 rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: config.accent_color ?? '#22c55e' }}
          >
            Em estoque
          </span>
        </div>
      </div>

      {/* Salvar */}
      <button
        onClick={handleSave}
        disabled={status === 'saving'}
        className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-60"
        style={{
          backgroundColor: config.accent_color ?? '#22c55e',
          color: 'black',
        }}
      >
        {status === 'saving' ? (
          <><Loader2 size={15} className="animate-spin" /> Salvando...</>
        ) : status === 'saved' ? (
          <><CheckCircle2 size={15} /> Salvo com sucesso!</>
        ) : (
          <><Save size={15} /> Salvar configurações</>
        )}
      </button>

      <p className="text-xs text-zinc-600">
        Store ID: <span className="font-mono text-zinc-400">{storeId || 'não definido'}</span>
      </p>
    </div>
  )
}
