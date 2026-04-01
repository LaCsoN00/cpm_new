import { useNavigate } from 'react-router-dom'
import { Globe, Bell, BellOff, Mail, MailX, Shield, Info, ChevronRight, Lock, Monitor, ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import useSettingsStore from '../store/settingsStore'

function Toggle({ active, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
        background: active ? 'linear-gradient(135deg, var(--primary), var(--primary-container))' : 'var(--toggle-bg)',
        display: 'flex', alignItems: 'center', padding: 3,
        transition: 'background 0.3s ease', position: 'relative'
      }}
    >
      <div style={{
        width: 20, height: 20, borderRadius: '50%', background: 'white',
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: active ? 'translateX(22px)' : 'translateX(0)',
      }} />
    </button>
  )
}

function SettingRow({ icon: Icon, iconColor, iconBg, title, description, right }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 0', borderBottom: '1px solid rgba(0,0,0,0.03)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, background: iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <Icon size={18} color={iconColor} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>{title}</div>
          {description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{description}</div>}
        </div>
      </div>
      <div>{right}</div>
    </div>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const {
    language,
    emailNotifications, browserNotifications,
    setLanguage,
    toggleEmailNotifications, toggleBrowserNotifications
  } = useSettingsStore()

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {window.innerWidth < 640 && (
            <button onClick={() => navigate(-1)} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h1 className="page-title">{t('settings.title')}</h1>
            <p className="page-subtitle">{t('settings.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Apparence */}
      <div className="card-custom" style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Monitor size={14} color="#7c3aed" />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)', fontFamily: 'Manrope, sans-serif' }}>{t('settings.appearance')}</h3>
        </div>

        <SettingRow
          icon={Globe}
          iconColor="#3b82f6"
          iconBg="#dbeafe"
          title={t('settings.language')}
          description={t('settings.languageDesc')}
          right={
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                padding: '6px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0',
                background: 'var(--surface-lowest)', fontSize: 13, fontWeight: 600,
                color: 'var(--text-main)', cursor: 'pointer', outline: 'none',
                fontFamily: 'inherit'
              }}
            >
              <option value="fr">🇫🇷 Français</option>
              <option value="en">🇬🇧 English</option>
            </select>
          }
        />
      </div>

      {/* Notifications */}
      <div className="card-custom" style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bell size={14} color="#3b82f6" />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)', fontFamily: 'Manrope, sans-serif' }}>{t('settings.notifications')}</h3>
        </div>

        <SettingRow
          icon={emailNotifications ? Mail : MailX}
          iconColor={emailNotifications ? '#10b981' : '#94a3b8'}
          iconBg={emailNotifications ? '#dcfce7' : '#f1f5f9'}
          title={t('settings.emailNotif')}
          description={t('settings.emailNotifDesc')}
          right={<Toggle active={emailNotifications} onToggle={toggleEmailNotifications} />}
        />

        <SettingRow
          icon={browserNotifications ? Bell : BellOff}
          iconColor={browserNotifications ? '#10b981' : '#94a3b8'}
          iconBg={browserNotifications ? '#dcfce7' : '#f1f5f9'}
          title={t('settings.browserNotif')}
          description={t('settings.browserNotifDesc')}
          right={<Toggle active={browserNotifications} onToggle={toggleBrowserNotifications} />}
        />
      </div>

      {/* Sécurité */}
      <div className="card-custom" style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={14} color="#dc2626" />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)', fontFamily: 'Manrope, sans-serif' }}>{t('settings.security')}</h3>
        </div>

        <div
          onClick={() => navigate('/profile')}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 0', cursor: 'pointer', borderBottom: '1px solid rgba(0,0,0,0.03)',
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = 0.7}
          onMouseLeave={e => e.currentTarget.style.opacity = 1}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, background: '#fef3c7',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Lock size={18} color="#d97706" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>{t('settings.changePassword')}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{t('settings.changePasswordDesc')}</div>
            </div>
          </div>
          <ChevronRight size={18} color="#94a3b8" />
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, background: '#dcfce7',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Shield size={18} color="#16a34a" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>{t('settings.activeSession')}</div>
              <div style={{ fontSize: 12, color: '#10b981', marginTop: 1, fontWeight: 600 }}>{t('settings.activeSessionDesc')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* À propos */}
      <div className="card-custom" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Info size={14} color="#64748b" />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)', fontFamily: 'Manrope, sans-serif' }}>{t('settings.about')}</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{t('settings.app')}</span>
            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{t('settings.appDesc')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{t('settings.version')}</span>
            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>1.0.0</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{t('settings.framework')}</span>
            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>React + Vite + Express</span>
          </div>
        </div>
      </div>
    </div>
  )
}
