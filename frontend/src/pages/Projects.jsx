import { useState, useEffect } from 'react'
import { Plus, Search, Edit2, Trash2, Eye, Calendar, User, UserPlus, Key, ArrowLeft } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import socket from '../services/socket'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'

const STATUS_COLORS = { PLANNED: { bg: '#eff6ff', color: '#1e40af' }, IN_PROGRESS: { bg: '#fef3c7', color: '#d97706' }, COMPLETED: { bg: '#f0fdf4', color: '#16a34a' } }

const EMPTY_FORM = { name: '', description: '', startDate: '', endDate: '', status: 'PLANNED', responsible: '', clientId: '' }

export default function Projects() {
  const { t } = useTranslation()
  const [projects, setProjects] = useState([])
  const [clients, setClients] = useState([])
  const [managers, setManagers] = useState([])
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [filter, setFilter] = useState('ALL')
  const [showModal, setShowModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [copiedCode, setCopiedCode] = useState(null)
  const [editProject, setEditProject] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const user = useAuthStore(state => state.user)

  const fetchProjects = async () => {
    try {
      const res = await api.get(`/projects?t=${Date.now()}`)
      setProjects(res.data || [])
    } catch { }
  }

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success(t('projects.copied'))
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const fetchClients = async () => {
    try {
      const res = await api.get('/clients')
      setClients(res.data || [])
    } catch { }
  }

  const fetchManagers = async () => {
    try {
      const res = await api.get('/users/managers')
      setManagers(res.data || [])
    } catch { }
  }

  useEffect(() => {
    const s = searchParams.get('search')
    if (s !== null) setSearch(s)
  }, [searchParams])

  useEffect(() => {
    let timer;
    const handleUpdate = () => {
      clearTimeout(timer)
      timer = setTimeout(fetchProjects, 500)
    }

    fetchProjects()
    fetchClients()
    fetchManagers()

    socket.on('project_updated', handleUpdate)
    socket.on('milestone_updated', handleUpdate)

    return () => {
      socket.off('project_updated', handleUpdate)
      socket.off('milestone_updated', handleUpdate)
      clearTimeout(timer)
    }
  }, [])

  const openCreate = () => { setEditProject(null); setForm(EMPTY_FORM); setShowModal(true) }
  const openEdit = (p) => { setEditProject(p); setForm({ name: p.name, description: p.description || '', startDate: p.startDate?.split('T')[0] || '', endDate: p.endDate?.split('T')[0] || '', status: p.status, responsible: p.responsible || '', clientId: p.clientId || '' }); setShowModal(true) }

  const handleJoin = async (e) => {
    e.preventDefault()
    if (!joinCode) return toast.error(t('projects.codeRequired'))
    setLoading(true)
    try {
      await api.post('/projects/join', { inviteCode: joinCode })
      toast.success(t('projects.joinSuccess'))
      setShowJoinModal(false)
      setJoinCode('')
      fetchProjects()
    } catch (err) {
      toast.error(err.response?.data?.message || t('projects.joinErrorResp'))
    } finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name) return toast.error(t('projects.nameReq'))
    if (!form.clientId) return toast.error(t('projects.clientReq'))
    setLoading(true)
    try {
      if (editProject) {
        await api.put(`/projects/${editProject.id}`, form)
        toast.success(t('projects.updated'))
      } else {
        await api.post('/projects', form)
        toast.success(t('projects.created'))
      }
      setShowModal(false)
      fetchProjects()
    } catch { } finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('projects.deleteConfirm'))) return
    try {
      await api.delete(`/projects/${id}`)
      toast.success(t('projects.deleted'))
      fetchProjects()
    } catch { }
  }

  const filtered = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'ALL' || p.status === filter
    return matchSearch && matchFilter
  })

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
            <h1 className="page-title">{t('projects.title')}</h1>
            <p className="page-subtitle">{t('projects.subtitle', { count: projects.length })}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {user?.role !== 'ADMIN' && (
            <button className="btn-primary-custom" onClick={() => setShowJoinModal(true)}>
              <Key size={18} /> {t('projects.join')}
            </button>
          )}
          {user?.role === 'MANAGER' && (
            <button className="btn-primary-custom" onClick={openCreate}><Plus size={18} /> {t('projects.newProject')}</button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input className="input-custom" style={{ paddingLeft: 36 }} placeholder={t('projects.search')} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {['ALL', 'PLANNED', 'IN_PROGRESS', 'COMPLETED'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`filter-pill ${filter === s ? 'active' : ''}`}
          >
            {s === 'ALL' ? t('projects.all') : t(`projects.${s}`)}
          </button>
        ))}
      </div>

      {/* Project Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {filtered.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            <FolderEmpty />
            <p style={{ marginTop: 12, fontSize: 15 }}>{t('projects.noProject')}</p>
          </div>
        ) : filtered.map(p => {
          const progressScore = p.milestones && p.milestones.length > 0
            ? Math.round(p.milestones.reduce((acc, m) => acc + (m.progress || 0), 0) / p.milestones.length)
            : 0;

          return (
            <div key={p.id} className="card-custom" style={{ cursor: 'default', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <span className="badge-status" style={{ ...STATUS_COLORS[p.status], fontSize: 11, padding: '4px 10px' }}>{t(`projects.${p.status}`)}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => navigate(`/projects/${p.id}`)} style={iconBtn('#f1f5f9', '#64748b')} title={t('projects.view')}><Eye size={14} /></button>
                  {user?.role !== 'ADMIN' && (p.creatorId === user?.id || user?.role === 'MANAGER') && (
                    <>
                      <button onClick={() => openEdit(p)} style={iconBtn('#fffbeb', '#f59e0b')} title={t('projects.edit')}><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(p.id)} style={iconBtn('#fef2f2', '#ef4444')} title={t('projects.delete')}><Trash2 size={14} /></button>
                    </>
                  )}
                </div>
              </div>

              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 8, lineHeight: 1.3 }}>{p.name}</h3>

              {(p.creatorId === user?.id || user?.role === 'MANAGER' || user?.role === 'ADMIN') && p.inviteCode && (
                <div
                  onClick={() => handleCopy(p.inviteCode)}
                  style={{
                    marginBottom: 16,
                    background: 'linear-gradient(135deg, #003529, #0d4d3e)',
                    padding: '10px 16px',
                    borderRadius: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 14px rgba(0, 53, 41, 0.2)'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  title={t('projects.copyCode')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Key size={14} color="#b3efda" />
                    <span style={{ color: '#b3efda', fontSize: 12, fontWeight: 600 }}>{t('projects.code')}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                    <span style={{ fontFamily: 'monospace', color: 'white', fontSize: 13, fontWeight: 700, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '120px' }}>{p.inviteCode}</span>
                  </div>
                </div>
              )}

              <p style={{ fontSize: 14, color: '#475569', marginBottom: 20, lineHeight: 1.6, flex: 1 }}>{p.description || t('projects.noDescription')}</p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                  {p.startDate && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={14} /> {new Date(p.startDate).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'fr-FR')}</span>}
                  {p.responsible && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><User size={14} /> {p.responsible}</span>}
                </div>
              </div>

              {p.milestones && (
                <div style={{ paddingTop: 16, borderTop: '1px dashed #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                    <span style={{ color: '#64748b', fontWeight: 500 }}>{t('projects.milestones')} : {p.milestones.filter(m => m.status === 'ACHIEVED').length}/{p.milestones.length}</span>
                    <span style={{ color: '#1e40af', fontWeight: 700 }}>
                      {progressScore}%
                    </span>
                  </div>
                  <div className="progress-bar" style={{ height: 8 }}>
                    <div className="progress-fill" style={{ width: `${progressScore}%` }} />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Join Modal */}
      {showJoinModal && (
        <div className="cpm-modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) setShowJoinModal(false); }}>
          <div className="cpm-modal-box" onMouseDown={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Key size={20} color="#1e40af" /> {t('projects.joinProject')}
            </h2>
            <form onSubmit={handleJoin}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>{t('projects.inviteCode')}</label>
                <input className="input-custom" autoFocus type="text" placeholder={t('projects.inviteCodePlaceholder')} value={joinCode} onChange={e => setJoinCode(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowJoinModal(false)} style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#64748b' }}>{t('projects.cancel')}</button>
                <button type="submit" className="btn-primary-custom" disabled={loading}>
                  {loading ? t('projects.verifying') : t('projects.joinBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Create/Edit Modal */}
      {showModal && (
        <div className="cpm-modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="cpm-modal-box" onMouseDown={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#1e293b' }}>
              {editProject ? t('projects.editProject') : t('projects.createProject')}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>{t('projects.projectName')}</label>
                <input className="input-custom" type="text" placeholder={t('projects.projectNamePlaceholder')} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>{t('projects.client')}</label>
                <select className="input-custom" value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))} required>
                  <option value="">{t('projects.selectClient')}</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1, marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>{t('projects.startDate')}</label>
                  <input className="input-custom" type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div style={{ flex: 1, marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>{t('projects.endDate')}</label>
                  <input className="input-custom" type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>{t('projects.responsible')}</label>
                <select className="input-custom" value={form.responsible} onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))} required>
                  <option value="">{t('projects.selectResponsible')}</option>
                  {managers.map(m => <option key={m.id} value={m.name}>{m.name} ({m.email})</option>)}
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>{t('projects.description')}</label>
                <textarea className="input-custom" placeholder={t('projects.descriptionPlaceholder')} rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'vertical' }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>{t('projects.status')}</label>
                <select 
                  className="input-custom" 
                  value={form.status} 
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  disabled={!editProject}
                  style={!editProject ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
                  title={!editProject ? t('projects.statusLocked') || 'Le statut par défaut est planifié' : ''}
                >
                  <option value="PLANNED">{t('projects.PLANNED')}</option>
                  <option value="IN_PROGRESS">{t('projects.IN_PROGRESS')}</option>
                  <option value="COMPLETED">{t('projects.COMPLETED')}</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#64748b' }}>{t('projects.cancel')}</button>
                <button type="submit" className="btn-primary-custom" disabled={loading}>
                  {loading ? t('projects.saving') : editProject ? t('projects.update') : t('projects.createBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function FolderEmpty() {
  return (
    <svg width="60" height="60" fill="none" viewBox="0 0 24 24" style={{ margin: '0 auto', display: 'block', color: '#cbd5e1' }}>
      <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  )
}

function iconBtn(bg, color) {
  return { background: bg, border: 'none', cursor: 'pointer', width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color }
}
