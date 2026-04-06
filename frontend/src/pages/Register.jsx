import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { UserPlus, Eye, EyeOff } from 'lucide-react'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

export default function Register() {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name || !email || !password || !confirmPassword) {
      return toast.error(t('register.fillAllFields'))
    }
    if (password !== confirmPassword) {
      return toast.error(t('register.pwdMismatch'))
    }
    setLoading(true)
    try {
      const data = await register(name, email, password)
      if (data?.token) {
        toast.success(t('register.registerSuccess'))
        navigate('/dashboard')
      } else {
        toast.success(data?.message || t('register.registerSuccess'))
        navigate('/login')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t('register.registerError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #003529 0%, #0d4d3e 50%, #002a21 100%)',
      padding: 20,
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Background decoration */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-15%', right: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
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
              height: 80,
              width: 'auto',
              display: 'block',
              margin: '0 auto 16px',
              filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.2))'
            }}
          />
          <h1 style={{ fontSize: 32, fontWeight: 900, color: 'white', letterSpacing: '-1px', fontFamily: "'Manrope', sans-serif" }}>
            {t('register.title')}
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('register.nameLabel')}
            </label>
            <input
              className="input-custom"
              type="text"
              placeholder={t('register.namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'white',
                padding: '14px 20px',
                borderRadius: 18,
                fontSize: 15
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('register.emailLabel')}
            </label>
            <input
              className="input-custom"
              type="email"
              placeholder={t('register.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'white',
                padding: '14px 20px',
                borderRadius: 18,
                fontSize: 15
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('register.pwdLabel')}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                className="input-custom"
                type={showPwd ? 'text' : 'password'}
                placeholder={t('register.pwdPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  paddingRight: 50,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'white',
                  padding: '14px 20px',
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
                  background: 'none', border: 'none', cursor: 'pointer', color: '#003529'
                }}
              >
                {showPwd ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 32 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('register.confirmPwdLabel')}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                className="input-custom"
                type={showConfirmPwd ? 'text' : 'password'}
                placeholder={t('register.confirmPwdPlaceholder')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  paddingRight: 50,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'white',
                  padding: '14px 20px',
                  borderRadius: 18,
                  width: '100%',
                  fontSize: 15
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                style={{
                  position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#003529'
                }}
              >
                {showConfirmPwd ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            className="btn-primary-custom"
            type="submit"
            disabled={loading}
            style={{
              width: '100%', justifyContent: 'center', padding: '16px 24px', fontSize: 16,
              background: 'white', color: '#003529', fontWeight: 800, borderRadius: 18,
              boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
              fontFamily: "'Manrope', sans-serif"
            }}
          >
            {loading ? (
              <div style={{ width: 20, height: 20, border: '3px solid rgba(0,53,41,0.2)', borderTop: '3px solid #003529', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            ) : (
              <><UserPlus size={22} /> {t('register.signupBtn')}</>
            )}
          </button>
        </form>

        <div style={{
          marginTop: 24, textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.7)'
        }}>
          {t('register.hasAccount')}{' '}
          <Link to="/login" style={{ color: 'white', fontWeight: 700, textDecoration: 'none' }}>
            {t('register.login')}
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}
