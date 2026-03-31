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

function generateEmbedScript(embedCode: string): string {
  // Self-contained inline widget script — fully functional
  return `<script>
(function(){
var E="${embedCode}",B="${WIDGET_BASE_URL}",S="ab_"+E,M={};
M[S]={open:false,msgs:[],sid:null,load:false,err:false};
var W=M[S],R=document,X="https://"+location.host;
function css(t,s){var e=document.createElement("style");e.textContent=t;document.head.appendChild(e);if(s)setTimeout(function(){document.head.removeChild(e)},s)}
function el(tag,cls,h){var e=document.createElement(tag);if(cls)e.className=cls;e.innerHTML=h||"";return e}
function ls(k,v){try{if(v===undefined)return JSON.parse(localStorage.getItem(k));localStorage.setItem(k,JSON.stringify(v))}catch(e){return v===undefined?null:true}}
var sid=ls("ab_sid"+E)||function(){var s=""+Date.now()+Math.random().toString(36).slice(2);ls("ab_sid"+E,s);return s}();
W.sid=sid;
var hist=ls("ab_hist"+E)||[];W.msgs=hist;
function saveHist(){ls("ab_hist"+E,W.msgs.slice(-50))}
function save(){ls("ab_open"+E,W.open)}
W.open=!!ls("ab_open"+E);
if(document.getElementById("abw")){return}
css("#abw-btn{position:fixed;z-index:99999;bottom:24px;right:24px;width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#059669,#10b981);border:none;cursor:pointer;box-shadow:0 4px 24px rgba(16,185,129,0.4);display:flex;align-items:center;justify-content:center;transition:transform .2s,box-shadow .2s}#abw-btn:hover{transform:scale(1.08);box-shadow:0 6px 32px rgba(16,185,129,0.5)}#abw-btn svg{width:28px;height:28px;fill:white}#abw-badge{position:absolute;top:-2px;right:-2px;min-width:18px;height:18px;border-radius:9px;background:#ef4444;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 4px;opacity:0;transition:opacity .2s}#abw-pan{position:fixed;z-index:99998;bottom:96px;right:24px;width:380px;max-width:calc(100vw - 32px);height:520px;max-height:calc(100vh - 120px);border-radius:16px;background:#fff;box-shadow:0 8px 40px rgba(0,0,0,0.15);display:flex;flex-direction:column;overflow:hidden;opacity:0;transform:translateY(16px) scale(0.95);transition:opacity .25s,transform .25s;pointer-events:none}#abw-pan.open{opacity:1;transform:translateY(0) scale(1);pointer-events:all}#abw-head{padding:16px;background:linear-gradient(135deg,#059669,#10b981);color:#fff;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}#abw-head h3{margin:0;font-size:15px;font-weight:600;display:flex;align-items:center;gap:8px}#abw-cls{background:rgba(255,255,255,0.2);border:none;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center}#abw-cls:hover{background:rgba(255,255,255,0.3)}#abw-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:8px}#abw-msgs::-webkit-scrollbar{width:4px}#abw-msgs::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:2px}#abw-bbl{max-width:80%;padding:10px 14px;border-radius:16px;font-size:14px;line-height:1.5;word-wrap:break-word;white-space:pre-wrap;animation:abIn .2s ease}@keyframes abIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.ab-bot{background:#f3f4f6;color:#1f2937;align-self:flex-start;border-bottom-left-radius:4px}.ab-user{background:linear-gradient(135deg,#059669,#10b981);color:#fff;align-self:flex-end;border-bottom-right-radius:4px}.ab-booking{background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46;align-self:center;text-align:center;cursor:pointer;padding:10px 20px;border-radius:12px;font-size:13px;font-weight:500}.ab-booking:hover{background:#d1fae5}#abw-typ{display:none;padding:10px 14px;align-self:flex-start}.ab-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#9ca3af;margin:0 2px;animation:abBounce .6s infinite alternate}.ab-dot:nth-child(2){animation-delay:.2s}.ab-dot:nth-child(3){animation-delay:.4s}@keyframes abBounce{to{opacity:.3;transform:translateY(-4px)}}#abw-inp{padding:12px 16px;border-top:1px solid #e5e7eb;display:flex;gap:8px;flex-shrink:0;background:#fff}#abw-inp input{flex:1;border:1px solid #d1d5db;border-radius:24px;padding:10px 16px;font-size:14px;outline:none;transition:border-color .2s}#abw-inp input:focus{border-color:#10b981}#abw-inp button{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#059669,#10b981);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .15s;flex-shrink:0}#abw-inp button:hover{transform:scale(1.05)}#abw-inp button svg{width:18px;height:18px;fill:white}");
var btn=el("div","","<button id=\"abw-btn\"><svg viewBox=\"0 0 24 24\"><path d=\"M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z\"/></svg></button><span id=\"abw-badge\"></span>");
btn.style.cssText="position:fixed;z-index:99999;bottom:24px;right:24px";
var pan=el("div","","<div id=\"abw-head\"><h3><svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"white\"><path d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z\"/></svg><span id=\"abw-title\">AgentBot</span></h3><button id=\"abw-cls\">✕</button></div><div id=\"abw-msgs\"></div><div id=\"abw-typ\"><span class=\"ab-dot\"></span><span class=\"ab-dot\"></span><span class=\"ab-dot\"></span></div><div id=\"abw-inp\"><input type=\"text\" placeholder=\"Напишите сообщение...\" /><button><svg viewBox=\"0 0 24 24\"><path d=\"M2.01 21L23 12 2.01 3 2 10l15 2-15 2z\"/></svg></button></div>");
R.body.appendChild(btn);R.body.appendChild(pan);
var bBtn=R.getElementById("abw-btn"),bPan=R.getElementById("abw-pan"),bCls=R.getElementById("abw-cls"),bMsgs=R.getElementById("abw-msgs"),bTyp=R.getElementById("abw-typ"),bInp=R.getElementById("abw-inp").querySelector("input"),bSend=R.getElementById("abw-inp").querySelector("button"),bBadge=R.getElementById("abw-badge"),bTitle=R.getElementById("abw-title");
var unread=0;
function toggle(){W.open=!W.open;if(W.open){bPan.classList.add("open");bBtn.style.display="none";unread=0;bBadge.style.opacity="0";bInp.focus();if(W.msgs.length===0)loadConfig();else bMsgs.scrollTop=bMsgs.scrollHeight}else{bPan.classList.remove("open");bBtn.style.display="flex"}save()}
function addMsg(text,type){W.msgs.push({text:text,type:type,t:Date.now()});saveHist();render()}
function render(){bMsgs.innerHTML="";W.msgs.forEach(function(m){var d=el("div","ab-bbl "+(m.type==='user'?'ab-user':m.type==='booking'?'ab-bot ab-booking':'ab-bot'),"");d.textContent=m.text;if(m.type==='booking')d.onclick=function(){bInp.value=m.text;doSend()};bMsgs.appendChild(d)});bMsgs.scrollTop=bMsgs.scrollHeight}
bBtn.onclick=toggle;bCls.onclick=toggle;
bSend.onclick=doSend;
bInp.onkeydown=function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();doSend()}};
function doSend(){var t=bInp.value.trim();if(!t||W.sending)return;bInp.value="";addMsg(t,"user");send(t)}
async function loadConfig(){try{var r=await fetch(B+"/api/bots/config?embedCode="+E);if(!r.ok)throw new Error();var d=await r.json();var bot=d.bot;bTitle.textContent=bot.name||"AgentBot";var cfg=bot.config||{};if(cfg.greeting){addMsg(cfg.greeting,"bot")}else{addMsg("Здравствуйте! Чем могу помочь?","bot")}}catch(e){addMsg("Не удалось загрузить виджет. Попробуйте позже.","bot")}}
async function send(text){W.sending=true;bTyp.style.display="flex";bMsgs.scrollTop=bMsgs.scrollHeight;try{var r=await fetch(B+"/api/bot-demo-chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:text,sessionId:sid,botName:bTitle.textContent,embedCode:E,language:"ru"})});if(!r.ok)throw new Error();var d=await r.json();bTyp.style.display="none";addMsg(d.response||"Извините, ошибка","bot");if(d.bookingPrompt){setTimeout(function(){addMsg(d.bookingPrompt,"booking")},300)}}catch(e){bTyp.style.display="none";addMsg("Ошибка соединения. Попробуйте ещё раз.","bot")}W.sending=false}
if(W.open){bPan.classList.add("open");bBtn.style.display="none";if(W.msgs.length>0)render();else loadConfig();bMsgs.scrollTop=bMsgs.scrollHeight}
})();
</script>`;
}

function generateEmbedScriptHtml(embedCode: string): string {
  return `<!-- AgentBot Widget -->
${generateEmbedScript(embedCode)}<!-- /AgentBot Widget -->`;
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

  const scriptTag = useMemo(() => generateEmbedScriptHtml(embedCode), [embedCode]);

  const label = (ru: string, en: string, tr: string) =>
    language === 'ru' ? ru : language === 'en' ? en : tr;

  const instructions = [
    {
      id: 'html',
      name: 'HTML',
      text: label('HTML', 'HTML', 'HTML'),
      instructions: label(
        'Вставьте код перед закрывающим тегом &lt;/body&gt; в вашем HTML-файле.',
        'Paste the code before the closing &lt;/body&gt; tag in your HTML file.',
        'Kodu HTML dosyanızda &lt;/body&gt; kapanış etiketinden önce yapıştırın.'
      ),
    },
    {
      id: 'wordpress',
      name: 'WordPress',
      text: 'WordPress',
      instructions: label(
        'Перейдите в Внешний вид → Редактор тем, выберите footer.php и вставьте код перед &lt;/body&gt;. Или используйте плагин "Insert Headers and Footers".',
        'Go to Appearance → Theme Editor, select footer.php and paste the code before &lt;/body&gt;. Or use the "Insert Headers and Footers" plugin.',
        'Görünüm → Tema Düzenleyici\'ye gidin, footer.php dosyasını seçin ve kodu &lt;/body&gt;\'den önce yapıştırın. Veya "Insert Headers and Footers" eklentisini kullanın.'
      ),
    },
    {
      id: 'shopify',
      name: 'Shopify',
      text: 'Shopify',
      instructions: label(
        'Перейдите в Онлайн-магазин → Темы → Изменить код. Откройте theme.liquid и вставьте код перед &lt;/body&gt;.',
        'Go to Online Store → Themes → Edit Code. Open theme.liquid and paste the code before &lt;/body&gt;.',
        'Çevrimiçi Mağaza → Temalar → Kodu Düzenle. theme.liquid dosyasını açın ve kodu &lt;/body&gt;\'den önce yapıştırın.'
      ),
    },
    {
      id: 'react',
      name: 'React / Next.js',
      text: 'React / Next.js',
      instructions: label(
        'Создайте компонент с useEffect, который добавляет скрипт в document.body черезdangerouslySetInnerHTML или DOM API.',
        'Create a component with useEffect that adds the script to document.body via dangerouslySetInnerHTML or DOM API.',
        'useEffect ile document.body\'e script ekleyen bir bileşen oluşturun. dangerouslySetInnerHTML veya DOM API kullanın.'
      ),
    },
    {
      id: 'tilda',
      name: 'Tilda',
      text: 'Tilda',
      instructions: label(
        'Откройте настройки сайта → Дополнительные теги → Вставьте код в поле "HTML-код в &lt;body&gt;" для всех страниц.',
        'Open Site Settings → More → Paste the code in the "HTML in &lt;body&gt;" field for all pages.',
        'Site Ayarları → Diğer → Tüm sayfalar için "&lt;body&gt; içinde HTML kodu" alanına kodu yapıştırın.'
      ),
    },
  ];

  const handleCopy = useCallback(async () => {
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
                  'Вставьте этот код на ваш сайт — виджет будет работать автоматически:',
                  'Paste this code on your site — the widget will work automatically:',
                  'Bu kodu sitenize yapıştırın — widget otomatik çalışacaktır:'
                )}
              </p>
              <div className="relative">
                <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg border bg-muted/50 p-4 text-xs leading-relaxed scroll-smooth scrollbar-thin">
                  <code className="text-foreground">{scriptTag}</code>
                </pre>
              </div>
              <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950">
                <Info className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  {label(
                    'Виджет полностью самодостаточный — никаких внешних CDN. Работает на любом сайте.',
                    'The widget is fully self-contained — no external CDN needed. Works on any site.',
                    'Widget tamamen kendi başına çalışır — harici CDN gerekmez. Herhangi bir sitede çalışır.'
                  )}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="instructions" className="mt-3">
            <div className="max-h-64 space-y-3 overflow-y-auto pr-1 scrollbar-thin">
              {instructions.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border p-3"
                >
                  <h4 className="text-sm font-semibold">{item.text}</h4>
                  <p
                    className="mt-1 text-xs text-muted-foreground leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: item.instructions }}
                  />
                </div>
              ))}
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
