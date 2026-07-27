import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useUserStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  currentSymptoms: '',
  analysisResults: null,
  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
    if (user) AsyncStorage.setItem('medicheck_user', JSON.stringify(user));
  },
  setToken: (token) => {
    set({ token });
    if (token) AsyncStorage.setItem('medicheck_token', token);
  },
  logout: async () => {
    await AsyncStorage.multiRemove(['medicheck_user', 'medicheck_token']);
    set({ user: null, token: null, isAuthenticated: false });
  },
  setCurrentSymptoms: (s) => set({ currentSymptoms: s }),
  setAnalysisResults: (r) => set({ analysisResults: r }),
  setSelectedDoctor: (d) => set({ selectedDoctor: d }),
  loadStoredSession: async () => {
    try {
      const [userStr, token] = await AsyncStorage.multiGet(['medicheck_user', 'medicheck_token']);
      const user = userStr[1] ? JSON.parse(userStr[1]) : null;
      const tok = token[1] || null;
      if (user && tok) set({ user, token: tok, isAuthenticated: true });
    } catch (e) { console.warn(e); }
  },
}));

export default useUserStore;