import { Menu, Bell, Search, Check, Trash2, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'
import useAuthStore from '../store/authStore'
import { getMediaUrl } from '../services/api'
import socket from '../services/socket'
import { useLocation, useNavigate } from 'react-router-dom'
import notificationService from '../services/notificationService'

export default function Navbar({ onMenuClick }) {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const location = useLocation()
  const [search, setSearch] = useState('')
  const [showNotifs, setShowNotifs] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [notifications, setNotifications] = useState([])

  const fetchNotifs = async () => {
    if (!user) return
    try {
      const data = await notificationService.getUserNotifications()
      setNotifications(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    let timer;
    const handleUpdate = (data) => {
      if (!data || data.userId === user?.id) {
        clearTimeout(timer)
        timer = setTimeout(fetchNotifs, 500)
      }
    }

    fetchNotifs()
    socket.on('notification_updated', handleUpdate)
    return () => {
      socket.off('notification_updated', handleUpdate)
      clearTimeout(timer)
    }
  }, [user])

  const unreadCount = notifications.filter(n => !n.isRead).length

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id)
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n))
    } catch (err) {
      console.error(err)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications(notifications.map(n => ({ ...n, isRead: true })))
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    try {
      await notificationService.deleteNotification(id)
      setNotifications(notifications.filter(n => n.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteAll = async () => {
    if (!window.confirm(t('nav.confirmDeleteAll'))) return
    try {
      await notificationService.deleteAllNotifications()
      setNotifications([])
    } catch (err) {
      console.error(err)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (!search.trim()) return
    // Check current location to decide where to search
    const path = location.pathname
    if (path.includes('/tickets')) {
      navigate(`/tickets?search=${encodeURIComponent(search.trim())}`)
    } else {
      // Default to projects search
      navigate(`/projects?search=${encodeURIComponent(search.trim())}`)
    }
    setSearch('')
  }

  return (
    <header className="navbar-custom">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMenuClick();
          }}
          style={{ 
            background: 'var(--surface-lowest)', 
            border: '1px solid #e2e8f0', 
            cursor: 'pointer', 
            width: 42, 
            height: 42, 
            borderRadius: '50%', 
            color: 'var(--text-muted)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexShrink: 0,
            padding: 0,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            zIndex: 110,
            position: 'relative'
          }}
        >
          <Menu size={20} />
        </button>

        <form onSubmit={handleSearch} style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, minHeight: 42 }}>
          <Search size={16} strokeWidth={2.5} style={{ position: 'absolute', left: 14, color: '#94a3b8', zIndex: 1 }} />
          <input
            className="input-custom"
            style={{ paddingLeft: 40, width: '100%', maxWidth: 220, height: 42, fontSize: 13 }}
            placeholder={t('nav.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
      </div>

      {/* Right side Container */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

        {/* Notifs & Profile container */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setShowNotifs(!showNotifs); setShowUserMenu(false) }}
              style={{
                background: 'var(--surface-lowest)', border: 'none', cursor: 'pointer',
                width: 44, height: 44, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', color: 'var(--text-muted)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
              }}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: 10, right: 10, minWidth: 16, height: 16, padding: '0 4px',
                  background: '#ef4444', color: 'white', fontSize: 10, fontWeight: 700,
                  borderRadius: 10, border: '2px solid var(--surface-lowest)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div style={{ position: 'absolute', top: '56px', right: 0, width: 340, background: 'var(--surface-lowest)', borderRadius: 24, boxShadow: '0 10px 40px rgba(0,53,41,0.1)', zIndex: 60, border: '1px solid #f1f5f9', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f8fafc' }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-main)' }}>{t('nav.notifications')}</div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllAsRead} style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Check size={14} /> {t('nav.markAllAsRead')}
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button onClick={handleDeleteAll} style={{ fontSize: 12, color: '#ef4444', fontWeight: 700, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Trash2 size={14} /> {t('nav.clearAll')}
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '30px 20px', textAlign: 'center' }}>{t('nav.noNotifications')}</div>
                  ) : (
                    notifications.map(notif => (
                      <div key={notif.id} style={{ display: 'flex', padding: '12px 20px', background: notif.isRead ? 'transparent' : '#f0fdf4', borderBottom: '1px solid #f8fafc', alignItems: 'flex-start', gap: 12, transition: 'background 0.2s' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: notif.isRead ? 'transparent' : '#10b981', marginTop: 6, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: notif.isRead ? 600 : 700, color: 'var(--text-main)', marginBottom: 2 }}>{notif.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: 4 }}>{notif.message}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{new Date(notif.createdAt).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {!notif.isRead && (
                            <button onClick={() => handleMarkAsRead(notif.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: 4 }} title={t('nav.markAsRead')}>
                              <Check size={14} />
                            </button>
                          )}
                          <button onClick={(e) => handleDelete(e, notif.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }} title={t('nav.delete')}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <div
              onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifs(false) }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '4px 16px 4px 4px', borderRadius: 9999, background: 'var(--surface-lowest)', border: '1px solid #f1f5f9', transition: 'border-color 0.2s, box-shadow 0.2s', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.05)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.02)'}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: user?.avatar ? 'transparent' : 'linear-gradient(135deg, var(--primary), var(--primary-container))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, color: 'white', overflow: 'hidden'
              }}>
                {user?.avatar ? (
                  <img src={getMediaUrl(user.avatar)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  user?.name?.charAt(0)?.toUpperCase() || 'U'
                )}
              </div>
              <div className="hidden sm:block">
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>{user?.name || t('nav.user')}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                  {user?.role === 'ADMIN' ? t('nav.roleAdmin') : user?.role === 'MANAGER' ? t('nav.roleManager') : t('nav.roleCollaborator')}
                </div>
              </div>
            </div>

            {showUserMenu && (
              <div style={{ position: 'absolute', top: '56px', right: 0, width: 220, background: 'var(--surface-lowest)', borderRadius: 24, boxShadow: '0 10px 40px rgba(0,53,41,0.1)', padding: 12, zIndex: 60, border: '1px solid #f1f5f9' }}>
                <div onClick={() => { navigate('/profile'); setShowUserMenu(false) }} style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRadius: 12, color: 'var(--text-main)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-color)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>{t('nav.myProfile')}</div>
                {user?.role === 'ADMIN' && (
                  <div onClick={() => { navigate('/settings'); setShowUserMenu(false) }} style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRadius: 12, color: 'var(--text-main)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-color)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>{t('nav.settings')}</div>
                )}
                <div style={{ margin: '8px 0', borderTop: '1px solid #f1f5f9' }} />
                <div
                  onClick={() => { useAuthStore.getState().logout(); navigate('/login') }}
                  style={{ padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', borderRadius: 12, color: '#ef4444' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {t('nav.logout')}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
