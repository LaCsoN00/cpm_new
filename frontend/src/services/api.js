import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: { 
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cpm_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message || 'Une erreur est survenue'
    const isLogin = err.config?.url?.includes('/auth/login')
    
    if (err.response?.status === 401 && !isLogin) {
      localStorage.removeItem('cpm_token')
      localStorage.removeItem('cpm-auth') // Clear Zustand persist
      window.location.href = '/login'
    } else if (err.response?.status !== 404 && !isLogin) {
      toast.error(msg)
    }
    return Promise.reject(err)
  }
)

export const getMediaUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http') || path.startsWith('data:')) return path
  const baseUrl = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api', '') 
    : 'http://localhost:5000'
  return `${baseUrl}${path.startsWith('/') ? path : '/' + path}`
}
export default api
