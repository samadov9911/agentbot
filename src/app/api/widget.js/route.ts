import { NextResponse } from 'next/server';

/**
 * /api/widget.js — Serves the self-contained AgentBot widget JavaScript.
 *
 * Usage on external sites:
 *   <script src="https://agentbot-one.vercel.app/api/widget.js" data-bot-id="bf_..." async></script>
 *
 * Features:
 * - Auto-detects user language from first message or browser locale
 * - Supports any language (not just ru/en/tr)
 * - Dynamic theming from bot appearance config
 * - Dynamic position (bottom-left / bottom-right)
 * - Bot avatar support
 * - Config refresh on every open (no stale appearance)
 * - DOMContentLoaded-safe, addEventListener, try/catch
 */

const WIDGET_VERSION = '5';

const WIDGET_JS = `
/* AgentBot Widget v${WIDGET_VERSION} */
(function(){
var sc=document.currentScript;
if(!sc){var ss=document.getElementsByTagName("script");for(var i=ss.length-1;i>=0;i--){if(ss[i].getAttribute("src")&&ss[i].getAttribute("src").indexOf("widget.js")!==-1){sc=ss[i];break}}}
if(!sc){return}
var E=sc.getAttribute("data-bot-id");
if(!E){return}

/* ── i18n: widget UI strings ── */
var L={
  ru:{placeholder:"Напишите сообщение...",greeting:"Здравствуйте! Чем могу помочь?",loadErr:"Не удалось загрузить виджет. Попробуйте позже.",apiErr:"Извините, ошибка.",netErr:"Ошибка соединения. Попробуйте ещё раз."},
  en:{placeholder:"Write a message...",greeting:"Hello! How can I help you?",loadErr:"Could not load widget. Please try again.",apiErr:"Sorry, an error occurred.",netErr:"Connection error. Please try again."},
  tr:{placeholder:"Bir mesaj yaz\u0131n...",greeting:"Merhaba! Size nas\u0131l yard\u0131mc\u0131 olabilirim?",loadErr:"Widget y\u00fcklenemedi. L\u00fctfen tekrar deneyin.",apiErr:"\u00dczg\u00fcn, bir hata olu\u015ftu.",netErr:"Ba\u011flant\u0131 hatas\u0131. L\u00fctfen tekrar deneyin."},
  de:{placeholder:"Schreiben Sie eine Nachricht...",greeting:"Hallo! Wie kann ich Ihnen helfen?",loadErr:"Widget konnte nicht geladen werden.",apiErr:"Entschuldigung, ein Fehler ist aufgetreten.",netErr:"Verbindungsfehler. Bitte versuchen Sie es erneut."},
  es:{placeholder:"Escribe un mensaje...",greeting:"\u00a1Hola! \u00bfC\u00f3mo puedo ayudarte?",loadErr:"No se pudo cargar el widget.",apiErr:"Lo siento, hubo un error.",netErr:"Error de conexi\u00f3n. Por favor, int\u00e9ntalo de nuevo."},
  zh:{placeholder:"\u5199\u4e00\u6761\u6d88\u606f...",greeting:"\u4f60\u597d\uff01\u6709\u4ec0\u4e48\u53ef\u4ee5\u5e2e\u4f60\u7684\uff1f",loadErr:"\u65e0\u6cd5\u52a0\u8f7d\u7ec4\u4ef6\u3002",apiErr:"\u62b1\u6b49\uff0c\u51fa\u9519\u4e86\u3002",netErr:"\u8fde\u63a5\u9519\u8bef\u3002\u8bf7\u91cd\u8bd5\u3002"},
  ar:{placeholder:"\u0627\u0643\u062a\u0628 \u0631\u0633\u0627\u0644\u0629...",greeting:"\u0645\u0631\u062d\u0628\u0627\u064b! \u0643\u064a\u0641 \u0623\u0633\u0627\u0639\u062f\u0643\u061f",loadErr:"\u062a\u0639\u0630\u0631 \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0648\u064a\u062c\u062a.",apiErr:"\u0639\u0630\u0631\u0627\u064b\u060c \u062d\u062f\u062b \u062e\u0637\u0623.",netErr:"\u062e\u0637\u0623 \u0641\u064a \u0627\u0644\u0627\u062a\u0635\u0627\u0644. \u064a\u0631\u062c\u0649 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649."},
  fr:{placeholder:"\u00c9crivez un message...",greeting:"Bonjour! Comment puis-je vous aider?",loadErr:"Impossible de charger le widget.",apiErr:"D\u00e9sol\u00e9, une erreur s'est produite.",netErr:"Erreur de connexion. Veuillez r\u00e9essayer."},
  pt:{placeholder:"Escreva uma mensagem...",greeting:"Ol\u00e1! Como posso ajudar?",loadErr:"N\u00e3o foi poss\u00edvel carregar o widget.",apiErr:"Desculpe, ocorreu um erro.",netErr:"Erro de conex\u00e3o. Tente novamente."},
  ja:{placeholder:"\u30e1\u30c3\u30bb\u30fc\u30b8\u3092\u5165\u529b...",greeting:"\u3053\u3093\u306b\u3061\u306f\uff01\u4f55\u304a\u624b\u4f1d\u3044\u3067\u3057\u3087\u3046\u304b\uff1f",loadErr:"\u30a6\u30a3\u30b8\u30a7\u30c3\u30c8\u304c\u8aad\u307f\u8fbc\u3081\u307e\u305b\u3093\u3002",apiErr:"\u7533\u3057\u8a33\u3042\u308a\u307e\u305b\u3093\u3001\u30a8\u30e9\u30fc\u304c\u767a\u751f\u3057\u307e\u3057\u305f\u3002",netErr:"\u63a5\u7d9a\u30a8\u30e9\u30fc\u3002\u3082\u3046\u4e00\u5ea6\u304a\u8a66\u3057\u304f\u3060\u3055\u3044\u3002"}
};

function detectLang(text){
  if(!text)return"en";
  var t=text.toLowerCase();
  if(/[\\u0400-\\u04ff]/.test(t))return"ru";
  if(/[\\u0600-\\u06ff]/.test(t))return"ar";
  if(/[\\u4e00-\\u9fff]/.test(t))return"zh";
  if(/[\\u3040-\\u30ff]/.test(t))return"ja";
  if(/[\\u00c0-\\u00ff]/.test(t)&&/\\u00e7|\\u00e3|\\u00f5|\\u00e1|\\u00e9|\\u00ed|\\u00f3|\\u00fa/.test(t))return"pt";
  if(/[\\u00c0-\\u00ff]/.test(t)&&/\\u00fc|\\u00f6|\\u00e4|\\u00df/.test(t))return"de";
  if(/[\\u00c0-\\u00ff]/.test(t)&&/\\u00f1|\\u00e9|\\u00ed|\\u00f3|\\u00fa/.test(t))return"es";
  if(/[\\u00c0-\\u00ff]/.test(t)&&/\\u00e7|\\u00e9|\\u00e8|\\u00ea|\\u00e0|\\u00f9/.test(t))return"fr";
  if(/[\\u011f\\u0131\\u015f\\u00e7\\u00f6\\u00fc]/.test(t))return"tr";
  return"en";
}

function browserLang(){
  try{var n=(navigator.language||navigator.userLanguage||"en").split("-")[0];if(L[n])return n}catch(e){}
  return"en";
}

function init(){
try{
var B="https://agentbot-one.vercel.app",S="ab_"+E;

/* ── Clean up any existing widget elements from previous embed codes ── */
var oldWrap=document.getElementById("abw-btn-wrap");
if(oldWrap){oldWrap.parentNode&&oldWrap.parentNode.removeChild(oldWrap)}
var oldPan=document.getElementById("abw-pan");
if(oldPan){oldPan.parentNode&&oldPan.parentNode.removeChild(oldPan)}
var oldStyle=document.getElementById("abw-css");
if(oldStyle){oldStyle.parentNode&&oldStyle.parentNode.removeChild(oldStyle)}

if(document.getElementById("abw-"+E)){return}
var M={};M[S]={open:false,msgs:[],sid:null};
var W=M[S],R=document;

/* ── Language: restore from storage or detect from browser ── */
var savedLang=ls("ab_lang"+E);
var lang=savedLang||browserLang();
W.lang=lang;

function t(k){return(L[lang]&&L[lang][k])||(L.en&&L.en[k])||k}

function css(t){var e=document.createElement("style");e.id="abw-css";e.textContent=t;document.head.appendChild(e)}

function el(tag,cls,h){var e=document.createElement(tag);if(cls)e.className=cls;e.innerHTML=h||"";return e}

function ls(k,v){try{if(v===undefined)return JSON.parse(localStorage.getItem(k));localStorage.setItem(k,JSON.stringify(v))}catch(e){return v===undefined?null:true}}

function applyTheme(primary,secondary){
  var root=document.documentElement;
  root.style.setProperty("--ab-primary",primary);
  root.style.setProperty("--ab-secondary",secondary);
  var r=parseInt(secondary.slice(1,3),16),g=parseInt(secondary.slice(3,5),16),b=parseInt(secondary.slice(5,7),16);
  root.style.setProperty("--ab-secondary-rgb",r+","+g+","+b);
}

function applyPosition(pos){
  var wrap=R.getElementById("abw-btn-wrap");
  var btn=R.getElementById("abw-btn");
  var pan=R.getElementById("abw-pan");
  if(!btn||!pan)return;
  /* Reset to default right position first */
  if(wrap){wrap.style.right="24px";wrap.style.left="auto"}
  btn.style.right="24px";btn.style.left="auto";
  pan.style.right="24px";pan.style.left="24px";
  var badge=R.getElementById("abw-badge");
  if(badge){badge.style.right="-2px";badge.style.left="auto"}
  /* Apply left if needed */
  if(pos==="bottom-left"){
    if(wrap){wrap.style.right="auto";wrap.style.left="24px"}
    btn.style.right="auto";btn.style.left="24px";
    pan.style.right="auto";pan.style.left="24px";
    if(badge){badge.style.right="auto";badge.style.left="-2px"}
  }
}

var sid=ls("ab_sid"+E)||function(){var s=""+Date.now()+Math.random().toString(36).slice(2);ls("ab_sid"+E,s);return s}();
W.sid=sid;
var hist=ls("ab_hist"+E)||[];W.msgs=hist;
function saveHist(){ls("ab_hist"+E,W.msgs.slice(-50))}
function save(){ls("ab_open"+E,W.open)}
W.open=!!ls("ab_open"+E);

/* Track last config version to detect changes */
var lastConfigHash=ls("ab_cfg"+E)||"";

css(":root{--ab-primary:#059669;--ab-secondary:#10b981;--ab-secondary-rgb:16,185,129}#abw-btn{position:fixed;z-index:99999;bottom:24px;right:24px;width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,var(--ab-primary),var(--ab-secondary));border:none;cursor:pointer;box-shadow:0 4px 24px rgba(var(--ab-secondary-rgb),0.4);display:flex;align-items:center;justify-content:center;transition:transform .2s,box-shadow .2s}#abw-btn:hover{transform:scale(1.08);box-shadow:0 6px 32px rgba(var(--ab-secondary-rgb),0.5)}#abw-btn svg{width:28px;height:28px;fill:white}#abw-badge{position:absolute;top:-2px;right:-2px;min-width:18px;height:18px;border-radius:9px;background:#ef4444;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 4px;opacity:0;transition:opacity .2s}#abw-pan{position:fixed;z-index:99998;bottom:96px;right:24px;width:380px;max-width:calc(100vw - 32px);height:520px;max-height:calc(100vh - 120px);border-radius:16px;background:#fff;box-shadow:0 8px 40px rgba(0,0,0,0.15);display:flex;flex-direction:column;overflow:hidden;opacity:0;transform:translateY(16px) scale(0.95);transition:opacity .25s,transform .25s;pointer-events:none}#abw-pan.open{opacity:1;transform:translateY(0) scale(1);pointer-events:all}#abw-head{padding:16px;background:linear-gradient(135deg,var(--ab-primary),var(--ab-secondary));color:#fff;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}#abw-head h3{margin:0;font-size:15px;font-weight:600;display:flex;align-items:center;gap:8px}#abw-cls{background:rgba(255,255,255,0.2);border:none;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center}#abw-cls:hover{background:rgba(255,255,255,0.3)}#abw-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:8px}#abw-msgs::-webkit-scrollbar{width:4px}#abw-msgs::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:2px}#abw-bbl{max-width:80%;padding:10px 14px;border-radius:16px;font-size:14px;line-height:1.5;word-wrap:break-word;white-space:pre-wrap;animation:abIn .2s ease}@keyframes abIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.ab-bot{background:#f3f4f6;color:#1f2937;align-self:flex-start;border-bottom-left-radius:4px}.ab-user{background:linear-gradient(135deg,var(--ab-primary),var(--ab-secondary));color:#fff;align-self:flex-end;border-bottom-right-radius:4px}.ab-booking{background:#f9fafb;border:1px solid var(--ab-secondary);color:#374151;align-self:center;text-align:center;cursor:pointer;padding:10px 20px;border-radius:12px;font-size:13px;font-weight:500}.ab-booking:hover{background:#f3f4f6}#abw-typ{display:none;padding:10px 14px;align-self:flex-start}.ab-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#9ca3af;margin:0 2px;animation:abBounce .6s infinite alternate}.ab-dot:nth-child(2){animation-delay:.2s}.ab-dot:nth-child(3){animation-delay:.4s}@keyframes abBounce{to{opacity:.3;transform:translateY(-4px)}}#abw-inp{padding:12px 16px;border-top:1px solid #e5e7eb;display:flex;gap:8px;flex-shrink:0;background:#fff}#abw-inp input{flex:1;border:1px solid #d1d5db;border-radius:24px;padding:10px 16px;font-size:14px;outline:none;transition:border-color .2s}#abw-inp input:focus{border-color:var(--ab-secondary)}#abw-inp button{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--ab-primary),var(--ab-secondary));border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .15s;flex-shrink:0}#abw-inp button:hover{transform:scale(1.05)}#abw-inp button svg{width:18px;height:18px;fill:white}");

var btnW=el("div","","<button id=\\"abw-btn\\"><svg viewBox=\\"0 0 24 24\\"><path d=\\"M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z\\"/></svg></button><span id=\\"abw-badge\\"></span>");
btnW.id="abw-btn-wrap";
btnW.style.cssText="position:fixed;z-index:99999;bottom:24px;right:24px";

var panW=el("div","","<div id=\\"abw-head\\"><h3><span id=\\"abw-avatar\\"></span><svg id=\\"abw-globe-icon\\" width=\\"20\\" height=\\"20\\" viewBox=\\"0 0 24 24\\" fill=\\"white\\"><path d=\\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z\\"/></svg><span id=\\"abw-title\\">AgentBot</span></h3><button id=\\"abw-cls\\">\u2715</button></div><div id=\\"abw-msgs\\"></div><div id=\\"abw-typ\\"><span class=\\"ab-dot\\"></span><span class=\\"ab-dot\\"></span><span class=\\"ab-dot\\"></span></div><div id=\\"abw-inp\\"><input type=\\"text\\" placeholder=\\""+t("placeholder")+"\\" /><button><svg viewBox=\\"0 0 24 24\\"><path d=\\"M2.01 21L23 12 2.01 3 2 10l15 2-15 2z\\"/></svg></button></div>");
panW.id="abw-pan";

R.body.appendChild(btnW);
R.body.appendChild(panW);

var bBtn=R.getElementById("abw-btn");
var bPan=R.getElementById("abw-pan");
var bCls=R.getElementById("abw-cls");
var bMsgs=R.getElementById("abw-msgs");
var bTyp=R.getElementById("abw-typ");
var bInp=R.getElementById("abw-inp").querySelector("input");
var bSend=R.getElementById("abw-inp").querySelector("button");
var bBadge=R.getElementById("abw-badge");
var bTitle=R.getElementById("abw-title");

if(!bBtn||!bPan){return}

/* Simple hash function to detect config changes */
function hashStr(s){var h=0;for(var i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h|=0}return""+h}

var configLoading=false;

/**
 * refreshConfig() — Fetches bot config and applies appearance (name, theme, position, avatar, language).
 * Called EVERY TIME the widget opens to ensure fresh data.
 * Only adds greeting if this is the first visit (no messages yet) or if greeting changed.
 */
function refreshConfig(){
  if(configLoading)return;
  configLoading=true;
  fetch(B+"/api/bots/config?embedCode="+E+"&_t="+Date.now()).then(function(r){if(!r.ok)throw new Error();return r.json()}).then(function(d){
    configLoading=false;
    var bot=d.bot;
    /* Compute config hash to detect changes */
    var newHash=hashStr(JSON.stringify(d));
    ls("ab_cfg"+E,newHash);
    var greetingChanged=(newHash!==lastConfigHash);
    lastConfigHash=newHash;

    /* Always update appearance */
    bTitle.textContent=bot.name||"AgentBot";
    var appearance=bot.appearance||{};
    if(appearance.primaryColor&&appearance.secondaryColor){applyTheme(appearance.primaryColor,appearance.secondaryColor)}
    applyPosition(appearance.position);
    if(bot.avatar){var av=R.getElementById("abw-avatar");if(av){av.innerHTML='<img src=\\"'+bot.avatar+'\\" style=\\"width:24px;height:24px;border-radius:50%;object-fit:cover\\" alt=\\"\\" />';var gl=R.getElementById("abw-globe-icon");if(gl)gl.style.display="none"}}
    if(appearance.language&&L[appearance.language]){W.lang=appearance.language;ls("ab_lang"+E,appearance.language);bInp.placeholder=t("placeholder")}

    /* Only add greeting on first visit or when config changed */
    if(W.msgs.length===0){
      var cfg=bot.config||{};
      if(cfg.greeting){addMsg(cfg.greeting,"bot")}else{addMsg(t("greeting"),"bot")}
    }
    render();
    bMsgs.scrollTop=bMsgs.scrollHeight;
  }).catch(function(){
    configLoading=false;
    if(W.msgs.length===0){addMsg(t("loadErr"),"bot")}
    render();
  })
}

function toggle(){
W.open=!W.open;
if(W.open){
bPan.classList.add("open");
bBtn.style.display="none";
bInp.focus();
/* ALWAYS refresh config on every open to get fresh appearance */
refreshConfig();
}else{
bPan.classList.remove("open");
bBtn.style.display="flex"
}
save()
}

function addMsg(text,type){W.msgs.push({text:text,type:type,t:Date.now()});saveHist();render()}

function render(){
bMsgs.innerHTML="";
W.msgs.forEach(function(m){
var d=el("div","ab-bbl "+(m.type==="user"?"ab-user":m.type==="booking"?"ab-bot ab-booking":"ab-bot"),"");
d.textContent=m.text;
if(m.type==="booking"){d.onclick=function(){bInp.value=m.text;doSend()}}
bMsgs.appendChild(d)
});
bMsgs.scrollTop=bMsgs.scrollHeight
}

bBtn.addEventListener("click",toggle);
bCls.addEventListener("click",toggle);
bSend.addEventListener("click",doSend);
bInp.addEventListener("keydown",function(e){if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();doSend()}});

function doSend(){
var txt=bInp.value.trim();
if(!txt||W.sending)return;
bInp.value="";
/* Auto-detect language from user message */
var detected=ls("ab_lang"+E);
if(!detected||detected==="en"){
  var newLang=detectLang(txt);
  if(newLang&&newLang!==W.lang){
    W.lang=newLang;
    ls("ab_lang"+E,newLang);
    bInp.placeholder=t("placeholder");
  }
}
addMsg(txt,"user");
send(txt)
}

function send(text){
W.sending=true;
bTyp.style.display="flex";
bMsgs.scrollTop=bMsgs.scrollHeight;
fetch(B+"/api/bot-demo-chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:text,sessionId:sid,botName:bTitle.textContent,embedCode:E,language:W.lang,msgs:W.msgs.filter(function(m){return m.type==="user"||m.type==="bot"}).map(function(m){return{text:m.text,type:m.type}})})}).then(function(r){if(!r.ok)throw new Error();return r.json()}).then(function(d){
bTyp.style.display="none";
addMsg(d.response||t("apiErr"),"bot");
if(d.bookingPrompt){setTimeout(function(){addMsg(d.bookingPrompt,"booking")},300)}
}).catch(function(){
bTyp.style.display="none";
addMsg(t("netErr"),"bot")
});
W.sending=false
}

/* On initial page load, always refresh config if widget was open */
if(W.open){bPan.classList.add("open");bBtn.style.display="none";refreshConfig()}else if(W.msgs.length===0){
  /* Pre-fetch config silently even when closed, so appearance is ready on first open */
  refreshConfig();
}

}catch(err){console.error("[AgentBot] Init error:",err)}
}

/* Wait for DOM to be ready */
if(document.readyState==="loading"){
document.addEventListener("DOMContentLoaded",init)
}else{
init()
}

})();
`;

export async function GET(request: Request) {
  return new NextResponse(WIDGET_JS.trim(), {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=120',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
