import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import useAuthStore from './store/authStore'
import useUIStore from './store/uiStore'
import useSettingsStore from './store/settingsStore'
import PageLoader from './components/PageLoader'
import MainLayout from './layouts/MainLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Milestones from './pages/Milestones'
import Evaluations from './pages/Evaluations'
import Tickets from './pages/Tickets'
import Clients from './pages/Clients'
import Invoices from './pages/Invoices'
import InvoiceCreate from './pages/InvoiceCreate'
import InvoicePreview from './pages/InvoicePreview'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Users from './pages/Users'

function PrivateRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />
  return children
}

function NavigationLoader() {
  const location = useLocation()
  const startLoading = useUIStore(s => s.startLoading)
  const stopLoading = useUIStore(s => s.stopLoading)
  const loadingCount = useUIStore(s => s.loadingCount)

  useEffect(() => {
    // Avoid showing loader for very fast transitions or if multiple redirects happen
    const timer = setTimeout(() => {
      startLoading()
    }, 50) // Small delay before showing loader to avoid flicker

    const stopTimer = setTimeout(() => {
      stopLoading()
    }, 600) // Ensure it stops after a reasonable time

    return () => {
      clearTimeout(timer)
      clearTimeout(stopTimer)
      // We don't call stopLoading here because it might have already been called or the next route will handle its own loading
    }
  }, [location.pathname]) // Only depend on pathname

  return loadingCount > 0 ? <PageLoader /> : null
}

export default function App() {
  return (
    <BrowserRouter>
      <NavigationLoader />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="milestones" element={<Milestones />} />
          <Route path="evaluations" element={<Evaluations />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="clients" element={<Clients />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="invoices/new" element={<InvoiceCreate />} />
          <Route path="invoices/:id" element={<InvoicePreview />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="users" element={<AdminRoute><Users /></AdminRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
