import { NextRequest, NextResponse } from "next/server";
import { findClientBySlug } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = await findClientBySlug(slug);
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const configs = await db.read<any>("widget_configs");
  const widgetConfig = configs.find((w: any) => w.clientId === client.id) || null;
  const allEntries = await db.read<any>("kb_entries");
  const kbEntries = allEntries.filter((k: any) => k.clientId === client.id);

  const chatUrl = `${req.nextUrl.origin}/api/chat/${slug}`;
  const name = client.name;
  const logo = client.logo || "";
  const primaryColor = client.primaryColor || "#7c3aed";
  const pos = widgetConfig?.position || "right";
  const mb = widgetConfig?.marginBottom ?? 20;
  const mr = widgetConfig?.marginRight ?? 20;
  const welcomeTitle = (widgetConfig?.welcomeTitle || "Bienvenue !").replace(/"/g, '\\"');
  const welcomeSub = (widgetConfig?.welcomeSub || "").replace(/"/g, '\\"');
  const showBrand = widgetConfig?.showBrand === true;

  const KQ_JSON = JSON.stringify(
    kbEntries.flatMap((k: any) => {
      const qs = [k.question];
      if (k.alt_questions) qs.push(...k.alt_questions.split(/[,|]+/).map((s: string) => s.trim()).filter(Boolean));
      return qs;
    })
  );
  const WC_JSON = JSON.stringify(kbEntries.slice(0, 4).map((k: any) => k.question));

  const script = `(function(){
var e={chatUrl:"${escapeJs(chatUrl)}",name:"${escapeJs(name)}",logo:"${escapeJs(logo)}",primaryColor:"${escapeJs(primaryColor)}",position:"${escapeJs(pos)}",marginBottom:${mb},marginRight:${mr},welcomeTitle:"${escapeJs(welcomeTitle)}",welcomeSub:"${escapeJs(welcomeSub)}",showBrand:${showBrand},maxMessageLength:500,maxHistoryLength:20};

var KQ=${KQ_JSON};
var WC=${WC_JSON};

/* Mode IA */
var aiKey="nova_ai_"+e.name.replace(/[^a-z0-9]/gi,"_");
var store=localStorage.getItem(aiKey);
var aiMode=store===null||store==="true";

function updateAIUI(){
  var btn=document.getElementById("na-ai");
  var av=document.getElementById("na-av");
  var sb=document.getElementById("na-sb");
  var ib=document.getElementById("na-ind");
  var iw=document.getElementById("na-iw");
  var sk=document.getElementById("na-sk");
  var sendBtn=document.getElementById("ns");
  if(btn)btn.classList.toggle("on",aiMode);
  if(av)av.classList.toggle("ai-mode",aiMode);
  if(sb)sb.style.display=aiMode?"flex":"none";
  if(ib)ib.style.display=aiMode?"inline-flex":"none";
  if(iw)iw.classList.toggle("ai-focus",aiMode);
  if(sk)sk.classList.toggle("ai-mode",aiMode);
  if(sendBtn)sendBtn.classList.toggle("ai-mode",aiMode);
}
function toggleAI(){
  aiMode=!aiMode;
  localStorage.setItem(aiKey,aiMode?"true":"false");
  updateAIUI();
}

/* CSS */
var t=document.createElement("style");
var C="";
var op=e.position==="right"?"left":"right";
C+="@media(prefers-reduced-motion:reduce){.nova-widget *{animation-duration:.01ms!important;transition-duration:.01ms!important}}";
C+=".nova-widget *{box-sizing:border-box;font-family:system-ui,-apple-system,sans-serif}";
C+="@keyframes nf{from{opacity:0;transform:translateY(16px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}";
C+="@keyframes nr{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}";
C+="@keyframes nl{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:translateX(0)}}";
C+="@keyframes nb{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}";
C+="@keyframes na-pulse{0%,100%{box-shadow:0 0 0 0 rgba(168,85,247,.7)}50%{box-shadow:0 0 0 5px rgba(168,85,247,0)}}";
C+="@keyframes nfade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}";
C+="@keyframes nw-glow{0%,100%{box-shadow:0 8px 24px "+e.primaryColor+"44}50%{box-shadow:0 8px 32px "+e.primaryColor+"66}}";
/* button */
C+=".nb{position:fixed;bottom:"+e.marginBottom+"px;"+op+":auto;"+e.position+":"+e.marginRight+"px;width:62px;height:62px;border-radius:50%;background:linear-gradient(135deg,"+e.primaryColor+","+e.primaryColor+"dd);border:none;cursor:pointer;box-shadow:0 8px 32px "+e.primaryColor+"55;z-index:999999;display:flex;align-items:center;justify-content:center;transition:all .35s cubic-bezier(.4,0,.2,1);animation:nb-pulse 3s ease-in-out infinite}";
C+=".nb:hover{transform:scale(1.08) translateY(-2px);box-shadow:0 12px 40px "+e.primaryColor+"66;animation:none}";
C+=".nb:active{transform:scale(.95)}";
C+="@keyframes nb-pulse{0%,100%{box-shadow:0 8px 32px "+e.primaryColor+"55}50%{box-shadow:0 8px 40px "+e.primaryColor+"77}}";
C+=".nb svg{width:24px;height:24px;color:#fff;transition:transform .3s}";
C+=".nb.o{opacity:0;pointer-events:none;transform:scale(.75)}";
C+=".nb-notif{position:absolute;top:-1px;right:-1px;width:20px;height:20px;background:#dc2626;border-radius:50%;border:3px solid #fff;display:none;align-items:center;justify-content:center;font-size:9px;font-weight:900;color:#fff;animation:npulse 2s infinite}";
C+="@keyframes npulse{0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.7)}50%{box-shadow:0 0 0 7px rgba(220,38,38,0)}}";
/* card */
C+=".nc{position:fixed;bottom:"+(e.marginBottom+76)+"px;"+op+":auto;"+e.position+":"+e.marginRight+"px;width:420px;max-width:calc(100vw - 32px);height:600px;max-height:calc(100vh - 120px);background:#fff;border-radius:24px;box-shadow:0 16px 48px rgba(0,0,0,.18);z-index:999998;display:none;flex-direction:column;overflow:hidden;animation:nf .32s cubic-bezier(.4,0,.2,1);transform-origin:bottom "+e.position+"}";
C+=".nc.o{display:flex}";
C+="@media(max-width:500px){.nc{bottom:0;"+op+":auto;"+e.position+":0;width:100vw;max-width:100vw;height:100vh;max-height:100vh;border-radius:0}}";
/* maximized */
C+=".nc.max{bottom:16px;"+op+":auto;"+e.position+":16px;width:820px;max-width:calc(100vw - 32px);height:740px;max-height:calc(100vh - 40px);border-radius:24px}";
C+="@media(max-width:860px){.nc.max{bottom:0;"+op+":auto;"+e.position+":0;width:100vw;max-width:100vw;height:100vh;max-height:100vh;border-radius:0}}";
/* offline banner */
C+=".n-off{display:none;background:#fef3c7;color:#92400e;font-size:11px;font-weight:600;text-align:center;padding:5px 12px;border-bottom:1px solid #fde68a;flex-shrink:0}";
C+=".n-off.show{display:block}";
/* header */
C+=".nh{background:linear-gradient(135deg,"+e.primaryColor+","+e.primaryColor+"dd);padding:16px 18px;display:flex;align-items:center;gap:12px;flex-shrink:0;position:relative;box-shadow:0 2px 16px rgba(0,0,0,.08)}";
C+=".nh h3{margin:0;font-size:15px;font-weight:700;line-height:1.3;color:#fff;letter-spacing:-.2px}";
C+=".nh p{margin:0;font-size:11.5px;opacity:.9;color:#fff}";
C+=".na{width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.2);border:2px solid rgba(255,255,255,.35);display:flex;align-items:center;justify-content:center;font-size:17px;color:#fff;flex-shrink:0;position:relative;overflow:hidden}";
C+=".na svg{width:24px;height:24px}";
C+=".na::after{content:'';position:absolute;bottom:1px;right:1px;width:12px;height:12px;background:#16a34a;border-radius:50%;border:2.5px solid "+e.primaryColor+";box-shadow:0 0 4px rgba(22,163,74,.4)}";
C+=".na.ai-mode{background:linear-gradient(135deg,#7c3aed,#9333ea)}";
C+=".na.ai-mode::after{background:#a855f7;border-color:#7c3aed;box-shadow:0 0 4px rgba(168,85,247,.5);animation:na-pulse 2s infinite}";
C+=".na img{width:100%;height:100%;object-fit:cover;border-radius:50%}";
C+=".nh-actions{display:flex;align-items:center;gap:4px;margin-left:auto}";
C+=".nh-btn{width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,.1);border:none;color:#fff;font-size:13px;cursor:pointer;transition:all .18s cubic-bezier(.4,0,.2,1);display:flex;align-items:center;justify-content:center;flex-shrink:0;line-height:1;padding:0}";
C+=".nh-btn:hover{background:rgba(255,255,255,.25);transform:scale(1.08) translateY(-1px)}";
C+=".nh-btn:active{transform:scale(.95)}";
C+=".nh-btn svg{width:16px;height:16px}";
C+=".na-ai{width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,.1);border:none;color:#fff;font-size:14px;cursor:pointer;transition:all .25s cubic-bezier(.4,0,.2,1);display:flex;align-items:center;justify-content:center;flex-shrink:0;line-height:1;padding:0}";
C+=".na-ai svg{width:16px;height:16px}";
C+=".na-ai.on{background:rgba(168,85,247,.4);box-shadow:0 0 12px rgba(168,85,247,.3)}";
C+=".na-ai:hover{background:rgba(255,255,255,.25);transform:scale(1.06)}";
C+=".na-ai.on:hover{background:rgba(168,85,247,.5)}";
/* status bar */
C+=".n-powered{padding:8px 16px;font-size:11.5px;color:#64748b;border-bottom:1px solid #eef2f6;background:#fff;display:flex;align-items:center;justify-content:center;gap:12px;flex-shrink:0}";
C+=".n-ind{display:none;align-items:center;gap:5px;background:linear-gradient(90deg,#7c3aed,#9333ea);color:#fff;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:.3px;box-shadow:0 2px 8px rgba(124,58,237,.25)}";
/* messages */
C+=".nm{flex:1;overflow-y:auto;padding:20px 16px;display:flex;flex-direction:column;gap:14px;background:linear-gradient(180deg,#f8fafc 0%,#f1f5f9 100%);scroll-behavior:smooth}";
C+=".nm::-webkit-scrollbar{width:4px}.nm::-webkit-scrollbar-thumb{background:#dde6ef;border-radius:4px}.nm::-webkit-scrollbar-track{background:transparent}";
/* user message */
C+=".nmsg.u{align-self:flex-end;max-width:84%;animation:nr .28s ease}";
C+=".nmsg.u .nmsg-bbl{background:linear-gradient(135deg,"+e.primaryColor+","+e.primaryColor+"dd);color:#fff;padding:12px 16px;border-radius:20px 20px 4px 20px;font-size:14px;line-height:1.65;box-shadow:0 3px 12px "+e.primaryColor+"33;white-space:pre-wrap;word-break:break-word}";
C+=".nmsg.u .nmsg-bbl p{margin:.4em 0}.nmsg.u .nmsg-bbl p:first-child{margin-top:0}.nmsg.u .nmsg-bbl p:last-child{margin-bottom:0}";
/* bot message row */
C+=".nmsg.b{display:flex;gap:10px;max-width:92%;animation:nl .28s ease}";
C+=".nba{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,"+e.primaryColor+",#4a90d9);display:flex;align-items:center;justify-content:center;font-size:13px;color:#fff;flex-shrink:0;margin-top:2px;box-shadow:0 2px 6px rgba(0,0,0,.08)}";
C+=".nba svg{width:20px;height:20px}";
C+=".nba.ai{background:linear-gradient(135deg,#7c3aed,#9333ea);box-shadow:0 2px 8px rgba(124,58,237,.2)}";
C+=".nmsg-bot{flex:1;min-width:0}";
C+=".nmsg-bbl{background:#fff;border:1px solid #eef2f6;padding:14px 16px;border-radius:20px 20px 20px 4px;font-size:14px;line-height:1.7;color:#0d1b2a;box-shadow:0 2px 8px rgba(0,0,0,.04);white-space:pre-wrap;word-break:break-word}";
C+=".nmsg-bbl p{margin:.4em 0}.nmsg-bbl p:first-child{margin-top:0}.nmsg-bbl p:last-child{margin-bottom:0}";
C+=".nmsg-bbl ul{margin:.5em 0 .5em 1.2em;padding:0}.nmsg-bbl li{margin:.2em 0}";
C+=".nmsg-bbl h1,.nmsg-bbl h2,.nmsg-bbl h3{margin:.6em 0 .3em;font-size:14px;font-weight:700;color:#0d1b2a}";
C+=".nmsg-bbl code{background:#f1f5f9;border:1px solid #e2e8f0;border-radius:4px;padding:1px 5px;font-size:12.5px;font-family:monospace;color:#334155}";
C+=".nmsg-bbl a{color:"+e.primaryColor+";text-decoration:underline}";
C+=".nmsg-bbl.ai-enhanced{border-left:3px solid #7c3aed;background:linear-gradient(135deg,#fff,#f8f6ff)}";
C+=".nft{display:flex;align-items:center;gap:8px;margin-top:6px;flex-wrap:wrap}";
C+=".nsc{font-size:10.5px;font-weight:600;padding:2px 7px;border-radius:5px;line-height:1.4}";
C+=".nsc.green{background:#d1fae5;color:#065f46}.nsc.orange{background:#fef3c7;color:#92400e}.nsc.red{background:#fee2e2;color:#991b1b}";
C+=".nsrc{font-size:11px;color:#64748b;line-height:1.4;font-style:italic}";
C+=".nsrc.ai{color:#7c3aed;font-weight:600;font-style:normal}";
/* copy button */
C+=".ncopy{background:none;border:1px solid #e2e8f0;border-radius:6px;padding:2px 7px;font-size:10px;color:#94a3b8;cursor:pointer;transition:all .15s;margin-left:auto}";
C+=".ncopy:hover{background:#f1f5f9;color:#475569;border-color:#cbd5e1}";
C+=".ncopy.done{color:#16a34a;border-color:#d1fae5}";
/* timestamp */
C+=".nts{font-size:10px;color:#94a3b8;margin-top:4px;text-align:right}";
C+=".nmsg.b .nts{text-align:left}";
/* character counter */
C+=".n-ctr{font-size:11px;color:#94a3b8;text-align:right;padding:2px 6px 0;transition:color .15s}";
C+=".n-ctr.warn{color:#f59e0b}.n-ctr.over{color:#ef4444}";
/* welcome */
C+=".nw{text-align:center;padding:18px 12px}";
C+=".nw-icon{width:60px;height:60px;background:linear-gradient(135deg,"+e.primaryColor+",#00b4cc);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;color:#fff;box-shadow:0 8px 24px "+e.primaryColor+"44;overflow:hidden;animation:nw-glow 3s ease-in-out infinite}";
C+=".nw-icon svg{width:32px;height:32px}";
C+=".nw-icon img{width:42px;height:42px;border-radius:50%;object-fit:cover}";
C+=".nw-title{font-size:16px;font-weight:800;color:#0d1b2a;margin-bottom:7px;letter-spacing:-.3px}";
C+=".nw-sub{font-size:13px;color:#64748b;line-height:1.7;margin-bottom:18px}";
C+=".nw-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:0}";
C+=".nw-chip{background:#fff;border:1.5px solid #eef2f6;border-radius:14px;padding:12px 8px;text-align:center;cursor:pointer;font-size:12.5px;font-weight:600;color:#0d1b2a;transition:all .18s cubic-bezier(.4,0,.2,1);box-shadow:0 1px 4px rgba(0,0,0,.04)}";
C+=".nw-chip:hover{border-color:"+e.primaryColor+";color:"+e.primaryColor+";background:"+e.primaryColor+"08;transform:translateY(-2px);box-shadow:0 4px 12px "+e.primaryColor+"18}";
C+=".nw-chip .nw-chip-icon{font-size:18px;display:block;margin-bottom:4px}";
/* suggestion chips */
C+=".nchips{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;margin-left:44px}";
C+=".nchip{padding:6px 15px;background:#fff;border:1px solid #eef2f6;border-radius:20px;font-size:12.5px;color:#0d1b2a;font-weight:600;cursor:pointer;transition:all .15s cubic-bezier(.4,0,.2,1);box-shadow:0 1px 3px rgba(0,0,0,.04)}";
C+=".nchip:hover{background:"+e.primaryColor+";color:#fff;border-color:"+e.primaryColor+";transform:translateY(-1px);box-shadow:0 4px 12px "+e.primaryColor+"33}";
/* typing */
C+=".nty{display:flex;gap:10px;max-width:92%;animation:nl .2s ease}";
C+=".nty-bbl{background:#fff;border:1px solid #eef2f6;padding:16px 18px;border-radius:20px 20px 20px 4px;box-shadow:0 2px 8px rgba(0,0,0,.04)}";
C+=".nty-label{font-size:11.5px;color:#7c3aed;font-weight:600;margin-bottom:7px}";
C+=".nty-dots{display:flex;gap:6px}";
C+=".nty-dots span{width:8px;height:8px;background:#cbd5e1;border-radius:50%;animation:nb .8s infinite ease-in-out}";
C+=".nty-dots span:nth-child(2){animation-delay:.16s}.nty-dots span:nth-child(3){animation-delay:.32s}";
/* input */
C+=".ni{border-top:1px solid #eef2f6;padding:8px 14px 12px;background:#fff;position:relative;flex-shrink:0}";
C+=".ni-inner{display:flex;align-items:flex-end;gap:10px;background:#f8fafc;border:2px solid #e2e8f0;border-radius:20px;padding:4px 4px 4px 16px;transition:all .25s cubic-bezier(.4,0,.2,1)}";
C+=".ni-inner:focus-within{border-color:"+e.primaryColor+";box-shadow:0 0 0 4px "+e.primaryColor+"15;background:#fff}";
C+=".ni-inner.ai-focus:focus-within{border-color:#7c3aed;box-shadow:0 0 0 4px rgba(124,58,237,.18);background:#fff}";
C+=".ni-inner textarea{flex:1;border:none;outline:none;font-size:14.5px;background:transparent;color:#0d1b2a;resize:none;min-height:40px;max-height:100px;font-family:inherit;line-height:1.5;padding:8px 0}";
C+=".ni-inner textarea::placeholder{color:#94a3b8}";
C+=".ni-inner textarea:disabled{opacity:.6;cursor:not-allowed}";
C+=".ni-inner button#ns{width:40px;height:40px;border-radius:14px;border:none;background:"+e.primaryColor+";color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .18s cubic-bezier(.4,0,.2,1)}";
C+=".ni-inner button#ns:hover:not(:disabled){background:"+e.primaryColor+"dd;transform:scale(1.06)}";
C+=".ni-inner button#ns:active:not(:disabled){transform:scale(.95)}";
C+=".ni-inner button#ns:disabled{opacity:.4;cursor:not-allowed;transform:none}";
C+=".ni-inner button#ns.ai-mode{background:#7c3aed}";
C+=".ni-inner button#ns.ai-mode:hover:not(:disabled){background:#6d28d9}";
C+=".ni-inner button#ns svg{width:18px;height:18px}";
/* autocomplete */
C+=".nac{position:absolute;bottom:100%;left:12px;right:12px;background:#fff;border:1px solid #eef2f6;border-radius:16px 16px 0 0;box-shadow:0 -6px 24px rgba(0,0,0,.08);display:none;max-height:220px;overflow-y:auto;padding:8px 0;margin-bottom:8px}";
C+=".nac.o{display:block;animation:nfade .18s ease}";
C+=".nac-item{padding:10px 16px;font-size:13px;color:#374151;cursor:pointer;transition:all .1s;line-height:1.4}";
C+=".nac-item:hover,.nac-item.sel{background:"+e.primaryColor+"0d;color:"+e.primaryColor+";font-weight:500}";
C+=".nac::-webkit-scrollbar{width:4px}.nac::-webkit-scrollbar-thumb{background:#dde6ef;border-radius:4px}";
/* footer */
C+=".nf{text-align:center;padding:6px;font-size:10px;color:#9ca3af;flex-shrink:0;border-top:1px solid #f3f4f6}";
t.textContent=C;
document.head.appendChild(t);

/* SVG icons */
var ICONS={
  chat:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  send:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
  brain:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 0 1 4 4c0 1.1-.4 2.1-1 2.8V12l-3 3-3-3V8.8A4 4 0 0 1 12 2z"/><path d="M8 14v3l4 4 4-4v-3"/></svg>',
  maximize:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>',
  minimize:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="10" y1="14" x2="3" y2="21"/></svg>',
  reset:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>',
  close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  robot:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/></svg>',
  copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'
};

/* Helpers */
function isValidUrl(s){return s&&(s.startsWith("http://")||s.startsWith("https://")||s.startsWith("/"))}
function formatTime(){var d=new Date();return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")}
function renderMarkdown(t){
  if(!t)return"";
  var s=String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  s=s.replace(/\\*\\*(.+?)\\*\\*/g,"<strong>$1</strong>");
  s=s.replace(/\\*(.+?)\\*/g,"<em>$1</em>");
  s=s.replace(/\`([^\`]+)\`/g,"<code>$1</code>");
  s=s.replace(/\\[([^\\]]+)\\]\\((https?:\\/\\/[^\\)]+\\))/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');
  s=s.replace(/^### (.+)$/gm,"<h3>$1</h3>");
  s=s.replace(/^## (.+)$/gm,"<h2>$1</h2>");
  s=s.replace(/^# (.+)$/gm,"<h1>$1</h1>");
  s=s.replace(/^[-*]\\s+(.+)$/gm,"<li>$1</li>");
  s=s.replace(/(<li>.*<\\/li>(\\n|$))+/g,function(m){return"<ul>"+m+"</ul>"});
  s=s.replace(/^\\d+\\.\\s+(.+)$/gm,"<li>$1</li>");
  s=s.replace(/\\n{2,}/g,"</p><p>").replace(/\\n/g,"<br>");
  if(!/^<[hup]/.test(s)) s="<p>"+s+"</p>";
  return s;
}
function escHtml(s){
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
function escAttr(s){
  return String(s).replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
function buildAvatarImg(){
  if(!e.logo) return ICONS.robot;
  var img=document.createElement("img");
  img.src=e.logo;
  img.style.cssText="width:100%;height:100%;object-fit:cover;border-radius:50%";
  return img.outerHTML;
}
function updateCharCounter(){
  var len=document.getElementById("ni").value.length;
  var el=document.getElementById("n-ctr");
  if(!el)return;
  if(len===0){el.textContent="";el.className="n-ctr";return}
  if(len>e.maxMessageLength*0.8){el.textContent=len+"/"+e.maxMessageLength;el.className="n-ctr "+(len>=e.maxMessageLength?"over":"warn")}
  else{el.textContent="";el.className="n-ctr"}
}
var isLoading=false;
/* HTML */
var avatarHtml=buildAvatarImg();

/* floating button */
var btn=document.createElement("button");
btn.className="nova-widget nb";btn.id="nb";
btn.setAttribute("aria-label","Ouvrir le chatbot");
btn.setAttribute("aria-expanded","false");
btn.innerHTML=ICONS.chat+'<span class="nb-notif" id="nb-notif" aria-hidden="true"></span>';
document.body.appendChild(btn);

/* welcome message */
var welcomeIcoArr=["\\ud83d\\udcac","\\ud83d\\udd0d","\\ud83c\\udf1f","\\ud83d\\udca1"];
var welcomeIcon=buildAvatarImg();
var welcomeHtml='<div class="nw"><div class="nw-icon">'+welcomeIcon+'</div><div class="nw-title">'+escHtml(e.welcomeTitle)+'</div><div class="nw-sub">'+escHtml(e.welcomeSub)+'</div>';
if(WC.length>0){
  welcomeHtml+='<div class="nw-grid">';
  for(var wi=0;wi<Math.min(WC.length,4);wi++){
    welcomeHtml+='<div class="nw-chip" data-q="'+escAttr(WC[wi])+'" tabindex="0" role="button"><span class="nw-chip-icon">'+welcomeIcoArr[wi%4]+'</span>'+escHtml(WC[wi])+'</div>';
  }
  welcomeHtml+="</div>";
}
welcomeHtml+="</div>";

/* chat card */
var card=document.createElement("div");
card.className="nova-widget nc";card.id="nc";
card.setAttribute("role","dialog");
card.setAttribute("aria-label","Chatbot");
card.setAttribute("aria-modal","true");
card.innerHTML='<div class="nh"><div class="na" id="na-av" aria-hidden="true">'+avatarHtml+'</div><div><h3>'+escHtml(e.name)+'</h3><p id="na-status">'+escHtml(e.welcomeSub)+'</p></div><div class="nh-actions"><button id="na-ai" class="na-ai'+(aiMode?" on":"")+'" title="Activer / D\u00e9sactiver le mode IA">'+ICONS.brain+'</button><button id="na-max" class="nh-btn" title="Agrandir">'+ICONS.maximize+'</button><button id="na-reset" class="nh-btn" title="R\u00e9initialiser">'+ICONS.reset+'</button><button id="na-close" class="nh-btn" title="Fermer">'+ICONS.close+'</button></div></div><div class="n-off" id="n-off" role="alert">&#x26a0;&#xfe0f; Connexion perdue \u2014 vos messages seront envoy\u00e9s d\u00e8s la reconnexion</div><div class="n-powered" id="na-pw"><span id="na-sb" style="display:'+(aiMode?"flex":"none")+'"><span class="n-ind" id="na-ind" style="display:'+(aiMode?"inline-flex":"none")+'">'+ICONS.brain+' IA Active</span></span><span id="na-sk" style="color:#6b7280">Base de connaissances</span></div><div class="nm" id="nm" role="log" aria-live="polite">'+welcomeHtml+'</div><div class="ni"><div class="nac" id="nac" role="listbox" aria-label="Suggestions"></div><div class="ni-inner'+(aiMode?" ai-focus":"")+'" id="na-iw"><textarea id="ni" placeholder="Posez votre question..." rows="1" maxlength="'+e.maxMessageLength+'" aria-label="Message" aria-autocomplete="list" aria-controls="nac"></textarea><button id="ns" class="'+(aiMode?"ai-mode":"")+'" aria-label="Envoyer">'+ICONS.send+'</button></div><div class="n-ctr" id="n-ctr"></div></div>'+(e.showBrand?'<div class="nf">Propuls\u00e9 par Nova Chatbot</div>':"");
document.body.appendChild(card);

/* Logo onerror fallback */
(function(){
  var imgs=document.querySelectorAll("#na-av img, .nw-icon img");
  for(var ii=0;ii<imgs.length;ii++)imgs[ii].onerror=function(){this.outerHTML=ICONS.robot};
})();

/* Connection status */
var cs=document.createElement("span");
cs.id="na-cs";
cs.style.cssText="width:8px;height:8px;border-radius:50%;display:inline-block;flex-shrink:0;margin-left:auto";
function updateConn(){cs.style.background=navigator.onLine?"#16a34a":"#dc2626";cs.title=navigator.onLine?"Connect\u00e9":"Hors ligne"}
updateConn();
window.addEventListener("online",function(){updateConn();document.getElementById("n-off").classList.remove("show");document.getElementById("ns").disabled=false});
window.addEventListener("offline",function(){updateConn();document.getElementById("n-off").classList.add("show")});
document.getElementById("na-pw").appendChild(cs);

/* auto-resize textarea + char counter */
document.getElementById("ni").oninput=function(){
  this.style.height="auto";
  this.style.height=Math.min(this.scrollHeight,90)+"px";
  renderSuggestions(this.value);
  updateCharCounter();
};

/* welcome chip clicks */
document.querySelectorAll(".nw-chip").forEach(function(el){
  el.addEventListener("click",function(){sendMessage((this.dataset.q||this.textContent).trim())});
  el.addEventListener("keydown",function(ev){if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();sendMessage((this.dataset.q||this.textContent).trim())}});
});

/* Show notification badge initially */
var notif=document.getElementById("nb-notif");
if(notif)notif.style.display="flex";

/* Message Helpers */
var chatHistory=[];

function addMsg(text,role,source,provider,clientName,score){
  var box=document.getElementById("nm"),row=document.createElement("div");
  var time=formatTime();
  if(role==="user"){
    row.className="nmsg u";
    row.innerHTML='<div class="nmsg-bbl">'+renderMarkdown(text)+'</div><div class="nts">'+time+'</div>';
  }else{
    row.className="nmsg b";
    var aiCls=(source==="ai"||aiMode)?" ai":"";
    var bubbleCls=(source==="ai"||aiMode)?"nmsg-bbl ai-enhanced":"nmsg-bbl";
    var sourceHtml="";
    var copyId="cp-"+Date.now()+"-"+Math.random().toString(36).slice(2,7);
    if(source==="kb"&&score!=null){
      var cls=score>70?"green":score>40?"orange":"red";
      sourceHtml='<div class="nft"><span class="nsc '+cls+'">\\u2713 '+score+'%</span><span class="nsrc">Base de connaissances</span><button class="ncopy" id="'+copyId+'" aria-label="Copier">'+ICONS.copy+' Copier</button></div>';
    }else if(source==="ai"&&provider){
      sourceHtml='<div class="nft"><span class="nsrc ai">Propuls\u00e9 par '+escHtml(provider)+(clientName?" + contexte "+escHtml(clientName):"")+'</span><button class="ncopy" id="'+copyId+'" aria-label="Copier">'+ICONS.copy+' Copier</button></div>';
    }else if(source==="fallback"){
      sourceHtml='<div class="nft"><span class="nsrc">Fallback</span><button class="ncopy" id="'+copyId+'" aria-label="Copier">'+ICONS.copy+' Copier</button></div>';
    }else{
      sourceHtml='<div class="nft"><button class="ncopy" id="'+copyId+'" aria-label="Copier">'+ICONS.copy+' Copier</button></div>';
    }
    row.innerHTML='<div class="nba'+aiCls+'" aria-hidden="true">'+ICONS.robot+'</div><div class="nmsg-bot"><div class="'+bubbleCls+'">'+renderMarkdown(text)+'</div>'+sourceHtml+'<div class="nts">'+time+'</div></div>';
    setTimeout(function(){
      var cb=document.getElementById(copyId);
      if(cb)cb.onclick=function(){
        navigator.clipboard.writeText(text).then(function(){
          cb.innerHTML=ICONS.copy+" Copi\u00e9 !";
          cb.classList.add("done");
          setTimeout(function(){cb.innerHTML=ICONS.copy+" Copier";cb.classList.remove("done")},1500);
        });
      };
    },0);
  }
  box.appendChild(row);
  box.scrollTop=box.scrollHeight;
}
function addSuggestions(questions){
  if(!questions||questions.length===0) return;
  var box=document.getElementById("nm"),cp=document.createElement("div");cp.className="nchips";
  for(var ri=0;ri<questions.length;ri++){
    var cc=document.createElement("div");cc.className="nchip";
    cc.textContent=questions[ri];
    cc.setAttribute("tabindex","0");cc.setAttribute("role","button");
    (function(q){
      cc.onclick=function(){sendMessage(q);};
      cc.onkeydown=function(ev){if(ev.key==="Enter"||ev.key===" ")sendMessage(q);};
    })(questions[ri]);
    cp.appendChild(cc);
  }
  box.appendChild(cp);
  box.scrollTop=box.scrollHeight;
}
function showTyping(){
  var box=document.getElementById("nm");
  if(document.getElementById("nty")) return;
  var d=document.createElement("div");d.className="nty";d.id="nty";d.setAttribute("aria-label","En train de r\u00e9pondre...");
  d.innerHTML='<div class="nba'+(aiMode?" ai":"")+'" aria-hidden="true">'+ICONS.robot+'</div><div class="nmsg-bot"><div class="nty-bbl"><div class="nty-label">R\u00e9flexion en cours\u2026</div><div class="nty-dots" aria-hidden="true"><span></span><span></span><span></span></div></div></div>';
  box.appendChild(d);box.scrollTop=box.scrollHeight;
}
function hideTyping(){var d=document.getElementById("nty");if(d)d.remove();}
function setLoading(state){
  isLoading=state;
  document.getElementById("ns").disabled=state;
  document.getElementById("ni").disabled=state;
  if(state) showTyping(); else hideTyping();
}

/* Autocompletion with highlighted text */
var selIdx=-1,nac=document.getElementById("nac");

function renderSuggestions(val){
  if(val.length<2||KQ.length===0){
    nac.classList.remove("o");selIdx=-1;return;
  }
  var vl=val.toLowerCase();
  var items=[];var seen={};
  for(var i=0;i<KQ.length;i++){
    var q=KQ[i];
    if(q.toLowerCase().indexOf(vl)!==-1&&!seen[q]){seen[q]=true;items.push(q);if(items.length>=8) break}
  }
  nac.innerHTML="";
  if(items.length===0){nac.classList.remove("o");selIdx=-1;return}
  for(var j=0;j<items.length;j++){
    var d=document.createElement("div");
    d.className="nac-item";d.setAttribute("role","option");d.setAttribute("aria-selected","false");
    var idx=items[j].toLowerCase().indexOf(vl);
    d.innerHTML=escHtml(items[j].slice(0,idx))+'<mark style="background:'+e.primaryColor+'22;color:'+e.primaryColor+';font-weight:700;border-radius:2px">'+escHtml(items[j].slice(idx,idx+vl.length))+'</mark>'+escHtml(items[j].slice(idx+vl.length));
    (function(q){d.onclick=function(){selectSuggestion(q)}})(items[j]);
    nac.appendChild(d);
  }
  nac.classList.add("o");selIdx=-1;
}
function selectSuggestion(q){
  nac.classList.remove("o");selIdx=-1;
  document.getElementById("ni").value=q;
  sendMessage(q);
}
document.getElementById("ni").onblur=function(){setTimeout(function(){nac.classList.remove("o");selIdx=-1;},200)};

/* Send message */
function sendMessage(text){
  text=(text||"").trim();
  if(!text||isLoading) return;
  if(!navigator.onLine){
    addMsg("Vous \u00eates hors ligne. Veuillez v\u00e9rifier votre connexion.","bot","fallback");
    return;
  }
  if(text.length>e.maxMessageLength) text=text.slice(0,e.maxMessageLength);
  setLoading(true);
  nac.classList.remove("o");selIdx=-1;
  chatHistory.push({role:"user",content:text});
  addMsg(text,"user");
  document.getElementById("ni").value="";
  document.getElementById("ni").style.height="auto";
  updateCharCounter();

  var xhr=new XMLHttpRequest();
  xhr.open("POST",e.chatUrl,true);
  xhr.setRequestHeader("Content-Type","application/json");
  xhr.timeout=30000;
  xhr.onload=function(){
    setLoading(false);
    if(xhr.status===429){addMsg("Trop de requ\u00eates. Veuillez patienter quelques secondes.","bot","fallback");return}
    if(xhr.status>=500){addMsg("Service temporairement indisponible. Veuillez r\u00e9essayer.","bot","fallback");return}
    try{
      var resp=JSON.parse(xhr.responseText);
      addMsg(resp.response,"bot",resp.source,resp.provider,resp.clientName,resp.score);
      chatHistory.push({role:"assistant",content:resp.response});
      if(chatHistory.length>e.maxHistoryLength) chatHistory=chatHistory.slice(-e.maxHistoryLength);
      addSuggestions(resp.suggestions);
    }catch(_){
      addMsg("Je n'ai pas trouv\u00e9 de r\u00e9ponse. Contactez-nous.","bot","fallback");
    }
  };
  xhr.onerror=function(){setLoading(false);addMsg("Erreur r\u00e9seau. V\u00e9rifiez votre connexion.","bot","fallback")};
  xhr.ontimeout=function(){setLoading(false);addMsg("La requ\u00eate a expir\u00e9 (30s). Veuillez r\u00e9essayer.","bot","fallback")};
  xhr.send(JSON.stringify({message:text,history:chatHistory.slice(0,-1),aiMode:aiMode}));
}
/* Escape to close */
document.addEventListener("keydown",function(ev){
  if(ev.key==="Escape"&&document.getElementById("nc").classList.contains("o")){
    document.getElementById("nc").classList.remove("o");
    document.getElementById("nb").classList.remove("o");
    document.getElementById("nb").setAttribute("aria-expanded","false");
    document.getElementById("nb").focus();
  }
});

/* Maximize / Minimize */
var maximized=false;
document.getElementById("na-max").onclick=function(){
  var c=document.getElementById("nc"),b=document.getElementById("na-max");
  maximized=!maximized;
  c.classList.toggle("max",maximized);
  b.innerHTML=maximized?ICONS.minimize:ICONS.maximize;
  b.title=maximized?"R\u00e9duire":"Agrandir";
};

/* Reset conversation */
document.getElementById("na-reset").onclick=function(){
  if(chatHistory.length===0) return;
  if(!confirm("R\u00e9initialiser la conversation ?")) return;
  chatHistory=[];
  var box=document.getElementById("nm");
  var welcomeIcon2=buildAvatarImg();
  var welcomeHtml='<div class="nw"><div class="nw-icon">'+welcomeIcon2+'</div><div class="nw-title">'+escHtml(e.welcomeTitle)+'</div><div class="nw-sub">'+escHtml(e.welcomeSub)+'</div>';
  if(WC.length>0){
    welcomeHtml+='<div class="nw-grid">';
    for(var wi=0;wi<Math.min(WC.length,4);wi++){
      welcomeHtml+='<div class="nw-chip" data-q="'+escAttr(WC[wi])+'" tabindex="0" role="button"><span class="nw-chip-icon">'+welcomeIcoArr[wi%4]+'</span>'+escHtml(WC[wi])+'</div>';
    }
    welcomeHtml+="</div>";
  }
  welcomeHtml+="</div>";
  box.innerHTML=welcomeHtml;
  var wimgs=box.querySelectorAll(".nw-icon img");
  for(var wi2=0;wi2<wimgs.length;wi2++)wimgs[wi2].onerror=function(){this.outerHTML=ICONS.robot};
  document.querySelectorAll("#nm .nw-chip").forEach(function(el){
    el.addEventListener("click",function(){sendMessage((this.dataset.q||this.textContent).trim())});
    el.addEventListener("keydown",function(ev){if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();sendMessage((this.dataset.q||this.textContent).trim())}});
  });
};

/* AI toggle events */
document.getElementById("na-ai").onclick=toggleAI;

/* Close button */
document.getElementById("na-close").onclick=function(){
  document.getElementById("nc").classList.remove("o");
  document.getElementById("nb").classList.remove("o");
  document.getElementById("nb").setAttribute("aria-expanded","false");
  nac.classList.remove("o");selIdx=-1;
};

/* Events */
document.getElementById("nb").onclick=function(){
  var c=document.getElementById("nc"),b=document.getElementById("nb");
  var isOpen=c.classList.toggle("o");
  b.classList.toggle("o",isOpen);
  b.setAttribute("aria-expanded",isOpen?"true":"false");
  var badge=document.getElementById("nb-notif");
  if(badge)badge.style.display="none";
  if(isOpen){document.getElementById("ni").focus()}else{nac.classList.remove("o");selIdx=-1}
};
document.getElementById("ns").onclick=function(){sendMessage(document.getElementById("ni").value)};
document.getElementById("ni").onkeydown=function(ev){
  var open=nac.classList.contains("o");
  if(open&&(ev.key==="ArrowDown"||ev.key==="ArrowUp")){
    ev.preventDefault();
    var items=nac.querySelectorAll(".nac-item");
    if(ev.key==="ArrowDown"&&selIdx<items.length-1) selIdx++;
    if(ev.key==="ArrowUp"&&selIdx>0) selIdx--;
    for(var i=0;i<items.length;i++){items[i].classList.toggle("sel",i===selIdx);items[i].setAttribute("aria-selected",i===selIdx?"true":"false")}
    if(selIdx>=0) items[selIdx].scrollIntoView({block:"nearest"});
    return
  }
  if(ev.key==="Enter"&&!ev.shiftKey){
    if(open&&selIdx>=0){ev.preventDefault();selectSuggestion(nac.querySelectorAll(".nac-item")[selIdx].textContent)}
    else{ev.preventDefault();sendMessage(ev.target.value)}
    return
  }
  if(ev.key==="Escape"&&open){nac.classList.remove("o");selIdx=-1}
};

/* Init AI UI */
updateAIUI();

})();`;

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

function escapeJs(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n");
}
