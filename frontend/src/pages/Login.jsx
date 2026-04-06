import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LogIn, Eye, EyeOff } from 'lucide-react'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

export default function Login() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

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
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}
