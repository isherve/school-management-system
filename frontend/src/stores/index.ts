import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, settingsApi, type User } from '../services/endpoints';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, code: string, rememberMe?: boolean) => Promise<void>;
  preparePasswordLogin: (email: string, password: string) => Promise<{ message: string; devCode?: string; emailFailed?: boolean }>;
  loginWithCode: (email: string, code: string) => Promise<void>;
  requestLoginCode: (email: string) => Promise<{ message: string; devCode?: string; emailFailed?: boolean; hint?: 'no_account' }>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      preparePasswordLogin: async (email, password) => {
        const result = await authApi.preparePasswordLogin(email, password);
        return result;
      },

      login: async (email, password, code, rememberMe) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login({ email, password, code, rememberMe });
          const { user, tokens } = response.data;
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
          set({ user, isAuthenticated: true, isLoading: false });
          useAppStore.getState().loadSchoolSettings();
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      loginWithCode: async (email, code) => {
        set({ isLoading: true });
        try {
          const response = await authApi.verifyLoginCode(email, code);
          const { user, tokens } = response.data;
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
          set({ user, isAuthenticated: true, isLoading: false });
          useAppStore.getState().loadSchoolSettings();
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      requestLoginCode: async (email) => {
        const result = await authApi.requestLoginCode(email);
        return result;
      },

      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, isAuthenticated: false });
        window.location.href = '/login';
      },

      fetchProfile: async () => {
        try {
          const user = await authApi.getProfile();
          set({ user, isAuthenticated: true });
          useAppStore.getState().loadSchoolSettings();
        } catch {
          set({ user: null, isAuthenticated: false });
        }
      },

      setUser: (user) => set({ user, isAuthenticated: !!user }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

interface AppState {
  currency: string;
  timezone: string;
  schoolName: string;
  loadSchoolSettings: () => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currency: 'RWF',
      timezone: 'Africa/Kigali',
      schoolName: 'Demo International School',

      loadSchoolSettings: async () => {
        try {
          const school = await settingsApi.getSchool();
          set({
            currency: school.currency || 'RWF',
            timezone: school.timezone || 'Africa/Kigali',
            schoolName: school.name || 'School',
          });
        } catch {
          /* keep defaults */
        }
      },
    }),
    { name: 'app-settings' }
  )
);

interface ThemeState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
        set({ theme: newTheme });
      },
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme);
      },
    }
  )
);

interface SidebarState {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  toggle: () => void;
  setMobileOpen: (open: boolean) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isCollapsed: false,
  isMobileOpen: false,
  toggle: () => set((s) => ({ isCollapsed: !s.isCollapsed })),
  setMobileOpen: (open) => set({ isMobileOpen: open }),
}));

export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastState {
  toasts: ToastItem[];
  push: (message: string, type?: ToastType) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message, type = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
