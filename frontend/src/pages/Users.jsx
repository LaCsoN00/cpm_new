import { useEffect, useState } from 'react'
import { UserCheck, Shield, Mail, UserX, Trash2 } from 'lucide-react'
import api from '../services/api'
import socket from '../services/socket'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import useAuthStore from '../store/authStore'

export default function Users() {
  const { t } = useTranslation()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const currentUser = useAuthStore(state => state.user)

  const fetchUsers = async () => {
    try {
      const res = await api.get(`/users?t=${Date.now()}`)
      setUsers(res.data)
    } catch (err) {
      toast.error(t('users.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let timer;
    const handleUpdate = () => {
      clearTimeout(timer)
      timer = setTimeout(fetchUsers, 500)
    }

    fetchUsers()
    socket.on('user_updated', handleUpdate)
    return () => {
      socket.off('user_updated', handleUpdate)
      clearTimeout(timer)
    }
  }, [])

  const handleApprove = async (id) => {
    try {
      await api.put(`/users/${id}/approve`)
      toast.success(t('users.approveSuccess'))
      fetchUsers()
    } catch (err) {
      toast.error(t('users.approveError'))
    }
  }

  const handleRoleChange = async (id, newRole) => {
    try {
      await api.put(`/users/${id}/role`, { role: newRole })
      toast.success(t('users.roleUpdated'))
      fetchUsers()
    } catch (err) {
      toast.error(t('users.roleError'))
    }
  }

  const handleSuspend = async (id) => {
    if (!window.confirm(t('users.suspendConfirm'))) return
    try {
      await api.put(`/users/${id}/suspend`)
      toast.success(t('users.suspendSuccess'))
      fetchUsers()
    } catch (err) {
      toast.error(t('users.suspendError'))
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('users.deleteConfirm'))) return
    try {
      await api.delete(`/users/${id}`)
      toast.success(t('users.deleteSuccess'))
      fetchUsers()
    } catch (err) {
      toast.error(t('users.deleteError'))
    }
  }

  if (loading) return <div style={{ padding: 40, color: '#94a3b8' }}>{t('users.loading')}</div>

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">{t('users.title')}</h1>
        <p className="page-subtitle">{t('users.subtitle')}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {users.map(u => (
          <div key={u.id} style={{ 
            background: 'white', 
            borderRadius: 20, 
            padding: 24, 
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            border: u.isApproved ? '1px solid #f1f5f9' : '1px solid #fef08a'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              {u.avatar ? (
                <img src={`http://localhost:5000${u.avatar}`} alt={u.name} style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#64748b' }}>
                  {u.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>{u.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b' }}>
                  <Mail size={13} /> {u.email}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ 
                padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: u.isApproved ? '#f0fdf4' : '#fefce8',
                color: u.isApproved ? '#16a34a' : '#ca8a04'
              }}>
                {u.isApproved ? t('users.approved') : t('users.pending')}
              </span>
              <span style={{ 
                padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: u.role === 'ADMIN' ? '#fee2e2' : u.role === 'MANAGER' ? '#eff6ff' : '#f1f5f9',
                color: u.role === 'ADMIN' ? '#dc2626' : u.role === 'MANAGER' ? '#2563eb' : '#475569'
              }}>
                <Shield size={10} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                {u.role === 'ADMIN' ? t('users.roleAdmin') : u.role === 'MANAGER' ? t('users.roleManager') : t('users.roleCollab')}
              </span>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {!u.isApproved ? (
                <button 
                  onClick={() => handleApprove(u.id)}
                  style={{ flex: 1, padding: '8px', borderRadius: 10, background: '#16a34a', color: 'white', border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <UserCheck size={16} /> {t('users.approve')}
                </button>
              ) : (
                currentUser.id !== u.id && (
                  <button 
                    onClick={() => handleSuspend(u.id)}
                    style={{ flex: 1, padding: '8px', borderRadius: 10, background: '#fef3c7', color: '#ca8a04', border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <UserX size={16} /> {t('users.suspend')}
                  </button>
                )
              )}

              {currentUser.id !== u.id && u.isApproved && (
                <div style={{ flex: 1, minWidth: 120 }}>
                  <select 
                    className="input-custom" 
                    style={{ height: 36, padding: '0 10px', width: '100%', fontSize: 12 }}
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  >
                    <option value="COLLABORATOR">{t('users.roleCollab')}</option>
                    <option value="MANAGER">{t('users.roleManager')}</option>
                    <option value="ADMIN">{t('users.roleAdmin')}</option>
                  </select>
                </div>
              )}

              {currentUser.id !== u.id && (
                <button 
                  onClick={() => handleDelete(u.id)}
                  style={{ width: 36, height: 36, borderRadius: 10, background: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title={t('users.delete')}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
