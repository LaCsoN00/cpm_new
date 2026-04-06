import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FolderKanban, Milestone, PieChart,
  LifeBuoy, Users, FileText, Settings, LogOut, X, UserCheck
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import useAuthStore from '../store/authStore'

const navGroups = [
  {
    title: 'nav.general',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'nav.dashboard' },
      { to: '/projects', icon: FolderKanban, label: 'nav.projects' },
      { to: '/milestones', icon: Milestone, label: 'nav.milestones' },
      { to: '/evaluations', icon: PieChart, label: 'nav.evaluations' },
      { to: '/clients', icon: Users, label: 'nav.clients' },
    ]
  },
  {
    title: 'nav.tools',
    items: [
      { to: '/tickets', icon: LifeBuoy, label: 'nav.tickets' },
      { to: '/invoices', icon: FileText, label: 'nav.invoices' },
    ]
  }
]

export default function Sidebar({ isOpen, isCollapsed, onClose }) {
  const { t } = useTranslation()
  const { logout, user } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div style={{ padding: isCollapsed ? '8px 0 16px 0' : '8px 16px 16px', textAlign: isCollapsed ? 'center' : 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'flex-start', gap: 12 }}>
          <img src="/icon-512x512.png" alt="Logo" style={{ width: 40, height: 40, objectFit: 'contain' }} />
          {!isCollapsed && (
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>CPM</div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {navGroups.map((group, idx) => {
          const items = group.items.filter(item => {
            if ((item.to === '/clients' || item.to === '/milestones') && user?.role === 'COLLABORATOR') return false;
            return true;
          });
          if (items.length === 0) return null;
          return (
            <div key={idx} style={{ marginBottom: isCollapsed ? 12 : 24 }}>
              {!isCollapsed && <div className="sidebar-category">{t(group.title)}</div>}
              {items.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''} ${isCollapsed ? 'collapsed' : ''}`}
                  title={isCollapsed ? t(label) : ''}
                >
                  <Icon size={18} strokeWidth={2} />
                  {!isCollapsed && <span>{t(label)}</span>}
                </NavLink>
              ))}
            </div>
          )
        })}

        <div style={{ marginBottom: 24 }}>
          {!isCollapsed && <div className="sidebar-category">{t('nav.other')}</div>}
          {user?.role === 'ADMIN' && (
            <>
              <NavLink to="/users" onClick={onClose} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''} ${isCollapsed ? 'collapsed' : ''}`} title={isCollapsed ? t('nav.usersAccess') : ''}>
                <UserCheck size={18} strokeWidth={2} />
                {!isCollapsed && <span>{t('nav.usersAccess')}</span>}
              </NavLink>
              <NavLink to="/settings" onClick={onClose} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''} ${isCollapsed ? 'collapsed' : ''}`} title={isCollapsed ? t('nav.settings') : ''}>
                <Settings size={18} strokeWidth={2} />
                {!isCollapsed && <span>{t('nav.settings')}</span>}
              </NavLink>
            </>
          )}
        </div>
      </nav>

      <div style={{ padding: '0 8px', marginTop: 'auto', marginBottom: 24 }}>
        <button
          onClick={handleLogout}
          className={`sidebar-link ${isCollapsed ? 'collapsed' : ''}`}
          style={{
            width: '100%',
            border: 'none',
            background: 'transparent',
            textAlign: 'left',
            cursor: 'pointer',
            color: '#ef4444',
            fontFamily: 'inherit'
          }}
          title={isCollapsed ? t('nav.logout') : ''}
        >
          <LogOut size={18} strokeWidth={2} />
          {!isCollapsed && <span style={{ fontWeight: 700 }}>{t('nav.logout')}</span>}
        </button>
      </div>
    </aside>
  )
}
