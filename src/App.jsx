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

const TYPE_ORDER = ['liquid', 'investment', 'asset', 'receivable', 'liability']

export default function App() {
  const [tab, setTab] = useState('帳戶')
  const [accounts, setAccounts] = useState([])
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('liquid')
  const [newBalance, setNewBalance] = useState('')
  const [editingAccount, setEditingAccount] = useState(null)
  const [editName, setEditName] = useState('')
  const [editType, setEditType] = useState('liquid')
  const [editBalance, setEditBalance] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => { fetchAccounts() }, [])

  async function fetchAccounts() {
    const { data } = await supabase.from('accounts').select('*').order('created_at')
    if (data) setAccounts(data)
  }

  async function addAccount() {
    if (!newName.trim()) return
    await supabase.from('accounts').insert({ name: newName.trim(), type: newType, balance: parseFloat(newBalance) || 0 })
    setNewName(''); setNewType('liquid'); setNewBalance(''); setShowAddAccount(false)
    fetchAccounts()
  }

  function openEdit(account) {
    setEditingAccount(account); setEditName(account.name); setEditType(account.type); setEditBalance(String(account.balance)); setDeletingId(null)
  }

  function closeEdit() { setEditingAccount(null); setDeletingId(null) }

  async function saveEdit() {
    if (!editName.trim()) return
    await supabase.from('accounts').update({ name: editName.trim(), type: editType, balance: parseFloat(editBalance) || 0 }).eq('id', editingAccount.id)
    closeEdit(); fetchAccounts()
  }

  async function deleteAccount(id) {
    await supabase.from('accounts').delete().eq('id', id)
    closeEdit(); fetchAccounts()
  }

  const totalAssets = accounts.filter(a => a.type !== 'liability').reduce((sum, a) => sum + Number(a.balance), 0)
  const totalLiabilities = accounts.filter(a => a.type === 'liability').reduce((sum, a) => sum + Number(a.balance), 0)
  const netWorth = totalAssets - totalLiabilities
  const sortedAccounts = [...accounts].sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type))

  const inputStyle = { width: '100%', backgroundColor: '#242424', border: '1px solid #2a2a2a', borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 15, marginBottom: 10, boxSizing: 'border-box', outline: 'none' }
  const cancelBtnStyle = { flex: 1, padding: '12px', backgroundColor: '#242424', border: 'none', borderRadius: 10, color: '#888', fontSize: 15, cursor: 'pointer' }
  const confirmBtnStyle = { flex: 2, padding: '12px', backgroundColor: '#4ade80', border: 'none', borderRadius: 10, color: '#000', fontSize: 15, fontWeight: 600, cursor: 'pointer' }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#0f0f0f', minHeight: '100vh', color: '#fff' }}>
      <div style={{ padding: '40px 20px 20px' }}>
        <div style={{ fontSize: 13, color: '#555', marginBottom: 6 }}>淨資產</div>
        <div style={{ fontSize: 36, fontWeight: 700, color: netWorth >= 0 ? '#4ade80' : '#f87171', letterSpacing: '-0.02em' }}>
          {netWorth >= 0 ? '+' : ''}{netWorth.toLocaleString()}<span style={{ fontSize: 16, fontWeight: 400, color: '#555', marginLeft: 4 }}>元</span>
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
          <span style={{ fontSize: 12, color: '#555' }}>資產 <span style={{ color: '#aaa' }}>{totalAssets.toLocaleString()}</span></span>
          <span style={{ fontSize: 12, color: '#555' }}>負債 <span style={{ color: '#f87171' }}>{totalLiabilities.toLocaleString()}</span></span>
        </div>
      </div>

      {tab === '帳戶' && (
        <div style={{ padding: '0 16px 120px' }}>
          {sortedAccounts.map(account => (
            <div key={account.id} onClick={() => openEdit(account)} style={{ backgroundColor: '#1a1a1a', borderRadius: 14, padding: '16px 18px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', border: '1px solid #222' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{account.name}</div>
                <div style={{ fontSize: 12, color: '#555', marginTop: 3 }}>{TYPE_LABELS[account.type]}</div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, color: account.type === 'liability' ? '#f87171' : '#fff' }}>
                {account.type === 'liability' ? '-' : ''}{Number(account.balance).toLocaleString()}
              </div>
            </div>
          ))}
          {!showAddAccount ? (
            <button onClick={() => setShowAddAccount(true)} style={{ width: '100%', padding: '14px', backgroundColor: 'transparent', border: '1px dashed #2a2a2a', borderRadius: 14, color: '#444', fontSize: 15, cursor: 'pointer', marginTop: 4 }}>+ 新增帳戶</button>
          ) : (
            <div style={{ backgroundColor: '#1a1a1a', borderRadius: 14, padding: 16, marginTop: 4, border: '1px solid #2a2a2a' }}>
              <div style={{ fontSize: 13, color: '#555', marginBottom: 12 }}>新增帳戶</div>
              <input placeholder="帳戶名稱" value={newName} onChange={e => setNewName(e.target.value)} autoFocus style={inputStyle} />
              <select value={newType} onChange={e => setNewType(e.target.value)} style={inputStyle}>
                {Object.entries(TYPE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
              <input placeholder="初始餘額（選填）" type="number" value={newBalance} onChange={e => setNewBalance(e.target.value)} style={inputStyle} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setShowAddAccount(false); setNewName(''); setNewBalance('') }} style={cancelBtnStyle}>取消</button>
                <button onClick={addAccount} style={confirmBtnStyle}>新增</button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === '常用品' && <div style={{ padding: '40px 20px', textAlign: 'center', color: '#333', fontSize: 14 }}>常用品（開發中）</div>}
      {tab === '紀錄' && <div style={{ padding: '40px 20px', textAlign: 'center', color: '#333', fontSize: 14 }}>紀錄（開發中）</div>}
      {tab === '設定' && <div style={{ padding: '40px 20px', textAlign: 'center', color: '#333', fontSize: 14 }}>設定（開發中）</div>}

      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, backgroundColor: '#141414', borderTop: '1px solid #1f1f1f', display: 'flex', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '14px 0', backgroundColor: 'transparent', border: 'none', color: tab === t ? '#4ade80' : '#444', fontSize: 13, cursor: 'pointer', fontWeight: tab === t ? 600 : 400 }}>{t}</button>
        ))}
      </div>

      {editingAccount && (
        <div onClick={closeEdit} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, backgroundColor: '#1a1a1a', borderRadius: '20px 20px 0 0', padding: '20px 16px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>編輯帳戶</div>
              <button onClick={closeEdit} style={{ background: 'none', border: 'none', color: '#555', fontSize: 20, cursor: 'pointer', padding: 4 }}>✕</button>
            </div>
            <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="帳戶名稱" style={inputStyle} />
            <select value={editType} onChange={e => setEditType(e.target.value)} style={inputStyle}>
              {Object.entries(TYPE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
            <input value={editBalance} onChange={e => setEditBalance(e.target.value)} placeholder="餘額" type="number" style={inputStyle} />
            <div style={{ display: 'flex', gap: 8 }}>
              {deletingId === editingAccount.id ? (
                <>
                  <button onClick={() => setDeletingId(null)} style={cancelBtnStyle}>取消刪除</button>
                  <button onClick={() => deleteAccount(editingAccount.id)} style={{ ...confirmBtnStyle, backgroundColor: '#f87171', color: '#fff' }}>確認刪除</button>
                </>
              ) : (
                <>
                  <button onClick={() => setDeletingId(editingAccount.id)} style={{ ...cancelBtnStyle, color: '#f87171' }}>刪除</button>
                  <button onClick={saveEdit} style={confirmBtnStyle}>儲存</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
