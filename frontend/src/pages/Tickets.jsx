import { useEffect, useState } from 'react'
import { Plus, MessageSquare, AlertCircle, Minus, ArrowUp, Search, ArrowLeft, SendHorizontal } from 'lucide-react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import AvatarImage from '../components/AvatarImage'
import socket from '../services/socket'
import { useTranslation } from 'react-i18next'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

const COLUMNS = [
  { key: 'OPEN', color: '#ef4444', bg: '#fef2f2' },
  { key: 'IN_PROGRESS', color: '#f59e0b', bg: '#fffbeb' },
  { key: 'RESOLVED', color: '#10b981', bg: '#f0fdf4' },
]
const PRIORITY_CONFIG = {
  LOW: { color: '#10b981', icon: Minus },
  MEDIUM: { color: '#f59e0b', icon: AlertCircle },
  HIGH: { color: '#ef4444', icon: ArrowUp }
}
const EMPTY_FORM = { title: '', description: '', priority: 'MEDIUM', status: 'OPEN' }

export default function Tickets() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [tickets, setTickets] = useState([])
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [showModal, setShowModal] = useState(false)
  const [showDetail, setShowDetail] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [comment, setComment] = useState('')
  const [expandedCol, setExpandedCol] = useState('OPEN')
  const user = useAuthStore(state => state.user)

  const fetchTickets = async () => {
    try {
      const res = await api.get(`/tickets?t=${Date.now()}`)
      setTickets(res.data || [])
    } catch (error) {
      console.error('Erreur chargement tickets:', error)
      toast.error(t('tickets.loadError'))
    }
  }

  useEffect(() => {
    const s = searchParams.get('search')
    if (s !== null) setSearch(s)
  }, [searchParams])

  useEffect(() => { 
    let timer;
    const handleUpdate = () => {
      clearTimeout(timer)
      timer = setTimeout(fetchTickets, 500)
    }

    fetchTickets()
    socket.on('ticket_updated', handleUpdate)
    return () => {
      socket.off('ticket_updated', handleUpdate)
      clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (showDetail) {
      const updated = tickets.find(t => t.id === showDetail.id)
      if (updated) setShowDetail(updated)
    }
  }, [tickets])

  const filteredTickets = tickets.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) || 
    (t.description && t.description.toLowerCase().includes(search.toLowerCase())) ||
    t.id.toString().includes(search)
  )

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.title) return toast.error(t('tickets.titleReq'))
    setLoading(true)
    try {
      await api.post('/tickets', form)
      toast.success(t('tickets.created'))
      setShowModal(false); setForm(EMPTY_FORM); fetchTickets()
    } catch (err) {
      console.error('Erreur création ticket:', err)
      toast.error(t('tickets.createError'))
    } finally { setLoading(false) }
  }

  const changeStatus = async (ticket, newStatus) => {
    try {
      await api.put(`/tickets/${ticket.id}`, { ...ticket, status: newStatus })
      toast.success(t('tickets.statusUpdated'))
      fetchTickets()
      if (showDetail?.id === ticket.id) setShowDetail({ ...showDetail, status: newStatus })
    } catch (error) {
      toast.error(t('tickets.statusError'))
    }
  }

  const deleteTicket = async (ticket, e) => {
    e.stopPropagation()
    if (!window.confirm(t('tickets.deleteConfirm') || 'Supprimer ce ticket résolu ?')) return
    try {
      await api.delete(`/tickets/${ticket.id}`)
      toast.success(t('tickets.deleted') || 'Ticket supprimé')
      fetchTickets()
      if (showDetail?.id === ticket.id) setShowDetail(null)
    } catch (err) {
      toast.error(err?.response?.data?.message || t('tickets.deleteError') || 'Erreur lors de la suppression')
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    try {
      const res = await api.post(`/tickets/${showDetail.id}/comments`, { content: comment })
      const newComment = res.data
      const updatedDetail = { ...showDetail, comments: [...(showDetail.comments || []), newComment] }
      setShowDetail(updatedDetail)
      setTickets(tickets.map(t => t.id === showDetail.id ? updatedDetail : t))
      setComment('')
      toast.success(t('tickets.commentAdded'))
    } catch (err) {
      toast.error(t('tickets.commentError'))
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
            <h1 className="page-title">{t('tickets.title')}</h1>
            <p className="page-subtitle">{t('tickets.subtitle', { count: tickets.length, open: tickets.filter(ti => ti.status === 'OPEN').length })}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative', width: 250 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              className="input-custom" 
              style={{ paddingLeft: 36, height: 42 }} 
              placeholder={t('tickets.searchPlaceholder') || t('projects.search')} 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          {user?.role === 'COLLABORATOR' && (
            <button className="btn-primary-custom" onClick={() => setShowModal(true)}>
              <Plus size={18} /> <span>{t('tickets.newTicket')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Kanban board */}
      <div className="kanban-grid">
        {COLUMNS.map(col => {
          const colTickets = filteredTickets.filter(t => t.status === col.key)
          const isExpanded = expandedCol === col.key
          return (
            <div key={col.key} className="kanban-column" style={{ minHeight: isExpanded ? 200 : 'auto' }}>
              <div 
                style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, cursor: 'pointer' }}
                onClick={() => { if (window.innerWidth <= 768) setExpandedCol(isExpanded ? null : col.key) }}
              >
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: col.color }} />
                <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>
                  {col.key === 'OPEN' ? t('tickets.open') : col.key === 'IN_PROGRESS' ? t('tickets.inProgress') : t('tickets.resolved')}
                </span>
                <span style={{ marginLeft: 'auto', background: col.bg, color: col.color, borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>{colTickets.length}</span>
                <span className="sm:hidden" style={{ marginLeft: 8, fontSize: 12, color: '#94a3b8' }}>{isExpanded ? '▼' : '▶'}</span>
              </div>
              
              <div style={{ display: (isExpanded || window.innerWidth > 768) ? 'block' : 'none' }}>
                {colTickets.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 10px', color: '#cbd5e1', fontSize: 13 }}>{t('tickets.noTicket')}</div>
                ) : colTickets.map(ti => {
                  const prio = PRIORITY_CONFIG[ti.priority]
                  return (
                    <div
                      key={ti.id}
                      className="kanban-card"
                      style={{ borderLeftColor: prio?.color }}
                      onClick={() => setShowDetail(ti)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>#{ti.id}</span>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                            <MessageSquare size={13} /> {ti.comments?.length || 0}
                          </span>
                          {prio && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: prio.color, fontWeight: 700, background: prio.color + '15', padding: '2px 7px', borderRadius: 5 }}>
                              <prio.icon size={11} /> {ti.priority === 'LOW' ? t('tickets.low') : ti.priority === 'MEDIUM' ? t('tickets.medium') : t('tickets.high')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-wrap" style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 6, lineHeight: 1.4 }}>{ti.title}</div>
                      {ti.description && (
                        <div className="text-wrap" style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{ti.description}</div>
                      )}
                      {user?.role === 'MANAGER' && (
                        <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {col.key !== 'OPEN' && <button onClick={e => { e.stopPropagation(); changeStatus(ti, 'OPEN') }} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 5, border: 'none', cursor: 'pointer', background: '#fef2f2', color: '#dc2626', fontWeight: 600 }}>{t('tickets.reopen')}</button>}
                          {col.key !== 'IN_PROGRESS' && col.key !== 'RESOLVED' && <button onClick={e => { e.stopPropagation(); changeStatus(ti, 'IN_PROGRESS') }} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 5, border: 'none', cursor: 'pointer', background: '#fffbeb', color: '#d97706', fontWeight: 600 }}>{t('tickets.setToInProgress')}</button>}
                          {col.key !== 'RESOLVED' && <button onClick={e => { e.stopPropagation(); changeStatus(ti, 'RESOLVED') }} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 5, border: 'none', cursor: 'pointer', background: '#f0fdf4', color: '#16a34a', fontWeight: 600 }}>{t('tickets.resolve')}</button>}
                          {col.key === 'RESOLVED' && <button onClick={e => deleteTicket(ti, e)} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 5, border: 'none', cursor: 'pointer', background: '#fee2e2', color: '#b91c1c', fontWeight: 600, marginLeft: 'auto' }}>🗑 {t('tickets.delete') || 'Supprimer'}</button>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="cpm-modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="cpm-modal-box" onMouseDown={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#1e293b' }}>{t('tickets.newTicket')}</h2>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>{t('tickets.formTitle')}</label>
                <input className="input-custom" placeholder={t('tickets.formTitlePlaceholder')} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>{t('tickets.formDescription')}</label>
                <textarea className="input-custom" rows={4} placeholder={t('tickets.formDescriptionPlaceholder')} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'vertical' }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>{t('tickets.formPriority')}</label>
                <select className="input-custom" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  <option value="LOW">{t('tickets.low')}</option>
                  <option value="MEDIUM">{t('tickets.medium')}</option>
                  <option value="HIGH">{t('tickets.high')}</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#64748b' }}>{t('tickets.cancel')}</button>
                <button type="submit" className="btn-primary-custom" disabled={loading}>
                  <span>{loading ? t('tickets.creating') : t('tickets.createBtn')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="cpm-modal-overlay" onClick={e => e.target === e.currentTarget && setShowDetail(null)}>
          <div className="cpm-modal-box">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, marginBottom: 4 }}>{t('tickets.ticketCaps')} #{showDetail.id}</div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1e293b' }}>{showDetail.title}</h2>
              </div>
              <button onClick={() => setShowDetail(null)} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', borderRadius: 8, padding: '6px 12px', color: '#64748b' }}>✕</button>
            </div>
            {showDetail.description && (
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, fontSize: 13, color: '#475569', lineHeight: 1.6, marginBottom: 16 }}>{showDetail.description}</div>
            )}
            {user?.role === 'MANAGER' && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {COLUMNS.filter(c => c.key !== showDetail.status).map(c => (
                  <button key={c.key} onClick={() => changeStatus(showDetail, c.key)} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: c.bg, color: c.color, fontSize: 13, fontWeight: 600 }}>
                    → {c.key === 'OPEN' ? t('tickets.open') : c.key === 'IN_PROGRESS' ? t('tickets.inProgress') : t('tickets.resolved')}
                  </button>
                ))}
                {showDetail.status === 'RESOLVED' && (
                  <button onClick={e => deleteTicket(showDetail, e)} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#fee2e2', color: '#b91c1c', fontSize: 13, fontWeight: 600, marginLeft: 'auto' }}>
                    🗑 {t('tickets.delete')}
                  </button>
                )}
              </div>
            )}

            {/* Commentaires */}
            <div style={{ marginTop: 20, borderTop: '1px solid #e2e8f0', paddingTop: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>{t('tickets.commentsTitle')}</h3>
              <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {showDetail.comments?.map(c => (
                  <div key={c.id} style={{ display: 'flex', gap: 12 }}>
                    {c.user.avatar ? (
                      <AvatarImage src={c.user.avatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#64748b' }}>
                        {c.user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div style={{ background: c.userId === user.id ? '#f0fdf4' : '#f8fafc', padding: '10px 14px', borderRadius: 12, flex: 1, border: c.userId === user.id ? '1px solid #dcfce7' : '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{c.user.name}</span>
                        <span style={{ fontSize: 10, color: '#94a3b8' }}>{new Date(c.createdAt).toLocaleString()}</span>
                      </div>
                      <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>{c.content}</div>
                    </div>
                  </div>
                ))}
                {(!showDetail.comments || showDetail.comments.length === 0) && (
                  <div style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>{t('tickets.noComment')}</div>
                )}
              </div>
              {user?.role !== 'ADMIN' && (
                <form onSubmit={handleAddComment} style={{ display: 'flex', gap: 10 }}>
                  <input
                    type="text"
                    className="input-custom"
                    style={{ flex: 1, height: 40, background: '#f8fafc', border: '1px solid #e2e8f0', paddingLeft: 16 }}
                    placeholder={t('tickets.commentPlaceholder') || "Écrivez un message..."}
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                  />
                  <button type="submit" className="btn-primary-custom" disabled={loading || !comment.trim()} style={{ height: 40, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <SendHorizontal size={16} /> <span>{t('tickets.send') || "Envoyer"}</span>
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
