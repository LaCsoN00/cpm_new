import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Printer, FileText, Trash2, CheckCircle, XCircle, CreditCard, Smartphone, Loader2, X } from 'lucide-react'
import api from '../services/api'
import socket from '../services/socket'
import toast from 'react-hot-toast'
import useSettingsStore from '../store/settingsStore'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'
import useAuthStore from '../store/authStore'

// Helper: format number without decimals
const fmt = (v) => {
  const locale = i18n.language === 'en' ? 'en-US' : 'fr-FR'
  return Math.round(v || 0).toLocaleString(locale)
}

export default function InvoicePreview() {
  const { t, i18n } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState(null)
  const { companyLogo: storeLogo, companyInfo: storeCompanyInfo } = useSettingsStore()

  // Priorité aux infos stockées sur la facture pour la cohérence entre utilisateurs
  const companyLogo = invoice?.companyLogo || storeLogo
  const companyInfo = (invoice?.companyName || invoice?.companyLogo) ? {
    name: invoice.companyName || 'CPM Pro',
    address: invoice.companyAddress || '',
    phone: invoice.companyPhone || '',
    email: invoice.companyEmail || ''
  } : (storeCompanyInfo || { name: 'CPM Pro', address: '', phone: '', email: '' })

  const user = useAuthStore(s => s.user)
  const isAdminOrManager = ['ADMIN', 'MANAGER'].includes(user?.role)

  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState(null)

  const fetchInvoice = () => {
    api.get(`/invoices/${id}?t=${Date.now()}`).then(r => setInvoice(r.data)).catch(() => navigate('/invoices'))
  }

  useEffect(() => {
    let timer;
    const handleUpdate = () => {
      clearTimeout(timer)
      timer = setTimeout(fetchInvoice, 500)
    }

    fetchInvoice()
    socket.on('invoice_updated', handleUpdate)
    return () => {
      socket.off('invoice_updated', handleUpdate)
      clearTimeout(timer)
    }
  }, [id])

  // Compute TVA rate from stored values
  const computedTvaRate = invoice && invoice.totalHT > 0
    ? Math.round((invoice.TVA / invoice.totalHT) * 100)
    : 20

  const updateStatus = async (newStatus, silent = false) => {
    try {
      const res = await api.put(`/invoices/${id}`, {
        status: newStatus,
        clientId: invoice.clientId || invoice.client?.id
      })
      if (res.data) {
        setInvoice(res.data)
        if (!silent) {
          let msg = ''
          if (newStatus === 'PAID') msg = t('invoicePreview.markedPaid')
          else if (newStatus === 'APPROVED') msg = t('invoicePreview.markedApproved')
          else if (newStatus === 'REJECTED') msg = t('invoicePreview.markedRejected')
          else msg = t('invoicePreview.markedPending')
          toast.success(msg)
        }
      }
    } catch (err) {
      console.error(err)
      toast.error(t('invoicePreview.statusUpdateError'))
    }
  }

  const deleteInvoice = async () => {
    if (!window.confirm(t('invoicePreview.deleteConfirm') || 'Supprimer cette facture payée ?')) return
    try {
      await api.delete(`/invoices/${id}`)
      toast.success(t('invoicePreview.deleted') || 'Facture supprimée')
      navigate('/invoices')
    } catch (err) {
      toast.error(err?.response?.data?.message || t('invoicePreview.deleteError') || 'Erreur lors de la suppression')
    }
  }

  const handlePayment = async () => {
    if (!paymentMethod) return
    setIsProcessingPayment(true)
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    await updateStatus('PAID', true)
    setIsProcessingPayment(false)
    setShowPaymentModal(false)
    toast.success('Paiement effectué avec succès !')
  }

  if (!invoice) return <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>{t('invoicePreview.loading')}</div>

  const getStatusDisplay = () => {
    switch (invoice.status) {
      case 'PAID': return { label: t('invoicePreview.paidCheck'), color: '#16a34a', bg: '#f0fdf4' }
      case 'APPROVED': return { label: t('invoicePreview.approvedCheck'), color: '#1e40af', bg: '#eff6ff' }
      case 'REJECTED': return { label: t('invoicePreview.rejectedCheck'), color: '#dc2626', bg: '#fef2f2' }
      default: return { label: t('invoicePreview.pendingClock'), color: '#d97706', bg: '#fffbeb' }
    }
  }

  const statusDisplay = getStatusDisplay()

  return (
    <div>
      {/* Action bar */}
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/invoices')} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 className="page-title">{t('invoicePreview.invoiceTitle', { number: invoice.number })}</h1>
          <p className="page-subtitle">{invoice.client?.name} • {new Date(invoice.date).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US')}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {user?.role === 'MANAGER' && invoice.status !== 'PAID' && (
            <button
              type="button"
              onClick={() => updateStatus('PAID')}
              disabled={invoice.status !== 'APPROVED'}
              title={invoice.status !== 'APPROVED' ? t('invoicePreview.waitApproval') || 'En attente d\'approbation du collaborateur' : ''}
              style={{
                padding: '9px 16px', borderRadius: 10, border: 'none',
                cursor: invoice.status === 'APPROVED' ? 'pointer' : 'not-allowed',
                fontWeight: 600, fontSize: 13,
                display: 'flex', alignItems: 'center', gap: 6,
                background: invoice.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.1)' : '#f1f5f9',
                color: invoice.status === 'APPROVED' ? '#16a34a' : '#94a3b8',
                opacity: invoice.status === 'APPROVED' ? 1 : 0.7,
                transition: 'all 0.2s'
              }}
            >
              <FileText size={15} /> {t('invoicePreview.setPaid')}
            </button>
          )}

          {!isAdminOrManager && invoice.status === 'PENDING' && (
            <>
              <button onClick={() => updateStatus('APPROVED')} style={{
                padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#eff6ff', color: '#1e40af'
              }}>
                <CheckCircle size={15} /> {t('invoicePreview.approve')}
              </button>
              <button onClick={() => updateStatus('REJECTED')} style={{
                padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#fef2f2', color: '#dc2626'
              }}>
                <XCircle size={15} /> {t('invoicePreview.reject')}
              </button>
            </>
          )}

          {!isAdminOrManager && invoice.status === 'APPROVED' && (
            <button onClick={() => setShowPaymentModal(true)} style={{
              padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.2s'
            }}>
              <CreditCard size={15} /> Payer la facture
            </button>
          )}

          {user?.role === 'MANAGER' && ['PAID', 'REJECTED'].includes(invoice.status) && (
            <button onClick={deleteInvoice} style={{
              padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(220, 38, 38, 0.1)', color: '#dc2626'
            }}>
              <Trash2 size={15} /> {t('invoicePreview.delete') || 'Supprimer'}
            </button>
          )}
          <button className="btn-primary-custom" onClick={() => window.print()}>
            <Printer size={18} /> {t('invoicePreview.print')}
          </button>
        </div>
      </div>

      {/* Invoice Preview */}
      <div className="invoice-print-area" style={{ 
          width: '100%',
          maxWidth: '850px',
          margin: '0 auto',
          background: 'white',
          minHeight: window.innerWidth < 640 ? 'auto' : '1100px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
          borderRadius: window.innerWidth < 640 ? '16px' : '24px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: window.innerWidth < 640 ? '20px' : '0'
        }}>
          {/* Watermark logo — centered flex container that covers the entire card */}
          {companyLogo && (
            <div style={{ position: 'absolute', top: '60%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.06, pointerEvents: 'none', zIndex: 0 }}>
              <img src={companyLogo} alt="" style={{ width: 500, height: 500, objectFit: 'contain' }} />
            </div>
          )}
          {/* Header */}
          <div style={{ padding: window.innerWidth < 640 ? '24px 20px' : '48px 36px', borderBottom: '1px solid #f1f5f9', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexDirection: window.innerWidth < 640 ? 'column' : 'row', gap: 16 }}>
              <div>
                <p style={{ fontSize: window.innerWidth < 640 ? 24 : 32, fontWeight: 900, color: '#1e3a8a', letterSpacing: -1 }}>{t('invoicePreview.invoiceLabel', { defaultValue: 'INVOICE' }).toUpperCase()}</p>
                <p style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>#{invoice.number}</p>
              </div>
              <div className="no-print">
                <button onClick={() => window.print()} className="btn-primary-custom" style={{ padding: '8px 20px', fontSize: 13 }}>
                  <Printer size={16} /> {t('invoicePreview.printBtn', { defaultValue: 'Print' })}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, flexDirection: window.innerWidth < 640 ? 'column' : 'row', gap: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {companyLogo && (
                  <img src={companyLogo} alt="Logo" style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 10, background: 'white', padding: 6 }} />
                )}
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.5px' }}>{companyInfo.name || 'CPM Pro'}</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{companyInfo.address || ''}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{companyInfo.phone || ''} • {companyInfo.email || ''}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  padding: '8px 20px', borderRadius: 40, fontWeight: 700, fontSize: 13,
                  background: statusDisplay.bg,
                  color: statusDisplay.color
                }}>
                  {statusDisplay.label}
                </span>
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: window.innerWidth < 640 ? '16px 16px' : '24px 36px', position: 'relative', zIndex: 1, flex: 1 }}>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', margin: window.innerWidth < 640 ? '0 -4px' : 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: window.innerWidth < 640 ? 450 : 'auto' }}>
                <thead>
                  <tr style={{ background: '#1e40af' }}>
                    {[t('invoicePreview.colDesc'), t('invoicePreview.colQty'), t('invoicePreview.colPrice'), t('invoicePreview.colHT')].map((h, i) => (
                      <th key={h} style={{ 
                        padding: window.innerWidth < 640 ? '10px 8px' : '14px 20px', 
                        textAlign: i === 0 ? 'left' : 'right', 
                        color: 'white', 
                        fontSize: window.innerWidth < 640 ? 11 : 12, 
                        fontWeight: 700, 
                        textTransform: 'uppercase', 
                        letterSpacing: 0.5 
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(invoice.items || []).map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: window.innerWidth < 640 ? '12px 8px' : '16px 20px', fontSize: window.innerWidth < 640 ? 12 : 14, color: '#1e293b', fontWeight: 500 }}>{item.description}</td>
                      <td style={{ padding: window.innerWidth < 640 ? '12px 8px' : '16px 20px', textAlign: 'right', fontSize: window.innerWidth < 640 ? 12 : 14, color: '#475569' }}>{item.quantity}</td>
                      <td style={{ padding: window.innerWidth < 640 ? '12px 8px' : '16px 20px', textAlign: 'right', fontSize: window.innerWidth < 640 ? 12 : 14, color: '#475569' }}>{fmt(item.price)}</td>
                      <td style={{ padding: window.innerWidth < 640 ? '12px 8px' : '16px 20px', textAlign: 'right', fontSize: window.innerWidth < 640 ? 12 : 14, fontWeight: 700, color: '#1e293b' }}>{fmt(item.quantity * item.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals — pushed to the bottom */}
          <div style={{ marginTop: 'auto', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: window.innerWidth < 640 ? '24px 20px' : '24px 36px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>{t('invoicePreview.billedTo')}</p>
                <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
                  <p style={{ fontWeight: 700, color: '#1e293b', fontSize: 14 }}>{invoice.client?.name}</p>
                  <p>{invoice.client?.email}</p>
                </div>
              </div>
              <div style={{ width: window.innerWidth < 640 ? '100%' : 280, background: '#f8fafc', borderRadius: 14, overflow: 'hidden' }}>
                {[
                  { label: t('invoicePreview.labelHT'), value: invoice.totalHT },
                  { label: t('invoicePreview.labelTVA', { rate: computedTvaRate }), value: invoice.TVA },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid #e2e8f0', fontSize: 13 }}>
                    <span style={{ color: '#64748b' }}>{label} :</span>
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>{fmt(value)} {t('invoicePreview.currency')}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: '#1e40af' }}>
                  <span style={{ fontWeight: 800, color: 'white', fontSize: 14 }}>{t('invoicePreview.labelTTC')}</span>
                  <span style={{ fontWeight: 900, color: 'white', fontSize: 16 }}>{fmt(invoice.totalTTC)} {t('invoicePreview.currency')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="cpm-modal-overlay">
          <div className="cpm-modal-box" style={{ maxWidth: 400 }}>
            {isProcessingPayment ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <Loader2 size={48} color="#10b981" className="animate-spin" style={{ margin: '0 auto', marginBottom: 20 }} />
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>Traitement du paiement en cours...</h3>
                <p style={{ color: '#64748b', fontSize: 14, marginTop: 10 }}>Veuillez patienter pendant que nous communiquons avec la banque.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>Règlement de la facture</h2>
                  <button onClick={() => setShowPaymentModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                    <X size={20} />
                  </button>
                </div>

                <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>
                  Montant à régler : <span style={{ fontWeight: 800, color: '#1e293b' }}>{fmt(invoice.totalTTC)} {t('invoicePreview.currency')}</span>
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                  <button
                    onClick={() => setPaymentMethod('MOBILE')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12, border: '1.5px solid',
                      borderColor: paymentMethod === 'MOBILE' ? '#10b981' : '#e2e8f0',
                      background: paymentMethod === 'MOBILE' ? 'rgba(16, 185, 129, 0.05)' : 'white',
                      cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
                    }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                      <Smartphone size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 15 }}>Mobile Money</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>Airtel money et Moov money Gabon</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('CARD')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12, border: '1.5px solid',
                      borderColor: paymentMethod === 'CARD' ? '#2563eb' : '#e2e8f0',
                      background: paymentMethod === 'CARD' ? 'rgba(37, 99, 235, 0.05)' : 'white',
                      cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
                    }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 15 }}>Carte Bancaire</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>Visa, Mastercard, etc.</div>
                    </div>
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowPaymentModal(false)} style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#64748b' }}>Annuler</button>
                  <button
                    onClick={handlePayment}
                    disabled={!paymentMethod}
                    style={{
                      padding: '10px 20px', borderRadius: 10, border: 'none', cursor: paymentMethod ? 'pointer' : 'not-allowed',
                      fontWeight: 600, fontSize: 14, background: paymentMethod ? '#1e40af' : '#94a3b8', color: 'white'
                    }}
                  >
                    Confirmer le paiement
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
