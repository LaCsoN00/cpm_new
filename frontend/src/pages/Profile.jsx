import { useEffect, useState, useRef } from 'react'
import { Camera, Save, Lock, User, Mail, Shield, Calendar, FolderKanban, LifeBuoy, FileText, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import ErrorBoundary from '../components/ErrorBoundary'
import i18n from '../i18n'

export default function Profile() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, setUser } = useAuthStore()
  const fileRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingPw, setSavingPw] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [profile, setProfile] = useState({ name: '', email: '', role: '', avatar: null, createdAt: '' })
  const [form, setForm] = useState({ name: '', email: '' })
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [stats, setStats] = useState({ projects: 0, tickets: 0, invoices: 0 })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const requests = [
          api.get('/users/me'),
          api.get('/projects'),
          api.get('/tickets')
        ]

        if (user?.role === 'ADMIN') {
          requests.push(api.get('/invoices'))
        }

        const responses = await Promise.all(requests)

        const me = responses[0].data
        const proj = responses[1].data || []
        const tick = responses[2].data || []
        const inv = user?.role === 'ADMIN' ? (responses[3]?.data || []) : []

        setProfile(me)
        setForm({ name: me.name, email: me.email })
        setStats({
          projects: proj.length,
          tickets: tick.length,
          invoices: user?.role === 'ADMIN' ? inv.length : 0,
        })
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name) return toast.error(t('profile.nameRequired'))
    setSaving(true)
    try {
      const res = await api.put('/users/me', form)
      if (res.data) {
        setProfile(res.data)
        const currentUser = useAuthStore.getState().user
        setUser({ ...currentUser, ...res.data })
        toast.success(t('profile.profileUpdated'))
      }
    } catch (err) {
      console.error('Save profile error:', err)
    } finally { setSaving(false) }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (!pwForm.oldPassword || !pwForm.newPassword) return toast.error(t('profile.allFieldsRequired'))
    if (pwForm.newPassword.length < 6) return toast.error(t('profile.passwordMin'))
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error(t('profile.passwordMismatch'))
    setSavingPw(true)
    try {
      await api.put('/users/me/password', { oldPassword: pwForm.oldPassword, newPassword: pwForm.newPassword })
      toast.success(t('profile.passwordUpdated'))
      setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
    } catch { } finally { setSavingPw(false) }
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return toast.error(t('profile.imageTooLarge'))

    setUploadingAvatar(true)
    const formData = new FormData()
    formData.append('avatar', file)
    try {
      const res = await api.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (res.data) {
        setProfile(res.data)
        const currentUser = useAuthStore.getState().user
        setUser({ ...currentUser, ...res.data })
        toast.success(t('profile.avatarUpdated'))
      }
    } catch (err) {
      console.error('Avatar upload error:', err)
    } finally { setUploadingAvatar(false) }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '...'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return '...'
      const locale = i18n.language === 'en' ? 'en-US' : 'fr-FR'
      return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
    } catch {
      return '...'
    }
  }

  const avatarUrl = profile.avatar || null

  const statCards = [
    { label: t('profile.projects'), value: stats.projects, icon: FolderKanban, color: '#10b981', bg: '#dcfce7' },
    { label: t('profile.tickets'), value: stats.tickets, icon: LifeBuoy, color: '#3b82f6', bg: '#dbeafe' },
    profile.role === 'ADMIN' && { label: t('profile.invoices'), value: stats.invoices, icon: FileText, color: '#f59e0b', bg: '#fef3c7' },
  ].filter(Boolean)

  const getRoleGradient = () => {
    if (profile.role === 'ADMIN') return 'linear-gradient(135deg, #10b981, #059669)'
    if (profile.role === 'MANAGER') return 'linear-gradient(135deg, #3b82f6, #2563eb)'
    return 'linear-gradient(135deg, #f59e0b, #d97706)' // Collaborator / Client
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: '#94a3b8', fontSize: 14 }}>
        {t('profile.loading')}
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate(-1)} className="btn-ghost-custom" style={{ padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">{t('profile.title')}</h1>
            <p className="page-subtitle">{t('profile.subtitle')}</p>
          </div>
        </div>

        {/* Profile Header Card */}
        <div className="card-custom" style={{ padding: '32px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
          {/* Avatar with upload */}
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              width: 110, height: 110, borderRadius: '50%', cursor: 'pointer',
              boxShadow: '0 8px 30px rgba(0,0,0,0.08)', border: '4px solid white',
              position: 'relative', overflow: 'hidden', flexShrink: 0,
              background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, var(--primary), var(--primary-container))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1) translateY(0)'}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 40, fontWeight: 900, color: 'white' }}>
                {profile.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            )}
            {/* Overlay on hover */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: uploadingAvatar ? 1 : 0, transition: 'opacity 0.2s',
              backdropFilter: 'blur(2px)'
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => { if (!uploadingAvatar) e.currentTarget.style.opacity = 0 }}
            >
              {uploadingAvatar ? (
                <div style={{ width: 24, height: 24, border: '3px solid white', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <Camera size={24} color="white" />
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
          </div>

          <div style={{ flex: 1, minWidth: 250 }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-main)', marginBottom: 12, fontFamily: 'Manrope, sans-serif', letterSpacing: '-0.5px' }}>
              {profile.name}
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mail size={16} color="#64748b" />
                </div>
                {profile.email}
              </div>

              <span style={{
                padding: '6px 16px', borderRadius: 9999, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px',
                background: profile.role === 'ADMIN' ? '#dcfce7' : profile.role === 'MANAGER' ? '#dbeafe' : '#fef3c7',
                color: profile.role === 'ADMIN' ? '#16a34a' : profile.role === 'MANAGER' ? '#2563eb' : '#d97706',
                display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
              }}>
                <Shield size={14} />
                {profile.role === 'ADMIN' ? t('profile.admin') : profile.role === 'MANAGER' ? t('profile.manager') : t('profile.collaborator')}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>
                <Calendar size={14} />
                {t('profile.joinedOn')} {formatDate(profile.createdAt)}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
          {statCards.map((s, i) => (
            <div key={i} className="stat-card" style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, display: 'flex' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <s.icon size={20} color={s.color} />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Two column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {/* Edit Profile */}
          <div className="card-custom" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={16} color="#16a34a" />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)', fontFamily: 'Manrope, sans-serif' }}>
                {t('profile.personalInfo')}
              </h3>
            </div>

            <form onSubmit={handleSave}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>{t('profile.fullName')}</label>
                <input className="input-custom" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={t('profile.fullName')} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>{t('profile.email')}</label>
                <input className="input-custom" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder={t('profile.email')} />
              </div>
              <button type="submit" className="btn-primary-custom" disabled={saving} style={{ marginTop: 4 }}>
                {saving ? (
                  <>{t('profile.saving')}</>
                ) : (
                  <><Save size={16} /> {t('profile.save')}</>
                )}
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div className="card-custom" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lock size={16} color="#dc2626" />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)', fontFamily: 'Manrope, sans-serif' }}>
                {t('profile.changePassword')}
              </h3>
            </div>

            <form onSubmit={handlePasswordChange}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>{t('profile.oldPassword')}</label>
                <div style={{ position: 'relative' }}>
                  <input className="input-custom" type={showOld ? 'text' : 'password'} value={pwForm.oldPassword} onChange={e => setPwForm(f => ({ ...f, oldPassword: e.target.value }))} placeholder="••••••••" />
                  <button type="button" onClick={() => setShowOld(!showOld)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                    {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>{t('profile.newPassword')}</label>
                <div style={{ position: 'relative' }}>
                  <input className="input-custom" type={showNew ? 'text' : 'password'} value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} placeholder={t('profile.minChars')} />
                  <button type="button" onClick={() => setShowNew(!showNew)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>{t('profile.confirmPassword')}</label>
                <input className="input-custom" type="password" value={pwForm.confirmPassword} onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))} placeholder={t('profile.confirm')} />
                {pwForm.confirmPassword && pwForm.newPassword === pwForm.confirmPassword && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 11, color: '#16a34a' }}>
                    <CheckCircle size={12} /> {t('profile.passwordsMatch')}
                  </div>
                )}
              </div>
              <button type="submit" className="btn-primary-custom" disabled={savingPw} style={{ marginTop: 4, background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}>
                {savingPw ? t('profile.modifying') : <><Lock size={16} /> {t('profile.modifyPassword')}</>}
              </button>
            </form>
          </div>
        </div>

        {/* Spinner keyframe */}
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </ErrorBoundary>
  )
}
