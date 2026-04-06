import { useEffect, useState } from 'react'
import { Plus, Search, Eye, FileText, Trash2, Printer } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import socket from '../services/socket'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'
import useAuthStore from '../store/authStore'

export default function Invoices() {
  const { t } = useTranslation()
  const [invoices, setInvoices] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('ALL')
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const isAdminOrManager = ['ADMIN', 'MANAGER'].includes(user?.role)

  const fetchInvoices = () => {
    api.get(`/invoices?t=${Date.now()}`).then(r => setInvoices(r.data || [])).catch(() => {})
  }

  useEffect(() => { 
    let timer;
    const handleUpdate = () => {
      clearTimeout(timer)
      timer = setTimeout(fetchInvoices, 500)
    }

    fetchInvoices()
    socket.on('invoice_updated', handleUpdate)
    return () => {
      socket.off('invoice_updated', handleUpdate)
      clearTimeout(timer)
    }
  }, [])


  const deleteInvoice = async (inv) => {
    if (!window.confirm(t('invoices.deleteConfirm') || 'Supprimer cette facture payée ?')) return
    try {
      await api.delete(`/invoices/${inv.id}`)
      toast.success(t('invoices.deleted') || 'Facture supprimée')
      fetchInvoices()
    } catch (err) {
      toast.error(err?.response?.data?.message || t('invoices.deleteError') || 'Erreur lors de la suppression')
    }
  }

  const filtered = invoices.filter(i => {
    const matchSearch = (i.number || '').toLowerCase().includes(search.toLowerCase()) ||
      (i.client?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (i.project?.name || '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'ALL' || i.status === filter
    return matchSearch && matchFilter
  })

  const totalAmount = invoices.reduce((a, i) => a + (i.totalTTC || 0), 0)
  const paidAmount = invoices.filter(i => i.status === 'PAID').reduce((a, i) => a + (i.totalTTC || 0), 0)

  const getStatusStyle = (status) => {
    switch (status) {
      case 'PAID': return { background: '#f0fdf4', color: '#16a34a' }
      case 'APPROVED': return { background: '#eff6ff', color: '#1e40af' }
      case 'REJECTED': return { background: '#fef2f2', color: '#dc2626' }
      default: return { background: '#fffbeb', color: '#d97706' }
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'PAID': return t('invoices.statusPaid')
      case 'APPROVED': return t('invoices.statusApproved')
      case 'REJECTED': return t('invoices.statusRejected')
      default: return t('invoices.statusPending')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">{t('invoices.title')}</h1>
          <p className="page-subtitle">{t('invoices.subtitle', { count: invoices.length })}</p>
        </div>
        {user?.role === 'MANAGER' && (
          <button className="btn-primary-custom" onClick={() => navigate('/invoices/new')}>
            <Plus size={18} /> <span>{t('invoices.newInvoice')}</span>
          </button>
        )}
      </div>

      {/* Summary cards - Only for Admin/Manager */}
      {isAdminOrManager && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { label: t('invoices.totalBilled'), value: `${Math.round(totalAmount).toLocaleString(i18n.language === 'en' ? 'en-US' : 'fr-FR')} ${t('invoices.currency')}`, color: '#1e40af', bg: '#eff6ff', icon: FileText },
            { label: t('invoices.amountCollected'), value: `${Math.round(paidAmount).toLocaleString(i18n.language === 'en' ? 'en-US' : 'fr-FR')} ${t('invoices.currency')}`, color: '#10b981', bg: '#f0fdf4', icon: FileText },
            { label: t('invoices.pending'), value: `${Math.round(totalAmount - paidAmount).toLocaleString(i18n.language === 'en' ? 'en-US' : 'fr-FR')} ${t('invoices.currency')}`, color: '#f59e0b', bg: '#fffbeb', icon: FileText },
            { label: t('invoices.totalCount'), value: invoices.length, color: '#6366f1', bg: '#f5f3ff', icon: FileText },
          ].map(({ label, value, color, bg, icon: Icon }) => (
            <div key={label} className="stat-card">
              <div className="stat-icon" style={{ background: bg }}><Icon size={20} color={color} /></div>
              <div>
                <div style={{ fontSize: typeof value === 'number' ? 28 : 18, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input className="input-custom" style={{ paddingLeft: 36 }} placeholder={t('invoices.searchPlaceholder')} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {[
          ['ALL', t('invoices.filterAll')],
          ['PENDING', t('invoices.filterPending')],
          ['APPROVED', t('invoices.statusApproved')],
          ['PAID', t('invoices.filterPaid')]
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`filter-pill ${filter === key ? 'active' : ''}`}
          >
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card-custom" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table-custom">
          <thead>
            <tr>
              <th>{t('invoices.colNumber')}</th>
              <th>{t('invoices.colClient')}</th>
              <th>{t('invoices.colProject')}</th>
              <th>{t('invoices.colDate')}</th>
              <th>{t('invoices.colTTC')}</th>
              <th>{t('invoices.colStatus')}</th>
              <th>{t('invoices.colActions')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>{t('invoices.noInvoice')}</td></tr>
            ) : filtered.map(inv => (
              <tr key={inv.id}>
                <td data-label={t('invoices.colNumber')}><span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e40af' }}>{inv.number}</span></td>
                <td data-label={t('invoices.colClient')} style={{ fontWeight: 600, color: 'var(--text-main)' }}>{inv.client?.name || '—'}</td>
                <td data-label={t('invoices.colProject')} style={{ fontWeight: 600, color: '#64748b', fontSize: 13 }}>{inv.project?.name || '—'}</td>
                <td data-label={t('invoices.colDate')} style={{ color: 'var(--text-muted)', fontSize: 13 }}>{inv.date ? new Date(inv.date).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'fr-FR') : '—'}</td>
                <td data-label={t('invoices.colTTC')} style={{ fontWeight: 800, color: 'var(--text-main)' }}>{Math.round(inv.totalTTC || 0).toLocaleString(i18n.language === 'en' ? 'en-US' : 'fr-FR')} {t('invoices.currency')}</td>
                <td data-label={t('invoices.colStatus')}>
                  <span className="badge-status" style={getStatusStyle(inv.status)}>
                    {getStatusLabel(inv.status)}
                  </span>
                </td>
                <td data-label={t('invoices.colActions')}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => navigate(`/invoices/${inv.id}`)} style={{ background: '#eff6ff', border: 'none', cursor: 'pointer', width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e40af' }} title={t('invoices.viewPdf')}>
                      <Eye size={13} />
                    </button>
                    {user?.role === 'MANAGER' && ['PAID', 'REJECTED'].includes(inv.status) && (
                      <button onClick={() => deleteInvoice(inv)} style={{ background: '#fee2e2', border: 'none', cursor: 'pointer', width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b91c1c' }} title={t('invoices.delete') || 'Supprimer'}>
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
