import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { LogIn, Eye, EyeOff, Zap } from 'lucide-react'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { resetDemoData } from '../services/apiMock'

export default function Login() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login, setUser } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  // Show demo button ONLY if:
  // 1. URL search has ?demo=true
  // 2. Or VITE_DEMO_ONLY env var is enabled
  // 3. Or a demo mode is already active
  const queryParams = new URLSearchParams(location.search)
  const showDemo = queryParams.get('demo') === 'true' || 
                   import.meta.env.VITE_DEMO_ONLY === 'true' || 
                   localStorage.getItem('cpm_demo_mode') === 'true'

  const launchDemo = () => {
    // Reset demo data to factory defaults
    resetDemoData()
    // Set demo mode flag
    localStorage.setItem('cpm_demo_mode', 'true')
    // Set a mock JWT token for user ID 1 (Admin Demo)
    const demoToken = 'demo_token_1'
    localStorage.setItem('cpm_token', demoToken)
    // Set the user in the Zustand auth store directly
    const demoUser = {
      id: 1, name: 'Admin Demo', email: 'demo@cpm.com',
      avatar: null, role: 'ADMIN',
      emailNotifications: true, browserNotifications: false,
      isApproved: true, createdAt: '2025-01-15T08:00:00.000Z',
    }
    setUser(demoUser)
    // Also persist the token so the store keeps it
    localStorage.setItem('cpm-auth', JSON.stringify({
      state: { user: demoUser, token: demoToken, isAuthenticated: true },
      version: 0
    }))
    toast.success('Mode Demo actif ! Explorez librement.')
    navigate('/dashboard')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) return toast.error(t('login.fillAllFields'))
    setLoading(true)
    try {
      await login(email, password)
      toast.success(t('login.loginSuccess'))
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || t('login.invalidCreds'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: 20,
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Background decoration */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-15%', right: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'rgba(0,119,182,0.05)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(0,119,182,0.05)' }} />
      </div>

      <div style={{
        width: '100%', maxWidth: 400,
        position: 'relative'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <img
            src="/icon-512x512.png"
            alt="Logo"
            style={{
              height: 100,
              width: 'auto',
              display: 'block',
              margin: '0 auto 24px',
              filter: 'drop-shadow(0 10px 20px rgba(0,119,182,0.15))'
            }}
          />
          <h1 style={{ fontSize: 36, fontWeight: 900, color: '#1e293b', letterSpacing: '-1.5px', fontFamily: "'Manrope', sans-serif" }}>
            CPM
          </h1>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
            Libreville • Gabon
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('login.emailLabel')}
            </label>
            <input
              className="input-custom"
              type="email"
              placeholder={t('login.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                background: 'white',
                border: '1.5px solid #e2e8f0',
                color: '#1e293b',
                padding: '16px 24px',
                borderRadius: 18,
                fontSize: 15
              }}
            />
          </div>

          <div style={{ marginBottom: 32 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('login.pwdLabel')}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                className="input-custom"
                type={showPwd ? 'text' : 'password'}
                placeholder={t('login.pwdPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  paddingRight: 50,
                  background: 'white',
                  border: '1.5px solid #e2e8f0',
                  color: '#1e293b',
                  padding: '16px 24px',
                  borderRadius: 18,
                  width: '100%',
                  fontSize: 15
                }}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                style={{
                  position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8'
                }}
              >
                {showPwd ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            className="btn-primary-custom"
            type="submit"
            disabled={loading}
            style={{
              width: '100%', justifyContent: 'center', padding: '16px 24px', fontSize: 16,
              background: 'var(--primary)', color: 'white', fontWeight: 800, borderRadius: 18,
              boxShadow: '0 12px 30px rgba(0,119,182,0.2)',
              fontFamily: "'Manrope', sans-serif"
            }}
          >
            {loading ? (
              <div style={{ width: 20, height: 20, border: '3px solid rgba(255,255,255,0.2)', borderTop: '3px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            ) : (
              <><LogIn size={22} /> {t('login.loginBtn')}</>
            )}
          </button>
        </form>

        <div style={{
          marginTop: 24, textAlign: 'center', fontSize: 13, color: '#64748b'
        }}>
          {t('login.noAccount')}{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
            {t('login.signup')}
          </Link>
        </div>

        {/* ── Demo Mode Card ── */}
        {showDemo && (
          <div
            onClick={launchDemo}
            style={{
              marginTop: 28,
              borderRadius: 18,
              background: '#f8fafc',
              border: '1.5px dashed #cbd5e1',
              padding: '16px 20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#f1f5f9'
              e.currentTarget.style.borderColor = 'var(--primary)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#f8fafc'
              e.currentTarget.style.borderColor = '#cbd5e1'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(0, 119, 182, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--primary)',
                flexShrink: 0
              }}>
                <Zap size={18} fill="currentColor" />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b' }}>
                  Essayer la Démo Portfolio
                </div>
                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 1 }}>
                  Accès direct sans compte (simulation locale)
                </div>
              </div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
              Lancer &rarr;
            </span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}
