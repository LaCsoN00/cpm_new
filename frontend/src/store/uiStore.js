import { create } from 'zustand'

const useUIStore = create((set) => ({
  selectedDate: new Date(),
  setSelectedDate: (date) => set({ selectedDate: date }),
  resetToToday: () => set({ selectedDate: new Date() }),
  
  loadingCount: 0,
  startLoading: () => set((state) => ({ loadingCount: state.loadingCount + 1 })),
  stopLoading: () => set((state) => ({ loadingCount: Math.max(0, state.loadingCount - 1) }))
}))

export default useUIStore
