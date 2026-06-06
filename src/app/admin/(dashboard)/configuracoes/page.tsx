'use client'

import { useState } from 'react'
import { Settings, Save, Smartphone, Clock, Phone, MapPin, AtSign, Palette, RotateCcw, Database } from 'lucide-react'
import { useAdminStore } from '@/contexts/AdminStore'

export default function ConfiguracoesAdminPage() {
  const { resetToDefaults, products, serviceOrders, appointments } = useAdminStore()
  const [config, setConfig] = useState({
    store_name: 'M CELL',
    whatsapp: '11999999999',
    phone: '(11) 99999-9999',
    address: 'Rua das Flores, 123 — Centro, São Paulo/SP',
    instagram: '@M CELLstore',
    hours_weekday: '08:00 - 18:00',
    hours_saturday: '08:00 - 13:00',
    accent_color: '#22c55e',
    about: 'Loja especializada em iPhones e smartphones, oferecendo aparelhos seminovos e lacrados com assistência técnica especializada.',
  })
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const fields = [
    { section: 'Identidade da loja', icon: Smartphone, items: [
      { key: 'store_name', label: 'Nome da loja', placeholder: 'M CELL' },
      { key: 'about', label: 'Descrição / Sobre', placeholder: 'Descreva sua loja...', multiline: true },
    ]},
    { section: 'Contato', icon: Phone, items: [
      { key: 'whatsapp', label: 'WhatsApp (somente números)', placeholder: '11999999999' },
      { key: 'phone', label: 'Telefone exibido', placeholder: '(11) 99999-9999' },
      { key: 'instagram', label: 'Instagram', placeholder: '@mmcell' },
      { key: 'address', label: 'Endereço', placeholder: 'Rua, Número — Bairro, Cidade/UF' },
    ]},
    { section: 'Horários', icon: Clock, items: [
      { key: 'hours_weekday', label: 'Segunda a Sexta', placeholder: '08:00 - 18:00' },
      { key: 'hours_saturday', label: 'Sábado', placeholder: '08:00 - 13:00' },
    ]},
  ]

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Dados da loja, horários e identidade visual</p>
      </div>

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
                    value={(config as Record<string, string>)[key]}
                    onChange={e => setConfig(c => ({ ...c, [key]: e.target.value }))}
                    placeholder={placeholder}
                    rows={3}
                    className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500/40 resize-none transition-all"
                  />
                ) : (
                  <input
                    value={(config as Record<string, string>)[key]}
                    onChange={e => setConfig(c => ({ ...c, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500/40 transition-all"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Brand color */}
      <div className="rounded-2xl bg-[#141414] border border-white/[0.06] overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.04]">
          <Palette size={14} className="text-green-400" />
          <h3 className="text-sm font-semibold text-white">Cor da marca</h3>
        </div>
        <div className="p-5">
          <label className="block text-xs font-medium text-zinc-400 mb-3">Cor de destaque (botões, links, destaques)</label>
          <div className="flex items-center gap-4">
            <input
              type="color"
              value={config.accent_color}
              onChange={e => setConfig(c => ({ ...c, accent_color: e.target.value }))}
              className="w-12 h-12 rounded-xl border border-white/[0.08] cursor-pointer bg-transparent p-1"
            />
            <div>
              <p className="text-sm font-mono text-white">{config.accent_color}</p>
              <p className="text-xs text-zinc-600 mt-0.5">Aplicado em botões, badges e destaques</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {['#22c55e', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#ec4899'].map(color => (
                <button
                  key={color}
                  onClick={() => setConfig(c => ({ ...c, accent_color: color }))}
                  className="w-7 h-7 rounded-lg border-2 transition-all hover:scale-110"
                  style={{ backgroundColor: color, borderColor: config.accent_color === color ? 'white' : 'transparent' }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-green-500/25 text-sm active:scale-95"
        >
          <Save size={15} />
          {saved ? 'Salvo!' : 'Salvar configurações'}
        </button>

        {/* Status do store */}
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#141414] border border-white/[0.06]">
          <Database size={13} className="text-green-400" />
          <span className="text-xs text-zinc-400">
            {products.length} produtos · {serviceOrders.length} O.S. · {appointments.length} agendamentos
          </span>
          <span className="text-[10px] text-green-500/60 bg-green-500/10 px-1.5 py-0.5 rounded-full font-medium">Salvo localmente</span>
        </div>
      </div>

      {/* Reset */}
      <div className="rounded-2xl bg-red-500/[0.04] border border-red-500/20 p-5">
        <div className="flex items-start gap-4">
          <RotateCcw size={18} className="text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-white mb-0.5">Restaurar dados originais</p>
            <p className="text-xs text-zinc-500 mb-4">Apaga todas as alterações feitas no admin e volta aos dados de demonstração. Esta ação não pode ser desfeita.</p>
            <button
              onClick={() => { if (confirm('Tem certeza? Todos os dados do admin serão resetados para o padrão.')) resetToDefaults() }}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 rounded-xl text-xs font-medium transition-all active:scale-95"
            >
              <RotateCcw size={13} /> Restaurar padrão
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
