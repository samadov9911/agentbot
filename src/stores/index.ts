import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AppPage } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
 /** Original admin user stored during impersonation */
  originalAdmin: User | null;
  /** Original admin token stored during impersonation */
  originalToken: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
  /** Switch to impersonating a target user (saves current admin) */
  impersonate: (targetUser: User, targetToken: string) => void;
  /** Exit impersonation and restore original admin */
  stopImpersonation: () => void;
  /** Whether the current session is an impersonation */
  isImpersonating: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      originalAdmin: null,
      originalToken: null,
      login: (user, token) =>
        set({ user, token, isAuthenticated: true, isLoading: false, originalAdmin: null, originalToken: null }),
      logout: () =>
        set({ user: null, token: null, isAuthenticated: false, isLoading: false, originalAdmin: null, originalToken: null }),
      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),
      setLoading: (loading) => set({ isLoading: loading }),
      impersonate: (targetUser, targetToken) => {
        const { user, token } = get();
        if (!user) return;
        // Store current session (token may be null for impersonated sessions — that's OK)
        set({
          originalAdmin: { ...user },
          originalToken: token,
          user: { ...targetUser, isImpersonated: true } as User & { isImpersonated?: boolean },
          token: targetToken,
          isAuthenticated: true,
        });
      },
      stopImpersonation: () => {
        const { originalAdmin, originalToken } = get();
        if (!originalAdmin) return;
        set({
          user: originalAdmin,
          token: originalToken,
          isAuthenticated: true,
          originalAdmin: null,
          originalToken: null,
        });
      },
      isImpersonating: () => {
        const { originalAdmin } = get();
        return originalAdmin !== null;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        originalAdmin: state.originalAdmin,
        originalToken: state.originalToken,
      }),
    }
  )
);

interface AppState {
  currentPage: AppPage;
  selectedBotId: string | null;
  sidebarOpen: boolean;
  language: 'ru' | 'en' | 'tr';
  setPage: (page: AppPage) => void;
  setSelectedBot: (id: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
  setLanguage: (lang: 'ru' | 'en' | 'tr') => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentPage: 'landing',
      selectedBotId: null,
      sidebarOpen: true,
      language: 'ru',
      setPage: (page) => set({ currentPage: page }),
      setSelectedBot: (id) => set({ selectedBotId: id }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        currentPage: state.currentPage,
        selectedBotId: state.selectedBotId,
        language: state.language,
      }),
    }
  )
);

interface DraftBotConfig {
  greeting: string;
  tone: 'formal' | 'friendly' | 'professional';
  workingHours: {
    enabled: boolean;
    days: number[];
    startTime: string;
    endTime: string;
  };
  features: {
    booking: boolean;
    services: boolean;
    faq: boolean;
    operatorTransfer: boolean;
    contactCollection: boolean;
  };
  faq: { question: string; answer: string }[];
  services: { name: string; price: number; duration: number; description: string }[];
  systemPrompt: string;
  aiPersonality: string;
  aiCapabilities: {
    autoQA: boolean;
    intentRecognition: boolean;
    leadCapture: boolean;
    personalization: boolean;
    operatorEscalation: boolean;
  };
}

interface DraftBotAppearance {
  position: 'bottom-right' | 'bottom-left' | 'inline';
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  buttonSize: 'small' | 'medium' | 'large';
  animation: 'fade' | 'slide' | 'bounce';
  companyName: string;
}

interface DraftBotCalendarConfig {
  days: number[];
  startTime: string;
  endTime: string;
  slotDuration: number;
  bufferMinutes: number;
  maxConcurrentBookings: number;
}

interface DraftBot {
  name: string;
  type: 'ai' | 'rule-based' | 'hybrid';
  niche: string;
  avatar: string;
  config: DraftBotConfig;
  appearance: DraftBotAppearance;
  calendarConfig: DraftBotCalendarConfig;
}

interface BotBuilderState {
  currentStep: number;
  draftBot: DraftBot;
  lastSaved: number | null;
  setStep: (step: number) => void;
  updateDraftBot: (data: Partial<DraftBot>) => void;
  updateConfig: (data: Partial<DraftBotConfig>) => void;
  updateFeatures: (data: Partial<DraftBotConfig['features']>) => void;
  updateWorkingHours: (data: Partial<DraftBotConfig['workingHours']>) => void;
  updateAppearance: (data: Partial<DraftBotAppearance>) => void;
  updateCalendarConfig: (data: Partial<DraftBotCalendarConfig>) => void;
  setLastSaved: (ts: number | null) => void;
  resetDraft: () => void;
}

const defaultDraftBot: DraftBot = {
  name: '',
  type: 'ai',
  niche: '',
  avatar: '',
  config: {
    greeting: '',
    tone: 'friendly',
    workingHours: {
      enabled: false,
      days: [1, 2, 3, 4, 5],
      startTime: '09:00',
      endTime: '18:00',
    },
    features: {
      booking: true,
      services: true,
      faq: true,
      operatorTransfer: false,
      contactCollection: true,
    },
    faq: [],
    services: [],
    systemPrompt: '',
    aiPersonality: '',
    aiCapabilities: {
      autoQA: true,
      intentRecognition: true,
      leadCapture: false,
      personalization: true,
      operatorEscalation: false,
    },
  },
  appearance: {
    position: 'bottom-right',
    primaryColor: '#059669',
    secondaryColor: '#10b981',
    backgroundColor: '#ffffff',
    buttonSize: 'medium',
    animation: 'bounce',
    companyName: '',
  },
  calendarConfig: {
    days: [1, 2, 3, 4, 5],
    startTime: '09:00',
    endTime: '18:00',
    slotDuration: 60,
    bufferMinutes: 15,
    maxConcurrentBookings: 1,
  },
};

export const useBotBuilderStore = create<BotBuilderState>()(
  persist(
    (set) => ({
      currentStep: 0,
      draftBot: { ...defaultDraftBot },
      lastSaved: null,
      setStep: (step) => set({ currentStep: step }),
      updateDraftBot: (data) =>
        set((state) => ({
          draftBot: {
            ...state.draftBot,
            ...data,
            config: data.config ? { ...state.draftBot.config, ...data.config } : state.draftBot.config,
            appearance: data.appearance ? { ...state.draftBot.appearance, ...data.appearance } : state.draftBot.appearance,
            calendarConfig: data.calendarConfig ? { ...state.draftBot.calendarConfig, ...data.calendarConfig } : state.draftBot.calendarConfig,
          },
        })),
      updateConfig: (data) =>
        set((state) => ({
          draftBot: {
            ...state.draftBot,
            config: { ...state.draftBot.config, ...data },
          },
        })),
      updateFeatures: (data) =>
        set((state) => ({
          draftBot: {
            ...state.draftBot,
            config: {
              ...state.draftBot.config,
              features: { ...state.draftBot.config.features, ...data },
            },
          },
        })),
      updateWorkingHours: (data) =>
        set((state) => ({
          draftBot: {
            ...state.draftBot,
            config: {
              ...state.draftBot.config,
              workingHours: { ...state.draftBot.config.workingHours, ...data },
            },
          },
        })),
      updateAppearance: (data) =>
        set((state) => ({
          draftBot: {
            ...state.draftBot,
            appearance: { ...state.draftBot.appearance, ...data },
          },
        })),
      updateCalendarConfig: (data) =>
        set((state) => ({
          draftBot: {
            ...state.draftBot,
            calendarConfig: { ...state.draftBot.calendarConfig, ...data },
          },
        })),
      setLastSaved: (ts) => set({ lastSaved: ts }),
      resetDraft: () => set({ currentStep: 0, draftBot: { ...defaultDraftBot }, lastSaved: null }),
    }),
    {
      name: 'bot-builder-draft',
      partialize: (state) => ({
        currentStep: state.currentStep,
        draftBot: state.draftBot,
        lastSaved: state.lastSaved,
      }),
    }
  )
);
