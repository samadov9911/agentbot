'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Code2,
  Copy,
  Plug,
  LayoutTemplate,
  MessageSquare,
  Terminal,
  Globe,
  Shield,
  Zap,
  Clock,
  FileJson,
  Database,
  Server,
  AlertCircle,
  Info,
  Settings,
  Palette,
  Smartphone,
  Monitor,
  ExternalLink,
  Bot,
  Send,
  Key,
  Webhook,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { t } from '@/lib/i18n';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ──────────────────────────────────────────────────────────────
// Shared Code Block Component
// ──────────────────────────────────────────────────────────────
function CodeBlock({ code, language = 'bash', filename }: { code: string; language?: string; filename?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Скопировано в буфер обмена');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      toast.success('Скопировано в буфер обмена');
      setTimeout(() => setCopied(false), 2000);
    }
  }, [code]);

  return (
    <div className="group relative my-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-950 dark:border-slate-700">
      {filename && (
        <div className="flex items-center gap-2 border-b border-slate-700 bg-slate-800/50 px-4 py-2">
          <FileJson className="size-3.5 text-slate-400" />
          <span className="text-xs text-slate-400">{filename}</span>
          <Badge variant="secondary" className="ml-auto text-[10px]">{language}</Badge>
        </div>
      )}
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-slate-100">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 size-8 bg-slate-800/80 text-slate-400 opacity-0 transition-opacity hover:bg-slate-700 hover:text-slate-200 group-hover:opacity-100"
        onClick={handleCopy}
      >
        {copied ? <CheckCircle2 className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
      </Button>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Info Callout Component
// ──────────────────────────────────────────────────────────────
function Callout({ type = 'info', children }: { type?: 'info' | 'warning' | 'tip'; children: React.ReactNode }) {
  const config = {
    info: { icon: Info, bg: 'bg-sky-50 dark:bg-sky-950/30', border: 'border-sky-200 dark:border-sky-800', text: 'text-sky-800 dark:text-sky-300', iconColor: 'text-sky-500' },
    warning: { icon: AlertCircle, bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-800 dark:text-amber-300', iconColor: 'text-amber-500' },
    tip: { icon: Zap, bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-800 dark:text-emerald-300', iconColor: 'text-emerald-500' },
  };
  const { icon: Icon, bg, border, text, iconColor } = config[type];
  return (
    <div className={`my-4 flex items-start gap-3 rounded-lg border ${border} ${bg} p-4`}>
      <Icon className={`mt-0.5 size-5 shrink-0 ${iconColor}`} />
      <div className={`text-sm ${text}`}>{children}</div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Step Number Component
// ──────────────────────────────────────────────────────────────
function StepNumber({ num, title }: { num: number; title: string }) {
  return (
    <div className="mb-2 flex items-center gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
        {num}
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Section Heading
// ──────────────────────────────────────────────────────────────
function SectionHeading({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <Icon className="size-5 text-emerald-600 dark:text-emerald-400" />
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Endpoint Row Component
// ──────────────────────────────────────────────────────────────
function EndpointRow({ method, path, description }: { method: string; path: string; description: string }) {
  const methodColor: Record<string, string> = {
    GET: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
    POST: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-400',
    PUT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
    DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
    PATCH: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-400',
  };
  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex items-center gap-2">
        <Badge className={`min-w-[60px] justify-center ${methodColor[method] || 'bg-slate-100 text-slate-700'}`}>{method}</Badge>
        <code className="text-sm font-mono">{path}</code>
      </div>
      <span className="text-sm text-muted-foreground">{description}</span>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// 1. API Documentation Page
// ──────────────────────────────────────────────────────────────
function ApiDocsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/50">
            <Code2 className="size-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">API документация</h1>
            <p className="text-muted-foreground">Полное описание REST API для интеграции АгентБот с вашими системами</p>
          </div>
        </div>
      </div>

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Globe className="size-5" /> Обзор API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            REST API АгентБот позволяет программно управлять ботами, диалогами, записями и аналитикой.
            API использует стандартные HTTP-методы, возвращает JSON-ответы и поддерживает CORS для браузерных запросов.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex items-start gap-2">
              <Shield className="mt-0.5 size-4 shrink-0 text-emerald-500" />
              <div><strong>Аутентификация</strong><br />API Key через заголовок <code className="rounded bg-muted px-1.5 py-0.5 text-xs">Authorization: Bearer &lt;key&gt;</code></div>
            </div>
            <div className="flex items-start gap-2">
              <FileJson className="mt-0.5 size-4 shrink-0 text-emerald-500" />
              <div><strong>Формат данных</strong><br />Все запросы и ответы в формате JSON</div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="mt-0.5 size-4 shrink-0 text-emerald-500" />
              <div><strong>Рейт-лимиты</strong><br />100 запросов/мин для стандартного тарифа</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Base URL */}
      <Callout type="info">
        <strong>Базовый URL:</strong> <code className="rounded bg-sky-100 px-1.5 py-0.5 dark:bg-sky-900">https://api.agentbot.ru/v1</code> — все эндпоинты указаны относительно базового URL.
      </Callout>

      {/* Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Key className="size-5" /> Аутентификация</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Все запросы к API требуют передачи API-ключа. Получить ключ можно в разделе <strong>Настройки → API</strong> в личном кабинете.
          </p>
          <CodeBlock
            language="http"
            code={`GET /v1/bots HTTP/1.1
Host: api.agentbot.ru
Authorization: Bearer abk_live_xxxxxxxxxxxxxxxxxxxx
Content-Type: application/json`}
          />
          <h3 className="text-sm font-semibold">Получение API-ключа:</h3>
          <ol className="ml-4 list-decimal space-y-1 text-sm text-muted-foreground">
            <li>Откройте <strong>Настройки</strong> в личном кабинете</li>
            <li>Перейдите в раздел <strong>API</strong></li>
            <li>Нажмите <strong>«Сгенерировать ключ»</strong></li>
            <li>Скопируйте ключ и сохраните в безопасном месте</li>
            <li>Используйте ключ в заголовке <code className="rounded bg-muted px-1 text-xs">Authorization</code> для всех запросов</li>
          </ol>
          <Callout type="warning">
            <strong>Важно:</strong> Никогда не раскрывайте ваш API-ключ в клиентском коде (frontend). Используйте его только на серверной стороне (backend).
          </Callout>
        </CardContent>
      </Card>

      {/* Bots Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bot className="size-5" /> Боты (Bots)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Управление AI-ботами: создание, получение списка, обновление и удаление.</p>
          <div className="space-y-2">
            <EndpointRow method="GET" path="/v1/bots" description="Получить список всех ботов" />
            <EndpointRow method="GET" path="/v1/bots/:id" description="Получить данные бота по ID" />
            <EndpointRow method="POST" path="/v1/bots" description="Создать нового бота" />
            <EndpointRow method="PUT" path="/v1/bots/:id" description="Обновить настройки бота" />
            <EndpointRow method="DELETE" path="/v1/bots/:id" description="Удалить бота" />
          </div>

          <h3 className="pt-2 text-sm font-semibold">Пример: Создание бота</h3>
          <CodeBlock
            language="json"
            filename="POST /v1/bots"
            code={`{
  "name": "Мой помощник",
  "type": "ai",
  "niche": "salon",
  "config": {
    "greeting": "Здравствуйте! Чем могу помочь?",
    "tone": "friendly",
    "language": "ru"
  },
  "appearance": {
    "primaryColor": "#10b981",
    "position": "right",
    "widgetTitle": "Онлайн-помощник"
  }
}`}
          />
          <h3 className="text-sm font-semibold">Пример ответа:</h3>
          <CodeBlock
            language="json"
            code={`{
  "success": true,
  "data": {
    "id": "bot_a1b2c3d4e5f6",
    "name": "Мой помощник",
    "type": "ai",
    "niche": "salon",
    "embedCode": "ABCD1234EFGH5678",
    "isActive": true,
    "createdAt": "2025-01-15T10:30:00Z"
  }
}`}
          />
        </CardContent>
      </Card>

      {/* Conversations Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Send className="size-5" /> Диалоги (Conversations)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Просмотр истории диалогов, отправка сообщений и управление беседами.</p>
          <div className="space-y-2">
            <EndpointRow method="GET" path="/v1/conversations" description="Список всех диалогов (с пагинацией)" />
            <EndpointRow method="GET" path="/v1/conversations/:id" description="Данные диалога с сообщениями" />
            <EndpointRow method="GET" path="/v1/conversations?botId=:botId" description="Диалоги конкретного бота" />
            <EndpointRow method="POST" path="/v1/conversations/:id/messages" description="Отправить сообщение в диалог" />
            <EndpointRow method="PATCH" path="/v1/conversations/:id/status" description="Изменить статус диалога" />
          </div>

          <h3 className="pt-2 text-sm font-semibold">Параметры запроса GET /v1/conversations:</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 pr-4 font-medium">Параметр</th>
                  <th className="pb-2 pr-4 font-medium">Тип</th>
                  <th className="pb-2 font-medium">Описание</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b"><td className="py-2 pr-4"><code>botId</code></td><td className="py-2 pr-4">string</td><td className="py-2">Фильтр по ID бота</td></tr>
                <tr className="border-b"><td className="py-2 pr-4"><code>status</code></td><td className="py-2 pr-4">string</td><td className="py-2">active, closed, archived</td></tr>
                <tr className="border-b"><td className="py-2 pr-4"><code>from</code></td><td className="py-2 pr-4">date</td><td className="py-2">Начало периода (ISO 8601)</td></tr>
                <tr className="border-b"><td className="py-2 pr-4"><code>to</code></td><td className="py-2 pr-4">date</td><td className="py-2">Конец периода (ISO 8601)</td></tr>
                <tr><td className="py-2 pr-4"><code>limit</code></td><td className="py-2 pr-4">number</td><td className="py-2">Кол-во результатов (max 100, default 20)</td></tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Terminal className="size-5" /> Записи (Appointments)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Управление записями клиентов: просмотр, создание, подтверждение и отмена.</p>
          <div className="space-y-2">
            <EndpointRow method="GET" path="/v1/appointments" description="Список всех записей" />
            <EndpointRow method="GET" path="/v1/appointments/:id" description="Детали записи" />
            <EndpointRow method="POST" path="/v1/appointments" description="Создать запись вручную" />
            <EndpointRow method="PATCH" path="/v1/appointments/:id/status" description="Обновить статус записи" />
            <EndpointRow method="DELETE" path="/v1/appointments/:id" description="Отменить запись" />
          </div>
          <h3 className="pt-2 text-sm font-semibold">Пример: Обновление статуса записи</h3>
          <CodeBlock
            language="json"
            filename="PATCH /v1/appointments/appt_x1y2z3/status"
            code={`{
  "status": "confirmed",
  "notes": "Подтверждено оператором"
}`}
          />
          <Callout type="tip">
            <strong>Совет:</strong> Статусы записей: <code>pending</code> — ожидает, <code>confirmed</code> — подтверждена, <code>cancelled</code> — отменена, <code>completed</code> — завершена.
          </Callout>
        </CardContent>
      </Card>

      {/* Analytics Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Layers className="size-5" /> Аналитика (Analytics)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Получение статистических данных и аналитических отчётов.</p>
          <div className="space-y-2">
            <EndpointRow method="GET" path="/v1/analytics/overview" description="Обзорная статистика" />
            <EndpointRow method="GET" path="/v1/analytics/daily" description="Ежедневная статистика" />
            <EndpointRow method="GET" path="/v1/analytics/bots/:id" description="Статистика конкретного бота" />
            <EndpointRow method="GET" path="/v1/analytics/export" description="Экспорт отчёта (CSV/PDF)" />
          </div>
          <h3 className="pt-2 text-sm font-semibold">Пример: Обзорная аналитика</h3>
          <CodeBlock
            language="json"
            code={`// GET /v1/analytics/overview
{
  "success": true,
  "data": {
    "totalConversations": 1247,
    "totalAppointments": 389,
    "completionRate": 92.5,
    "avgResponseTime": 1.2,
    "activeBots": 5,
    "period": {
      "from": "2025-01-01T00:00:00Z",
      "to": "2025-01-31T23:59:59Z"
    }
  }
}`}
          />
        </CardContent>
      </Card>

      {/* Webhooks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Webhook className="size-5" /> Вебхуки (Webhooks)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Настройте вебхуки для получения уведомлений о событиях в реальном времени.
            Когда происходит событие (новое сообщение, запись и т.д.), АгентБот отправляет POST-запрос на указанный URL.
          </p>
          <div className="space-y-2">
            <EndpointRow method="POST" path="/v1/webhooks" description="Создать вебхук" />
            <EndpointRow method="GET" path="/v1/webhooks" description="Список вебхуков" />
            <EndpointRow method="DELETE" path="/v1/webhooks/:id" description="Удалить вебхук" />
          </div>
          <h3 className="text-sm font-semibold">Доступные события:</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {['conversation.created', 'message.received', 'message.sent', 'appointment.created', 'appointment.status_changed', 'bot.status_changed'].map((event) => (
              <div key={event} className="flex items-center gap-2 rounded-lg border bg-card p-2.5">
                <ChevronRight className="size-3.5 text-emerald-500" />
                <code className="text-xs">{event}</code>
              </div>
            ))}
          </div>
          <CodeBlock
            language="json"
            filename="Пример payload вебхука"
            code={`{
  "event": "appointment.created",
  "timestamp": "2025-01-15T14:30:00Z",
  "data": {
    "appointmentId": "appt_x1y2z3",
    "botId": "bot_a1b2c3",
    "visitorName": "Иван Петров",
    "visitorPhone": "+79991234567",
    "visitorEmail": "ivan@example.com",
    "service": "Стрижка",
    "date": "2025-01-16T10:00:00Z",
    "status": "pending"
  }
}`}
          />
        </CardContent>
      </Card>

      {/* Error Handling */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><AlertCircle className="size-5" /> Обработка ошибок</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">API возвращает стандартные HTTP-коды ошибок с подробным JSON-описанием.</p>
          <div className="space-y-2">
            <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <Badge className="bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-400">200</Badge>
              <span className="text-sm"><strong>OK</strong> — запрос выполнен успешно</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <Badge className="bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-400">201</Badge>
              <span className="text-sm"><strong>Created</strong> — ресурс успешно создан</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">400</Badge>
              <span className="text-sm"><strong>Bad Request</strong> — неверные параметры запроса</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <Badge className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400">401</Badge>
              <span className="text-sm"><strong>Unauthorized</strong> — отсутствует или неверный API-ключ</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <Badge className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400">403</Badge>
              <span className="text-sm"><strong>Forbidden</strong> — нет доступа к ресурсу</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <Badge className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400">404</Badge>
              <span className="text-sm"><strong>Not Found</strong> — ресурс не найден</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <Badge className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400">429</Badge>
              <span className="text-sm"><strong>Too Many Requests</strong> — превышен лимит запросов</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <Badge className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400">500</Badge>
              <span className="text-sm"><strong>Internal Server Error</strong> — ошибка сервера</span>
            </div>
          </div>
          <h3 className="text-sm font-semibold">Пример ответа с ошибкой:</h3>
          <CodeBlock
            language="json"
            code={`{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing API key",
    "status": 401
  }
}`}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// 2. Integration Guides Page
// ──────────────────────────────────────────────────────────────
function IntegrationGuidesPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-900/50">
            <Plug className="size-6 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Руководства по интеграции</h1>
            <p className="text-muted-foreground">Пошаговые инструкции для интеграции АгентБот с CRM, ERP и другими системами</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="general">Общие принципы</TabsTrigger>
          <TabsTrigger value="crm">CRM-системы</TabsTrigger>
          <TabsTrigger value="website">Сайты (CMS)</TabsTrigger>
          <TabsTrigger value="other">Другие системы</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Database className="size-5" /> Как работает интеграция</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                АгентБот поддерживает два основных способа интеграции с внешними системами:
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border bg-card p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Webhook className="size-5 text-emerald-500" />
                    <h3 className="font-semibold">Вебхуки (Push)</h3>
                  </div>
                  <p>АгентБот отправляет данные в вашу систему в реальном времени при наступлении событий: новое сообщение, запись, смена статуса.</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Code2 className="size-5 text-emerald-500" />
                    <h3 className="font-semibold">REST API (Pull)</h3>
                  </div>
                  <p>Ваша система периодически обращается к API АгентБот для получения обновлений: списка диалогов, записей, аналитики.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Общая схема работы</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StepNumber num={1} title="Настройте API-ключ" />
              <p className="ml-11 text-sm text-muted-foreground">Получите ключ в личном кабинете: Настройки → API → Сгенерировать ключ</p>
              <StepNumber num={2} title="Создайте вебхук (опционально)" />
              <p className="ml-11 text-sm text-muted-foreground">Настройте URL вашей системы для получения событий в реальном времени</p>
              <StepNumber num={3} title="Настройте обмен данными" />
              <p className="ml-11 text-sm text-muted-foreground">Используйте API для синхронизации данных между АгентБот и вашей системой</p>
              <StepNumber num={4} title="Протестируйте интеграцию" />
              <p className="ml-11 text-sm text-muted-foreground">Отправьте тестовые данные и убедитесь, что обмен работает корректно</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CRM Tab */}
        <TabsContent value="crm" className="space-y-6">
          {/* AmoCRM */}
          <Card>
            <CardHeader>
              <CardTitle>Интеграция с amoCRM</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                amoCRM — популярная CRM-система для управления продажами. Интеграция позволяет автоматически создавать сделки и контакты из диалогов бота.
              </p>
              <StepNumber num={1} title="Получите API-ключи amoCRM" />
              <p className="ml-11 text-sm text-muted-foreground">
                Перейдите в amoCRM → Настройки → Интеграции → Создать интеграцию. Скопируйте <code className="rounded bg-muted px-1 text-xs">Client ID</code> и <code className="rounded bg-muted px-1 text-xs">Client Secret</code>.
              </p>
              <StepNumber num={2} title="Настройте вебхук в АгентБот" />
              <p className="ml-11 text-sm text-muted-foreground">
                В личном кабинете АгентБот перейдите в настройки бота → Интеграции → amoCRM. Вставьте API-ключи и выберите события для передачи.
              </p>
              <CodeBlock
                language="json"
                filename="Пример: создание сделки в amoCRM через вебхук"
                code={`// АгентБот отправляет POST на ваш сервер
// Ваш сервер создаёт сделку в amoCRM

POST https://example.com/webhook/agentbot
{
  "event": "conversation.created",
  "data": {
    "visitorName": "Мария Иванова",
    "visitorPhone": "+79991234567",
    "visitorEmail": "maria@example.com",
    "message": "Хочу записаться на стрижку",
    "source": "widget"
  }
}

// Ваш сервер → POST к amoCRM API
POST https://your-domain.amocrm.ru/api/v4/leads
{
  "name": "Запрос с сайта — Мария Иванова",
  "contacts": {
    "name": "Мария Иванова",
    "phone": "+79991234567"
  },
  "custom_fields": {
    "source": "agentbot_widget"
  }
}`}
              />
              <StepNumber num={3} title="Настройте синхронизацию статусов" />
              <p className="ml-11 text-sm text-muted-foreground">
                При изменении статуса записи в АгентБот (подтверждено/отменено) — статус автоматически обновляется в amoCRM.
              </p>
              <Callout type="tip">
                <strong>Совет:</strong> Используйте промежуточный сервер (middleware) для преобразования данных между форматами АгентБот и amoCRM. Это позволит гибко настраивать маппинг полей.
              </Callout>
            </CardContent>
          </Card>

          {/* Bitrix24 */}
          <Card>
            <CardHeader>
              <CardTitle>Интеграция с Битрикс24</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Битрикс24 — комплексная CRM с инструментами управления задачами и коммуникациями.
              </p>
              <StepNumber num={1} title="Создайте входящий вебхук в Битрикс24" />
              <p className="ml-11 text-sm text-muted-foreground">
                Битрикс24 → Разработчикам → Другое → Входящий вебхук. Выберите права: CRM (лиды, контакты) и скопируйте URL вебхука.
              </p>
              <StepNumber num={2} title="Настройте обработчик" />
              <CodeBlock
                language="json"
                filename="Пример: создание лида в Битрикс24"
                code={`// POST на URL входящего вебхука Битрикс24
POST https://your-domain.bitrix24.ru/rest/1/your_webhook_code/crm.lead.add.json
{
  "fields": {
    "TITLE": "Новый лид с сайта",
    "NAME": "Мария",
    "LAST_NAME": "Иванова",
    "PHONE": [
      { "VALUE": "+79991234567", "VALUE_TYPE": "WORK" }
    ],
    "EMAIL": [
      { "VALUE": "maria@example.com", "VALUE_TYPE": "WORK" }
    ],
    "SOURCE_ID": "WEB",
    "COMMENTS": "Обращение через AI-чат АгентБот. Запрос: запись на стрижку."
  },
  "params": { "REGISTER_SONET_EVENT": "Y" }
}`}
              />
              <StepNumber num={3} title="Настройте уведомления в Битрикс24" />
              <p className="ml-11 text-sm text-muted-foreground">
                При создании лида менеджер получает уведомление в Битрикс24 и может сразу связаться с клиентом.
              </p>
            </CardContent>
          </Card>

          {/* YClients */}
          <Card>
            <CardHeader>
              <CardTitle>Интеграция с YClients</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                YClients — популярная система управления для салонов красоты и сервисных бизнесов.
                АгентБот может автоматически создавать записи в YClients из диалогов с клиентами.
              </p>
              <StepNumber num={1} title="Подключите YClients API" />
              <p className="ml-11 text-sm text-muted-foreground">
                В YClients: Настройки → API → Получите ключ авторизации (Bearer token).
              </p>
              <StepNumber num={2} title="Настройте双向 синхронизацию записей" />
              <CodeBlock
                language="json"
                filename="Пример: создание записи в YClients"
                code={`// Получение списка услуг из YClients
GET https://api.yclients.com/api/v1/services/{company_id}
Authorization: Bearer ycl_token_xxxxx

// Создание записи
POST https://api.yclients.com/api/v1/records/{company_id}
Authorization: Bearer ycl_token_xxxxx
{
  "staff_id": 123,
  "services": [456],
  "datetime": "2025-01-16 10:00",
  "client": {
    "name": "Мария Иванова",
    "phone": "79991234567"
  },
  "comment": "Запись через AI-ассистент"
}`}
              />
              <Callout type="tip">
                <strong>Совет:</strong> Синхронизируйте расписание сотрудников из YClients с ботом, чтобы клиент видел только доступные слоты.
              </Callout>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Website Tab */}
        <TabsContent value="website" className="space-y-6">
          {/* WordPress */}
          <Card>
            <CardHeader>
              <CardTitle>WordPress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StepNumber num={1} title="Установите код виджета" />
              <p className="ml-11 text-sm text-muted-foreground">Перейдите в Внешний вид → Редактор тем → header.php (или footer.php). Вставьте код перед <code className="rounded bg-muted px-1 text-xs">&lt;/body&gt;</code></p>
              <CodeBlock
                language="html"
                filename="functions.php или плагин"
                code={`// Добавьте в functions.php вашей темы WordPress
function agentbot_widget() {
    ?>
    <script>
      (function(w,d,s,o){
        var j=d.createElement(s);j.async=true;
        j.src='https://widget.agentbot.ru/v1/loader.js';
        j.setAttribute('data-code','ВАШ_КОД_ВНЕДРЕНИЯ');
        d.head.appendChild(j);
      })(window,document,'script');
    </script>
    <?php
}
add_action('wp_footer', 'agentbot_widget');`}
              />
              <StepNumber num={2} title="Альтернатива: через плагин" />
              <p className="ml-11 text-sm text-muted-foreground">Установите плагин «Insert Headers and Footers» и добавьте код виджета в раздел Footer Scripts.</p>
            </CardContent>
          </Card>

          {/* Tilda */}
          <Card>
            <CardHeader>
              <CardTitle>Tilda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StepNumber num={1} title="Добавьте код в настройки сайта" />
              <p className="ml-11 text-sm text-muted-foreground">
                Перейдите в Настройки сайта → Ещё → Код в &lt;head&gt; или &lt;body&gt;. Вставьте код виджета.
              </p>
              <CodeBlock
                language="html"
                code={`<!-- Вставьте в «Код в <body>» в настройках Tilda -->
<script>
  (function(w,d,s,o){
    var j=d.createElement(s);j.async=true;
    j.src='https://widget.agentbot.ru/v1/loader.js';
    j.setAttribute('data-code','ВАШ_КОД_ВНЕДРЕНИЯ');
    d.head.appendChild(j);
  })(window,document,'script');
</script>`}
              />
              <Callout type="tip">
                <strong>Совет:</strong> Если вы используете несколько проектов Tilda, добавьте код в каждый проект отдельно.
              </Callout>
            </CardContent>
          </Card>

          {/* Shopify */}
          <Card>
            <CardHeader>
              <CardTitle>Shopify</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StepNumber num={1} title="Добавьте код в тему Shopify" />
              <p className="ml-11 text-sm text-muted-foreground">
                Перейдите в Интернет-магазин → Темы → Действие → Изменить код → theme.liquid → вставьте код перед <code className="rounded bg-muted px-1 text-xs">&lt;/body&gt;</code>
              </p>
              <StepNumber num={2} title="Альтернатива: через раздел настроек" />
              <p className="ml-11 text-sm text-muted-foreground">
                Интернет-магазин → Настройки → Пользовательские скрипты → добавьте код в «Дополнительные скрипты».
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other Tab */}
        <TabsContent value="other" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Server className="size-5" /> Custom Backend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Если у вас собственный бекенд (Node.js, Python, PHP), интеграция выполняется через REST API.
              </p>
              <CodeBlock
                language="python"
                filename="Python / Flask — пример обработчика вебхука"
                code={`from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/webhook/agentbot', methods=['POST'])
def handle_agentbot_event():
    data = request.json
    event = data.get('event')
    
    if event == 'appointment.created':
        visitor = data['data']
        # Создать запись в вашей системе
        create_booking(
            name=visitor['visitorName'],
            phone=visitor['visitorPhone'],
            service=visitor['service'],
            date=visitor['date']
        )
    elif event == 'message.received':
        # Переслать сообщение в CRM
        forward_to_crm(data['data'])
    
    return jsonify({"success": True}), 200

if __name__ == '__main__':
    app.run(port=3000)`}
              />
              <CodeBlock
                language="javascript"
                filename="Node.js / Express — пример обработчика вебхука"
                code={`const express = require('express');
const app = express();

app.use(express.json());

app.post('/webhook/agentbot', async (req, res) => {
  const { event, data } = req.body;
  
  switch (event) {
    case 'appointment.created':
      // Создать запись в вашей системе
      await createBooking({
        name: data.visitorName,
        phone: data.visitorPhone,
        service: data.service,
        date: data.date,
      });
      break;
      
    case 'message.received':
      // Переслать в CRM / Telegram-канал оператора
      await forwardMessage(data);
      break;
  }
  
  res.json({ success: true });
});

app.listen(3000, () => console.log('Webhook server running'));`}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Globe className="size-5" /> Telegram Bot API</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Вы можете создать своего Telegram-бота, который будет пересылать уведомления от АгентБот в чат оператора.
              </p>
              <CodeBlock
                language="python"
                filename="Python — пересылка уведомлений в Telegram"
                code={`import requests

TELEGRAM_TOKEN = "your_bot_token"
CHAT_ID = "your_chat_id"

def send_to_telegram(message):
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    payload = {
        "chat_id": CHAT_ID,
        "text": message,
        "parse_mode": "HTML"
    }
    requests.post(url, json=payload)

# При получении вебхука от АгентБот:
def handle_agentbot_event(event, data):
    if event == "appointment.created":
        msg = (
            f"📋 Новая запись!\\n"
            f"👤 {data['visitorName']}\\n"
            f"📞 {data['visitorPhone']}\\n"
            f"💈 {data.get('service', '—')}\\n"
            f"📅 {data['date']}"
        )
        send_to_telegram(msg)`}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// 3. Widget Setup Page
// ──────────────────────────────────────────────────────────────
function WidgetSetupPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/50">
            <LayoutTemplate className="size-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Настройка виджета</h1>
            <p className="text-muted-foreground">Встраивание чат-виджета на любой сайт за минуту</p>
          </div>
        </div>
      </div>

      {/* What is Widget */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Monitor className="size-5" /> Что такое виджет?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Виджет АгентБот — это плавающий чат-окно, которое отображается на вашем сайте и позволяет посетителям общаться
            с вашим AI-ботом в реальном времени. Виджет поддерживает запись на услуги, ответы на вопросы и сбор контактных данных.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                <Zap className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div><strong>Быстрая загрузка</strong><br />Асинхронная загрузка без задержки страницы</div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
                <Palette className="size-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div><strong>Кастомизация</strong><br />Цвета, позиция, заголовок, аватар</div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900/50">
                <Smartphone className="size-4 text-sky-600 dark:text-sky-400" />
              </div>
              <div><strong>Адаптивный</strong><br />Работает на мобильных и десктопе</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step by Step */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings className="size-5" /> Пошаговая установка</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <StepNumber num={1} title="Получите код внедрения" />
          <p className="ml-11 text-sm text-muted-foreground">
            После создания бота в личном кабинете, перейдите в раздел <strong>Мои боты</strong>, нажмите на нужного бота
            и скопируйте код внедрения. Код выглядит так:
          </p>
          <div className="ml-11">
            <CodeBlock
              language="html"
              filename="Код виджета АгентБот"
              code={`<script>
  (function(w,d,s,o){
    var j=d.createElement(s);j.async=true;
    j.src='https://widget.agentbot.ru/v1/loader.js';
    j.setAttribute('data-code','ABCD1234EFGH5678');
    d.head.appendChild(j);
  })(window,document,'script');
</script>`}
            />
          </div>

          <Callout type="info">
            <strong>Код внедрения</strong> уникален для каждого бота. Не используйте чужие коды — они не будут работать на вашем домене.
          </Callout>

          <StepNumber num={2} title="Добавьте код на ваш сайт" />
          <p className="ml-11 text-sm text-muted-foreground">
            Вставьте скопированный код перед закрывающим тегом <code className="rounded bg-muted px-1 text-xs">&lt;/body&gt;</code> на всех страницах вашего сайта.
          </p>
          <div className="ml-11">
            <CodeBlock
              language="html"
              filename="Пример: HTML-страница с виджетом"
              code={`<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Мой сайт</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Добро пожаловать!</h1>
  <p>Содержимое вашего сайта...</p>

  <!-- Код виджета АгентБот — вставьте перед </body> -->
  <script>
    (function(w,d,s,o){
      var j=d.createElement(s);j.async=true;
      j.src='https://widget.agentbot.ru/v1/loader.js';
      j.setAttribute('data-code','ABCD1234EFGH5678');
      d.head.appendChild(j);
    })(window,document,'script');
  </script>
</body>
</html>`}
            />
          </div>

          <StepNumber num={3} title="Проверьте работу виджета" />
          <p className="ml-11 text-sm text-muted-foreground">
            Откройте ваш сайт в браузере. В правом нижнем углу появится иконка чата. Нажмите на неё — откроется окно виджета с приветственным сообщением бота.
          </p>

          <Callout type="tip">
            <strong>Совет:</strong> Если виджет не отображается, проверьте: (1) код вставлен корректно, (2) бот активен в личном кабинете, (3) нет блокировок со стороны Content Security Policy.
          </Callout>
        </CardContent>
      </Card>

      {/* Customization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette className="size-5" /> Настройка внешнего вида</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Настройте внешний вид виджета в личном кабинете: раздел <strong>Мои боты → Настройки бота → Внешний вид</strong>.
          </p>

          <div className="space-y-3">
            <div className="rounded-lg border bg-card p-4">
              <h4 className="mb-2 font-semibold text-sm">Цветовая схема</h4>
              <p className="text-sm text-muted-foreground">Выберите основной цвет виджета, который будет соответствовать вашему бренду. Цвет применяется к кнопкам, заголовку и активным элементам.</p>
              <CodeBlock
                language="html"
                filename="Настройка цвета через data-атрибуты"
                code={`<script>
  var config = {
    code: 'ABCD1234EFGH5678',
    color: '#10b981',        // Основной цвет
    position: 'right',       // Позиция: right или left
    title: 'Онлайн-помощник', // Заголовок чата
    greeting: 'Здравствуйте! Чем могу помочь?',
    avatar: 'https://your-site.com/bot-avatar.png'
  };
  
  (function(w,d,s,o){
    var j=d.createElement(s);j.async=true;
    j.src='https://widget.agentbot.ru/v1/loader.js';
    Object.keys(config).forEach(function(k){ j.setAttribute('data-'+k, config[k]); });
    d.head.appendChild(j);
  })(window,document,'script');
</script>`}
              />
            </div>

            <div className="rounded-lg border bg-card p-4">
              <h4 className="mb-2 font-semibold text-sm">Позиция на странице</h4>
              <p className="text-sm text-muted-foreground">
                Виджет можно разместить в правом (<code className="rounded bg-muted px-1 text-xs">right</code>) или левом (<code className="rounded bg-muted px-1 text-xs">left</code>) нижнем углу. По умолчанию — справа.
              </p>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <h4 className="mb-2 font-semibold text-sm">Приветствие и аватар</h4>
              <p className="text-sm text-muted-foreground">
                Настройте приветственное сообщение и аватар бота в личном кабинете. Аватар отображается в шапке чата и рядом с сообщениями бота.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Zap className="size-5" /> Дополнительные настройки</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="rounded-lg border bg-card p-4">
              <h4 className="mb-2 font-semibold text-sm">Автозапуск через N секунд</h4>
              <CodeBlock
                language="html"
                code={`<script>
  // Автоматически открыть чат через 10 секунд
  var config = {
    code: 'ABCD1234EFGH5678',
    autoOpen: '10'  // секунд до автозапуска
  };
  // ... остальной код загрузчика
</script>`}
              />
            </div>

            <div className="rounded-lg border bg-card p-4">
              <h4 className="mb-2 font-semibold text-sm">Сбор контактных данных</h4>
              <p className="text-sm text-muted-foreground">
                Бот автоматически запрашивает имя, телефон и email посетителя перед началом диалога.
                Контактные данные сохраняются в личном кабинете и передаются через вебхуки.
              </p>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <h4 className="mb-2 font-semibold text-sm">Режим «только на определённых страницах»</h4>
              <CodeBlock
                language="html"
                code={`<!-- Показывать виджет только на страницах /services и /contacts -->
<script>
  var showOnPages = ['/services', '/contacts'];
  if (showOnPages.some(function(p) {
    return window.location.pathname.indexOf(p) !== -1;
  })) {
    var j = document.createElement('script');
    j.async = true;
    j.src = 'https://widget.agentbot.ru/v1/loader.js';
    j.setAttribute('data-code', 'ABCD1234EFGH5678');
    document.head.appendChild(j);
  }
</script>`}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><AlertCircle className="size-5" /> Решение проблем</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-3">
            <div className="rounded-lg border bg-card p-4">
              <h4 className="mb-1 font-semibold text-sm">Виджет не отображается</h4>
              <ol className="ml-4 list-decimal space-y-1 text-sm text-muted-foreground">
                <li>Проверьте, что код скопирован полностью и вставлен перед <code className="rounded bg-muted px-1 text-xs">&lt;/body&gt;</code></li>
                <li>Убедитесь, что бот активен в личном кабинете (Мои боты → статус «Активен»)</li>
                <li>Откройте консоль браузера (F12) и проверьте наличие ошибок</li>
                <li>Убедитесь, что Content Security Policy не блокирует загрузку скрипта</li>
              </ol>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <h4 className="mb-1 font-semibold text-sm">Виджет отображается, но бот не отвечает</h4>
              <ol className="ml-4 list-decimal space-y-1 text-sm text-muted-foreground">
                <li>Проверьте подключение AI-модели в настройках бота</li>
                <li>Убедитесь, что не превышен лимит сообщений по тарифу</li>
                <li>Проверьте сетевую вкладку (F12 → Network) на наличие ошибок запросов</li>
              </ol>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <h4 className="mb-1 font-semibold text-sm">Виджет замедляет загрузку страницы</h4>
              <ol className="ml-4 list-decimal space-y-1 text-sm text-muted-foreground">
                <li>Убедитесь, что скрипт загружается асинхронно (<code className="rounded bg-muted px-1 text-xs">j.async=true</code>)</li>
                <li>Виджет загружается после основной страницы и не блокирует рендеринг</li>
                <li>Используйте Chrome DevTools → Performance для анализа</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// 4. Telegram Setup Page
// ──────────────────────────────────────────────────────────────
function TelegramSetupPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/50">
            <MessageSquare className="size-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Настройка Telegram</h1>
            <p className="text-muted-foreground">Подключите Telegram-бота для общения с клиентами в мессенджере</p>
          </div>
        </div>
      </div>

      {/* What is Telegram Bot */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MessageSquare className="size-5" /> Что такое Telegram-бот?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Telegram-бот АгентБот — это ваш AI-ассистент, доступный прямо в мессенджере Telegram.
            Клиенты могут общаться с ботом, записываться на услуги и получать ответы на вопросы
            без необходимости переходить на ваш сайт.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/50">
                <Send className="size-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div><strong>Мгновенные ответы</strong><br />Бот отвечает за 1-2 секунды 24/7</div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                <Terminal className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div><strong>Единый кабинет</strong><br />Управление из той же панели, что и виджет</div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
                <Layers className="size-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div><strong>Общая база</strong><br />Все диалоги в единой аналитике</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step by Step */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings className="size-5" /> Пошаговая настройка</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <StepNumber num={1} title="Создайте бота через @BotFather" />
          <p className="ml-11 text-sm text-muted-foreground">
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">@BotFather</code> — это официальный бот Telegram для создания и управления ботами.
          </p>
          <div className="ml-11 space-y-2">
            <p className="text-sm text-muted-foreground">Отправьте @BotFather следующие команды:</p>
            <CodeBlock
              language="text"
              filename="Диалог с @BotFather"
              code={`1. Откройте Telegram и найдите @BotFather
2. Отправьте команду: /newbot
3. Введите имя бота: Мой Салон AI
4. Введите username бота: my_salon_ai_bot (должен заканчиваться на _bot)
5. @BotFather ответит с токеном бота:
   ✅ Token: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz`}
            />
          </div>
          <Callout type="warning">
            <strong>Важно:</strong> Сохраните полученный токен в безопасном месте. Он потребуется для подключения бота к АгентБот. Не делитесь токеном с третьими лицами.
          </Callout>

          <StepNumber num={2} title="Настройте бота в @BotFather (опционально)" />
          <p className="ml-11 text-sm text-muted-foreground">
            Улучшите профиль бота, настроив описание и команды:
          </p>
          <div className="ml-11 space-y-2">
            <CodeBlock
              language="text"
              filename="Дополнительные настройки через @BotFather"
              code={`/setdescription — Описание бота (показывается при запуске)
  Пример: "AI-ассистент салона красоты. Запишитесь на услугу за 1 минуту!"

/setabouttext — Краткое описание (показывается в профиле бота)
  Пример: "🤖 AI-помощник салона красоты"

/setuserpic — Установите аватар бота
  Отправьте изображение, которое будет отображаться в качестве аватара

/setcommands — Настройте меню команд
  /start — Запустить бота
  /services — Список услуг
  /book — Записаться
  /contact — Контакты`}
            />
          </div>

          <StepNumber num={3} title="Подключите бота в АгентБот" />
          <p className="ml-11 text-sm text-muted-foreground">
            В личном кабинете АгентБот перейдите в настройки бота и вставьте полученный токен:
          </p>
          <div className="ml-11">
            <CodeBlock
              language="text"
              filename="Настройки в личном кабинете"
              code={`1. Откройте личный кабинет АгентБот
2. Перейдите в раздел "Мои боты"
3. Нажмите на нужного бота → "Настройки"
4. Перейдите в раздел "Каналы" → "Telegram"
5. Вставьте токен бота из @BotFather
6. Нажмите "Сохранить и подключить"`}
            />
          </div>

          <Callout type="tip">
            <strong>Проверка:</strong> После подключения отправьте сообщение вашему боту в Telegram.
            Если всё настроено верно, бот ответит приветственным сообщением.
          </Callout>

          <StepNumber num={4} title="Настройте приветственное сообщение" />
          <p className="ml-11 text-sm text-muted-foreground">
            Настройте приветствие, которое будет отправляться новым пользователям:
          </p>
          <div className="ml-11">
            <CodeBlock
              language="text"
              filename="Пример приветственного сообщения"
              code={`Здравствуйте! 👋 Я AI-ассистент салона красоты "Эстетика".

Чем могу помочь?
💇 Записаться на услугу
📋 Узнать цены и акции
🕐 Уточнить расписание
📍 Узнать адрес и контакты

Просто напишите ваш вопрос!`}
            />
          </div>

          <StepNumber num={5} title="Протестируйте работу бота" />
          <p className="ml-11 text-sm text-muted-foreground">
            Найдите вашего бота в Telegram по username (например, <code className="rounded bg-muted px-1 text-xs">@my_salon_ai_bot</code>)
            и отправьте тестовое сообщение. Убедитесь, что:
          </p>
          <div className="ml-11 space-y-1">
            {[
              'Бот отвечает на сообщения',
              'Приветственное сообщение отправляется автоматически',
              'Кнопки и inline-клавиатура работают корректно',
              'Запись на услуги работает',
              'Контактные данные сохраняются в личном кабинете',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Advanced Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Zap className="size-5" /> Дополнительные возможности</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="rounded-lg border bg-card p-4">
              <h4 className="mb-2 font-semibold text-sm">Inline-кнопки (клавиатура)</h4>
              <p className="mb-2 text-sm text-muted-foreground">
                Настройте кнопки быстрого доступа для часто используемых функций:
              </p>
              <CodeBlock
                language="text"
                code={`Пример меню inline-кнопок:

┌─────────────────────────────┐
│ 💇 Записаться на стрижку     │
│ 💅 Записаться на маникюр     │
│ 📋 Все услуги               │
│ 🕐 Расписание               │
│ 📍 Контакты                 │
│ 👤 Связаться с оператором   │
└─────────────────────────────┘`}
              />
            </div>

            <div className="rounded-lg border bg-card p-4">
              <h4 className="mb-2 font-semibold text-sm">Передача диалога оператору</h4>
              <p className="text-sm text-muted-foreground">
                Если бот не может ответить на вопрос, он может автоматически перевести диалог на живого оператора.
                Оператор получает уведомление и продолжает общение от имени бота в Telegram.
              </p>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <h4 className="mb-2 font-semibold text-sm">Рассылки через Telegram</h4>
              <p className="text-sm text-muted-foreground">
                Отправляйте уведомления клиентам через Telegram: подтверждения записей, напоминания, акции и спецпредложения.
                Настройки рассылок доступны в разделе «Привлечение клиентов» личного кабинета.
              </p>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <h4 className="mb-2 font-semibold text-sm">Мультисайтовая поддержка</h4>
              <p className="text-sm text-muted-foreground">
                Один Telegram-бот может обслуживать несколько сайтов или филиалов.
                Используйте теги и ниши для маршрутизации вопросов в нужного бота.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><AlertCircle className="size-5" /> Решение проблем</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-3">
            <div className="rounded-lg border bg-card p-4">
              <h4 className="mb-1 font-semibold text-sm">Бот не отвечает в Telegram</h4>
              <ol className="ml-4 list-decimal space-y-1 text-sm text-muted-foreground">
                <li>Проверьте, что токен введён корректно в настройках АгентБот</li>
                <li>Убедитесь, что бот не был остановлен через @BotFather</li>
                <li>Проверьте, что webhook установлен правильно (АгентБот делает это автоматически)</li>
                <li>Попробуйте отправить команду <code className="rounded bg-muted px-1 text-xs">/start</code></li>
              </ol>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <h4 className="mb-1 font-semibold text-sm">Ошибка «Bad Gateway» при подключении</h4>
              <ol className="ml-4 list-decimal space-y-1 text-sm text-muted-foreground">
                <li>Убедитесь, что токен действителен (проверьте через @BotFather → /token)</li>
                <li>Возможно, токен был перегенерирован — обновите его в настройках</li>
                <li>Проверьте логи в разделе «Админ-панель → Логи»</li>
              </ol>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <h4 className="mb-1 font-semibold text-sm">Бот отвечает, но с задержкой</h4>
              <ol className="ml-4 list-decimal space-y-1 text-sm text-muted-foreground">
                <li>Задержка обычно 1-3 секунды — это нормальное время обработки AI</li>
                <li>Если задержка более 10 секунд — проверьте лимиты тарифа</li>
                <li>Попробуйте упростить системный промпт бота для более быстрых ответов</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="size-5" /> Безопасность</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-4 text-emerald-500 shrink-0" />
              <span>Все сообщения шифруются Telegram (TLS 1.3)</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-4 text-emerald-500 shrink-0" />
              <span>Токен бота хранится в зашифрованном виде на серверах АгентБот</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-4 text-emerald-500 shrink-0" />
              <span>Контактные данные клиентов не передаются третьим лицам</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-4 text-emerald-500 shrink-0" />
              <span>Журнал всех действий доступен в разделе «Админ-панель → Логи»</span>
            </div>
          </div>
          <Callout type="warning">
            <strong>Важно:</strong> Никогда не публиковайте токен бота в открытых источниках (GitHub, форумы, документация).
            Если токен скомпрометирован — перегенерируйте его через @BotFather (/revoke).
          </Callout>
        </CardContent>
      </Card>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Exported wrapper with overlay navigation
// ──────────────────────────────────────────────────────────────
export type DocPageId = 'api' | 'integration' | 'widget' | 'telegram';

const DOC_PAGES: { id: DocPageId; title: string; icon: React.ElementType; color: string; component: React.FC }[] = [
  { id: 'api', title: 'API документация', icon: Code2, color: 'emerald', component: ApiDocsPage },
  { id: 'integration', title: 'Руководства по интеграции', icon: Plug, color: 'teal', component: IntegrationGuidesPage },
  { id: 'widget', title: 'Настройка виджета', icon: LayoutTemplate, color: 'amber', component: WidgetSetupPage },
  { id: 'telegram', title: 'Настройка Telegram', icon: MessageSquare, color: 'violet', component: TelegramSetupPage },
];

export function DocumentationOverlay({ pageId, onBack }: { pageId: DocPageId; onBack: () => void }) {
  const pageInfo = DOC_PAGES.find((p) => p.id === pageId) || DOC_PAGES[0];
  const PageComponent = pageInfo.component;
  const colors = COLOR_MAP[pageInfo.color];

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBack();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/95 backdrop-blur-sm px-4 py-3 sm:px-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 shrink-0">
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Назад</span>
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <div className={`flex size-8 items-center justify-center rounded-lg ${colors.bg}`}>
          <pageInfo.icon className={`size-4 ${colors.icon}`} />
        </div>
        <h1 className="text-sm font-semibold truncate">{pageInfo.title}</h1>
        <Badge variant="secondary" className="ml-auto shrink-0 hidden sm:inline-flex">Документация</Badge>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
          <PageComponent />
        </div>
      </div>
    </div>
  );
}

const COLOR_MAP: Record<string, { bg: string; icon: string; border: string }> = {
  emerald: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/50',
    icon: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  teal: {
    bg: 'bg-teal-100 dark:bg-teal-900/50',
    icon: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-200 dark:border-teal-800',
  },
  amber: {
    bg: 'bg-amber-100 dark:bg-amber-900/50',
    icon: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
  },
  violet: {
    bg: 'bg-violet-100 dark:bg-violet-900/50',
    icon: 'text-violet-600 dark:text-violet-400',
    border: 'border-violet-200 dark:border-violet-800',
  },
};
