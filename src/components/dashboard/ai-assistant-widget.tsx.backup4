'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  X,
  Send,
  Bot,
  Trash2,
  RotateCcw,
  Sparkles,
  Zap,
  LayoutTemplate,
  Globe,
  CreditCard,
} from 'lucide-react';

import { useAuthStore, useAppStore } from '@/stores';
import { t, type Language } from '@/lib/i18n';

import { Button } from '@/components/ui/button';

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: number;
}

interface QuickSuggestion {
  icon: React.ElementType;
  label: string;
  message: string;
}

// ──────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'ai-assistant-history';
const MAX_MESSAGES = 20;

// Dynamic quick suggestions — generated based on current language
function getQuickSuggestions(language: Language): QuickSuggestion[] {
  return [
    {
      icon: Sparkles,
      label: t('aiAssistant.suggestionCreate', language),
      message: language === 'ru'
        ? 'Как создать бота?'
        : language === 'tr'
          ? 'Bot nasıl oluştururum?'
          : 'How to create a bot?',
    },
    {
      icon: LayoutTemplate,
      label: t('aiAssistant.suggestionTemplate', language),
      message: language === 'ru'
        ? 'Какой шаблон выбрать для моего бизнеса?'
        : language === 'tr'
          ? 'İşim için hangi şablonu seçmeliyim?'
          : 'Which template for my business?',
    },
    {
      icon: Globe,
      label: t('aiAssistant.suggestionWidget', language),
      message: language === 'ru'
        ? 'Как добавить виджет на мой сайт?'
        : language === 'tr'
          ? 'Siteye widget nasıl eklerim?'
          : 'How to add widget to my site?',
    },
    {
      icon: CreditCard,
      label: t('aiAssistant.suggestionPlans', language),
      message: language === 'ru'
        ? 'Расскажи о тарифах и ценах'
        : language === 'tr'
          ? 'Planlar ve fiyatlar hakkında bilgi ver'
          : 'Explain subscription plans',
    },
  ];
}

const PAGE_TITLE_KEYS: Record<string, string> = {
  dashboard: 'Overview',
  bots: 'My Bots',
  'bot-builder': 'Bot Builder',
  analytics: 'Analytics',
  settings: 'Settings',
  subscription: 'Subscription',
  help: 'Help',
  admin: 'Admin Panel',
  'admin-users': 'Admin Users',
  'admin-analytics': 'Admin Analytics',
  'admin-logs': 'Admin Logs',
  landing: 'Landing',
};

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatTime(ts: number, language: Language): string {
  const date = new Date(ts);
  if (language === 'tr') {
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  }
  if (language === 'en') {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function loadHistory(): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((m) => m.id && m.role && m.content && m.timestamp);
  } catch {
    return [];
  }
}

function saveHistory(messages: ChatMessage[]) {
  if (typeof window === 'undefined') return;
  try {
    const trimmed = messages.slice(-MAX_MESSAGES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // storage full – silently ignore
  }
}

function clearHistory() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

// ──────────────────────────────────────────────────────────────
// Typing indicator
// ──────────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0ms]" />
          <span className="size-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:150ms]" />
          <span className="size-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Chat message bubble
// ──────────────────────────────────────────────────────────────

function ChatBubble({ message, language }: { message: ChatMessage; language: Language }) {
  const isBot = message.role === 'bot';
  const time = formatTime(message.timestamp, language);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}
    >
      <div className="group relative max-w-[85%]">
        {/* Avatar for bot */}
        {isBot && (
          <div className="absolute -left-8 top-0 flex size-6 items-center justify-center rounded-full bg-emerald-600 text-white">
            <Bot className="size-3.5" />
          </div>
        )}

        <div
          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isBot
              ? 'rounded-bl-sm bg-muted text-foreground'
              : 'rounded-br-sm bg-emerald-600 text-white dark:bg-emerald-500'
          }`}
        >
          {message.content}
        </div>
      </div>
      <span className="mt-1 text-[10px] text-muted-foreground px-1 tabular-nums">
        {time}
      </span>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────
// Main widget
// ──────────────────────────────────────────────────────────────

export function AiAssistantWidget() {
  const { user } = useAuthStore();
  const { currentPage, language } = useAppStore();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [hasEverOpened, setHasEverOpened] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Initialize on mount ──
  useEffect(() => {
    setHasMounted(true);
    const saved = loadHistory();
    if (saved.length > 0) {
      setMessages(saved);
    }
  }, []);

  // ── Track first open ──
  useEffect(() => {
    if (isOpen && !hasEverOpened) {
      setHasEverOpened(true);
    }
  }, [isOpen, hasEverOpened]);

  // ── Auto-scroll to bottom ──
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // ── Persist messages ──
  useEffect(() => {
    if (hasMounted) {
      saveHistory(messages);
    }
  }, [messages, hasMounted]);

  // ── Build context string for AI ──
  const contextStr = useMemo(() => {
    const parts: string[] = [];
    const pageName = PAGE_TITLE_KEYS[currentPage] ?? currentPage;
    parts.push(`Current page: ${pageName}`);
    if (user?.planName) {
      parts.push(`User plan: ${user.planName}`);
    }
    if (user?.company) {
      parts.push(`Company: ${user.company}`);
    }
    return parts.join(' | ');
  }, [currentPage, user?.planName, user?.company]);

  // ── Send message ──
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMsg: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: trimmed,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev.slice(-MAX_MESSAGES + 1), userMsg]);
      setInput('');
      setIsLoading(true);
      setError(null);

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      // Build history for API (last 10 messages before current)
      const history = messages
        .slice(-10)
        .map((m) => ({
          role: m.role === 'bot' ? 'assistant' as const : 'user' as const,
          content: m.content,
        }));

      try {
        const res = await fetch('/api/ai-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            context: contextStr,
            history,
          }),
        });

        if (!res.ok) {
          throw new Error(`Server error: ${res.status}`);
        }

        const data = await res.json();

        const botMsg: ChatMessage = {
          id: generateId(),
          role: 'bot',
          content: data.response || 'Sorry, I could not generate a response.',
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, botMsg]);
      } catch (err) {
        console.error('AI Assistant error:', err);
        setError(t('aiAssistant.error', language));
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages, contextStr, language],
  );

  // ── Handle submit ──
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      sendMessage(input);
    },
    [sendMessage, input],
  );

  // ── Handle keydown (Enter / Shift+Enter) ──
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input);
      }
    },
    [sendMessage, input],
  );

  // ── Auto-resize textarea ──
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      const el = e.target;
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 100)}px`;
    },
    [],
  );

  // ── Retry last failed message ──
  const handleRetry = useCallback(() => {
    setError(null);
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      // Remove last bot message if it was an error response, then resend
      sendMessage(lastUserMsg.content);
    }
  }, [messages, sendMessage]);

  // ── Clear chat ──
  const handleClear = useCallback(() => {
    setMessages([]);
    clearHistory();
  }, []);

  // ── Quick suggestion click ──
  const handleSuggestionClick = useCallback(
    (suggestion: QuickSuggestion) => {
      sendMessage(suggestion.message);
    },
    [sendMessage],
  );

  // ── Welcome message ──
  const showWelcome = messages.length === 0 && !isLoading;

  // Don't render until mounted (avoid hydration mismatch)
  if (!hasMounted) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="absolute bottom-16 right-0 mb-2 flex flex-col overflow-hidden rounded-2xl border bg-background shadow-xl w-[calc(100vw-3rem)] sm:w-[380px]"
            style={{ maxHeight: '520px' }}
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between gap-2 border-b bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-3 dark:from-emerald-700 dark:to-emerald-600">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-white/20 text-white">
                  <Bot className="size-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white leading-tight">
                    {t('aiAssistant.title', language)}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-emerald-100">
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                      <span className="relative inline-flex size-2 rounded-full bg-emerald-200" />
                    </span>
                    {t('aiAssistant.online', language)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-white/80 hover:text-white hover:bg-white/20"
                  onClick={handleClear}
                  title={t('aiAssistant.clearChat', language)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-white/80 hover:text-white hover:bg-white/20"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            {/* ── Messages Area ── */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0" style={{ maxHeight: '340px' }}>
              {/* Welcome message */}
              {showWelcome && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center gap-4 py-2"
                >
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                    <Sparkles className="size-7" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                      {t('aiAssistant.greeting', language)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('aiAssistant.placeholder', language)}
                    </p>
                  </div>

                  {/* Quick suggestions */}
                  <div className="flex flex-wrap justify-center gap-2 w-full">
                    {getQuickSuggestions(language).map((suggestion) => {
                      const Icon = suggestion.icon;
                      return (
                        <button
                          key={suggestion.label}
                          type="button"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 hover:border-emerald-300 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900"
                        >
                          <Icon className="size-3.5 shrink-0" />
                          <span>{suggestion.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Chat messages */}
              {messages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} language={language} />
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 px-1"
                >
                  <div className="flex size-6 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <Bot className="size-3.5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TypingIndicator />
                    <span className="text-[11px] text-muted-foreground italic">
                      {t('aiAssistant.thinking', language)}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2"
                >
                  <span className="text-xs text-destructive flex-1">{error}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 gap-1 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleRetry}
                  >
                    <RotateCcw className="size-3" />
                    <span className="text-xs">{t('aiAssistant.retry', language)}</span>
                  </Button>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── Input Area ── */}
            <div className="border-t bg-background px-3 py-2.5">
              <form onSubmit={handleSubmit} className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={t('aiAssistant.placeholder', language)}
                  disabled={isLoading}
                  rows={1}
                  className="flex-1 resize-none rounded-xl border bg-muted/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-muted/30 max-h-[100px] transition-[height] duration-100"
                  style={{ lineHeight: '1.4' }}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isLoading || !input.trim()}
                  className="size-9 shrink-0 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="size-4" />
                  <span className="sr-only">{t('common.send', language)}</span>
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Button ── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            type="button"
            onClick={() => setIsOpen(true)}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 20,
              delay: 0.1,
            }}
            className="relative flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 transition-shadow hover:shadow-xl hover:shadow-emerald-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:from-emerald-600 dark:to-emerald-700"
            aria-label={t('aiAssistant.title', language)}
          >
            {/* Bounce animation on mount */}
            <motion.span
              animate={{ y: [0, -3, 0] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: 'loop',
                ease: 'easeInOut',
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <MessageCircle className="size-6" />
            </motion.span>

            {/* Notification badge dot */}
            {messages.length === 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex size-3.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-3.5 rounded-full border-2 border-background bg-emerald-500 dark:border-background" />
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
