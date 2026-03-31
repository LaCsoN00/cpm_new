import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { useState } from 'react'

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const toggleSidebar = () => {
    // On mobile, toggle the drawer
    if (window.innerWidth < 1024) {
      setSidebarOpen(!sidebarOpen)
    } else {
      // On desktop, toggle collapse
      setIsCollapsed(!isCollapsed)
    }
  }

  return (
    <div className="app-wrapper" translate="no">
      <div className="app-container">
        {/* Overlay mobile */}
        {sidebarOpen && (
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 45 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <Sidebar 
          isOpen={sidebarOpen} 
          isCollapsed={isCollapsed} 
          onClose={() => setSidebarOpen(false)} 
        />
        <div className="main-content">
          <Navbar onMenuClick={toggleSidebar} />
          <div className="scrollable-content">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
