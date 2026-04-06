import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, CheckCircle, Clock, XCircle, Edit2, Trash2, Key } from 'lucide-react'
import api from '../services/api'
import socket from '../services/socket'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'
import { useTranslation } from 'react-i18next'

const MS_COLORS = { ACHIEVED: { bg: '#f0fdf4', color: '#16a34a', icon: CheckCircle }, NOT_ACHIEVED: { bg: '#fef2f2', color: '#dc2626', icon: XCircle }, PENDING: { bg: '#fef3c7', color: '#d97706', icon: Clock } }
const EMPTY_MS = { name: '', targetDate: '', status: 'PENDING', progress: 0 }

export default function ProjectDetail() {
  const { t, i18n } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [milestones, setMilestones] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editMs, setEditMs] = useState(null)
  const [form, setForm] = useState(EMPTY_MS)
  const [loading, setLoading] = useState(false)
  const [copiedCode, setCopiedCode] = useState(null)
  const user = useAuthStore(state => state.user)

  const canModifyProject = user?.role === 'MANAGER'

  const fetchData = async () => {
    try {
      const tCache = Date.now()
      const [proj, miles] = await Promise.all([
        api.get(`/projects/${id}?t=${tCache}`),
        api.get(`/milestones?projectId=${id}&t=${tCache}`)
      ])
      setProject(proj.data)
      setMilestones(miles.data || [])
    } catch { navigate('/projects') }
  }

  useEffect(() => {
    let timer;
    const handleUpdate = () => {
      clearTimeout(timer)
      timer = setTimeout(fetchData, 500)
    }

    fetchData()

    // Listen for events related to this project
    socket.on('project_updated', handleUpdate)
    
    const handleMilestoneUpdate = (data) => {
      if (!data || data.projectId === parseInt(id)) handleUpdate()
    }
    socket.on('milestone_updated', handleMilestoneUpdate)

    return () => {
      socket.off('project_updated', handleUpdate)
      socket.off('milestone_updated', handleMilestoneUpdate)
      clearTimeout(timer)
    }
  }, [id])

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success(t('projectDetail.codeCopied'))
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const openCreate = () => { setEditMs(null); setForm(EMPTY_MS); setShowModal(true) }
  const openEdit = (ms) => { setEditMs(ms); setForm({ name: ms.name, targetDate: ms.targetDate?.split('T')[0] || '', status: ms.status, progress: ms.progress || 0 }); setShowModal(true) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name) return toast.error(t('projectDetail.nameRequired'))
    setLoading(true)
    try {
      if (editMs) {
        await api.put(`/milestones/${editMs.id}`, form)
        toast.success(t('projectDetail.msUpdated'))
      } else {
        await api.post('/milestones', { ...form, projectId: parseInt(id) })
        toast.success(t('projectDetail.msCreated'))
      }
      setShowModal(false); fetchData()
    } catch { } finally { setLoading(false) }
  }

  const handleDelete = async (msId) => {
    if (!window.confirm(t('projectDetail.confirmDelete'))) return
    try { await api.delete(`/milestones/${msId}`); toast.success(t('projectDetail.msDeleted')); fetchData() } catch { }
  }

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
      fetchData()
    } catch (err) {
      toast.error(t('milestones.updateError') || 'Erreur de mise à jour')
    }
  }

  const globalProgress = milestones.length
    ? Math.round(milestones.reduce((a, m) => a + (m.progress || 0), 0) / milestones.length)
    : 0

  if (!project) return <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>{t('projectDetail.loading')}</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate('/projects')} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 className="page-title">{project.name}</h1>
          <p className="page-subtitle" style={{ marginBottom: 4 }}>{project.description}</p>
          {canModifyProject && project.inviteCode && (
            <div
              onClick={() => handleCopy(project.inviteCode)}
              style={{
                marginTop: 12,
                background: 'linear-gradient(135deg, #003529, #0d4d3e)',
                padding: '10px 20px',
                borderRadius: 9999,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 16,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 14px rgba(0, 53, 41, 0.2)'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              title={t('projectDetail.clickToCopy')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Key size={14} color="#b3efda" />
                <span style={{ color: '#b3efda', fontWeight: 600, fontSize: 13 }}>{t('projectDetail.code')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                <span style={{ fontFamily: 'monospace', color: 'white', fontWeight: 700, fontSize: 14, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '120px' }}>{project.inviteCode}</span>
              </div>
            </div>
          )}
        </div>
        {canModifyProject && (
          <button className="btn-primary-custom" onClick={openCreate}><Plus size={18} /> <span>{t('projectDetail.addMs')}</span></button>
        )}
      </div>

      {/* Global progress card */}
      <div className="card-custom" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{t('projectDetail.globalProgress')}</span>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#1e40af' }}>{globalProgress}%</span>
        </div>
        <div className="progress-bar" style={{ height: 12 }}>
          <div className="progress-fill" style={{ width: `${globalProgress}%` }} />
        </div>
        <div style={{ display: 'flex', gap: 20, marginTop: 12, fontSize: 12, color: '#94a3b8' }}>
          <span>✅ {milestones.filter(m => m.status === 'ACHIEVED').length} {t('projectDetail.achieved')}</span>
          <span>⏳ {milestones.filter(m => m.status === 'PENDING').length} {t('projectDetail.inProgress')}</span>
          <span>❌ {milestones.filter(m => m.status === 'NOT_ACHIEVED').length} {t('projectDetail.notAchieved')}</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="card-custom">
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 20 }}>{t('projectDetail.msTitle')}</h2>
        {milestones.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
            {t('projectDetail.noMs')}
          </div>
        ) : milestones.map((ms, idx) => {
          const { bg, color, icon: Icon } = MS_COLORS[ms.status] || MS_COLORS.PENDING
          return (
            <div key={ms.id} className="timeline-item">
              <div className="timeline-dot" style={{ background: bg, border: `2px solid ${color}` }}>
                <Icon size={16} color={color} />
              </div>
              <div style={{ flex: 1, paddingTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{ms.name}</h4>
                    {ms.targetDate && (
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>
                        {t('projectDetail.targetDateLabel')} {new Date(ms.targetDate).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US')}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {user?.role === 'MANAGER' && (
                      <input 
                        type="checkbox" 
                        className="checkbox-premium" 
                        checked={ms.status === 'ACHIEVED'} 
                        onChange={() => toggleMilestone(ms)}
                        title={ms.status === 'ACHIEVED' ? t('milestones.reopen') : t('milestones.complete')}
                      />
                    )}
                    <span className="badge-status" style={{ background: bg, color }}>{ms.status === 'ACHIEVED' ? t('projectDetail.statusAchieved') : ms.status === 'NOT_ACHIEVED' ? t('projectDetail.statusNotAchieved') : t('projectDetail.statusInProgress')}</span>
                    {user?.role === 'MANAGER' && (
                      <button onClick={() => openEdit(ms)} style={{ background: '#fef3c7', border: 'none', cursor: 'pointer', width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}><Edit2 size={13} /></button>
                    )}
                    {canModifyProject && (
                      <button onClick={() => handleDelete(ms.id)} style={{ background: '#fef2f2', border: 'none', cursor: 'pointer', width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}><Trash2 size={13} /></button>
                    )}
                  </div>
                </div>
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
                    <span>{t('projectDetail.progressText')}</span><span style={{ fontWeight: 600, color: '#1e40af' }}>{ms.progress || 0}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${ms.progress || 0}%` }} />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {showModal && (
        <div className="cpm-modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="cpm-modal-box">
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#1e293b' }}>{editMs ? t('projectDetail.editMs') : t('projectDetail.newMs')}</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>{t('projectDetail.msNameLabel')} {canModifyProject && '*'}</label>
                <input className="input-custom" placeholder={t('projectDetail.msNamePlaceholder')} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} disabled={!canModifyProject} style={{ opacity: canModifyProject ? 1 : 0.7 }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>{t('projectDetail.formTargetDate')}</label>
                <input className="input-custom" type="date" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))} disabled={!canModifyProject} style={{ opacity: canModifyProject ? 1 : 0.7 }} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#64748b' }}>{t('projectDetail.cancel')}</button>
                <button type="submit" className="btn-primary-custom" disabled={loading}>
                  <span>{loading ? t('projectDetail.saving') : editMs ? t('projectDetail.update') : t('projectDetail.create')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
