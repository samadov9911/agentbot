export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar?: string | null;
  company?: string | null;
  role: string;
  language: string;
  isActive: boolean;
  createdAt: string;
  demoExpiresAt?: string;
  planName?: string;
  planStatus?: string;
}

export interface Bot {
  id: string;
  userId: string;
  name: string;
  type: 'ai' | 'rule-based' | 'hybrid';
  niche?: string | null;
  avatar?: string | null;
  config: BotConfig;
  appearance: BotAppearance;
  isActive: boolean;
  embedCode?: string | null;
  telegramToken?: string | null;
  whatsappConfig?: string | null;
  publishedAt?: string | null;
  conversationsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BotConfig {
  greeting?: string;
  tone?: 'formal' | 'friendly' | 'professional';
  workingHours?: {
    enabled: boolean;
    days: number[];
    startTime: string;
    endTime: string;
    timezone: string;
  };
  features?: {
    booking: boolean;
    services: boolean;
    faq: boolean;
    operatorTransfer: boolean;
    contactCollection: boolean;
  };
  faq?: FaqItem[];
  services?: ServiceItem[];
  systemPrompt?: string;
}

export interface BotAppearance {
  position?: 'bottom-right' | 'bottom-left' | 'inline';
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  buttonSize?: 'small' | 'medium' | 'large';
  animation?: 'fade' | 'slide' | 'bounce';
  companyName?: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ServiceItem {
  name: string;
  price: number;
  duration: number;
  description?: string;
}

export interface Conversation {
  id: string;
  botId: string;
  source: string;
  visitorId?: string;
  visitorName?: string;
  status: string;
  isFlagged: boolean;
  isProcessed: boolean;
  messages?: Message[];
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'bot' | 'operator' | 'system';
  content: string;
  messageType: string;
  metadata?: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  botId: string;
  visitorName: string;
  visitorPhone: string;
  visitorEmail?: string;
  service?: string;
  date: string;
  duration: number;
  status: string;
  notes?: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: 'demo' | 'monthly' | 'quarterly' | 'yearly' | 'lifetime';
  status: 'active' | 'expired' | 'cancelled';
  startsAt: string;
  expiresAt?: string;
  autoRenew: boolean;
  pricePaid?: number;
}

export interface DemoPeriod {
  id: string;
  userId: string;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
}

export interface BotTemplate {
  id: string;
  niche: string;
  name: string;
  description?: string;
  greeting?: string;
  faq?: FaqItem[];
  colors?: { primary: string; secondary: string };
  icon?: string;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  plan: string;
  status: string;
  createdAt: string;
}

export interface AnalyticsData {
  totalVisitors: number;
  totalConversations: number;
  totalAppointments: number;
  conversionRate: number;
  dailyStats: DailyStat[];
  topQuestions: { question: string; count: number }[];
  topServices: { service: string; count: number }[];
  sources: { source: string; count: number }[];
}

export interface DailyStat {
  date: string;
  visitors: number;
  conversations: number;
  appointments: number;
}

export type AppPage =
  | 'landing'
  | 'login'
  | 'register'
  | 'dashboard'
  | 'bots'
  | 'bot-builder'
  | 'bot-preview'
  | 'ai-agent'
  | 'analytics'
  | 'settings'
  | 'subscription'
  | 'help'
  | 'admin'
  | 'admin-users'
  | 'admin-analytics'
  | 'admin-logs'
  | 'admin-embed'
  | 'support'
  | 'bookings'
  | 'forgot-password'
  | 'reset-password';

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  discount?: number;
  popular?: boolean;
}

export interface CallLog {
  id: string;
  userId: string;
  botId?: string;
  clientPhone: string;
  companyPhone: string;
  taskDescription: string;
  script: string;
  status: 'completed' | 'failed' | 'no_answer';
  duration: number;
  transcript: CallDialogLine[];
  aiSummary: string;
  createdAt: string;
}

export interface CallDialogLine {
  role: 'ai_agent' | 'client';
  text: string;
  timestamp: string;
}
