import { NextResponse } from 'next/server';

/**
 * /api/widget.js — Serves the self-contained AgentBot widget JavaScript.
 *
 * Usage on external sites:
 *   <script src="https://agentbot-one.vercel.app/api/widget.js" data-bot-id="bf_..." async></script>
 *
 * The script reads `data-bot-id` from its own <script> tag, then initializes
 * the full chat widget (button, panel, CSS, chat engine) on the host page.
 *
 * This is a static response (same JS for every bot) — cacheable and fast.
 */

const WIDGET_JS = `
(function(){
/* ─── AgentBot Widget Engine ─── */
/* Find our own <script> tag to read data-bot-id */
var sc=document.currentScript||function(){var s=document.getElementsByTagName("script");for(var i=s.length-1;i>=0;i--){if(s[i].getAttribute("src")&&s[i].getAttribute("src").indexOf("widget.js")!==-1)return s[i]}return null}();
if(!sc)return;
var E=sc.getAttribute("data-bot-id");
if(!E){console.warn("[AgentBot] data-bot-id not found on script tag");return}
var B="https://agentbot-one.vercel.app",S="ab_"+E,M={};
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
if(document.getElementById("abw-"+E)){return}
css("#abw-btn{position:fixed;z-index:99999;bottom:24px;right:24px;width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#059669,#10b981);border:none;cursor:pointer;box-shadow:0 4px 24px rgba(16,185,129,0.4);display:flex;align-items:center;justify-content:center;transition:transform .2s,box-shadow .2s}#abw-btn:hover{transform:scale(1.08);box-shadow:0 6px 32px rgba(16,185,129,0.5)}#abw-btn svg{width:28px;height:28px;fill:white}#abw-badge{position:absolute;top:-2px;right:-2px;min-width:18px;height:18px;border-radius:9px;background:#ef4444;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 4px;opacity:0;transition:opacity .2s}#abw-pan{position:fixed;z-index:99998;bottom:96px;right:24px;width:380px;max-width:calc(100vw - 32px);height:520px;max-height:calc(100vh - 120px);border-radius:16px;background:#fff;box-shadow:0 8px 40px rgba(0,0,0,0.15);display:flex;flex-direction:column;overflow:hidden;opacity:0;transform:translateY(16px) scale(0.95);transition:opacity .25s,transform .25s;pointer-events:none}#abw-pan.open{opacity:1;transform:translateY(0) scale(1);pointer-events:all}#abw-head{padding:16px;background:linear-gradient(135deg,#059669,#10b981);color:#fff;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}#abw-head h3{margin:0;font-size:15px;font-weight:600;display:flex;align-items:center;gap:8px}#abw-cls{background:rgba(255,255,255,0.2);border:none;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center}#abw-cls:hover{background:rgba(255,255,255,0.3)}#abw-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:8px}#abw-msgs::-webkit-scrollbar{width:4px}#abw-msgs::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:2px}#abw-bbl{max-width:80%;padding:10px 14px;border-radius:16px;font-size:14px;line-height:1.5;word-wrap:break-word;white-space:pre-wrap;animation:abIn .2s ease}@keyframes abIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.ab-bot{background:#f3f4f6;color:#1f2937;align-self:flex-start;border-bottom-left-radius:4px}.ab-user{background:linear-gradient(135deg,#059669,#10b981);color:#fff;align-self:flex-end;border-bottom-right-radius:4px}.ab-booking{background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46;align-self:center;text-align:center;cursor:pointer;padding:10px 20px;border-radius:12px;font-size:13px;font-weight:500}.ab-booking:hover{background:#d1fae5}#abw-typ{display:none;padding:10px 14px;align-self:flex-start}.ab-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#9ca3af;margin:0 2px;animation:abBounce .6s infinite alternate}.ab-dot:nth-child(2){animation-delay:.2s}.ab-dot:nth-child(3){animation-delay:.4s}@keyframes abBounce{to{opacity:.3;transform:translateY(-4px)}}#abw-inp{padding:12px 16px;border-top:1px solid #e5e7eb;display:flex;gap:8px;flex-shrink:0;background:#fff}#abw-inp input{flex:1;border:1px solid #d1d5db;border-radius:24px;padding:10px 16px;font-size:14px;outline:none;transition:border-color .2s}#abw-inp input:focus{border-color:#10b981}#abw-inp button{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#059669,#10b981);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .15s;flex-shrink:0}#abw-inp button:hover{transform:scale(1.05)}#abw-inp button svg{width:18px;height:18px;fill:white}");
var btn=el("div","","<button id=\\"abw-btn\\"><svg viewBox=\\"0 0 24 24\\"><path d=\\"M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z\\"/></svg></button><span id=\\"abw-badge\\"></span>");
btn.style.cssText="position:fixed;z-index:99999;bottom:24px;right:24px";
var pan=el("div","","<div id=\\"abw-head\\"><h3><svg width=\\"20\\" height=\\"20\\" viewBox=\\"0 0 24 24\\" fill=\\"white\\"><path d=\\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z\\"/></svg><span id=\\"abw-title\\">AgentBot</span></h3><button id=\\"abw-cls\\">✕</button></div><div id=\\"abw-msgs\\"></div><div id=\\"abw-typ\\"><span class=\\"ab-dot\\"></span><span class=\\"ab-dot\\"></span><span class=\\"ab-dot\\"></span></div><div id=\\"abw-inp\\"><input type=\\"text\\" placeholder=\\"Напишите сообщение...\\" /><button><svg viewBox=\\"0 0 24 24\\"><path d=\\"M2.01 21L23 12 2.01 3 2 10l15 2-15 2z\\"/></svg></button></div>");
pan.id="abw-pan";
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
`;

export async function GET() {
  return new NextResponse(WIDGET_JS.trim(), {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
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
