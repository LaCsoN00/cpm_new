import { useEffect, useState } from 'react'
import { Plus, Search, CheckCircle, Clock, XCircle, Edit2, Trash2, ArrowLeft } from 'lucide-react'
import api from '../services/api'
import socket from '../services/socket'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import useAuthStore from '../store/authStore'
import { useNavigate } from 'react-router-dom'

const MS_COLORS = { ACHIEVED: { bg: '#ecfeff', color: '#0891b2' }, NOT_ACHIEVED: { bg: '#fef2f2', color: '#dc2626' }, PENDING: { bg: '#fef3c7', color: '#d97706' } }
const EMPTY_FORM = { name: '', targetDate: '', status: 'PENDING', progress: 0, projectId: '' }

export default function Milestones() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [milestones, setMilestones] = useState([])
  const [projects, setProjects] = useState([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editMs, setEditMs] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)

  const fetchAll = async () => {
    const tCache = Date.now()
    const [m, p] = await Promise.all([api.get(`/milestones?t=${tCache}`), api.get(`/projects?t=${tCache}`)])
    setMilestones(m.data || []); setProjects(p.data || [])
  }

  useEffect(() => {
    let timer;
    const handleUpdate = () => {
      clearTimeout(timer)
      timer = setTimeout(fetchAll, 500)
    }
    fetchAll()
    socket.on('milestone_updated', handleUpdate)
    return () => {
      socket.off('milestone_updated', handleUpdate)
      clearTimeout(timer)
    }
  }, [])

  const openCreate = () => { setEditMs(null); setForm(EMPTY_FORM); setShowModal(true) }
  const openEdit = (ms) => { setEditMs(ms); setForm({ name: ms.name, targetDate: ms.targetDate?.split('T')[0] || '', status: ms.status, progress: ms.progress || 0, projectId: ms.projectId || '' }); setShowModal(true) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.projectId) return toast.error(t('milestones.reqFields'))
    setLoading(true)
    try {
      const payload = { ...form, projectId: parseInt(form.projectId), progress: parseInt(form.progress) }
      if (editMs) { await api.put(`/milestones/${editMs.id}`, payload); toast.success(t('milestones.updated')) }
      else { await api.post('/milestones', payload); toast.success(t('milestones.created')) }
      setShowModal(false); fetchAll()
    } catch { } finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('milestones.confirmDelete'))) return
    try { await api.delete(`/milestones/${id}`); toast.success(t('milestones.deleted')); fetchAll() } catch { }
  }

  const user = useAuthStore(state => state.user)
  const filtered = milestones.filter(m => m.name.toLowerCase().includes(search.toLowerCase()))
  const getProject = (pid) => projects.find(p => p.id === pid)

  const toggleMilestone = async (ms) => {
    try {
      const isAchieved = ms.status === 'ACHIEVED'
      const newStatus = isAchieved ? 'PENDING' : 'ACHIEVED'
      const newProgress = isAchieved ? 0 : 100
      
      await api.put(`/milestones/${ms.id}`, {
        ...ms,
        status: newStatus,
        progress: newProgress
      })
      
      toast.success(isAchieved ? t('milestones.reopened') || 'Jalon rouvert' : t('milestones.completed') || 'Jalon terminé')
      fetchAll()
    } catch (err) {
      toast.error(t('milestones.updateError') || 'Erreur de mise à jour')
    }
  }

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
            <h1 className="page-title">{t('milestones.title')}</h1>
            <p className="page-subtitle">{t('milestones.subtitle', { count: milestones.length })}</p>
          </div>
        </div>
        {user?.role === 'MANAGER' && (
          <button className="btn-primary-custom" onClick={openCreate}><Plus size={18} /> <span>{t('milestones.newMs')}</span></button>
        )}
      </div>

      <div style={{ marginBottom: 20, maxWidth: 360 }}>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input className="input-custom" style={{ paddingLeft: 36 }} placeholder={t('milestones.searchPlaceholder')} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card-custom">
        <table className="table-custom">
          <thead>
            <tr>
              <th>{t('milestones.colMs')}</th>
              <th>{t('milestones.colProject')}</th>
              <th>{t('milestones.colTargetDate')}</th>
              <th>{t('milestones.colStatus')}</th>
              <th style={{ textAlign: 'center' }}>{t('milestones.colProgress')}</th>
              <th>{t('milestones.colActions')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>{t('milestones.noMsFound')}</td></tr>
            ) : filtered.map(ms => {
              const c = MS_COLORS[ms.status] || MS_COLORS.PENDING
              const proj = getProject(ms.projectId)
              return (
                <tr key={ms.id}>
                  <td data-label={t('milestones.colMs')}><span style={{ fontWeight: 600, color: '#1e293b' }}>{ms.name}</span></td>
                  <td data-label={t('milestones.colProject')}>
                    {proj ? <span style={{ background: '#eff6ff', color: '#1e40af', padding: '3px 9px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{proj.name}</span> : '—'}
                  </td>
                  <td data-label={t('milestones.colTargetDate')} style={{ color: '#64748b', fontSize: 13 }}>{ms.targetDate ? new Date(ms.targetDate).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US') : '—'}</td>
                  <td data-label={t('milestones.colStatus')}><span className="badge-status" style={{ background: c.bg, color: c.color }}>{ms.status === 'ACHIEVED' ? t('milestones.statusAchieved') : ms.status === 'NOT_ACHIEVED' ? t('milestones.statusNotAchieved') : t('milestones.statusPending')}</span></td>
                  <td data-label={t('milestones.colProgress')} style={{ width: 100 }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      {user?.role === 'MANAGER' && (
                        <input 
                          type="checkbox" 
                          className="checkbox-premium" 
                          checked={ms.status === 'ACHIEVED'} 
                          onChange={() => toggleMilestone(ms)}
                        />
                      )}
                    </div>
                  </td>
                  <td data-label={t('milestones.colActions')}>
                    {user?.role === 'MANAGER' && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEdit(ms)} style={{ background: '#fef3c7', border: 'none', cursor: 'pointer', width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}><Edit2 size={13} /></button>
                        <button onClick={() => handleDelete(ms.id)} style={{ background: '#fef2f2', border: 'none', cursor: 'pointer', width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}><Trash2 size={13} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="cpm-modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="cpm-modal-box" onMouseDown={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#1e293b' }}>{editMs ? t('milestones.editMs') : t('milestones.newMs')}</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>{t('milestones.formName')}</label>
                <input className="input-custom" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={t('milestones.formNamePlaceholder')} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>{t('milestones.formProject')}</label>
                <select className="input-custom" value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}>
                  <option value="">{t('milestones.formProjectPlaceholder')}</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>{t('milestones.formTargetDate')}</label>
                <input className="input-custom" type="date" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#64748b' }}>{t('milestones.cancel')}</button>
                <button type="submit" className="btn-primary-custom" disabled={loading}>
                  <span>{loading ? t('milestones.saving') : editMs ? t('milestones.update') : t('milestones.create')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
