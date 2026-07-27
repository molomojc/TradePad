import { create } from 'zustand';

const useAuthStore = create((set) => ({
  isOpen: false,
  view: 'login', // 'login' or 'signup'
  
  openAuthModal: (view = 'login') => set({ isOpen: true, view }),
  closeAuthModal: () => set({ isOpen: false }),
  switchView: (view) => set({ view }),
}));

export default useAuthStore;
