import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'
import useSettingsStore from './settingsStore'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const res = await api.post('/auth/login', { email, password })
        const { user, token } = res.data
        localStorage.setItem('cpm_token', token)
        set({ user, token, isAuthenticated: true })
        if (user.emailNotifications !== undefined) {
          useSettingsStore.getState().updateSettings({
            emailNotifications: user.emailNotifications,
            browserNotifications: user.browserNotifications
          })
        }
        return user
      },

      register: async (name, email, password) => {
        const res = await api.post('/auth/register', { name, email, password })
        if (res.data.token) {
          const { user, token } = res.data
          localStorage.setItem('cpm_token', token)
          set({ user, token, isAuthenticated: true })
        }
        return res.data
      },

      logout: () => {
        localStorage.removeItem('cpm_token')
        localStorage.removeItem('cpm-auth')
        set({ user: null, token: null, isAuthenticated: false })
      },

      setUser: (user) => {
        if (!user) {
          set({ user: null, isAuthenticated: false, token: null })
          return
        }
        set({ user, isAuthenticated: true })
        if (user.emailNotifications !== undefined) {
          useSettingsStore.getState().updateSettings({
            emailNotifications: user.emailNotifications,
            browserNotifications: user.browserNotifications
          })
        }
      },
    }),
    {
      name: 'cpm-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated })
    }
  )
)

export default useAuthStore
