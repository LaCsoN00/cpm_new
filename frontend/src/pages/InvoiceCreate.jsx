import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Plus, Trash2, FileText, Upload, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import useSettingsStore from '../store/settingsStore'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'

// Helper: format number without decimals
const fmt = (v) => {
  const locale = i18n.language === 'en' ? 'en-US' : 'fr-FR'
  return Math.round(v || 0).toLocaleString(locale)
}

export default function InvoiceCreate() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [clientId, setClientId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [status, setStatus] = useState('PENDING')
  const [tvaRate, setTvaRate] = useState(20)
  const { companyLogo, companyInfo, setCompanyLogo, setCompanyInfo } = useSettingsStore()
  const [localCompanyInfo, setLocalCompanyInfo] = useState(companyInfo || { name: '', address: '', phone: '', email: '' })
  const [items, setItems] = useState([{ description: '', quantity: 1, price: 0 }])
  const [loading, setLoading] = useState(false)
  const logoInputRef = useRef(null)

  useEffect(() => { 
    api.get('/clients').then(r => setClients(r.data || [])).catch(() => {})
    api.get('/projects').then(r => setProjects(r.data || [])).catch(() => {})
  }, [])

  const addItem = () => setItems(i => [...i, { description: '', quantity: 1, price: 0 }])
  const removeItem = (idx) => setItems(i => i.filter((_, j) => j !== idx))
  const updateItem = (idx, field, value) => setItems(i => i.map((item, j) => j === idx ? { ...item, [field]: value } : item))

  const totalHT = items.reduce((sum, i) => sum + (parseFloat(i.quantity) || 0) * (parseFloat(i.price) || 0), 0)
  const tva = totalHT * (parseFloat(tvaRate) || 0) / 100
  const totalTTC = totalHT + tva

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error(t('invoiceCreate.logoSizeError')); return }
    const reader = new FileReader()
    reader.onload = (ev) => setCompanyLogo(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!clientId) return toast.error(t('invoiceCreate.clientReq'))
    if (!projectId) return toast.error(t('invoiceCreate.projectReq') || 'Veuillez sélectionner un projet')
    if (items.some(i => !i.description)) return toast.error(t('invoiceCreate.descReq'))
    setLoading(true)
    // Persist company info to store
    setCompanyInfo(localCompanyInfo)
    try {
      const res = await api.post('/invoices', {
        clientId: parseInt(clientId),
        projectId: projectId ? parseInt(projectId) : null,
        status,
        totalHT,
        TVA: tva,
        totalTTC,
        companyName: localCompanyInfo.name,
        companyAddress: localCompanyInfo.address,
        companyPhone: localCompanyInfo.phone,
        companyEmail: localCompanyInfo.email,
        companyLogo: companyLogo,
        items: items.map(i => ({ description: i.description, quantity: parseFloat(i.quantity), price: parseFloat(i.price) }))
      })
      toast.success(t('invoiceCreate.created'))
      navigate(`/invoices/${res.data.id}`)
    } catch {} finally { setLoading(false) }
  }

  const selectedClient = clients.find(c => c.id === parseInt(clientId))
  const clientProjects = projects.filter(p => p.clientId === parseInt(clientId))

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate('/invoices')} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 className="page-title">{t('invoiceCreate.title')}</h1>
        </div>
        <button className="btn-primary-custom" onClick={handleSubmit} disabled={loading}>
          <FileText size={18} /> {loading ? t('invoiceCreate.creating') : t('invoiceCreate.createBtn')}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        {/* Company info */}
        <div className="card-custom">
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
            {t('invoiceCreate.companyInfoTitle')}
          </h3>

          {/* Logo upload */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 8, color: '#64748b' }}>{t('invoiceCreate.logoLabel')}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {companyLogo ? (
                <div style={{ position: 'relative' }}>
                  <img src={companyLogo} alt="Logo" style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', padding: 4 }} />
                  <button onClick={() => setCompanyLogo(null)} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button onClick={() => logoInputRef.current?.click()} style={{ width: 64, height: 64, borderRadius: 10, border: '2px dashed #cbd5e1', background: '#f8fafc', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#94a3b8', transition: 'all 0.2s' }}>
                  <Upload size={16} />
                  <span style={{ fontSize: 9, fontWeight: 600 }}>Logo</span>
                </button>
              )}
              <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
              <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.4 }}>
                {t('invoiceCreate.logoFormat')}<br />{t('invoiceCreate.logoMax')}
              </div>
            </div>
          </div>

          {[
            { label: t('invoiceCreate.companyName'), key: 'name' },
            { label: t('invoiceCreate.companyAddress'), key: 'address' },
            { label: t('invoiceCreate.companyPhone'), key: 'phone' },
            { label: t('invoiceCreate.companyEmail'), key: 'email' },
          ].map(({ label, key }) => (
            <div key={key} style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: '#64748b' }}>{label}</label>
              <input className="input-custom" value={localCompanyInfo[key]} onChange={e => setLocalCompanyInfo(c => ({ ...c, [key]: e.target.value }))} />
            </div>
          ))}
        </div>

        {/* Client + settings */}
        <div className="card-custom">
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
            {t('invoiceCreate.clientSettingsTitle')}
          </h3>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: '#64748b' }}>{t('invoiceCreate.clientLabel')}</label>
            <select className="input-custom" value={clientId} onChange={e => { setClientId(e.target.value); setProjectId(''); }}>
              <option value="">{t('invoiceCreate.selectClient')}</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: '#64748b' }}>{t('invoiceCreate.projectLabel')} <span style={{ color: '#ef4444' }}>*</span></label>
            <select className="input-custom" value={projectId} onChange={e => setProjectId(e.target.value)}>
              <option value="">{t('invoiceCreate.selectProject')}</option>
              {clientProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          {selectedClient && (
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 12, color: '#64748b', lineHeight: 1.8 }}>
              <strong style={{ color: '#1e293b' }}>{selectedClient.name}</strong>
              {selectedClient.company && <><br />{selectedClient.company}</>}
              {selectedClient.email && <><br />✉ {selectedClient.email}</>}
              {selectedClient.phone && <><br />📞 {selectedClient.phone}</>}
            </div>
          )}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: '#64748b' }}>{t('invoiceCreate.tvaRate')}</label>
            <input
              className="input-custom"
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={tvaRate}
              onChange={e => setTvaRate(e.target.value)}
              style={{ fontSize: 13 }}
            />
          </div>
          <div style={{ background: '#eff6ff', borderRadius: 10, padding: 12, fontSize: 12, color: '#1e40af' }}>
            <strong>{t('invoiceCreate.tvaApplied')}</strong> {parseFloat(tvaRate) || 0}%
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="card-custom" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{t('invoiceCreate.itemsTitle')}</h3>
          <button className="btn-primary-custom" style={{ padding: '7px 14px', fontSize: 13 }} onClick={addItem}><Plus size={15} /> {t('invoiceCreate.addItem')}</button>
        </div>

        <div className="invoice-items-container">
          {window.innerWidth < 768 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {items.map((item, idx) => (
                <div key={idx} style={{ background: '#f8fafc', padding: 16, borderRadius: 16, border: '1px solid #e2e8f0', position: 'relative' }}>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>{t('invoiceCreate.colDesc')}</label>
                    <input className="input-custom" style={{ fontSize: 13, background: 'white' }} placeholder={t('invoiceCreate.descPlaceholder')} value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>{t('invoiceCreate.colQty')}</label>
                      <input className="input-custom" type="number" min="0.01" step="0.01" style={{ fontSize: 13, textAlign: 'right', background: 'white' }} value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>{t('invoiceCreate.colPrice', { currency: '' })}</label>
                      <input className="input-custom" type="number" min="0" step="0.01" style={{ fontSize: 13, textAlign: 'right', background: 'white' }} value={item.price} onChange={e => updateItem(idx, 'price', e.target.value)} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px dashed #e2e8f0' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>
                      {fmt((parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0))} {t('invoiceCreate.currency')}
                    </div>
                    {items.length > 1 && (
                      <button onClick={() => removeItem(idx)} style={{ background: '#fef2f2', border: 'none', cursor: 'pointer', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {[t('invoiceCreate.colDesc'), t('invoiceCreate.colQty'), t('invoiceCreate.colPrice', { currency: t('invoiceCreate.currency') }), t('invoiceCreate.colTotal', { currency: t('invoiceCreate.currency') }), ''].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '8px 12px', width: '45%' }}>
                        <input className="input-custom" style={{ fontSize: 13 }} placeholder={t('invoiceCreate.descPlaceholder')} value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} />
                      </td>
                      <td style={{ padding: '8px 12px', width: '12%' }}>
                        <input className="input-custom" type="number" min="0.01" step="0.01" style={{ fontSize: 13, textAlign: 'right' }} value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} />
                      </td>
                      <td style={{ padding: '8px 12px', width: '18%' }}>
                        <input className="input-custom" type="number" min="0" step="0.01" style={{ fontSize: 13, textAlign: 'right' }} value={item.price} onChange={e => updateItem(idx, 'price', e.target.value)} />
                      </td>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: '#1e293b', fontSize: 14 }}>
                        {fmt((parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0))} {t('invoiceCreate.currency')}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        {items.length > 1 && (
                          <button onClick={() => removeItem(idx)} style={{ background: '#fef2f2', border: 'none', cursor: 'pointer', width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}><Trash2 size={13} /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <div style={{ minWidth: 280, background: '#f8fafc', borderRadius: 14, padding: 20 }}>
            {[
              { label: t('invoiceCreate.labelHT'), value: totalHT },
              { label: t('invoiceCreate.labelTVA', { rate: parseFloat(tvaRate) || 0 }), value: tva },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #e2e8f0', fontSize: 14, color: '#64748b' }}>
                <span>{label} :</span>
                <span style={{ fontWeight: 600 }}>{fmt(value)} {t('invoiceCreate.currency')}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, fontSize: 18, fontWeight: 800 }}>
              <span style={{ color: '#1e293b' }}>{t('invoiceCreate.labelTTC')}</span>
              <span style={{ color: '#1e40af' }}>{fmt(totalTTC)} {t('invoiceCreate.currency')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
