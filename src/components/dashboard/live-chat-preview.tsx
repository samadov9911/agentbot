'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, CalendarCheck, MessageSquare, Send, RotateCcw, Sparkles } from 'lucide-react';
import { useBotBuilderStore, useAppStore } from '@/stores';

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: number;
}

interface BookingSuggestion {
  id: string;
  text: string;
  timestamp: number;
}

let msgIdCounter = 0;
function nextId() {
  return `demo-${++msgIdCounter}-${Date.now()}`;
}

export function LiveChatPreview() {
  const { draftBot } = useBotBuilderStore();
  const { language, selectedBotId } = useAppStore();
  const { appearance, config, name: botName, type: botType, calendarConfig, avatar } = draftBot;
  const hasAvatar = avatar && avatar.startsWith('data:');

  const [isOpen, setIsOpen] = useState(true);
  const [animKey, setAnimKey] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [bookingSuggestion, setBookingSuggestion] = useState<BookingSuggestion | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevAnimationRef = useRef(appearance.animation);

  const companyName = appearance.companyName || '';
  const primaryColor = appearance.primaryColor || '#059669';
  const secondaryColor = appearance.secondaryColor || '#10b981';

  // Send greeting on first open
  const hasSentGreeting = useRef(false);
  useEffect(() => {
    if (isOpen && !hasSentGreeting.current) {
      hasSentGreeting.current = true;
      const greetingText = config.greeting
        ? config.greeting
            .replace('{bot_name}', botName || 'Бот')
            .replace('{company_name}', companyName || 'Компания')
            .replace('{user_name}', language === 'ru' ? 'Гость' : language === 'en' ? 'Guest' : 'Misafir')
        : (language === 'ru'
            ? `Добрый день!${botName ? ` Я ${botName}` : ''}${companyName ? `, ${companyName}` : ''} 💬`
            : language === 'en'
              ? `Hi there!${botName ? ` I'm ${botName}` : ''}${companyName ? ` from ${companyName}` : ''} 💬`
              : `Merhaba!${botName ? ` Ben ${botName}` : ''}${companyName ? `, ${companyName}` : ''} 💬`);

      setMessages([{
        id: nextId(),
        role: 'bot',
        content: greetingText,
        timestamp: Date.now(),
      }]);
    }
  }, [isOpen, botName, companyName, config.greeting, language]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: nextId(),
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/bot-demo-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          sessionId,
          botConfig: {
            type: botType,
            systemPrompt: config.systemPrompt,
            tone: config.tone,
            faq: config.faq,
            services: config.services,
            greeting: config.greeting,
          },
          botName,
          companyName,
          language,
          calendarConfig,
          // Use real botId if available (when previewing an existing saved bot)
          // so that conversations are saved to DB and appear in Analytics > Dialogs.
          // For new unsaved bots, don't send botId to avoid FK errors.
          ...(selectedBotId ? { botId: selectedBotId } : {}),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const botMsg: ChatMessage = {
          id: nextId(),
          role: 'bot',
          content: data.response,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, botMsg]);

        // Handle booking prompt suggestion
        if (data.bookingPrompt) {
          setBookingSuggestion({
            id: nextId(),
            text: data.bookingPrompt,
            timestamp: Date.now(),
          });
        } else {
          setBookingSuggestion(null);
        }
      } else {
        const errorMsg: ChatMessage = {
          id: nextId(),
          role: 'bot',
          content: language === 'ru' ? 'Произошла ошибка. Попробуйте ещё раз.' : language === 'en' ? 'An error occurred. Please try again.' : 'Bir hata oluştu. Lütfen tekrar deneyin.',
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } catch {
      const errorMsg: ChatMessage = {
        id: nextId(),
        role: 'bot',
        content: language === 'ru' ? 'Не удалось получить ответ. Проверьте подключение.' : language === 'en' ? 'Could not get a response. Check your connection.' : 'Yanıt alınamadı. Bağlantınızı kontrol edin.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, sessionId, botType, config, botName, companyName, language, calendarConfig, selectedBotId]);

  const handleReset = useCallback(async () => {
    setMessages([]);
    setIsLoading(false);
    setInput('');
    hasSentGreeting.current = false;

    try {
      await fetch(`/api/bot-demo-chat?sessionId=${sessionId}`, { method: 'DELETE' });
    } catch {
      // Silently fail
    }

    // Re-trigger greeting
    setTimeout(() => {
      hasSentGreeting.current = true;
      const greetingText = config.greeting
        ? config.greeting
            .replace('{bot_name}', botName || 'Бот')
            .replace('{company_name}', companyName || 'Компания')
            .replace('{user_name}', language === 'ru' ? 'Гость' : language === 'en' ? 'Guest' : 'Misafir')
        : (language === 'ru'
            ? `Добрый день!${botName ? ` Я ${botName}` : ''}${companyName ? `, ${companyName}` : ''} 💬`
            : language === 'en'
              ? `Hi there!${botName ? ` I'm ${botName}` : ''}${companyName ? ` from ${companyName}` : ''} 💬`
              : `Merhaba!${botName ? ` Ben ${botName}` : ''}${companyName ? `, ${companyName}` : ''} 💬`);

      setMessages([{
        id: nextId(),
        role: 'bot',
        content: greetingText,
        timestamp: Date.now(),
      }]);
      setBookingSuggestion(null);
    }, 100);
  }, [sessionId, config.greeting, botName, companyName, language]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }, [input, sendMessage]);

  // Format message content (handle newlines)
  const formatContent = (text: string) => {
    return text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  // Replay animation when user switches style
  useEffect(() => {
    if (prevAnimationRef.current !== appearance.animation) {
      prevAnimationRef.current = appearance.animation;
      // Close and re-open the chat to replay the entrance animation
      setIsOpen(false);
      setTimeout(() => {
        setAnimKey(k => k + 1);
        setIsOpen(true);
      }, 80);
    }
  }, [appearance.animation]);

  const animationStyle = {
    fade: { animation: 'chatFadeIn 0.35s ease-out' },
    slide: { animation: 'chatSlideUp 0.35s ease-out' },
    bounce: { animation: 'chatBounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' },
  };

  const sizeMap = { small: 'size-10', medium: 'size-12', large: 'size-14' };

  // Demo label text
  const demoLabel = language === 'ru' ? 'Демо-режим' : language === 'en' ? 'Demo mode' : 'Demo modu';
  const demoHint = language === 'ru' ? 'Попробуйте общаться с ботом' : language === 'en' ? 'Try chatting with the bot' : 'Bot ile sohbet etmeyi deneyin';
  const placeholderText = language === 'ru' ? 'Введите сообщение...' : language === 'en' ? 'Type a message...' : 'Mesaj yazın...';
  const resetLabel = language === 'ru' ? 'Сбросить' : language === 'en' ? 'Reset' : 'Sıfırla';
  const botTypeLabel = botType === 'ai' ? 'AI' : botType === 'hybrid' ? 'Hybrid' : 'Bot';

  return (
    <div className="relative rounded-xl bg-muted/30 border-2 border-dashed border-muted-foreground/20 overflow-hidden" style={{ minHeight: 460 }}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="grid grid-cols-4 grid-rows-4 gap-1 h-full p-4">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="rounded bg-foreground" />
          ))}
        </div>
      </div>

      {/* Demo badge */}
      <div className="relative flex items-center justify-center pt-3 pb-1">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800">
          <Sparkles className="size-3 text-amber-600 dark:text-amber-400" />
          <span className="text-[10px] font-medium text-amber-700 dark:text-amber-300">{demoLabel}</span>
        </div>
        <span className="text-[10px] text-muted-foreground ml-2">{demoHint}</span>
      </div>

      {/* Chat Widget */}
      {isOpen && (
      <div
        key={animKey}
        className="relative mx-auto mt-1 mb-16 w-80 max-w-full rounded-xl shadow-lg overflow-hidden border bg-background"
        style={animationStyle[appearance.animation as keyof typeof animationStyle] || animationStyle.bounce}
      >
        {/* Header */}
        <div className="p-3 text-white relative" style={{ backgroundColor: primaryColor }}>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
              {hasAvatar ? (
                <img src={avatar} alt={botName || 'Bot'} className="size-full object-cover" />
              ) : (
                <Bot className="size-4" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{botName || 'Бот'}</p>
              <div className="flex items-center gap-1.5">
                <p className="text-xs opacity-80 truncate">{companyName || 'Компания'}</p>
                <span className="text-[9px] opacity-60 px-1.5 py-0.5 rounded-full bg-white/15">{botTypeLabel}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="size-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
              title={resetLabel}
            >
              <RotateCcw className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div className="p-3 space-y-3 min-h-[200px] max-h-[280px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground text-xs">
              {isLoading ? '...' : demoHint}
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'bot' && (
                <div
                  className="size-6 rounded-full flex items-center justify-center shrink-0 mt-1 overflow-hidden"
                  style={{ backgroundColor: `${secondaryColor}20` }}
                >
                  {hasAvatar ? (
                    <img src={avatar} alt={botName || 'Bot'} className="size-full object-cover" />
                  ) : (
                    <Bot className="size-3" style={{ color: secondaryColor }} />
                  )}
                </div>
              )}
              <div
                className={`rounded-2xl px-3 py-2 text-xs max-w-[80%] leading-relaxed ${
                  msg.role === 'user'
                    ? 'rounded-tr-sm bg-muted'
                    : 'rounded-tl-sm text-white'
                }`}
                style={msg.role === 'bot' ? { backgroundColor: secondaryColor } : undefined}
              >
                {formatContent(msg.content)}
              </div>
              {msg.role === 'user' && (
                <div className="size-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1">
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {(language === 'ru' ? 'Г' : language === 'en' ? 'U' : 'M')}
                  </span>
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex gap-2 justify-start">
              <div
                className="size-6 rounded-full flex items-center justify-center shrink-0 mt-1 overflow-hidden"
                style={{ backgroundColor: `${secondaryColor}20` }}
              >
                {hasAvatar ? (
                  <img src={avatar} alt={botName || 'Bot'} className="size-full object-cover" />
                ) : (
                  <Bot className="size-3" style={{ color: secondaryColor }} />
                )}
              </div>
              <div className="rounded-2xl rounded-tl-sm px-3 py-2.5" style={{ backgroundColor: `${secondaryColor}20` }}>
                <div className="flex gap-1 items-center">
                  <div className="size-1.5 rounded-full animate-bounce" style={{ backgroundColor: secondaryColor, animationDelay: '0ms' }} />
                  <div className="size-1.5 rounded-full animate-bounce" style={{ backgroundColor: secondaryColor, animationDelay: '150ms' }} />
                  <div className="size-1.5 rounded-full animate-bounce" style={{ backgroundColor: secondaryColor, animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* Booking suggestion prompt */}
          {bookingSuggestion && !isLoading && (
            <button
              type="button"
              onClick={() => {
                setBookingSuggestion(null);
                sendMessage(bookingSuggestion.text);
              }}
              className="flex items-center gap-2 mx-auto mt-1 px-3 py-1.5 rounded-full text-[10px] font-medium border transition-all hover:scale-105 cursor-pointer"
              style={{
                borderColor: `${primaryColor}40`,
                backgroundColor: `${primaryColor}10`,
                color: primaryColor,
              }}
            >
              <CalendarCheck className="size-3" />
              <span>{bookingSuggestion.text.replace(/^[📅 ]+/, '')}</span>
            </button>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-2 border-t bg-muted/30">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholderText}
              disabled={isLoading}
              className="flex-1 h-8 text-xs rounded-lg border border-border bg-background px-3 outline-none focus:ring-1 focus:ring-emerald-300 transition-colors disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="size-8 rounded-lg flex items-center justify-center text-white shrink-0 transition-opacity disabled:opacity-40 hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              <Send className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Keyframe definitions */}
      <style>{`
        @keyframes chatFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes chatBounceIn {
          0% { opacity: 0; transform: translateY(20px) scale(0.95); }
          60% { opacity: 1; transform: translateY(-4px) scale(1.02); }
          80% { transform: translateY(2px) scale(0.99); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Floating Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`absolute bottom-4 ${appearance.position === 'bottom-left' ? 'left-4' : 'right-4'}`}
      >
        <div
          className={`${sizeMap[appearance.buttonSize]} rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer transition-transform hover:scale-110`}
          style={{ backgroundColor: primaryColor }}
        >
          {isOpen ? (
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          ) : (
            <MessageSquare className="size-5" />
          )}
        </div>
      </button>
    </div>
  );
}
