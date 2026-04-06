import { useEffect, useState } from 'react'
import { Plus, Search, Edit2, Trash2, User, Mail, Phone, Building2, UserPlus, ArrowLeft } from 'lucide-react'
import api from '../services/api'
import socket from '../services/socket'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import useAuthStore from '../store/authStore'
import { useNavigate } from 'react-router-dom'

const EMPTY_FORM = { name: '', company: '', email: '', phone: '' }

export default function Clients() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editClient, setEditClient] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const user = useAuthStore(state => state.user)

  const fetchClients = async () => {
    const res = await api.get(`/clients?t=${Date.now()}`)
    setClients(res.data || [])
  }

  useEffect(() => { 
    let timer;
    const handleUpdate = () => {
      clearTimeout(timer)
      timer = setTimeout(fetchClients, 500)
    }
    fetchClients()
    socket.on('client_updated', handleUpdate)
    return () => {
      socket.off('client_updated', handleUpdate)
      clearTimeout(timer)
    }
  }, [])

  const openCreate = () => { setEditClient(null); setForm(EMPTY_FORM); setShowModal(true) }
  const openEdit = (c) => { setEditClient(c); setForm({ name: c.name, company: c.company || '', email: c.email || '', phone: c.phone || '' }); setShowModal(true) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name) return toast.error(t('clients.nameReq'))
    setLoading(true)
    try {
      if (editClient) { await api.put(`/clients/${editClient.id}`, form); toast.success(t('clients.updated')) }
      else { await api.post('/clients', form); toast.success(t('clients.created')) }
      setShowModal(false); fetchClients()
    } catch { } finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('clients.deleteConfirm'))) return
    try { await api.delete(`/clients/${id}`); toast.success(t('clients.deleted')); fetchClients() } catch { }
  }

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.company || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {window.innerWidth < 640 && (
            <button onClick={() => navigate(-1)} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h1 className="page-title">{t('clients.title')}</h1>
            <p className="page-subtitle">{t('clients.subtitle', { count: clients.length })}</p>
          </div>
        </div>
        {user?.role === 'MANAGER' && (
          <button className="btn-primary-custom" onClick={openCreate}><UserPlus size={18} /> <span>{t('clients.newClient')}</span></button>
        )}
      </div>

      <div style={{ marginBottom: 20, maxWidth: 360 }}>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input className="input-custom" style={{ paddingLeft: 36 }} placeholder={t('clients.search')} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {filtered.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', color: '#94a3b8', background: 'var(--bg-card)', borderRadius: 16 }}>
            {t('clients.noClient')}
          </div>
        ) : filtered.map(c => (
          <div key={c.id} className="card-custom">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: `hsl(${(c.id * 47) % 360}, 70%, 92%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: `hsl(${(c.id * 47) % 360}, 60%, 35%)` }}>
                {c.name.charAt(0).toUpperCase()}
              </div>
              {user?.role === 'MANAGER' && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => openEdit(c)} style={{ background: '#fef3c7', border: 'none', cursor: 'pointer', width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}><Edit2 size={13} /></button>
                  <button onClick={() => handleDelete(c.id)} style={{ background: '#fef2f2', border: 'none', cursor: 'pointer', width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}><Trash2 size={13} /></button>
                </div>
              )}
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>{c.name}</h3>
            {c.company && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                <Building2 size={12} /> {c.company}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {c.email && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}><Mail size={12} /> {c.email}</div>}
              {c.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}><Phone size={12} /> {c.phone}</div>}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="cpm-modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="cpm-modal-box" onMouseDown={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#1e293b' }}>{editClient ? t('clients.editClient') : t('clients.newClient')}</h2>
            <form onSubmit={handleSubmit}>
              {[
                { label: t('clients.formName'), key: 'name', type: 'text', placeholder: t('clients.formNamePlaceholder') },
                { label: t('clients.formCompany'), key: 'company', type: 'text', placeholder: t('clients.formCompanyPlaceholder') },
                { label: t('clients.formEmail'), key: 'email', type: 'email', placeholder: t('clients.formEmailPlaceholder') },
                { label: t('clients.formPhone'), key: 'phone', type: 'tel', placeholder: t('clients.formPhonePlaceholder') },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key} style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>{label}</label>
                  <input className="input-custom" type={type} placeholder={placeholder} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#64748b' }}>{t('clients.cancel')}</button>
                <button type="submit" className="btn-primary-custom" disabled={loading}>
                  <span>{loading ? t('clients.saving') : editClient ? t('clients.update') : t('clients.create')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
