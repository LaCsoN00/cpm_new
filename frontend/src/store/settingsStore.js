import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import i18n from '../i18n'

import api from '../services/api'

const useSettingsStore = create(
  persist(
    (set) => ({
      language: 'fr',
      emailNotifications: true,
      browserNotifications: false,
      companyLogo: null,
      companyInfo: {
        name: 'CPM Pro',
        address: 'Quartier Louis, Libreville, Gabon',
        phone: '+241 01 00 00 00',
        email: 'contact@cpmpro.fr'
      },

      setCompanyLogo: (logo) => set({ companyLogo: logo }),
      setCompanyInfo: (info) => set((s) => ({ companyInfo: { ...s.companyInfo, ...info } })),

      setLanguage: (language) => {
        set({ language })
        if (i18n && typeof i18n.changeLanguage === 'function') {
          i18n.changeLanguage(language)
        }
      },
      
      toggleEmailNotifications: async () => {
        set((s) => ({ emailNotifications: !s.emailNotifications }))
        try {
          const state = useSettingsStore.getState()
          await api.put('/users/me/settings', { emailNotifications: state.emailNotifications })
        } catch (err) {
          // Revert on error
          set((s) => ({ emailNotifications: !s.emailNotifications }))
        }
      },
      
      toggleBrowserNotifications: async () => {
        set((s) => ({ browserNotifications: !s.browserNotifications }))
        try {
          const state = useSettingsStore.getState()
          await api.put('/users/me/settings', { browserNotifications: state.browserNotifications })
        } catch (err) {
          // Revert on error
          set((s) => ({ browserNotifications: !s.browserNotifications }))
        }
      },
      
      // Update settings directly when logging in
      updateSettings: (settings) => set((s) => ({ ...s, ...settings }))
    }),
    {
      name: 'cpm-settings',
    }
  )
)

export default useSettingsStore
