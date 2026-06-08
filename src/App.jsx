import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const TABS = ['帳戶', '常用品', '紀錄', '設定']

const TYPE_LABELS = {
  liquid: '流動資金',
  investment: '投資',
  asset: '固定資產',
  receivable: '應收',
  liability: '負債'
}

export default function App() {
  const [tab, setTab] = useState('帳戶')
  const [accounts, setAccounts] = useState([])
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('liquid')
  const [newBalance, setNewBalance] = useState('')

  useEffect(() => {
    fetchAccounts()
  }, [])

  async function fetchAccounts() {
    const { data } = await supabase.from('accounts').select('*').order('created_at')
    if (data) setAccounts(data)
  }

  async function addAccount() {
    if (!newName.trim()) return
    await supabase.from('accounts').insert({
      name: newName.trim(),
      type: newType,
      balance: parseFloat(newBalance) || 0
    })
    setNewName('')
    setNewType('liquid')
    setNewBalance('')
    setShowAddAccount(false)
    fetchAccounts()
  }

  const totalAssets = accounts
    .filter(a => a.type !== 'liability')
    .reduce((sum, a) => sum + Number(a.balance), 0)

  const totalLiabilities = accounts
    .filter(a => a.type === 'liability')
    .reduce((sum, a) => sum + Number(a.balance), 0)

  const netWorth = totalAssets - totalLiabilities

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', fontFamily: 'system-ui', backgroundColor: '#0f0f0f', minHeight: '100vh', color: '#fff' }}>
      
      <div style={{ padding: '32px 16px 16px' }}>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>本月進步</div>
        <div style={{ fontSize: 32, fontWeight: 700, color: netWorth >= 0 ? '#4ade80' : '#f87171' }}>
          {netWorth >= 0 ? '+' : ''}{netWorth.toLocaleString()} 元
        </div>
      </div>

      {tab === '帳戶' && (
        <div style={{ padding: '0 16px 100px' }}>
          {accounts.map(account => (
            <div key={account.id} style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: '14px 16px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{account.name}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{TYPE_LABELS[account.type]}</div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, color: account.type === 'liability' ? '#f87171' : '#fff' }}>
                {Number(account.balance).toLocaleString()}
              </div>
            </div>
          ))}

          {!showAddAccount ? (
            <button onClick={() => setShowAddAccount(true)} style={{ width: '100%', padding: '14px', backgroundColor: '#1a1a1a', border: '1px dashed #333', borderRadius: 12, color: '#888', fontSize: 15, cursor: 'pointer', marginTop: 4 }}>
              + 新增帳戶
            </button>
          ) : (
            <div style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginTop: 4 }}>
              <input
                placeholder="帳戶名稱"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                style={{ width: '100%', backgroundColor: '#2a2a2a', border: 'none', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 15, marginBottom: 10, boxSizing: 'border-box' }}
              />
              <select
                value={newType}
                onChange={e => setNewType(e.target.value)}
                style={{ width: '100%', backgroundColor: '#2a2a2a', border: 'none', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 15, marginBottom: 10, boxSizing: 'border-box' }}
              >
                {Object.entries(TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <input
                placeholder="初始餘額"
                type="number"
                value={newBalance}
                onChange={e => setNewBalance(e.target.value)}
                style={{ width: '100%', backgroundColor: '#2a2a2a', border: 'none', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 15, marginBottom: 10, boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowAddAccount(false)} style={{ flex: 1, padding: '10px', backgroundColor: '#2a2a2a', border: 'none', borderRadius: 8, color: '#888', fontSize: 15, cursor: 'pointer' }}>
                  取消
                </button>
                <button onClick={addAccount} style={{ flex: 1, padding: '10px', backgroundColor: '#4ade80', border: 'none', borderRadius: 8, color: '#000', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                  新增
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, backgroundColor: '#1a1a1a', borderTop: '1px solid #2a2a2a', display: 'flex' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '12px 0', backgroundColor: 'transparent', border: 'none', color: tab === t ? '#4ade80' : '#888', fontSize: 13, cursor: 'pointer' }}>
            {t}
          </button>
        ))}
      </div>
    </div>
  )
}
