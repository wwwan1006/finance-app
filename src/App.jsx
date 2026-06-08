import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const TABS = ['帳戶', '常用品', '紀錄', '設定']
const TYPE_LABELS = { liquid: '流動資金', investment: '投資', asset: '固定資產', receivable: '應收', liability: '負債' }
const TYPE_ORDER = ['liquid', 'investment', 'asset', 'receivable', 'liability']
const CATEGORY_LABELS = { food: '食物', transport: '交通', health: '健康', shopping: '購物', entertainment: '娛樂', other: '其他' }
const inputStyle = { width: '100%', backgroundColor: '#242424', border: '1px solid #2a2a2a', borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 15, marginBottom: 10, boxSizing: 'border-box', outline: 'none' }
const cancelBtnStyle = { flex: 1, padding: '12px', backgroundColor: '#242424', border: 'none', borderRadius: 10, color: '#888', fontSize: 15, cursor: 'pointer' }
const confirmBtnStyle = { flex: 2, padding: '12px', backgroundColor: '#4ade80', border: 'none', borderRadius: 10, color: '#000', fontSize: 15, fontWeight: 600, cursor: 'pointer' }

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
  const [items, setItems] = useState([])
  const [showAddItem, setShowAddItem] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [newItemAmount, setNewItemAmount] = useState('')
  const [newItemCategory, setNewItemCategory] = useState('other')
  const [recordingItem, setRecordingItem] = useState(null)
  const [recordAmount, setRecordAmount] = useState('')
  const [recordFromAccount, setRecordFromAccount] = useState('')
  const [recordDone, setRecordDone] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [editItemName, setEditItemName] = useState('')
  const [editItemCategory, setEditItemCategory] = useState('other')
  const [deletingItemId, setDeletingItemId] = useState(null)

  useEffect(() => { fetchAccounts(); fetchItems() }, [])

  async function fetchAccounts() {
    const { data } = await supabase.from('accounts').select('*').order('created_at')
    if (data) setAccounts(data)
  }
  async function fetchItems() {
    const { data } = await supabase.from('frequent_items').select('*').order('sort_order').order('created_at')
    if (data) setItems(data)
  }
  async function addAccount() {
    if (!newName.trim()) return
    await supabase.from('accounts').insert({ name: newName.trim(), type: newType, balance: parseFloat(newBalance) || 0 })
    setNewName(''); setNewType('liquid'); setNewBalance(''); setShowAddAccount(false); fetchAccounts()
  }
  function openEditAccount(account) { setEditingAccount(account); setEditName(account.name); setEditType(account.type); setEditBalance(String(account.balance)); setDeletingId(null) }
  function closeEditAccount() { setEditingAccount(null); setDeletingId(null) }
  async function saveEditAccount() {
    if (!editName.trim()) return
    await supabase.from('accounts').update({ name: editName.trim(), type: editType, balance: parseFloat(editBalance) || 0 }).eq('id', editingAccount.id)
    closeEditAccount(); fetchAccounts()
  }
  async function deleteAccount(id) { await supabase.from('accounts').delete().eq('id', id); closeEditAccount(); fetchAccounts() }
  async function addItem() {
    if (!newItemName.trim()) return
    const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.sort_order || 0)) : 0
    await supabase.from('frequent_items').insert({ name: newItemName.trim(), last_amount: parseFloat(newItemAmount) || 0, category: newItemCategory, sort_order: maxOrder + 1 })
    setNewItemName(''); setNewItemAmount(''); setNewItemCategory('other'); setShowAddItem(false); fetchItems()
  }
  function openRecordItem(item) { setRecordingItem(item); setRecordAmount(String(item.last_amount || '')); setRecordFromAccount(accounts.filter(a => a.type !== 'liability')[0]?.id || ''); setRecordDone(false) }
  function closeRecordItem() { setRecordingItem(null); setRecordDone(false) }
  async function confirmRecord() {
    if (!recordAmount || !recordFromAccount) return
    const amount = parseFloat(recordAmount)
    if (isNaN(amount) || amount <= 0) return
    await supabase.from('transactions').insert({ amount, type: 'expense', from_account_id: recordFromAccount, category: recordingItem.category || 'other', note: recordingItem.name, is_diversion: false })
    const account = accounts.find(a => a.id === recordFromAccount)
    if (account) await supabase.from('accounts').update({ balance: Number(account.balance) - amount }).eq('id', recordFromAccount)
    await supabase.from('frequent_items').update({ last_amount: amount }).eq('id', recordingItem.id)
    setRecordDone(true); fetchAccounts(); fetchItems(); setTimeout(() => closeRecordItem(), 800)
  }
  function openEditItem(item) { setEditingItem(item); setEditItemName(item.name); setEditItemCategory(item.category || 'other'); setDeletingItemId(null) }
  function closeEditItem() { setEditingItem(null); setDeletingItemId(null) }
  async function saveEditItem() {
    if (!editItemName.trim()) return
    await supabase.from('frequent_items').update({ name: editItemName.trim(), category: editItemCategory }).eq('id', editingItem.id)
    closeEditItem(); fetchItems()
  }
  async function deleteItem(id) { await supabase.from('frequent_items').delete().eq('id', id); closeEditItem(); fetchItems() }

  const totalAssets = accounts.filter(a => a.type !== 'liability').reduce((sum, a) => sum + Number(a.balance), 0)
  const totalLiabilities = accounts.filter(a => a.type === 'liability').reduce((sum, a) => sum + Number(a.balance), 0)
  const netWorth = totalAssets - totalLiabilities
  const sortedAccounts = [...accounts].sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type))
  const spendableAccounts = accounts.filter(a => a.type !== 'liability' && a.type !== 'asset')

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', fontFamily: 'system-ui,-apple-system,sans-serif', backgroundColor: '#0f0f0f', minHeight: '100vh', color: '#fff' }}>
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
            <div key={account.id} onClick={() => openEditAccount(account)} style={{ backgroundColor: '#1a1a1a', borderRadius: 14, padding: '16px 18px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', border: '1px solid #222' }}>
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

      {tab === '常用品' && (
        <div style={{ padding: '0 16px 120px' }}>
          {items.length === 0 && !showAddItem && <div style={{ textAlign: 'center', color: '#333', fontSize: 14, padding: '40px 0' }}>還沒有常用品</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            {items.map(item => (
              <div key={item.id} style={{ backgroundColor: '#1a1a1a', borderRadius: 14, padding: '16px 14px', border: '1px solid #222', position: 'relative' }}>
                <button onClick={() => openEditItem(item)} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', color: '#333', fontSize: 16, cursor: 'pointer', padding: 2 }}>···</button>
                <div onClick={() => openRecordItem(item)} style={{ cursor: 'pointer' }}>
                  <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>{CATEGORY_LABELS[item.category] || '其他'}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{item.name}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#4ade80' }}>{Number(item.last_amount || 0).toLocaleString()}<span style={{ fontSize: 12, color: '#555', marginLeft: 2 }}>元</span></div>
                </div>
              </div>
            ))}
          </div>
          {!showAddItem ? (
            <button onClick={() => setShowAddItem(true)} style={{ width: '100%', padding: '14px', backgroundColor: 'transparent', border: '1px dashed #2a2a2a', borderRadius: 14, color: '#444', fontSize: 15, cursor: 'pointer' }}>+ 新增常用品</button>
          ) : (
            <div style={{ backgroundColor: '#1a1a1a', borderRadius: 14, padding: 16, border: '1px solid #2a2a2a' }}>
              <div style={{ fontSize: 13, color: '#555', marginBottom: 12 }}>新增常用品</div>
              <input placeholder="名稱（例：全聯採購）" value={newItemName} onChange={e => setNewItemName(e.target.value)} autoFocus style={inputStyle} />
              <select value={newItemCategory} onChange={e => setNewItemCategory(e.target.value)} style={inputStyle}>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
              <input placeholder="預設金額（選填）" type="number" value={newItemAmount} onChange={e => setNewItemAmount(e.target.value)} style={inputStyle} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setShowAddItem(false); setNewItemName(''); setNewItemAmount('') }} style={cancelBtnStyle}>取消</button>
                <button onClick={addItem} style={confirmBtnStyle}>新增</button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === '紀錄' && <div style={{ padding: '40px 20px', textAlign: 'center', color: '#333', fontSize: 14 }}>紀錄（開發中）</div>}
      {tab === '設定' && <div style={{ padding: '40px 20px', textAlign: 'center', color: '#333', fontSize: 14 }}>設定（開發中）</div>}

      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, backgroundColor: '#141414', borderTop: '1px solid #1f1f1f', display: 'flex', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '14px 0', backgroundColor: 'transparent', border: 'none', color: tab === t ? '#4ade80' : '#444', fontSize: 13, cursor: 'pointer', fontWeight: tab === t ? 600 : 400 }}>{t}</button>
        ))}
      </div>

      {editingAccount && (
        <div onClick={closeEditAccount} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, backgroundColor: '#1a1a1a', borderRadius: '20px 20px 0 0', padding: '20px 16px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>編輯帳戶</div>
              <button onClick={closeEditAccount} style={{ background: 'none', border: 'none', color: '#555', fontSize: 20, cursor: 'pointer', padding: 4 }}>✕</button>
            </div>
            <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="帳戶名稱" style={inputStyle} />
            <select value={editType} onChange={e => setEditType(e.target.value)} style={inputStyle}>
              {Object.entries(TYPE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
            <input value={editBalance} onChange={e => setEditBalance(e.target.value)} placeholder="餘額" type="number" style={inputStyle} />
            <div style={{ display: 'flex', gap: 8 }}>
              {deletingId === editingAccount.id ? (
                <><button onClick={() => setDeletingId(null)} style={cancelBtnStyle}>取消刪除</button><button onClick={() => deleteAccount(editingAccount.id)} style={{ ...confirmBtnStyle, backgroundColor: '#f87171', color: '#fff' }}>確認刪除</button></>
              ) : (
                <><button onClick={() => setDeletingId(editingAccount.id)} style={{ ...cancelBtnStyle, color: '#f87171' }}>刪除</button><button onClick={saveEditAccount} style={confirmBtnStyle}>儲存</button></>
              )}
            </div>
          </div>
        </div>
      )}

      {recordingItem && (
        <div onClick={closeRecordItem} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, backgroundColor: '#1a1a1a', borderRadius: '20px 20px 0 0', padding: '20px 16px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}>
            {recordDone ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>✓</div>
                <div style={{ fontSize: 16, color: '#4ade80', fontWeight: 600 }}>記錄完成</div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div><div style={{ fontSize: 16, fontWeight: 600 }}>{recordingItem.name}</div><div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{CATEGORY_LABELS[recordingItem.category] || '其他'}</div></div>
                  <button onClick={closeRecordItem} style={{ background: 'none', border: 'none', color: '#555', fontSize: 20, cursor: 'pointer', padding: 4 }}>✕</button>
                </div>
                <div style={{ fontSize: 13, color: '#555', marginBottom: 6 }}>金額</div>
                <input value={recordAmount} onChange={e => setRecordAmount(e.target.value)} type="number" placeholder="輸入金額" autoFocus style={{ ...inputStyle, fontSize: 24, fontWeight: 700, textAlign: 'center' }} />
                <div style={{ fontSize: 13, color: '#555', marginBottom: 6 }}>從哪個帳戶扣</div>
                <select value={recordFromAccount} onChange={e => setRecordFromAccount(e.target.value)} style={inputStyle}>
                  {spendableAccounts.map(a => <option key={a.id} value={a.id}>{a.name}（{Number(a.balance).toLocaleString()}）</option>)}
                </select>
                <button onClick={confirmRecord} style={{ ...confirmBtnStyle, width: '100%', flex: 'none', marginTop: 4 }}>確認記錄</button>
              </>
            )}
          </div>
        </div>
      )}

      {editingItem && (
        <div onClick={closeEditItem} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, backgroundColor: '#1a1a1a', borderRadius: '20px 20px 0 0', padding: '20px 16px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>編輯常用品</div>
              <button onClick={closeEditItem} style={{ background: 'none', border: 'none', color: '#555', fontSize: 20, cursor: 'pointer', padding: 4 }}>✕</button>
            </div>
            <input value={editItemName} onChange={e => setEditItemName(e.target.value)} placeholder="名稱" style={inputStyle} />
            <select value={editItemCategory} onChange={e => setEditItemCategory(e.target.value)} style={inputStyle}>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 8 }}>
              {deletingItemId === editingItem.id ? (
                <><button onClick={() => setDeletingItemId(null)} style={cancelBtnStyle}>取消刪除</button><button onClick={() => deleteItem(editingItem.id)} style={{ ...confirmBtnStyle, backgroundColor: '#f87171', color: '#fff' }}>確認刪除</button></>
              ) : (
                <><button onClick={() => setDeletingItemId(editingItem.id)} style={{ ...cancelBtnStyle, color: '#f87171' }}>刪除</button><button onClick={saveEditItem} style={confirmBtnStyle}>儲存</button></>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
