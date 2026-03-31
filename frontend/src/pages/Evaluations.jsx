import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, Trash2, Target, Plus, Edit2 } from 'lucide-react'
import api from '../services/api'
import socket from '../services/socket'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useTranslation } from 'react-i18next'
import useAuthStore from '../store/authStore'
import ErrorBoundary from '../components/ErrorBoundary'

const EMPTY_FORM = { indicator: '', targetValue: 100, actualValue: 0, projectId: '' }

export default function Evaluations() {
  const { t } = useTranslation()
  const user = useAuthStore(state => state.user)
  const isManager = user?.role === 'MANAGER'
  const [evals, setEvals] = useState([])
  const [projects, setProjects] = useState([])
  const [mounted, setMounted] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editEval, setEditEval] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)

  const fetchAll = async () => {
    const tCache = Date.now()
    const [e, p] = await Promise.all([api.get(`/evaluations?t=${tCache}`), api.get(`/projects?t=${tCache}`)])
    setEvals(e.data || [])
    setProjects(p.data || [])
  }

  useEffect(() => {
    let timer;
    const handleUpdate = () => {
      clearTimeout(timer)
      timer = setTimeout(fetchAll, 500)
    }

    fetchAll()
    socket.on('evaluation_updated', handleUpdate)
    const mountTimer = setTimeout(() => setMounted(true), 300)
    
    return () => {
      socket.off('evaluation_updated', handleUpdate)
      clearTimeout(timer)
      clearTimeout(mountTimer)
    }
  }, [])

  const openCreate = () => {
    setEditEval(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  const openEdit = (ev) => {
    setEditEval(ev)
    setForm({
      indicator: ev.indicator,
      targetValue: ev.targetValue,
      actualValue: ev.actualValue,
      projectId: ev.projectId || ''
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.indicator) return toast.error(t('evaluations.indicatorReq'))
    setLoading(true)
    try {
      const payload = {
        indicator: form.indicator,
        targetValue: parseFloat(form.targetValue) || 0,
        actualValue: parseFloat(form.actualValue) || 0,
        projectId: form.projectId ? parseInt(form.projectId) : null
      }
      if (editEval) {
        await api.put(`/evaluations/${editEval.id}`, payload)
        toast.success(t('evaluations.evalUpdated'))
      } else {
        await api.post('/evaluations', payload)
        toast.success(t('evaluations.evalCreated'))
      }
      setShowModal(false)
      fetchAll()
    } catch (err) {
      toast.error(err?.response?.data?.message || t('evaluations.indicatorReq'))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('evaluations.confirmDelete'))) return
    try {
      await api.delete(`/evaluations/${id}`)
      toast.success(t('evaluations.deleted'))
      fetchAll()
    } catch (err) {
      toast.error(err?.response?.data?.message || t('evaluations.indicatorReq'))
    }
  }

  const chartData = evals.slice(0, 8).map(e => ({
    name: e.indicator.length > 15 ? e.indicator.slice(0, 15) + '...' : e.indicator,
    [t('evaluations.target')]: e.targetValue,
    [t('evaluations.actual')]: e.actualValue
  }))

  const getPerf = (target, actual) => {
    if (!target) return null
    const pct = (actual / target) * 100
    if (pct >= 100) return { icon: TrendingUp, color: '#10b981', label: `${Math.round(pct)}%`, bg: '#f0fdf4' }
    if (pct >= 50) return { icon: Minus, color: '#f59e0b', label: `${Math.round(pct)}%`, bg: '#fffbeb' }
    return { icon: TrendingDown, color: '#ef4444', label: `${Math.round(pct)}%`, bg: '#fef2f2' }
  }

  // Global stats
  const avgPerf = evals.length > 0
    ? Math.round(evals.reduce((acc, ev) => acc + (ev.targetValue > 0 ? (ev.actualValue / ev.targetValue) * 100 : 0), 0) / evals.length)
    : 0
  const achieved = evals.filter(ev => ev.targetValue > 0 && (ev.actualValue / ev.targetValue) >= 1).length

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">{t('evaluations.title')}</h1>
          <p className="page-subtitle">{t('evaluations.subtitle', { count: evals.length })}</p>
        </div>
        {isManager && (
          <button className="btn-primary-custom" onClick={openCreate}>
            <Plus size={18} /> {t('evaluations.newIndicator')}
          </button>
        )}
      </div>

      {/* KPI Summary Cards */}
      {evals.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
          {[
            { label: t('evaluations.colIndicator') + 's', value: evals.length, color: '#6366f1', bg: '#f5f3ff' },
            { label: t('evaluations.colPerf') + ' moy.', value: `${avgPerf}%`, color: avgPerf >= 80 ? '#10b981' : avgPerf >= 50 ? '#f59e0b' : '#ef4444', bg: avgPerf >= 80 ? '#f0fdf4' : avgPerf >= 50 ? '#fffbeb' : '#fef2f2' },
            { label: 'Objectifs atteints', value: `${achieved}/${evals.length}`, color: '#10b981', bg: '#f0fdf4' },
          ].map((c, i) => (
            <div key={i} className="stat-card" style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: c.color, lineHeight: 1 }}>{c.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginTop: 6 }}>{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 ? (
        <div className="card-custom" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 20 }}>{t('evaluations.chartTitle')}</h3>
          <div style={{ height: 260, width: '100%', minHeight: 260 }}>
            {mounted && chartData.length > 0 ? (
              <ErrorBoundary>
                <ResponsiveContainer width="100%" height="100%" debounce={100}>
                  <BarChart data={chartData} barGap={8}>
                    <defs>
                      <linearGradient id="colorRealise" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={1} />
                        <stop offset="95%" stopColor="var(--primary-dark)" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} dx={-10} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} cursor={{ fill: '#f8fafc' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 13, fontWeight: 600, color: '#64748b', paddingTop: 20 }} />
                    <Bar name={t('evaluations.target')} dataKey={t('evaluations.target')} fill="#e2e8f0" radius={[6, 6, 0, 0]} barSize={28} />
                    <Bar name={t('evaluations.actual')} dataKey={t('evaluations.actual')} fill="url(#colorRealise)" radius={[6, 6, 0, 0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </ErrorBoundary>
            ) : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>{t('evaluations.loadingChart')}</div>}
          </div>
        </div>
      ) : (
        <div className="card-custom" style={{ marginBottom: 24, padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
          {t('evaluations.noData')}
        </div>
      )}

      {/* Indicators list */}
      <div className="card-custom">
        <table className="table-custom">
          <thead>
            <tr>
              <th>{t('evaluations.colIndicator')}</th>
              <th>{t('evaluations.colProject')}</th>
              <th>{t('evaluations.colTarget')}</th>
              <th>{t('evaluations.colActual')}</th>
              <th>{t('evaluations.colPerf')}</th>
              {isManager && <th>{t('evaluations.colActions')}</th>}
            </tr>
          </thead>
          <tbody>
            {evals.length === 0 ? (
              <tr><td colSpan={isManager ? 6 : 5} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>{t('evaluations.noIndicator')}</td></tr>
            ) : evals.map(ev => {
              const perf = getPerf(ev.targetValue, ev.actualValue)
              const pct = ev.targetValue ? Math.min(100, Math.round((ev.actualValue / ev.targetValue) * 100)) : 0
              return (
                <tr key={ev.id}>
                  <td data-label={t('evaluations.colIndicator')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 32, background: '#eff6ff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Target size={15} color="#1e40af" />
                      </div>
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>{ev.indicator}</span>
                    </div>
                  </td>
                  <td data-label={t('evaluations.colProject')} style={{ color: '#64748b', fontSize: 13 }}>{projects.find(p => p.id === ev.projectId)?.name || '—'}</td>
                  <td data-label={t('evaluations.colTarget')} style={{ fontWeight: 600, color: '#1e293b' }}>{ev.targetValue}</td>
                  <td data-label={t('evaluations.colActual')} style={{ fontWeight: 600, color: '#1e293b' }}>{ev.actualValue}</td>
                  <td data-label={t('evaluations.colPerf')}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 100 }}>
                      {perf && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, background: perf.bg, color: perf.color, fontSize: 12, fontWeight: 700, width: 'fit-content' }}>
                          <perf.icon size={12} />{perf.label}
                        </span>
                      )}
                      <div className="progress-bar" style={{ height: 5 }}>
                        <div className="progress-fill" style={{ width: `${pct}%`, background: perf?.color || '#3b82f6' }} />
                      </div>
                    </div>
                  </td>
                  {isManager && (
                    <td data-label={t('evaluations.colActions')}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => openEdit(ev)}
                          style={{ background: '#fef3c7', border: 'none', cursor: 'pointer', width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}
                          title={t('evaluations.editEval')}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(ev.id)}
                          style={{ background: '#fef2f2', border: 'none', cursor: 'pointer', width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}
                          title={t('evaluations.confirmDelete')}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="cpm-modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="cpm-modal-box" onMouseDown={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#1e293b' }}>
              {editEval ? t('evaluations.editEval') : t('evaluations.newIndicator')}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>{t('evaluations.formIndicator')}</label>
                <input
                  className="input-custom"
                  value={form.indicator}
                  onChange={e => setForm(f => ({ ...f, indicator: e.target.value }))}
                  placeholder={t('evaluations.formIndicatorPlaceholder')}
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>{t('evaluations.formTarget')}</label>
                  <input
                    className="input-custom"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.targetValue}
                    onChange={e => setForm(f => ({ ...f, targetValue: e.target.value }))}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>{t('evaluations.formActual')}</label>
                  <input
                    className="input-custom"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.actualValue}
                    onChange={e => setForm(f => ({ ...f, actualValue: e.target.value }))}
                  />
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>{t('evaluations.formProject')}</label>
                <select className="input-custom" value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}>
                  <option value="">{t('evaluations.noProject')}</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {/* Live preview of performance */}
              {form.targetValue > 0 && (
                <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  {(() => {
                    const pct = Math.round((parseFloat(form.actualValue) / parseFloat(form.targetValue)) * 100)
                    const color = pct >= 100 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="progress-bar" style={{ flex: 1, height: 8 }}>
                          <div className="progress-fill" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color, minWidth: 40 }}>{pct}%</span>
                      </div>
                    )
                  })()}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#64748b' }}>
                  {t('evaluations.cancel')}
                </button>
                <button type="submit" className="btn-primary-custom" disabled={loading}>
                  {loading ? t('evaluations.saving') : editEval ? t('evaluations.update') : t('evaluations.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
