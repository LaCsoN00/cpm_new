import { create } from 'zustand'

const useUIStore = create((set) => ({
  selectedDate: new Date(),
  setSelectedDate: (date) => set({ selectedDate: date }),
  resetToToday: () => set({ selectedDate: new Date() })
}))

export default useUIStore
