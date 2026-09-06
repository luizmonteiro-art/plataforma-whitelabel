import React from 'react'
import { createRoot } from 'react-dom/client'
import { AdminStoreProvider } from '../../src/contexts/AdminStore'
import { VendasClient } from '../../src/app/admin/(dashboard)/vendas/VendasClient'
import Dashboard from '../../src/app/admin/(dashboard)/dashboard/page'
import { storeId } from './transport'

const page=location.pathname === '/dashboard' ? <Dashboard /> : <VendasClient />
createRoot(document.getElementById('root')!).render(<>
  <aside style={{padding:16,background:'#332800',color:'#fff'}}>
    <strong>Demonstração local — dados fictícios — sem ligação com produção</strong>
    <nav style={{display:'flex',gap:20,marginTop:12}}><a href="/vendas">Vendas</a><a href="/dashboard">Dashboard</a></nav>
    <label>Simular conexão: <select aria-label="Simular conexão" defaultValue="normal" onChange={e=>sessionStorage.setItem('qa-failure',e.target.value)}>
      <option value="normal">Normal</option><option value="before">Falha antes de salvar</option><option value="after">Resposta perdida depois de salvar</option>
    </select></label>
  </aside>
  <main style={{padding:16}}><AdminStoreProvider storeId={storeId} planId="loja">{page}</AdminStoreProvider></main>
</>)
