'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bot,
  Plus,
  MessageSquare,
  Pencil,
  Code2,
  Trash2,
  Copy,
  Check,
  Scissors,
  Heart,
  UtensilsCrossed,
  Building2,
  GraduationCap,
  Dumbbell,
  Briefcase,
  ShoppingCart,
  Sparkles,
  CircleDot,
  MoreHorizontal,
  ExternalLink,
  Search,
  Loader2,
  Save,
  Info,
  Globe,
  Layout,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuthStore, useAppStore } from '@/stores';
import { t } from '@/lib/i18n';
import type { Bot } from '@/types';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ──────────────────────────────────────────────────────────────
// Niche icon & color mapping
// ──────────────────────────────────────────────────────────────

const NICHE_CONFIG: Record<
  string,
  { icon: React.ElementType; bg: string; text: string }
> = {
  salon: {
    icon: Scissors,
    bg: 'bg-pink-100 dark:bg-pink-950',
    text: 'text-pink-600 dark:text-pink-400',
  },
  medical: {
    icon: Heart,
    bg: 'bg-red-100 dark:bg-red-950',
    text: 'text-red-600 dark:text-red-400',
  },
  restaurant: {
    icon: UtensilsCrossed,
    bg: 'bg-orange-100 dark:bg-orange-950',
    text: 'text-orange-600 dark:text-orange-400',
  },
  realEstate: {
    icon: Building2,
    bg: 'bg-teal-100 dark:bg-teal-950',
    text: 'text-teal-600 dark:text-teal-400',
  },
  education: {
    icon: GraduationCap,
    bg: 'bg-sky-100 dark:bg-sky-950',
    text: 'text-sky-600 dark:text-sky-400',
  },
  fitness: {
    icon: Dumbbell,
    bg: 'bg-violet-100 dark:bg-violet-950',
    text: 'text-violet-600 dark:text-violet-400',
  },
  consulting: {
    icon: Briefcase,
    bg: 'bg-amber-100 dark:bg-amber-950',
    text: 'text-amber-600 dark:text-amber-400',
  },
  ecommerce: {
    icon: ShoppingCart,
    bg: 'bg-emerald-100 dark:bg-emerald-950',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
};

const DEFAULT_NICHE_CONFIG = {
  icon: CircleDot,
  bg: 'bg-slate-100 dark:bg-slate-800',
  text: 'text-slate-600 dark:text-slate-400',
};

function getNicheConfig(niche: string | null | undefined) {
  if (!niche) return DEFAULT_NICHE_CONFIG;
  return NICHE_CONFIG[niche] ?? DEFAULT_NICHE_CONFIG;
}

// ──────────────────────────────────────────────────────────────
// Bot type badge config
// ──────────────────────────────────────────────────────────────

function getTypeBadge(type: Bot['type']) {
  switch (type) {
    case 'ai':
      return {
        label: 'AI',
        className:
          'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
      };
    case 'rule-based':
      return {
        label: 'Rule',
        className:
          'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800',
      };
    case 'hybrid':
      return {
        label: 'Hybrid',
        className:
          'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800',
      };
    default:
      return {
        label: type,
        className: '',
      };
  }
}

// ──────────────────────────────────────────────────────────────
// Bot status helpers
// ──────────────────────────────────────────────────────────────

function getBotStatus(
  bot: Pick<Bot, 'isActive' | 'publishedAt'>
): {
  key: 'published' | 'draft' | 'disabled';
  dotClass: string;
  label: string;
} {
  if (bot.isActive && bot.publishedAt) {
    return {
      key: 'published',
      dotClass: 'bg-emerald-500',
      label: 'bots.published',
    };
  }
  if (!bot.isActive && bot.publishedAt) {
    return {
      key: 'disabled',
      dotClass: 'bg-red-500',
      label: 'bots.disabled',
    };
  }
  return {
    key: 'draft',
    dotClass: 'bg-amber-500',
    label: 'bots.draft',
  };
}

// ──────────────────────────────────────────────────────────────
// Skeleton loaders
// ──────────────────────────────────────────────────────────────

function BotCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Skeleton className="size-12 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2.5">
            <Skeleton className="h-5 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="size-8 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

function BotsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <BotCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Empty State
// ──────────────────────────────────────────────────────────────

function EmptyState({
  language,
  onCreateBot,
}: {
  language: 'ru' | 'en' | 'tr';
  onCreateBot: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col items-center justify-center gap-5 px-6 py-16 text-center">
        <div className="relative">
          <div className="flex size-20 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950">
            <Bot className="size-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
            <Sparkles className="size-3.5 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-semibold">
            {t('bots.noBots', language)}
          </h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            {t('dashboard.noBots', language)}
          </p>
        </div>
        <Button
          onClick={onCreateBot}
          className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
        >
          <Plus className="size-4" />
          {t('bots.createNew', language)}
        </Button>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────────────────────────────────────────
// Embed Code Modal
// ──────────────────────────────────────────────────────────────

const WIDGET_BASE_URL = 'https://agentbot-one.vercel.app';

/**
 * Generate the SHORT embed code that customers copy.
 * The actual widget engine loads from /api/widget.js — no huge inline script.
 */
function generateEmbedScript(embedCode: string): string {
  return `<!-- AgentBot Widget -->
<script
  src="${WIDGET_BASE_URL}/api/widget.js?v=2"
  data-bot-id="${embedCode}"
  async>
</script>`;
}

function generateEmbedScriptHtml(embedCode: string): string {
  // Legacy function — no longer needed, kept for compatibility
  return generateEmbedScript(embedCode);
}

/**
 * Format the embed script for display in the code block.
 * Shows a clean, readable version with line-by-line comments.
 * The copied code is identical — just the short <script> tag.
 */
function getFormattedDisplayCode(embedCode: string, language: string): string {
  return `<!-- AgentBot Widget -->
<script
  src="${WIDGET_BASE_URL}/api/widget.js?v=2"
  data-bot-id="${embedCode}"
  async>
</script>`;
}

function EmbedCodeModal({
  open,
  onOpenChange,
  botName,
  embedCode,
  language,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  botName: string;
  embedCode: string;
  language: 'ru' | 'en' | 'tr';
}) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('code');
  const [openInstructions, setOpenInstructions] = useState<Record<string, boolean>>({});

  const scriptTag = useMemo(() => generateEmbedScript(embedCode), [embedCode]);
  const displayCode = useMemo(() => getFormattedDisplayCode(embedCode, language), [embedCode, language]);

  const label = (ru: string, en: string, tr: string) =>
    language === 'ru' ? ru : language === 'en' ? en : tr;

  const toggleInstruction = useCallback((id: string) => {
    setOpenInstructions(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const instructions = [
    {
      id: 'html',
      name: label('HTML / Любой сайт', 'HTML / Any Website', 'HTML / Herhangi Bir Site'),
      icon: Code2,
      summary: label(
        'Вставьте код перед &lt;/body&gt; — это самый простой способ',
        'Paste the code before &lt;/body&gt; — the simplest method',
        'Kodu &lt;/body&gt;\'den önce yapıştırın — en basit yöntem'
      ),
      steps: [
        {
          ru: 'Откройте HTML-файл вашего сайта (обычно <code>index.html</code> или аналогичный).',
          en: 'Open your site\'s HTML file (usually <code>index.html</code> or similar).',
          tr: 'Sitenizin HTML dosyasını açın (genellikle <code>index.html</code> veya benzeri).',
        },
        {
          ru: 'Найдите закрывающий тег <code>&lt;/body&gt;</code> в самом конце файла (обычно одна из последних строк).',
          en: 'Find the <code>&lt;/body&gt;</code> closing tag near the end of the file (usually one of the last lines).',
          tr: 'Dosyanın sonuna doğru <code>&lt;/body&gt;</code> kapanış etiketini bulun (genellikle son satırlardan biri).',
        },
        {
          ru: 'Вставьте скопированный код виджета <b>прямо перед</b> <code>&lt;/body&gt;</code>.',
          en: 'Paste the copied widget code <b>directly before</b> <code>&lt;/body&gt;</code>.',
          tr: 'Kopyalanan widget kodunu <code>&lt;/body&gt;</code> etiketinden <b>hemen önce</b> yapıştırın.',
        },
        {
          ru: 'Сохраните файл и обновите страницу в браузере — виджет появится в правом нижнем углу.',
          en: 'Save the file and refresh the page in your browser — the widget will appear in the bottom-right corner.',
          tr: 'Dosyayı kaydedin ve tarayıcıda sayfayı yenileyin — widget sağ alt köşede görünecektir.',
        },
      ],
    },
    {
      id: 'wordpress',
      name: 'WordPress',
      icon: Globe,
      summary: label(
        'Два способа: через редактор темы или через плагин (рекомендуется)',
        'Two methods: via Theme Editor or via plugin (recommended)',
        'İki yöntem: Tema Düzenleyici veya eklenti (önerilir)'
      ),
      steps: [
        {
          ru: '<b>Способ 1 — Плагин (рекомендуется):</b>',
          en: '<b>Method 1 — Plugin (recommended):</b>',
          tr: '<b>Yöntem 1 — Eklenti (önerilir):</b>',
        },
        {
          ru: 'Установите бесплатный плагин <b>«Insert Headers and Footers»</b> (или «WPCode»).',
          en: 'Install the free <b>«Insert Headers and Footers»</b> plugin (or «WPCode»).',
          tr: '<b>«Insert Headers and Footers»</b> eklentisini (veya «WPCode») ücretsiz kurun.',
        },
        {
          ru: 'Перейдите в <b>Settings → Insert Headers and Footers</b>.',
          en: 'Go to <b>Settings → Insert Headers and Footers</b>.',
          tr: '<b>Ayarlar → Insert Headers and Footers</b> bölümüne gidin.',
        },
        {
          ru: 'Вставьте код в поле <b>«Scripts in Footer»</b> (или «%Footer»).',
          en: 'Paste the code into the <b>«Scripts in Footer»</b> field (or «%Footer»).',
          tr: 'Kodu <b>«Scripts in Footer»</b> alanına yapıştırın (veya «%Footer»).',
        },
        {
          ru: '<b>Способ 2 — Редактор темы:</b> Внешний вид → Редактор тем → <code>footer.php</code> → вставьте перед <code>&lt;/body&gt;</code>.',
          en: '<b>Method 2 — Theme Editor:</b> Appearance → Theme Editor → <code>footer.php</code> → paste before <code>&lt;/body&gt;</code>.',
          tr: '<b>Yöntem 2 — Tema Düzenleyici:</b> Görünüm → Tema Düzenleyici → <code>footer.php</code> → <code>&lt;/body&gt;</code> öncesine yapıştırın.',
        },
      ],
    },
    {
      id: 'shopify',
      name: 'Shopify',
      icon: ShoppingCart,
      summary: label(
        'Вставка через редактор кода темы (theme.liquid)',
        'Insert via theme code editor (theme.liquid)',
        'Tema kod düzenleyicisi aracılığıyla ekleme (theme.liquid)'
      ),
      steps: [
        {
          ru: 'В панели администратора перейдите в <b>Online Store → Themes</b>.',
          en: 'In the admin panel, go to <b>Online Store → Themes</b>.',
          tr: 'Yönetici panelinde <b>Online Store → Themes</b> bölümüne gidin.',
        },
        {
          ru: 'Нажмите <b>Actions → Edit code</b> на вашей текущей теме.',
          en: 'Click <b>Actions → Edit code</b> on your current theme.',
          tr: 'Geçerli temanızda <b>Actions → Edit code</b> düğmesine tıklayın.',
        },
        {
          ru: 'В папке <b>Layout</b> откройте файл <code>theme.liquid</code>.',
          en: 'In the <b>Layout</b> folder, open <code>theme.liquid</code>.',
          tr: '<b>Layout</b> klasöründe <code>theme.liquid</code> dosyasını açın.',
        },
        {
          ru: 'Прокрутите в самый низ и вставьте код <b>перед</b> закрывающим тегом <code>&lt;/body&gt;</code>.',
          en: 'Scroll to the bottom and paste the code <b>before</b> the closing <code>&lt;/body&gt;</code> tag.',
          tr: 'En alta kaydırın ve kodu <code>&lt;/body&gt;</code> kapanış etiketinden <b>önce</b> yapıştırın.',
        },
        {
          ru: 'Нажмите <b>Save</b>. Виджет появится на всех страницах магазина.',
          en: 'Click <b>Save</b>. The widget will appear on all store pages.',
          tr: '<b>Save</b> düğmesine tıklayın. Widget mağazanın tüm sayfalarında görünecektir.',
        },
      ],
    },
    {
      id: 'react',
      name: 'React / Next.js',
      icon: Sparkles,
      summary: label(
        'Создайте отдельный компонент с useEffect для вставки скрипта',
        'Create a separate component with useEffect to inject the script',
        'Script\'i eklemek için useEffect ile ayrı bir bileşen oluşturun'
      ),
      steps: [
        {
          ru: 'Создайте файл <code>AgentBotWidget.tsx</code> (или <code>.js</code>):',
          en: 'Create a file <code>AgentBotWidget.tsx</code> (or <code>.js</code>):',
          tr: '<code>AgentBotWidget.tsx</code> (veya <code>.js</code>) dosyası oluşturun:',
        },
        {
          ru: 'Вставьте в него следующий код:',
          en: 'Paste the following code into it:',
          tr: 'Aşağıdaki kodu yapıştırın:',
        },
        {
          ru: '<pre>useEffect(() =&gt; {\n  const s = document.createElement("script");\n  s.src = "https://agentbot-one.vercel.app/api/widget.js?v=2";\n  s.setAttribute("data-bot-id", "ВАШ_BOT_ID");\n  s.async = true;\n  document.body.appendChild(s);\n}, []);</pre>',
          en: '<pre>useEffect(() =&gt; {\n  const s = document.createElement("script");\n  s.src = "https://agentbot-one.vercel.app/api/widget.js?v=2";\n  s.setAttribute("data-bot-id", "YOUR_BOT_ID");\n  s.async = true;\n  document.body.appendChild(s);\n}, []);</pre>',
          tr: '<pre>useEffect(() =&gt; {\n  const s = document.createElement("script");\n  s.src = "https://agentbot-one.vercel.app/api/widget.js?v=2";\n  s.setAttribute("data-bot-id", "BOT_ID_NIZ");\n  s.async = true;\n  document.body.appendChild(s);\n}, []);</pre>',
        },
        {
          ru: 'Замените <code>ВАШ_BOT_ID</code> на ваш реальный embed-код бота (например, <code>bf_ac7b0b7b-...</code>).',
          en: 'Replace <code>YOUR_BOT_ID</code> with your actual bot embed code (e.g., <code>bf_ac7b0b7b-...</code>).',
          tr: '<code>BOT_ID_NIZ</code> kısmını gerçek bot embed kodunuzla değiştirin (ör. <code>bf_ac7b0b7b-...</code>).',
        },
        {
          ru: 'Добавьте <code>&lt;AgentBotWidget /&gt;</code> в корневой layout (<code>app.tsx</code> или <code>_app.tsx</code>).',
          en: 'Add <code>&lt;AgentBotWidget /&gt;</code> to your root layout (<code>app.tsx</code> or <code>_app.tsx</code>).',
          tr: '<code>&lt;AgentBotWidget /&gt;</code> bileşenini kök layout\'ınıza (<code>app.tsx</code> veya <code>_app.tsx</code>) ekleyin.',
        },
      ],
    },
    {
      id: 'tilda',
      name: 'Tilda',
      icon: Layout,
      summary: label(
        'Вставка через настройки сайта — без доступа к коду',
        'Insert via site settings — no code access needed',
        'Kod erişimi olmadan site ayarları aracılığıyla ekleme'
      ),
      steps: [
        {
          ru: 'Откройте ваш сайт в редакторе Tilda.',
          en: 'Open your site in the Tilda editor.',
          tr: 'Sitenizi Tilda düzenleyicide açın.',
        },
        {
          ru: 'Перейдите в <b>Настройки сайта</b> (значок шестерёнки в левом меню).',
          en: 'Go to <b>Site Settings</b> (gear icon in the left menu).',
          tr: '<b>Site Ayarları</b> bölümüne gidin (sol menüdeki dişli simgesi).',
        },
        {
          ru: 'Перейдите во вкладку <b>Дополнительные теги</b> (или «Ещё» → «HTML-код для вставки в head/body»).',
          en: 'Go to the <b>More</b> tab (or «Ещё» → «HTML-code for head/body»).',
          tr: '<b>Diğer</b> sekmesine gidin (veya «Ещё» → «HTML-code for head/body»).',
        },
        {
          ru: 'Вставьте код в поле <b>«HTML-код в &lt;body&gt;»</b> для всех страниц.',
          en: 'Paste the code in the <b>«HTML in &lt;body&gt;»</b> field for all pages.',
          tr: 'Kodu tüm sayfalar için <b>«HTML in &lt;body&gt;»</b> alanına yapıştırın.',
        },
        {
          ru: 'Нажмите <b>Сохранить</b> и <b>Опубликовать</b>. Виджет будет на всех страницах.',
          en: 'Click <b>Save</b> and <b>Publish</b>. The widget will be on all pages.',
          tr: '<b>Kaydet</b> ve <b>Yayınla</b> düğmelerine tıklayın. Widget tüm sayfalarda olacak.',
        },
      ],
    },
    {
      id: 'messengers',
      name: label('Telegram / WhatsApp', 'Telegram / WhatsApp', 'Telegram / WhatsApp'),
      icon: MessageSquare,
      summary: label(
        'Виджет предназначен для сайтов. Для мессенджеров используйте Telegram Bot API.',
        'The widget is designed for websites. For messengers, use Telegram Bot API.',
        'Widget siteler için tasarlanmıştır. Mesajlaş uygulamaları için Telegram Bot API kullanın.'
      ),
      steps: [
        {
          ru: 'AgentBot виджет работает на <b>любых веб-сайтах</b> — это плавающая кнопка чата в правом нижнем углу.',
          en: 'The AgentBot widget works on <b>any website</b> — it\'s a floating chat button in the bottom-right corner.',
          tr: 'AgentBot widget <b>herhangi bir web sitesinde</b> çalışır — sağ alt köşede kayan bir sohbet düğmesi.',
        },
        {
          ru: '<b>Для Telegram:</b> виджет можно встроить в Telegram Web App через iframe. Напишите нам в поддержку для настройки.',
          en: '<b>For Telegram:</b> the widget can be embedded in Telegram Web App via iframe. Contact support for setup.',
          tr: '<b>Telegram için:</b> widget iframe aracılığıyla Telegram Web App\'e gömülebilir. Kurulum için destek ile iletişime geçin.',
        },
        {
          ru: '<b>Для WhatsApp:</b> в настоящее время WhatsApp не поддерживает встраивание сторонних виджетов. Виджет работает на вашем сайте — клиенты могут писать оттуда.',
          en: '<b>For WhatsApp:</b> WhatsApp currently does not support embedding third-party widgets. The widget works on your site — clients can chat from there.',
          tr: '<b>WhatsApp için:</b> WhatsApp şu anda üçüncü taraf widget gömülmesini desteklemiyor. Widget sitenizde çalışır — müşteriler oradan yazışabilir.',
        },
      ],
    },
  ];

  const handleCopy = useCallback(async () => {
    // Copy the MINIFIED version (the real working code), not the display version
    try {
      await navigator.clipboard.writeText(scriptTag);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = scriptTag;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [scriptTag]);

  useEffect(() => {
    if (!open) {
      setCopied(false);
      setActiveTab('code');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-hidden flex flex-col sm:max-w-2xl">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Code2 className="size-5 text-emerald-600 dark:text-emerald-400" />
            {t('bots.embedCode', language)}
          </DialogTitle>
          <DialogDescription>
            {botName} &mdash;{' '}
            <span className="font-mono text-xs text-muted-foreground">
              {embedCode}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="code" className="flex-1">
              {label('Код виджета', 'Widget Code', 'Widget Kodu')}
            </TabsTrigger>
            <TabsTrigger value="instructions" className="flex-1">
              {label('Инструкции', 'Instructions', 'Talimatlar')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="code" className="mt-3">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {label(
                  'Скопируйте этот код и вставьте на ваш сайт. Виджет появится в правом нижнем углу:',
                  'Copy this code and paste it on your site. The widget will appear in the bottom-right corner:',
                  'Bu kodu kopyalayıp sitenize yapıştırın. Widget sağ alt köşede görünecektir:'
                )}
              </p>
              {/* Code display — formatted and readable */}
              <div className="relative">
                <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg border bg-muted/50 p-4 text-xs leading-relaxed scroll-smooth scrollbar-thin font-mono">
                  <code className="text-foreground">{displayCode}</code>
                </pre>
              </div>
              {/* Info notes */}
              <div className="space-y-2">
                <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950">
                  <Info className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    {label(
                      'Виджет загружается с нашего сервера — обновления работают автоматически, без повторного копирования кода.',
                      'The widget loads from our server — updates work automatically, no need to re-copy the code.',
                      'Widget sunucumuzdan yüklenir — güncellemeler otomatik olarak çalışır, kodu tekrar kopyalamanıza gerek yok.'
                    )}
                  </p>
                </div>
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
                  <MessageSquare className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    {label(
                      'Виджет работает на любых сайтах: обычные сайты, WordPress, Shopify, Tilda, React/Next.js и другие.',
                      'The widget works on any website: plain HTML, WordPress, Shopify, Tilda, React/Next.js, and more.',
                      'Widget herhangi bir sitede çalışır: düz HTML, WordPress, Shopify, Tilda, React/Next.js ve daha fazlası.'
                    )}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="instructions" className="mt-3">
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1 scrollbar-thin">
              {instructions.map((item) => {
                const isOpen = openInstructions[item.id] ?? false;
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    className="rounded-lg border transition-colors"
                  >
                    {/* Header — clickable to toggle */}
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 p-3 text-left hover:bg-muted/50 rounded-lg transition-colors"
                      onClick={() => toggleInstruction(item.id)}
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950">
                        <Icon className="size-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold leading-tight">{item.name}</h4>
                        <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{item.summary}</p>
                      </div>
                      <div className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                        <svg className="size-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                      </div>
                    </button>
                    {/* Expandable steps */}
                    {isOpen && (
                      <div className="border-t px-3 pb-3 pt-2">
                        <ol className="space-y-2.5">
                          {item.steps.map((step, idx) => (
                            <li key={idx} className="flex gap-2">
                              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                                {idx + 1}
                              </span>
                              <span
                                className="text-xs text-foreground leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: step[language] }}
                              />
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        </div>

        <DialogFooter className="flex-col gap-2 shrink-0 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            {t('common.close', language)}
          </Button>
          <Button
            onClick={handleCopy}
            className="w-full bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 sm:w-auto"
          >
            {copied ? (
              <>
                <Check className="size-4" />
                {t('bots.embedCopied', language)}
              </>
            ) : (
              <>
                <Copy className="size-4" />
                {t('bots.copyEmbed', language)}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────────────────────
// Delete Confirmation Dialog
// ──────────────────────────────────────────────────────────────

function DeleteConfirmDialog({
  open,
  onOpenChange,
  botName,
  language,
  onConfirm,
  isDeleting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  botName: string;
  language: 'ru' | 'en' | 'tr';
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="size-5 text-destructive" />
            {t('bots.deleteBot', language)}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('bots.deleteConfirm', language)}
            <span className="mt-1.5 block font-semibold text-foreground">
              &laquo;{botName}&raquo;
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {t('common.cancel', language)}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isDeleting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isDeleting
              ? t('common.loading', language)
              : t('common.delete', language)}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ──────────────────────────────────────────────────────────────
// Edit Bot Dialog
// ──────────────────────────────────────────────────────────────

const NICHE_OPTIONS = [
  'salon',
  'restaurant',
  'education',
  'fitness',
  'realEstate',
  'medical',
  'ecommerce',
  'consulting',
  'other',
];

const STYLE_OPTIONS = [
  { value: 'friendly', ru: 'Дружелюбный', en: 'Friendly', tr: 'Dost canlı' },
  { value: 'professional', ru: 'Профессиональный', en: 'Professional', tr: 'Profesyonel' },
  { value: 'formal', ru: 'Краткий', en: 'Concise', tr: 'Kısa' },
];

function EditBotDialog({
  open,
  onOpenChange,
  bot,
  language,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bot: Bot;
  language: 'ru' | 'en' | 'tr';
  onSave: (updatedBot: Bot) => void;
}) {
  const [name, setName] = useState(bot.name);
  const [niche, setNiche] = useState(bot.niche ?? '');
  const [greeting, setGreeting] = useState(
    typeof bot.config === 'object' && bot.config !== null
      ? (bot.config as Record<string, unknown>).greeting as string
      : ''
  );
  const [style, setStyle] = useState(
    typeof bot.config === 'object' && bot.config !== null
      ? ((bot.config as Record<string, unknown>).tone as string) ?? 'friendly'
      : 'friendly'
  );
  const [isActive, setIsActive] = useState(bot.isActive);
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when bot changes or dialog opens
  useEffect(() => {
    if (open) {
      setName(bot.name);
      setNiche(bot.niche ?? '');
      const cfg =
        typeof bot.config === 'object' && bot.config !== null
          ? (bot.config as Record<string, unknown>)
          : {};
      setGreeting((cfg.greeting as string) ?? '');
      setStyle(((cfg.tone as string) ?? 'friendly'));
      setIsActive(bot.isActive);
      setIsSaving(false);
    }
  }, [open, bot]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(
        language === 'ru'
          ? 'Введите название бота'
          : language === 'en'
            ? 'Please enter a bot name'
            : 'Lütfen bot adını girin'
      );
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/bots', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': useAuthStore.getState().user?.id ?? '' },
        body: JSON.stringify({
          id: bot.id,
          name: name.trim(),
          niche: niche || null,
          greeting,
          style,
          isActive,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as Record<string, string>).error ?? 'Failed to update bot');
      }

      await response.json();
      onSave({
        ...bot,
        name: name.trim(),
        niche: niche || null,
        isActive,
        config: { ...bot.config, greeting, tone: style },
      });
      onOpenChange(false);
      toast.success(
        language === 'ru'
          ? 'Бот успешно обновлён'
          : language === 'en'
            ? 'Bot updated successfully'
            : 'Bot başarıyla güncellendi'
      );
    } catch (err: unknown) {
      toast.error(
        language === 'ru'
          ? 'Ошибка при сохранении'
          : language === 'en'
            ? 'Failed to save'
            : 'Kaydedilemedi'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const label = (ru: string, en: string, tr: string) =>
    language === 'ru' ? ru : language === 'en' ? en : tr;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isSaving) onOpenChange(v); }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="size-5 text-emerald-600 dark:text-emerald-400" />
            {label('Редактировать бота', 'Edit Bot', 'Botu Düzenle')}
          </DialogTitle>
          <DialogDescription>
            {label(
              'Измените настройки вашего AI-агента',
              'Update your AI agent settings',
              'AI ajanınızın ayarlarını güncelleyin'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Bot name */}
          <div className="space-y-2">
            <Label htmlFor="edit-bot-name">
              {label('Название бота', 'Bot name', 'Bot adı')}
            </Label>
            <Input
              id="edit-bot-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={label('Мой бот', 'My Bot', 'Benim Botum')}
            />
          </div>

          {/* Bot niche */}
          <div className="space-y-2">
            <Label>
              {label('Ниша', 'Niche', 'Niş')}
            </Label>
            <Select value={niche} onValueChange={setNiche}>
              <SelectTrigger>
                <SelectValue placeholder={label('Выберите нишу', 'Select niche', 'Niş seçin')} />
              </SelectTrigger>
              <SelectContent>
                {NICHE_OPTIONS.map((n) => (
                  <SelectItem key={n} value={n}>
                    {t(`botBuilder.${n}`, language)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Greeting message - spans full width */}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="edit-bot-greeting">
              {label('Приветственное сообщение', 'Greeting message', 'Karşılama mesajı')}
            </Label>
            <Textarea
              id="edit-bot-greeting"
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              placeholder={label(
                'Привет! Чем могу помочь?',
                'Hello! How can I help you?',
                'Merhaba! Size nasıl yardımcı olabilirim?'
              )}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {label(
                'Первое сообщение, которое отправит бот пользователю',
                'The first message the bot will send to the user',
                'Botun kullanıcıya göndereceği ilk mesaj'
              )}
            </p>
          </div>

          {/* Response style */}
          <div className="space-y-2">
            <Label>
              {label('Стиль ответов', 'Response style', 'Yanıt stili')}
            </Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STYLE_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {label(s.ru, s.en, s.tr)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">
                {label('Активен', 'Active', 'Aktif')}
              </Label>
              <p className="text-xs text-muted-foreground">
                {label(
                  'Бот принимает сообщения',
                  'Bot is accepting messages',
                  'Bot mesaj kabul ediyor'
                )}
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            {label('Отмена', 'Cancel', 'İptal')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 sm:w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {label('Сохранение...', 'Saving...', 'Kaydediliyor...')}
              </>
            ) : (
              <>
                <Save className="size-4" />
                {label('Сохранить', 'Save', 'Kaydet')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────────────────────
// Bot Card
// ──────────────────────────────────────────────────────────────

function BotCard({
  bot,
  language,
  onEdit,
  onEmbed,
  onEditInline,
  onDelete,
}: {
  bot: Bot;
  language: 'ru' | 'en' | 'tr';
  onEdit: () => void;
  onEmbed: () => void;
  onEditInline: () => void;
  onDelete: () => void;
}) {
  const nicheConfig = getNicheConfig(bot.niche);
  const typeBadge = getTypeBadge(bot.type);
  const status = getBotStatus(bot);

  const NicheIcon = nicheConfig.icon;

  const formattedDate = new Date(bot.createdAt).toLocaleDateString(
    language === 'ru' ? 'ru-RU' : language === 'tr' ? 'tr-TR' : 'en-US',
    { day: 'numeric', month: 'short', year: 'numeric' }
  );

  const isActiveStatus = status.key === 'published';
  const isDraft = status.key === 'draft';
  const isDisabled = status.key === 'disabled';

  return (
    <Card
      className={`group relative overflow-hidden transition-all hover:shadow-md ${
        isDraft
          ? 'border-dashed border-muted-foreground/25'
          : isDisabled
            ? 'opacity-75'
            : 'hover:border-emerald-200 dark:hover:border-emerald-800'
      }`}
    >
      {/* Status indicator bar */}
      <div
        className={`absolute inset-x-0 top-0 h-0.5 ${
          isActiveStatus
            ? 'bg-emerald-500'
            : isDraft
              ? 'bg-amber-400'
              : 'bg-red-400'
        }`}
      />

      <CardContent className="p-5">
        {/* ── Header: Avatar + Info ── */}
        <div className="flex items-start gap-4">
          {/* Avatar */}
          {bot.avatar && bot.avatar.startsWith('data:') ? (
            <div className="size-12 shrink-0 overflow-hidden rounded-xl transition-transform group-hover:scale-105">
              <img
                src={bot.avatar}
                alt={bot.name}
                className="size-full object-cover"
              />
            </div>
          ) : (
            <div
              className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${nicheConfig.bg} transition-transform group-hover:scale-105`}
            >
              <NicheIcon className={`size-6 ${nicheConfig.text}`} />
            </div>
          )}

          {/* Name + badges */}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold leading-tight">
              {bot.name}
            </h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Badge
                variant="outline"
                className={`text-[11px] font-medium ${typeBadge.className}`}
              >
                {typeBadge.label}
              </Badge>
              {bot.niche && (
                <Badge variant="secondary" className="text-[11px] font-normal">
                  {t(`botBuilder.${bot.niche}`, language)}
                </Badge>
              )}
            </div>
          </div>

          {/* Status dot */}
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="mt-1 flex items-center gap-1.5 whitespace-nowrap">
                  <span
                    className={`size-2 shrink-0 rounded-full ${status.dotClass} ${
                      isActiveStatus ? 'animate-pulse' : ''
                    }`}
                  />
                  <span className="text-xs text-muted-foreground">
                    {t(status.label, language)}
                  </span>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{t(status.label, language)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* ── Stats row ── */}
        <div className="mt-4 flex items-center gap-4 border-t border-dashed pt-3">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MessageSquare className="size-3.5" />
            <span className="text-xs font-medium tabular-nums">
              {bot.conversationsCount ?? 0}
            </span>
            <span className="text-xs">{t('bots.conversations', language)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <ExternalLink className="size-3.5" />
            <span className="text-xs">{formattedDate}</span>
          </div>
        </div>

        {/* ── Actions row ── */}
        <div className="mt-4 flex items-center gap-2">
          <TooltipProvider delayDuration={300}>
            {/* Edit */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={onEdit}
                >
                  <Pencil className="size-3.5" />
                  <span className="hidden sm:inline">
                    {t('common.edit', language)}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('bots.editBot', language)}</p>
              </TooltipContent>
            </Tooltip>

            {/* Embed code */}
            {bot.embedCode && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    onClick={onEmbed}
                  >
                    <Code2 className="size-3.5" />
                    <span className="hidden sm:inline">
                      {t('bots.embedCode', language)}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('bots.copyEmbed', language)}</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* More menu (Delete) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                >
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="gap-2"
                  onClick={onEditInline}
                >
                  <Pencil className="size-4" />
                  {t('bots.editBot', language)}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 text-destructive focus:text-destructive"
                  onClick={onDelete}
                >
                  <Trash2 className="size-4" />
                  {t('bots.deleteBot', language)}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────────────────────────────────────────
// Main MyBotsPage Component
// ──────────────────────────────────────────────────────────────

export function MyBotsPage() {
  const { user } = useAuthStore();
  const { language, setPage, setSelectedBot } = useAppStore();

  // ── Demo status ──
  const isDemoUser = !!(
    user?.demoExpiresAt &&
    (!user?.planName || user.planName === 'demo' || user.planName === 'none')
  );
  const isDemoExpired = isDemoUser && new Date(user.demoExpiresAt) < new Date();
  const isDemoActive = isDemoUser && !isDemoExpired;

  const [bots, setBots] = useState<Bot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [embedModalOpen, setEmbedModalOpen] = useState(false);
  const [selectedEmbedBot, setSelectedEmbedBot] = useState<Bot | null>(null);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedEditBot, setSelectedEditBot] = useState<Bot | null>(null);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDeleteBot, setSelectedDeleteBot] = useState<Bot | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Fetch bots ──
  useEffect(() => {
    let cancelled = false;

    async function fetchBots() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/bots', {
          headers: { 'x-user-id': user.id },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch bots');
        }

        const data = await response.json();

        if (cancelled) return;

        const botList: Bot[] = (data.bots ?? []).map(
          (b: Record<string, unknown>) => ({
            id: b.id as string,
            userId: (user as { id: string }).id,
            name: b.name as string,
            type: b.type as Bot['type'],
            niche: (b.niche as string) ?? null,
            avatar: (b.avatar as string) ?? null,
            config: (b.config as Bot['config']) ?? {},
            appearance: (b.appearance as Bot['appearance']) ?? {},
            isActive: b.isActive as boolean,
            embedCode: (b.embedCode as string) ?? null,
            publishedAt: b.publishedAt
              ? new Date(b.publishedAt as string)
              : null,
            conversationsCount: (b.conversationsCount as number) ?? 0,
            createdAt: b.createdAt as string,
            updatedAt: b.updatedAt as string,
          })
        );

        setBots(botList);
      } catch {
        // empty list on error
        setBots([]);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchBots();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // ── Filtered bots ──
  const filteredBots = bots.filter((bot) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      bot.name.toLowerCase().includes(q) ||
      bot.type.toLowerCase().includes(q) ||
      (bot.niche?.toLowerCase() ?? '').includes(q)
    );
  });

  // ── Handlers ──
  const handleCreateBot = useCallback(() => {
    setSelectedBot(null);
    setPage('bot-builder');
  }, [setSelectedBot, setPage]);

  const handleEditBot = useCallback(
    (bot: Bot) => {
      setSelectedBot(bot.id);
      setPage('bot-builder');
    },
    [setSelectedBot, setPage]
  );

  const handleEmbedCode = useCallback((bot: Bot) => {
    setSelectedEmbedBot(bot);
    setEmbedModalOpen(true);
  }, []);

  const handleEditInlineBot = useCallback((bot: Bot) => {
    setSelectedEditBot(bot);
    setEditDialogOpen(true);
  }, []);

  const handleEditInlineSave = useCallback((updatedBot: Bot) => {
    setBots((prev) =>
      prev.map((b) => (b.id === updatedBot.id ? updatedBot : b))
    );
  }, []);

  const handleDeleteBot = useCallback((bot: Bot) => {
    setSelectedDeleteBot(bot);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!user?.id || !selectedDeleteBot) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/bots?id=${selectedDeleteBot.id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': user.id },
      });

      if (!response.ok) {
        throw new Error('Failed to delete bot');
      }

      setBots((prev) => prev.filter((b) => b.id !== selectedDeleteBot.id));
      setDeleteDialogOpen(false);
      setSelectedDeleteBot(null);
    } catch {
      // keep dialog open on error so user can retry
    } finally {
      setIsDeleting(false);
    }
  }, [user?.id, selectedDeleteBot]);

  // ── Render ──
  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6">
        {/* ── Header Section ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {t('bots.title', language)}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isLoading
                ? '...'
                : `${bots.length} ${bots.length === 1 ? 'бот' : bots.length < 5 ? 'бота' : 'ботов'}`}
            </p>
            {/* Demo limit info */}
            {isDemoActive && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                <Info className="size-3 shrink-0" />
                {language === 'ru'
                  ? 'Демо: можно создать 1 бота, 1 услугу'
                  : language === 'en'
                    ? 'Demo: 1 bot, 1 service available'
                    : 'Demo: 1 bot, 1 hizmet mevcut'}
                <button
                  onClick={() => setPage('subscription')}
                  className="underline hover:text-amber-700 dark:hover:text-amber-300 ml-0.5"
                >
                  {language === 'ru' ? 'Тарифы' : language === 'en' ? 'Plans' : 'Planlar'}
                </button>
              </p>
            )}
          </div>
          <Button
            onClick={handleCreateBot}
            disabled={isDemoExpired || (isDemoActive && bots.length >= 1)}
            className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 shrink-0"
          >
            <Plus className="size-4" />
            {t('bots.createNew', language)}
          </Button>
        </div>

        {/* ── Search bar ── */}
        {!isLoading && bots.length > 0 && (
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('common.search', language) + '...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9"
            />
          </div>
        )}

        {/* ── Content ── */}
        {isLoading ? (
          <BotsGridSkeleton />
        ) : bots.length === 0 ? (
          <EmptyState language={language} onCreateBot={handleCreateBot} />
        ) : filteredBots.length === 0 ? (
          /* No search results */
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <Search className="size-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {t('common.noData', language)}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredBots.map((bot) => (
              <BotCard
                key={bot.id}
                bot={bot}
                language={language}
                onEdit={() => handleEditBot(bot)}
                onEmbed={() => handleEmbedCode(bot)}
                onEditInline={() => handleEditInlineBot(bot)}
                onDelete={() => handleDeleteBot(bot)}
              />
            ))}
          </div>
        )}

        {/* ── Embed Code Modal ── */}
        {selectedEmbedBot && (
          <EmbedCodeModal
            open={embedModalOpen}
            onOpenChange={setEmbedModalOpen}
            botName={selectedEmbedBot.name}
            embedCode={selectedEmbedBot.embedCode ?? ''}
            language={language}
          />
        )}

        {/* ── Edit Bot Dialog ── */}
        {selectedEditBot && (
          <EditBotDialog
            open={editDialogOpen}
            onOpenChange={(open) => {
              setEditDialogOpen(open);
              if (!open) setSelectedEditBot(null);
            }}
            bot={selectedEditBot}
            language={language}
            onSave={handleEditInlineSave}
          />
        )}

        {/* ── Delete Confirmation Dialog ── */}
        {selectedDeleteBot && (
          <DeleteConfirmDialog
            open={deleteDialogOpen}
            onOpenChange={(open) => {
              if (!isDeleting) {
                setDeleteDialogOpen(open);
                if (!open) setSelectedDeleteBot(null);
              }
            }}
            botName={selectedDeleteBot.name}
            language={language}
            onConfirm={confirmDelete}
            isDeleting={isDeleting}
          />
        )}
      </div>
    </TooltipProvider>
  );
}

export default MyBotsPage;
