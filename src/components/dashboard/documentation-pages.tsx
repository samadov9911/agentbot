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
import { useAppStore } from '@/stores';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ──────────────────────────────────────────────────────────────
// Shared Code Block Component
// ──────────────────────────────────────────────────────────────
function CodeBlock({ code, lang = 'bash', filename }: { code: string; lang?: string; filename?: string }) {
  const [copied, setCopied] = useState(false);
  const language = useAppStore((s) => s.language);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success(t('doc.shared.copiedToClipboard', language));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      toast.success(t('doc.shared.copiedToClipboard', language));
      setTimeout(() => setCopied(false), 2000);
    }
  }, [code, language]);

  return (
    <div className="group relative my-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-950 dark:border-slate-700">
      {filename && (
        <div className="flex items-center gap-2 border-b border-slate-700 bg-slate-800/50 px-4 py-2">
          <FileJson className="size-3.5 text-slate-400" />
          <span className="text-xs text-slate-400">{filename}</span>
          <Badge variant="secondary" className="ml-auto text-[10px]">{lang}</Badge>
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
  const language = useAppStore((s) => s.language);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/50">
            <Code2 className="size-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('doc.api.title', language)}</h1>
            <p className="text-muted-foreground">{t('doc.api.subtitle', language)}</p>
          </div>
        </div>
      </div>

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Globe className="size-5" /> {t('doc.api.overview', language)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            {t('doc.api.overviewDesc', language)}
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex items-start gap-2">
              <Shield className="mt-0.5 size-4 shrink-0 text-emerald-500" />
              <div><strong>{t('doc.api.auth', language)}</strong><br />{t('doc.api.authDesc', language)}</div>
            </div>
            <div className="flex items-start gap-2">
              <FileJson className="mt-0.5 size-4 shrink-0 text-emerald-500" />
              <div><strong>{t('doc.api.dataFormat', language)}</strong><br />{t('doc.api.dataFormatDesc', language)}</div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="mt-0.5 size-4 shrink-0 text-emerald-500" />
              <div><strong>{t('doc.api.rateLimits', language)}</strong><br />{t('doc.api.rateLimitsDesc', language)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Base URL */}
      <Callout type="info">
        <strong>{t('doc.api.baseUrl', language)}:</strong> <code className="rounded bg-sky-100 px-1.5 py-0.5 dark:bg-sky-900">https://api.agentbot.ru/v1</code> — {t('doc.api.baseUrlDesc', language)}
      </Callout>

      {/* Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Key className="size-5" /> {t('doc.api.authSection', language)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('doc.api.authSectionDesc', language)}
          </p>
          <CodeBlock
            lang="http"
            code={`GET /v1/bots HTTP/1.1
Host: api.agentbot.ru
Authorization: Bearer abk_live_xxxxxxxxxxxxxxxxxxxx
Content-Type: application/json`}
          />
          <h3 className="text-sm font-semibold">{t('doc.api.gettingKey', language)}:</h3>
          <ol className="ml-4 list-decimal space-y-1 text-sm text-muted-foreground">
            <li>{t('doc.api.gettingKeyStep1', language)}</li>
            <li>{t('doc.api.gettingKeyStep2', language)}</li>
            <li>{t('doc.api.gettingKeyStep3', language)}</li>
            <li>{t('doc.api.gettingKeyStep4', language)}</li>
            <li>{t('doc.api.gettingKeyStep5', language)}</li>
          </ol>
          <Callout type="warning">
            <strong>{t('doc.api.important', language)}:</strong> {t('doc.api.authWarning', language)}
          </Callout>
        </CardContent>
      </Card>

      {/* Bots Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bot className="size-5" /> {t('doc.api.botsSection', language)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t('doc.api.botsDesc', language)}</p>
          <div className="space-y-2">
            <EndpointRow method="GET" path="/v1/bots" description={t('doc.api.botsGetAll', language)} />
            <EndpointRow method="GET" path="/v1/bots/:id" description={t('doc.api.botsGetById', language)} />
            <EndpointRow method="POST" path="/v1/bots" description={t('doc.api.botsCreate', language)} />
            <EndpointRow method="PUT" path="/v1/bots/:id" description={t('doc.api.botsUpdate', language)} />
            <EndpointRow method="DELETE" path="/v1/bots/:id" description={t('doc.api.botsDelete', language)} />
          </div>

          <h3 className="pt-2 text-sm font-semibold">{t('doc.api.exampleCreateBot', language)}</h3>
          <CodeBlock
            lang="json"
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
          <h3 className="text-sm font-semibold">{t('doc.api.exampleResponse', language)}</h3>
          <CodeBlock
            lang="json"
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
          <CardTitle className="flex items-center gap-2"><Send className="size-5" /> {t('doc.api.conversationsSection', language)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t('doc.api.conversationsDesc', language)}</p>
          <div className="space-y-2">
            <EndpointRow method="GET" path="/v1/conversations" description={t('doc.api.conversationsGetAll', language)} />
            <EndpointRow method="GET" path="/v1/conversations/:id" description={t('doc.api.conversationsGetById', language)} />
            <EndpointRow method="GET" path="/v1/conversations?botId=:botId" description={t('doc.api.conversationsByBot', language)} />
            <EndpointRow method="POST" path="/v1/conversations/:id/messages" description={t('doc.api.conversationsSendMessage', language)} />
            <EndpointRow method="PATCH" path="/v1/conversations/:id/status" description={t('doc.api.conversationsChangeStatus', language)} />
          </div>

          <h3 className="pt-2 text-sm font-semibold">{t('doc.api.conversationsParams', language)}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 pr-4 font-medium">{t('doc.api.paramHeader', language)}</th>
                  <th className="pb-2 pr-4 font-medium">{t('doc.api.typeHeader', language)}</th>
                  <th className="pb-2 font-medium">{t('doc.api.descHeader', language)}</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b"><td className="py-2 pr-4"><code>botId</code></td><td className="py-2 pr-4">string</td><td className="py-2">{t('doc.api.paramBotId', language)}</td></tr>
                <tr className="border-b"><td className="py-2 pr-4"><code>status</code></td><td className="py-2 pr-4">string</td><td className="py-2">active, closed, archived</td></tr>
                <tr className="border-b"><td className="py-2 pr-4"><code>from</code></td><td className="py-2 pr-4">date</td><td className="py-2">{t('doc.api.paramFrom', language)}</td></tr>
                <tr className="border-b"><td className="py-2 pr-4"><code>to</code></td><td className="py-2 pr-4">date</td><td className="py-2">{t('doc.api.paramTo', language)}</td></tr>
                <tr><td className="py-2 pr-4"><code>limit</code></td><td className="py-2 pr-4">number</td><td className="py-2">{t('doc.api.paramLimit', language)}</td></tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Terminal className="size-5" /> {t('doc.api.appointmentsSection', language)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t('doc.api.appointmentsDesc', language)}</p>
          <div className="space-y-2">
            <EndpointRow method="GET" path="/v1/appointments" description={t('doc.api.appointmentsGetAll', language)} />
            <EndpointRow method="GET" path="/v1/appointments/:id" description={t('doc.api.appointmentsGetById', language)} />
            <EndpointRow method="POST" path="/v1/appointments" description={t('doc.api.appointmentsCreate', language)} />
            <EndpointRow method="PATCH" path="/v1/appointments/:id/status" description={t('doc.api.appointmentsUpdateStatus', language)} />
            <EndpointRow method="DELETE" path="/v1/appointments/:id" description={t('doc.api.appointmentsCancel', language)} />
          </div>
          <h3 className="pt-2 text-sm font-semibold">{t('doc.api.exampleUpdateStatus', language)}</h3>
          <CodeBlock
            lang="json"
            filename="PATCH /v1/appointments/appt_x1y2z3/status"
            code={`{
  "status": "confirmed",
  "notes": "Подтверждено оператором"
}`}
          />
          <Callout type="tip">
            <strong>{t('doc.api.tip', language)}:</strong> {t('doc.api.statusesTip', language)}
          </Callout>
        </CardContent>
      </Card>

      {/* Analytics Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Layers className="size-5" /> {t('doc.api.analyticsSection', language)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t('doc.api.analyticsDesc', language)}</p>
          <div className="space-y-2">
            <EndpointRow method="GET" path="/v1/analytics/overview" description={t('doc.api.analyticsOverview', language)} />
            <EndpointRow method="GET" path="/v1/analytics/daily" description={t('doc.api.analyticsDaily', language)} />
            <EndpointRow method="GET" path="/v1/analytics/bots/:id" description={t('doc.api.analyticsByBot', language)} />
            <EndpointRow method="GET" path="/v1/analytics/export" description={t('doc.api.analyticsExport', language)} />
          </div>
          <h3 className="pt-2 text-sm font-semibold">{t('doc.api.exampleAnalytics', language)}</h3>
          <CodeBlock
            lang="json"
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
          <CardTitle className="flex items-center gap-2"><Webhook className="size-5" /> {t('doc.api.webhooksSection', language)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('doc.api.webhooksDesc', language)}
          </p>
          <div className="space-y-2">
            <EndpointRow method="POST" path="/v1/webhooks" description={t('doc.api.webhooksCreate', language)} />
            <EndpointRow method="GET" path="/v1/webhooks" description={t('doc.api.webhooksGetAll', language)} />
            <EndpointRow method="DELETE" path="/v1/webhooks/:id" description={t('doc.api.webhooksDelete', language)} />
          </div>
          <h3 className="text-sm font-semibold">{t('doc.api.availableEvents', language)}:</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {['conversation.created', 'message.received', 'message.sent', 'appointment.created', 'appointment.status_changed', 'bot.status_changed'].map((event) => (
              <div key={event} className="flex items-center gap-2 rounded-lg border bg-card p-2.5">
                <ChevronRight className="size-3.5 text-emerald-500" />
                <code className="text-xs">{event}</code>
              </div>
            ))}
          </div>
          <CodeBlock
            lang="json"
            filename={t('doc.api.webhookPayloadExample', language)}
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
          <CardTitle className="flex items-center gap-2"><AlertCircle className="size-5" /> {t('doc.api.errorHandling', language)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t('doc.api.errorHandlingDesc', language)}</p>
          <div className="space-y-2">
            <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <Badge className="bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-400">200</Badge>
              <span className="text-sm"><strong>OK</strong> — {t('doc.api.error200', language)}</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <Badge className="bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-400">201</Badge>
              <span className="text-sm"><strong>Created</strong> — {t('doc.api.error201', language)}</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">400</Badge>
              <span className="text-sm"><strong>Bad Request</strong> — {t('doc.api.error400', language)}</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <Badge className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400">401</Badge>
              <span className="text-sm"><strong>Unauthorized</strong> — {t('doc.api.error401', language)}</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <Badge className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400">403</Badge>
              <span className="text-sm"><strong>Forbidden</strong> — {t('doc.api.error403', language)}</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <Badge className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400">404</Badge>
              <span className="text-sm"><strong>Not Found</strong> — {t('doc.api.error404', language)}</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <Badge className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400">429</Badge>
              <span className="text-sm"><strong>Too Many Requests</strong> — {t('doc.api.error429', language)}</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <Badge className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400">500</Badge>
              <span className="text-sm"><strong>Internal Server Error</strong> — {t('doc.api.error500', language)}</span>
            </div>
          </div>
          <h3 className="text-sm font-semibold">{t('doc.api.errorExample', language)}</h3>
          <CodeBlock
            lang="json"
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
  const language = useAppStore((s) => s.language);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-900/50">
            <Plug className="size-6 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('doc.integration.title', language)}</h1>
            <p className="text-muted-foreground">{t('doc.integration.subtitle', language)}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="general">{t('doc.integration.tabGeneral', language)}</TabsTrigger>
          <TabsTrigger value="crm">{t('doc.integration.tabCrm', language)}</TabsTrigger>
          <TabsTrigger value="website">{t('doc.integration.tabWebsite', language)}</TabsTrigger>
          <TabsTrigger value="other">{t('doc.integration.tabOther', language)}</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Database className="size-5" /> {t('doc.integration.howItWorks', language)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                {t('doc.integration.howItWorksDesc', language)}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border bg-card p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Webhook className="size-5 text-emerald-500" />
                    <h3 className="font-semibold">{t('doc.integration.webhooksPush', language)}</h3>
                  </div>
                  <p>{t('doc.integration.webhooksPushDesc', language)}</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Code2 className="size-5 text-emerald-500" />
                    <h3 className="font-semibold">{t('doc.integration.restPull', language)}</h3>
                  </div>
                  <p>{t('doc.integration.restPullDesc', language)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('doc.integration.generalScheme', language)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StepNumber num={1} title={t('doc.integration.step1Title', language)} />
              <p className="ml-11 text-sm text-muted-foreground">{t('doc.integration.step1Desc', language)}</p>
              <StepNumber num={2} title={t('doc.integration.step2Title', language)} />
              <p className="ml-11 text-sm text-muted-foreground">{t('doc.integration.step2Desc', language)}</p>
              <StepNumber num={3} title={t('doc.integration.step3Title', language)} />
              <p className="ml-11 text-sm text-muted-foreground">{t('doc.integration.step3Desc', language)}</p>
              <StepNumber num={4} title={t('doc.integration.step4Title', language)} />
              <p className="ml-11 text-sm text-muted-foreground">{t('doc.integration.step4Desc', language)}</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CRM Tab */}
        <TabsContent value="crm" className="space-y-6">
          {/* AmoCRM */}
          <Card>
            <CardHeader>
              <CardTitle>{t('doc.integration.amocrmTitle', language)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('doc.integration.amocrmDesc', language)}
              </p>
              <StepNumber num={1} title={t('doc.integration.amocrmStep1', language)} />
              <p className="ml-11 text-sm text-muted-foreground">
                {t('doc.integration.amocrmStep1Desc', language)}
              </p>
              <StepNumber num={2} title={t('doc.integration.amocrmStep2', language)} />
              <p className="ml-11 text-sm text-muted-foreground">
                {t('doc.integration.amocrmStep2Desc', language)}
              </p>
              <CodeBlock
                lang="json"
                filename={t('doc.integration.amocrmCodeFilename', language)}
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
              <StepNumber num={3} title={t('doc.integration.amocrmStep3', language)} />
              <p className="ml-11 text-sm text-muted-foreground">
                {t('doc.integration.amocrmStep3Desc', language)}
              </p>
              <Callout type="tip">
                <strong>{t('doc.api.tip', language)}:</strong> {t('doc.integration.amocrmTip', language)}
              </Callout>
            </CardContent>
          </Card>

          {/* Bitrix24 */}
          <Card>
            <CardHeader>
              <CardTitle>{t('doc.integration.bitrixTitle', language)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('doc.integration.bitrixDesc', language)}
              </p>
              <StepNumber num={1} title={t('doc.integration.bitrixStep1', language)} />
              <p className="ml-11 text-sm text-muted-foreground">
                {t('doc.integration.bitrixStep1Desc', language)}
              </p>
              <StepNumber num={2} title={t('doc.integration.bitrixStep2', language)} />
              <CodeBlock
                lang="json"
                filename={t('doc.integration.bitrixCodeFilename', language)}
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
              <StepNumber num={3} title={t('doc.integration.bitrixStep3', language)} />
              <p className="ml-11 text-sm text-muted-foreground">
                {t('doc.integration.bitrixStep3Desc', language)}
              </p>
            </CardContent>
          </Card>

          {/* YClients */}
          <Card>
            <CardHeader>
              <CardTitle>{t('doc.integration.yclientsTitle', language)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('doc.integration.yclientsDesc', language)}
              </p>
              <StepNumber num={1} title={t('doc.integration.yclientsStep1', language)} />
              <p className="ml-11 text-sm text-muted-foreground">
                {t('doc.integration.yclientsStep1Desc', language)}
              </p>
              <StepNumber num={2} title={t('doc.integration.yclientsStep2', language)} />
              <CodeBlock
                lang="json"
                filename={t('doc.integration.yclientsCodeFilename', language)}
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
                <strong>{t('doc.api.tip', language)}:</strong> {t('doc.integration.yclientsTip', language)}
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
              <StepNumber num={1} title={t('doc.integration.wpStep1', language)} />
              <p className="ml-11 text-sm text-muted-foreground">{t('doc.integration.wpStep1Desc', language)}</p>
              <CodeBlock
                lang="html"
                filename={t('doc.integration.wpCodeFilename', language)}
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
              <StepNumber num={2} title={t('doc.integration.wpStep2', language)} />
              <p className="ml-11 text-sm text-muted-foreground">{t('doc.integration.wpStep2Desc', language)}</p>
            </CardContent>
          </Card>

          {/* Tilda */}
          <Card>
            <CardHeader>
              <CardTitle>Tilda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StepNumber num={1} title={t('doc.integration.tildaStep1', language)} />
              <p className="ml-11 text-sm text-muted-foreground">
                {t('doc.integration.tildaStep1Desc', language)}
              </p>
              <CodeBlock
                lang="html"
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
                <strong>{t('doc.api.tip', language)}:</strong> {t('doc.integration.tildaTip', language)}
              </Callout>
            </CardContent>
          </Card>

          {/* Shopify */}
          <Card>
            <CardHeader>
              <CardTitle>Shopify</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StepNumber num={1} title={t('doc.integration.shopifyStep1', language)} />
              <p className="ml-11 text-sm text-muted-foreground">
                {t('doc.integration.shopifyStep1Desc', language)}
              </p>
              <StepNumber num={2} title={t('doc.integration.shopifyStep2', language)} />
              <p className="ml-11 text-sm text-muted-foreground">
                {t('doc.integration.shopifyStep2Desc', language)}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other Tab */}
        <TabsContent value="other" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Server className="size-5" /> {t('doc.integration.customBackend', language)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('doc.integration.customBackendDesc', language)}
              </p>
              <CodeBlock
                lang="python"
                filename={t('doc.integration.pythonWebhookFilename', language)}
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
                lang="javascript"
                filename={t('doc.integration.nodeWebhookFilename', language)}
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
              <CardTitle className="flex items-center gap-2"><Globe className="size-5" /> {t('doc.integration.telegramBotApi', language)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('doc.integration.telegramRelayDesc', language)}
              </p>
              <CodeBlock
                lang="python"
                filename={t('doc.integration.telegramRelayFilename', language)}
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
  const language = useAppStore((s) => s.language);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/50">
            <LayoutTemplate className="size-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('doc.widget.title', language)}</h1>
            <p className="text-muted-foreground">{t('doc.widget.subtitle', language)}</p>
          </div>
        </div>
      </div>

      {/* What is Widget */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Monitor className="size-5" /> {t('doc.widget.whatIsWidget', language)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            {t('doc.widget.whatIsWidgetDesc', language)}
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                <Zap className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div><strong>{t('doc.widget.fastLoading', language)}</strong><br />{t('doc.widget.fastLoadingDesc', language)}</div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
                <Palette className="size-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div><strong>{t('doc.widget.customization', language)}</strong><br />{t('doc.widget.customizationDesc', language)}</div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900/50">
                <Smartphone className="size-4 text-sky-600 dark:text-sky-400" />
              </div>
              <div><strong>{t('doc.widget.responsive', language)}</strong><br />{t('doc.widget.responsiveDesc', language)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step by Step */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings className="size-5" /> {t('doc.widget.stepByStep', language)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <StepNumber num={1} title={t('doc.widget.step1Title', language)} />
          <p className="ml-11 text-sm text-muted-foreground">
            {t('doc.widget.step1Desc', language)}
          </p>
          <div className="ml-11">
            <CodeBlock
              lang="html"
              filename={t('doc.widget.widgetCodeFilename', language)}
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
            <strong>{t('doc.widget.embedCodeLabel', language)}</strong> {t('doc.widget.embedCodeNote', language)}
          </Callout>

          <StepNumber num={2} title={t('doc.widget.step2Title', language)} />
          <p className="ml-11 text-sm text-muted-foreground">
            {t('doc.widget.step2Desc', language)}
          </p>
          <div className="ml-11">
            <CodeBlock
              lang="html"
              filename={t('doc.widget.htmlPageFilename', language)}
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

          <StepNumber num={3} title={t('doc.widget.step3Title', language)} />
          <p className="ml-11 text-sm text-muted-foreground">
            {t('doc.widget.step3Desc', language)}
          </p>

          <Callout type="tip">
            <strong>{t('doc.api.tip', language)}:</strong> {t('doc.widget.step3Tip', language)}
          </Callout>
        </CardContent>
      </Card>

      {/* Customization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette className="size-5" /> {t('doc.widget.appearance', language)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('doc.widget.appearanceDesc', language)}
          </p>

          <div className="space-y-3">
            <div className="rounded-lg border bg-card p-4">
              <h4 className="mb-2 font-semibold text-sm">{t('doc.widget.colorScheme', language)}</h4>
              <p className="text-sm text-muted-foreground">{t('doc.widget.colorSchemeDesc', language)}</p>
              <CodeBlock
                lang="html"
                filename={t('doc.widget.colorConfigFilename', language)}
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
              <h4 className="mb-2 font-semibold text-sm">{t('doc.widget.position', language)}</h4>
              <p className="text-sm text-muted-foreground">
                {t('doc.widget.positionDesc', language)}
              </p>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <h4 className="mb-2 font-semibold text-sm">{t('doc.widget.greetingAvatar', language)}</h4>
              <p className="text-sm text-muted-foreground">
                {t('doc.widget.greetingAvatarDesc', language)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Zap className="size-5" /> {t('doc.widget.advanced', language)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="rounded-lg border bg-card p-4">
              <h4 className="mb-2 font-semibold text-sm">{t('doc.widget.autoOpen', language)}</h4>
              <CodeBlock
                lang="html"
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
              <h4 className="mb-2 font-semibold text-sm">{t('doc.widget.contactCollection', language)}</h4>
              <p className="text-sm text-muted-foreground">
                {t('doc.widget.contactCollectionDesc', language)}
              </p>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <h4 className="mb-2 font-semibold text-sm">{t('doc.widget.pageFiltering', language)}</h4>
              <CodeBlock
                lang="html"
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
          <CardTitle className="flex items-center gap-2"><AlertCircle className="size-5" /> {t('doc.widget.troubleshooting', language)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-3">
            <div className="rounded-lg border bg-card p-4">
              <h4 className="mb-1 font-semibold text-sm">{t('doc.widget.troubleNotVisible', language)}</h4>
              <ol className="ml-4 list-decimal space-y-1 text-sm text-muted-foreground">
                <li>{t('doc.widget.troubleNotVisible1', language)}</li>
                <li>{t('doc.widget.troubleNotVisible2', language)}</li>
                <li>{t('doc.widget.troubleNotVisible3', language)}</li>
                <li>{t('doc.widget.troubleNotVisible4', language)}</li>
              </ol>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <h4 className="mb-1 font-semibold text-sm">{t('doc.widget.troubleNoReply', language)}</h4>
              <ol className="ml-4 list-decimal space-y-1 text-sm text-muted-foreground">
                <li>{t('doc.widget.troubleNoReply1', language)}</li>
                <li>{t('doc.widget.troubleNoReply2', language)}</li>
                <li>{t('doc.widget.troubleNoReply3', language)}</li>
              </ol>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <h4 className="mb-1 font-semibold text-sm">{t('doc.widget.troubleSlowPage', language)}</h4>
              <ol className="ml-4 list-decimal space-y-1 text-sm text-muted-foreground">
                <li>{t('doc.widget.troubleSlowPage1', language)}</li>
                <li>{t('doc.widget.troubleSlowPage2', language)}</li>
                <li>{t('doc.widget.troubleSlowPage3', language)}</li>
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
  const language = useAppStore((s) => s.language);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/50">
            <MessageSquare className="size-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('doc.telegram.title', language)}</h1>
            <p className="text-muted-foreground">{t('doc.telegram.subtitle', language)}</p>
          </div>
        </div>
      </div>

      {/* What is Telegram Bot */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MessageSquare className="size-5" /> {t('doc.telegram.whatIsBot', language)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            {t('doc.telegram.whatIsBotDesc', language)}
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/50">
                <Send className="size-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div><strong>{t('doc.telegram.instantReplies', language)}</strong><br />{t('doc.telegram.instantRepliesDesc', language)}</div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                <Terminal className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div><strong>{t('doc.telegram.singleDashboard', language)}</strong><br />{t('doc.telegram.singleDashboardDesc', language)}</div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
                <Layers className="size-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div><strong>{t('doc.telegram.unifiedBase', language)}</strong><br />{t('doc.telegram.unifiedBaseDesc', language)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step by Step */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings className="size-5" /> {t('doc.telegram.stepByStep', language)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <StepNumber num={1} title={t('doc.telegram.step1Title', language)} />
          <p className="ml-11 text-sm text-muted-foreground">
            {t('doc.telegram.step1Desc', language)}
          </p>
          <div className="ml-11 space-y-2">
            <p className="text-sm text-muted-foreground">{t('doc.telegram.step1SendCommands', language)}</p>
            <CodeBlock
              lang="text"
              filename={t('doc.telegram.botfatherDialog', language)}
              code={`1. Откройте Telegram и найдите @BotFather
2. Отправьте команду: /newbot
3. Введите имя бота: Мой Салон AI
4. Введите username бота: my_salon_ai_bot (должен заканчиваться на _bot)
5. @BotFather ответит с токеном бота:
   ✅ Token: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz`}
            />
          </div>
          <Callout type="warning">
            <strong>{t('doc.api.important', language)}:</strong> {t('doc.telegram.step1Warning', language)}
          </Callout>

          <StepNumber num={2} title={t('doc.telegram.step2Title', language)} />
          <p className="ml-11 text-sm text-muted-foreground">
            {t('doc.telegram.step2Desc', language)}
          </p>
          <div className="ml-11 space-y-2">
            <CodeBlock
              lang="text"
              filename={t('doc.telegram.botfatherExtraSettings', language)}
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

          <StepNumber num={3} title={t('doc.telegram.step3Title', language)} />
          <p className="ml-11 text-sm text-muted-foreground">
            {t('doc.telegram.step3Desc', language)}
          </p>
          <div className="ml-11">
            <CodeBlock
              lang="text"
              filename={t('doc.telegram.dashboardSettings', language)}
              code={`1. Откройте личный кабинет АгентБот
2. Перейдите в раздел "Мои боты"
3. Нажмите на нужного бота → "Настройки"
4. Перейдите в раздел "Каналы" → "Telegram"
5. Вставьте токен бота из @BotFather
6. Нажмите "Сохранить и подключить"`}
            />
          </div>

          <Callout type="tip">
            <strong>{t('doc.telegram.checkLabel', language)}:</strong> {t('doc.telegram.step3Tip', language)}
          </Callout>

          <StepNumber num={4} title={t('doc.telegram.step4Title', language)} />
          <p className="ml-11 text-sm text-muted-foreground">
            {t('doc.telegram.step4Desc', language)}
          </p>
          <div className="ml-11">
            <CodeBlock
              lang="text"
              filename={t('doc.telegram.welcomeMessageExample', language)}
              code={`Здравствуйте! 👋 Я AI-ассистент салона красоты "Эстетика".

Чем могу помочь?
💇 Записаться на услугу
📋 Узнать цены и акции
🕐 Уточнить расписание
📍 Узнать адрес и контакты

Просто напишите ваш вопрос!`}
            />
          </div>

          <StepNumber num={5} title={t('doc.telegram.step5Title', language)} />
          <p className="ml-11 text-sm text-muted-foreground">
            {t('doc.telegram.step5Desc', language)}
          </p>
          <div className="ml-11 space-y-1">
            {[
              t('doc.telegram.check1', language),
              t('doc.telegram.check2', language),
              t('doc.telegram.check3', language),
              t('doc.telegram.check4', language),
              t('doc.telegram.check5', language),
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
          <CardTitle className="flex items-center gap-2"><Zap className="size-5" /> {t('doc.telegram.advancedFeatures', language)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="rounded-lg border bg-card p-4">
              <h4 className="mb-2 font-semibold text-sm">{t('doc.telegram.inlineButtons', language)}</h4>
              <p className="mb-2 text-sm text-muted-foreground">
                {t('doc.telegram.inlineButtonsDesc', language)}
              </p>
              <CodeBlock
                lang="text"
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
              <h4 className="mb-2 font-semibold text-sm">{t('doc.telegram.operatorTransfer', language)}</h4>
              <p className="text-sm text-muted-foreground">
                {t('doc.telegram.operatorTransferDesc', language)}
              </p>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <h4 className="mb-2 font-semibold text-sm">{t('doc.telegram.broadcasts', language)}</h4>
              <p className="text-sm text-muted-foreground">
                {t('doc.telegram.broadcastsDesc', language)}
              </p>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <h4 className="mb-2 font-semibold text-sm">{t('doc.telegram.multisite', language)}</h4>
              <p className="text-sm text-muted-foreground">
                {t('doc.telegram.multisiteDesc', language)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><AlertCircle className="size-5" /> {t('doc.telegram.troubleshooting', language)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-3">
            <div className="rounded-lg border bg-card p-4">
              <h4 className="mb-1 font-semibold text-sm">{t('doc.telegram.troubleNoReply', language)}</h4>
              <ol className="ml-4 list-decimal space-y-1 text-sm text-muted-foreground">
                <li>{t('doc.telegram.troubleNoReply1', language)}</li>
                <li>{t('doc.telegram.troubleNoReply2', language)}</li>
                <li>{t('doc.telegram.troubleNoReply3', language)}</li>
                <li>{t('doc.telegram.troubleNoReply4', language)}</li>
              </ol>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <h4 className="mb-1 font-semibold text-sm">{t('doc.telegram.troubleBadGateway', language)}</h4>
              <ol className="ml-4 list-decimal space-y-1 text-sm text-muted-foreground">
                <li>{t('doc.telegram.troubleBadGateway1', language)}</li>
                <li>{t('doc.telegram.troubleBadGateway2', language)}</li>
                <li>{t('doc.telegram.troubleBadGateway3', language)}</li>
              </ol>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <h4 className="mb-1 font-semibold text-sm">{t('doc.telegram.troubleDelay', language)}</h4>
              <ol className="ml-4 list-decimal space-y-1 text-sm text-muted-foreground">
                <li>{t('doc.telegram.troubleDelay1', language)}</li>
                <li>{t('doc.telegram.troubleDelay2', language)}</li>
                <li>{t('doc.telegram.troubleDelay3', language)}</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="size-5" /> {t('doc.telegram.security', language)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-4 text-emerald-500 shrink-0" />
              <span>{t('doc.telegram.security1', language)}</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-4 text-emerald-500 shrink-0" />
              <span>{t('doc.telegram.security2', language)}</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-4 text-emerald-500 shrink-0" />
              <span>{t('doc.telegram.security3', language)}</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-4 text-emerald-500 shrink-0" />
              <span>{t('doc.telegram.security4', language)}</span>
            </div>
          </div>
          <Callout type="warning">
            <strong>{t('doc.api.important', language)}:</strong> {t('doc.telegram.securityWarning', language)}
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

const DOC_PAGES: { id: DocPageId; titleKey: string; icon: React.ElementType; color: string; component: React.FC }[] = [
  { id: 'api', titleKey: 'doc.shared.apiDocs', icon: Code2, color: 'emerald', component: ApiDocsPage },
  { id: 'integration', titleKey: 'doc.shared.integrationGuides', icon: Plug, color: 'teal', component: IntegrationGuidesPage },
  { id: 'widget', titleKey: 'doc.shared.widgetSetup', icon: LayoutTemplate, color: 'amber', component: WidgetSetupPage },
  { id: 'telegram', titleKey: 'doc.shared.telegramSetup', icon: MessageSquare, color: 'violet', component: TelegramSetupPage },
];

export function DocumentationOverlay({ pageId, onBack }: { pageId: DocPageId; onBack: () => void }) {
  const pageInfo = DOC_PAGES.find((p) => p.id === pageId) || DOC_PAGES[0];
  const PageComponent = pageInfo.component;
  const colors = COLOR_MAP[pageInfo.color];
  const language = useAppStore((s) => s.language);

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
          <span className="hidden sm:inline">{t('doc.shared.back', language)}</span>
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <div className={`flex size-8 items-center justify-center rounded-lg ${colors.bg}`}>
          <pageInfo.icon className={`size-4 ${colors.icon}`} />
        </div>
        <h1 className="text-sm font-semibold truncate">{t(pageInfo.titleKey, language)}</h1>
        <Badge variant="secondary" className="ml-auto shrink-0 hidden sm:inline-flex">{t('doc.shared.documentation', language)}</Badge>
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
