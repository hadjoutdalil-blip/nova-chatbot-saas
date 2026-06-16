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
  const avatarIcon = widgetConfig?.avatarIcon || "robot";

  const KQ_JSON = JSON.stringify(
    kbEntries.flatMap((k: any) => {
      const qs = [k.question];
      if (k.alt_questions) qs.push(...k.alt_questions.split(/[,|]+/).map((s: string) => s.trim()).filter(Boolean));
      return qs;
    })
  );
  const WC_JSON = JSON.stringify(kbEntries.slice(0, 4).map((k: any) => k.question));

  const script = `(function(){
var e={chatUrl:"${escapeJs(chatUrl)}",name:"${escapeJs(name)}",logo:"${escapeJs(logo)}",primaryColor:"${escapeJs(primaryColor)}",position:"${escapeJs(pos)}",marginBottom:${mb},marginRight:${mr},welcomeTitle:"${escapeJs(welcomeTitle)}",welcomeSub:"${escapeJs(welcomeSub)}",showBrand:${showBrand},avatarIcon:"${avatarIcon}",maxMessageLength:500,maxHistoryLength:20,proactiveEnabled:${widgetConfig?.proactiveEnabled===true},autoOpenDelay:${widgetConfig?.autoOpenDelay??5},showNotification:${widgetConfig?.showNotification!==false},notificationText:"${escapeJs(widgetConfig?.notificationText??"")}",sendGreeting:${widgetConfig?.sendGreeting===true},scrollTrigger:${widgetConfig?.scrollTrigger??0},exitIntent:${widgetConfig?.exitIntent===true}};

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

/* Avatar icons */
var AVATARS={
  robot:'<svg viewBox="0 0 64 64" width="24" height="24"><circle cx="32" cy="34" r="26" fill="#4A90D9"/><circle cx="22" cy="28" r="7" fill="#fff"/><circle cx="42" cy="28" r="7" fill="#fff"/><circle cx="22" cy="28" r="3.5" fill="#1a1a2e"/><circle cx="42" cy="28" r="3.5" fill="#1a1a2e"/><path d="M24 46Q32 54 40 46" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/><rect x="29" y="8" width="6" height="10" rx="3" fill="#4A90D9"/><circle cx="32" cy="6" r="4.5" fill="#FFD700"/></svg>',
  bot:'<svg viewBox="0 0 64 64" width="24" height="24"><rect x="10" y="14" width="44" height="38" rx="10" fill="#2ECC71"/><rect x="18" y="24" width="10" height="10" rx="2" fill="#fff"/><rect x="36" y="24" width="10" height="10" rx="2" fill="#fff"/><rect x="18" y="24" width="5" height="10" fill="#1a1a2e"/><rect x="36" y="24" width="5" height="10" fill="#1a1a2e"/><rect x="24" y="42" width="16" height="4" rx="2" fill="#fff"/><rect x="29" y="6" width="6" height="10" rx="3" fill="#2ECC71"/><circle cx="32" cy="4" r="3.5" fill="#E74C3C"/></svg>',
  sparkle:'<svg viewBox="0 0 64 64" width="24" height="24"><circle cx="32" cy="34" r="26" fill="#9B59B6"/><path d="M32 8l4 12 12-4-8 10 8 12-12-4-4 12-4-12-12 4 8-12-8-10 12 4z" fill="#FFD700" opacity=".3"/><circle cx="22" cy="28" r="7" fill="#fff"/><circle cx="42" cy="28" r="7" fill="#fff"/><circle cx="22" cy="28" r="4" fill="#fff"/><circle cx="42" cy="28" r="4" fill="#fff"/><path d="M24 46Q32 54 40 46" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>',
  heart:'<svg viewBox="0 0 64 64" width="24" height="24"><circle cx="32" cy="34" r="26" fill="#E74C3C"/><path d="M18 26Q22 18 26 26Q30 18 32 26" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/><path d="M32 26Q34 18 38 26Q42 18 46 26" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/><circle cx="18" cy="26" r="1.5" fill="#E74C3C"/><circle cx="32" cy="26" r="1.5" fill="#E74C3C"/><circle cx="46" cy="26" r="1.5" fill="#E74C3C"/><path d="M24 46Q32 54 40 46" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="16" cy="40" r="4.5" fill="#fff" opacity=".25"/><circle cx="48" cy="40" r="4.5" fill="#fff" opacity=".25"/></svg>',
  chat:'<svg viewBox="0 0 64 64" width="24" height="24"><path d="M32 10L18 24h-6v30h40V24h-6L32 10z" fill="#FF6B6B"/><circle cx="22" cy="30" r="7" fill="#fff"/><circle cx="42" cy="30" r="7" fill="#fff"/><circle cx="22" cy="30" r="3.5" fill="#1a1a2e"/><circle cx="42" cy="30" r="3.5" fill="#1a1a2e"/><path d="M24 46Q32 54 40 46" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M14 38L10 42M50 38L54 42" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>',
  headset:'<svg viewBox="0 0 64 64" width="24" height="24"><circle cx="32" cy="34" r="24" fill="#1ABC9C"/><rect x="6" y="30" width="10" height="18" rx="5" fill="#16A085"/><rect x="48" y="30" width="10" height="18" rx="5" fill="#16A085"/><circle cx="22" cy="28" r="7" fill="#fff"/><circle cx="42" cy="28" r="7" fill="#fff"/><circle cx="22" cy="28" r="3.5" fill="#1a1a2e"/><circle cx="42" cy="28" r="3.5" fill="#1a1a2e"/><path d="M24 46Q32 54 40 46" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="32" cy="48" r="2.5" fill="#E74C3C"/></svg>',
  smile:'<svg viewBox="0 0 64 64" width="24" height="24"><circle cx="32" cy="34" r="26" fill="#F1C40F"/><circle cx="22" cy="28" r="7" fill="#fff"/><circle cx="42" cy="28" r="7" fill="#fff"/><circle cx="22" cy="28" r="4" fill="#333"/><circle cx="42" cy="28" r="4" fill="#333"/><circle cx="16" cy="40" r="5" fill="#E74C3C" opacity=".35"/><circle cx="48" cy="40" r="5" fill="#E74C3C" opacity=".35"/><path d="M22 48Q32 58 42 48" stroke="#333" stroke-width="4" fill="none" stroke-linecap="round"/></svg>',
  zap:'<svg viewBox="0 0 64 64" width="24" height="24"><circle cx="32" cy="34" r="26" fill="#F39C12"/><path d="M32 8l-8 20h8l-4 24 16-28h-8l8-16z" fill="#E67E22" opacity=".4"/><circle cx="22" cy="28" r="7" fill="#fff"/><circle cx="42" cy="28" r="7" fill="#fff"/><circle cx="22" cy="28" r="3.5" fill="#333"/><circle cx="42" cy="28" r="3.5" fill="#333"/><path d="M24 46Q32 54 40 46" stroke="#333" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>',
  compass:'<svg viewBox="0 0 64 64" width="24" height="24"><circle cx="32" cy="34" r="26" fill="#3F51B5"/><circle cx="32" cy="28" r="10" fill="#fff" opacity=".15"/><path d="M32 22v12M26 28h12" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><circle cx="22" cy="28" r="7" fill="#fff"/><circle cx="42" cy="28" r="7" fill="#fff"/><circle cx="22" cy="28" r="3.5" fill="#1a1a2e"/><circle cx="42" cy="28" r="3.5" fill="#1a1a2e"/><path d="M24 46Q32 54 40 46" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>',
  shield:'<svg viewBox="0 0 64 64" width="24" height="24"><circle cx="32" cy="34" r="26" fill="#546E7A"/><path d="M32 14l14 5v12c0 10-14 17-14 17s-14-7-14-17V19l14-5z" fill="#78909C" opacity=".5"/><circle cx="22" cy="28" r="7" fill="#fff"/><circle cx="42" cy="28" r="7" fill="#fff"/><circle cx="22" cy="28" r="3.5" fill="#1a1a2e"/><circle cx="42" cy="28" r="3.5" fill="#1a1a2e"/><path d="M24 46Q32 54 40 46" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M32 14l14 5v12c0 10-14 17-14 17s-14-7-14-17V19l14-5z" stroke="#fff" stroke-width="2.5" fill="none"/></svg>',
  astronaut:'<svg viewBox="0 0 64 64" width="24" height="24"><circle cx="32" cy="34" r="26" fill="#2C3E50"/><circle cx="32" cy="34" r="20" fill="#B0BEC5"/><circle cx="22" cy="28" r="7" fill="#fff"/><circle cx="42" cy="28" r="7" fill="#fff"/><circle cx="22" cy="28" r="3.5" fill="#1a1a2e"/><circle cx="42" cy="28" r="3.5" fill="#1a1a2e"/><path d="M24 46Q32 54 40 46" stroke="#1a1a2e" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="44" cy="52" r="4" fill="#fff" opacity=".25"/></svg>',
  friend:'<svg viewBox="0 0 64 64" width="24" height="24"><circle cx="32" cy="34" r="26" fill="#E91E8A"/><path d="M18 28Q22 20 26 28Q30 20 34 28Q38 20 42 28Q46 20 46 28" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/><path d="M24 46Q32 54 40 46" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="16" cy="40" r="4.5" fill="#fff" opacity=".3"/><circle cx="48" cy="40" r="4.5" fill="#fff" opacity=".3"/></svg>',
  ninja:'<svg viewBox="0 0 64 64" width="24" height="24"><circle cx="32" cy="34" r="26" fill="#6C5CE7"/><rect x="14" y="14" width="36" height="18" rx="9" fill="#2D1B69"/><circle cx="22" cy="28" r="5" fill="#fff"/><circle cx="42" cy="28" r="5" fill="#fff"/><circle cx="22" cy="28" r="2.5" fill="#1a1a2e"/><circle cx="42" cy="28" r="2.5" fill="#1a1a2e"/><path d="M26 46Q32 52 38 46" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="32" cy="8" r="4" fill="#FFD700"/></svg>',
  genius:'<svg viewBox="0 0 64 64" width="24" height="24"><circle cx="32" cy="34" r="26" fill="#E67E22"/><circle cx="32" cy="10" r="8" fill="#FFD700"/><path d="M32 6v8M28 10h8" stroke="#E67E22" stroke-width="2.5" stroke-linecap="round"/><circle cx="22" cy="30" r="7" fill="#fff"/><circle cx="42" cy="30" r="7" fill="#fff"/><circle cx="22" cy="30" r="3.5" fill="#333"/><circle cx="42" cy="30" r="3.5" fill="#333"/><rect x="16" y="26" width="32" height="4" rx="2" fill="#333" opacity=".5"/><path d="M26 46Q32 52 38 46" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></svg>',
  alien:'<svg viewBox="0 0 64 64" width="24" height="24"><ellipse cx="32" cy="36" rx="28" ry="22" fill="#00E676"/><circle cx="20" cy="28" r="8" fill="#fff"/><circle cx="44" cy="28" r="8" fill="#fff"/><circle cx="32" cy="36" r="5" fill="#fff"/><circle cx="20" cy="28" r="4" fill="#1a1a2e"/><circle cx="44" cy="28" r="4" fill="#1a1a2e"/><circle cx="32" cy="36" r="2.5" fill="#1a1a2e"/><path d="M24 48Q32 54 40 48" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M12 20Q8 12 16 14" stroke="#00E676" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M52 20Q56 12 48 14" stroke="#00E676" stroke-width="3" fill="none" stroke-linecap="round"/></svg>',
  robot2:'<svg viewBox="0 0 64 64" width="24" height="24"><rect x="10" y="14" width="44" height="40" rx="8" fill="#95A5A6"/><circle cx="22" cy="30" r="7" fill="#fff"/><circle cx="42" cy="30" r="7" fill="#fff"/><circle cx="22" cy="30" r="3.5" fill="#333"/><circle cx="42" cy="30" r="3.5" fill="#333"/><rect x="26" y="44" width="12" height="4" rx="2" fill="#333"/><rect x="14" y="12" width="8" height="3" rx="1.5" fill="#E74C3C"/><rect x="28" y="12" width="8" height="3" rx="1.5" fill="#F1C40F"/><rect x="42" y="12" width="8" height="3" rx="1.5" fill="#2ECC71"/></svg>',
  color1:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 53.8 45"><defs><style>.cls-1{fill:#f4dd45;}.cls-1,.cls-2,.cls-3,.cls-4{fill-rule:evenodd;}.cls-2{fill:#aaf4a5;}.cls-3{fill:#def6ff;}.cls-4{fill:#dd636e;}.cls-5{fill:none;stroke:#000;stroke-linecap:round;stroke-linejoin:round;}</style></defs><g><polygon class="cls-1" points="53.3 44.5 0.5 44.5 0.5 40.1 53.3 40.1 53.3 44.5 53.3 44.5"/><path class="cls-2" d="M48.9,22.5a22,22,0,0,0-22-22h0a22,22,0,0,0-22,22V40.1h44V22.5Z"/><path class="cls-3" d="M26.9,9.3c9.72,0,17.6,5.92,17.6,13.2S36.62,35.7,26.9,35.7,9.3,29.79,9.3,22.5,17.19,9.3,26.9,9.3Z"/><path class="cls-4" d="M26.9,19.61a2.31,2.31,0,0,1,3.71-.91c.92.91.92,2.73,0,4.56A10.87,10.87,0,0,1,26.9,26.9a10.84,10.84,0,0,1-3.7-3.64c-.93-1.83-.93-3.65,0-4.56a2.31,2.31,0,0,1,3.7.91Z"/><path class="cls-5" d="M26.35,44.5h1.1m3.85,0h22V40.1H.5v4.4h22m26.4-22a22,22,0,0,0-22-22h0a22,22,0,0,0-22,22V40.1h44V22.5ZM26.9,9.3c9.72,0,17.6,5.92,17.6,13.2S36.62,35.7,26.9,35.7,9.3,29.79,9.3,22.5,17.19,9.3,26.9,9.3Zm0,10.31a2.31,2.31,0,0,1,3.71-.91c.92.91.92,2.73,0,4.56A10.87,10.87,0,0,1,26.9,26.9a10.84,10.84,0,0,1-3.7-3.64c-.93-1.83-.93-3.65,0-4.56a2.31,2.31,0,0,1,3.7.91Zm7.62,7.29a8.79,8.79,0,0,1-7.62,4.4M19.28,18.1a8.8,8.8,0,0,1,7.62-4.4M3.76,2.85A4.4,4.4,0,1,1,.65,8.24M50.19,2.85A4.4,4.4,0,1,0,53.3,8.24"/></g></svg>',
  color2:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 53.8 45"><defs><style>.cls-1{fill:#aaf4a5;}.cls-1,.cls-2,.cls-3{fill-rule:evenodd;}.cls-2{fill:#f4dd45;}.cls-3{fill:#dd636e;}.cls-4{fill:none;stroke:#000;stroke-linecap:round;stroke-linejoin:round;}</style></defs><g><polygon class="cls-1" points="48.9 13.7 4.9 13.7 4.9 44.5 48.9 44.5 48.9 13.7 48.9 13.7"/><path class="cls-2" d="M44.5,29.1a11,11,0,0,0-11-11H20.3a11,11,0,0,0-11,11h0a11,11,0,0,0,11,11H33.5a11,11,0,0,0,11-11ZM48.9.5a4.4,4.4,0,1,0,4.4,4.4A4.4,4.4,0,0,0,48.9.5ZM4.9.5A4.4,4.4,0,1,1,.5,4.9,4.4,4.4,0,0,1,4.9.5Z"/><path class="cls-3" d="M26.9,31.3a2.2,2.2,0,1,1-2.2,2.2,2.2,2.2,0,0,1,2.2-2.2Zm8.8,0a2.2,2.2,0,1,1-2.2,2.2,2.2,2.2,0,0,1,2.2-2.2Zm-17.6,0a2.2,2.2,0,1,1-2.2,2.2,2.2,2.2,0,0,1,2.2-2.2Zm11-8.8H24.7v8.8h4.4V22.5Zm8.8,0H33.5v8.8h4.4V22.5Zm-17.6,0H15.9v8.8h4.4V22.5Z"/><path class="cls-4" d="M26.35,44.5h1.1m3.85,0H48.9V13.7H4.9V44.5H22.5m22-15.4a11,11,0,0,0-11-11H20.3a11,11,0,0,0-11,11h0a11,11,0,0,0,11,11H33.5a11,11,0,0,0,11-11ZM26.9,31.3a2.2,2.2,0,1,1-2.2,2.2,2.2,2.2,0,0,1,2.2-2.2Zm8.8,0a2.2,2.2,0,1,1-2.2,2.2,2.2,2.2,0,0,1,2.2-2.2Zm-17.6,0a2.2,2.2,0,1,1-2.2,2.2,2.2,2.2,0,0,1,2.2-2.2ZM4.9.5A4.4,4.4,0,1,1,.5,4.9,4.4,4.4,0,0,1,4.9.5ZM9.3,7.83l8.8,5.87M48.9.5a4.4,4.4,0,1,0,4.4,4.4A4.4,4.4,0,0,0,48.9.5ZM44.5,7.83,35.7,13.7m-6.6,8.8H24.7v8.8h4.4V22.5Zm8.8,0H33.5v8.8h4.4V22.5Zm-17.6,0H15.9v8.8h4.4V22.5Z"/></g></svg>',
  color3:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 53.8 53.8"><defs><style>.cls-1{fill:#dd636e;}.cls-1,.cls-2,.cls-3{fill-rule:evenodd;}.cls-2{fill:#def6ff;}.cls-3{fill:#aaf4a5;}.cls-4{fill:none;stroke:#000;stroke-linecap:round;stroke-linejoin:round;}</style></defs><g><path class="cls-1" d="M30.72.78a26.43,26.43,0,0,0-7.64,0L21.83,5A22.41,22.41,0,0,0,15,7.86l-3.9-2.13a26.57,26.57,0,0,0-5.4,5.4L7.86,15A22.41,22.41,0,0,0,5,21.83L.78,23.08a26.43,26.43,0,0,0,0,7.64L5,32a22.47,22.47,0,0,0,2.82,6.81L5.73,42.67a26.37,26.37,0,0,0,5.4,5.41L15,45.94a22.16,22.16,0,0,0,6.8,2.82L23.08,53a26.43,26.43,0,0,0,7.64,0L32,48.76a22.22,22.22,0,0,0,6.81-2.82l3.89,2.14a26.17,26.17,0,0,0,5.41-5.41l-2.14-3.89A22.22,22.22,0,0,0,48.76,32L53,30.72a26.43,26.43,0,0,0,0-7.64l-4.27-1.25A22.16,22.16,0,0,0,45.94,15l2.14-3.9a26.37,26.37,0,0,0-5.41-5.4L38.78,7.86A22.47,22.47,0,0,0,32,5L30.72.78Z"/><path class="cls-2" d="M26.9,9.3A17.6,17.6,0,1,1,9.3,26.9,17.61,17.61,0,0,1,26.9,9.3Z"/><path class="cls-3" d="M37.9,22.5h-22V32.83c0,2.72,2.46,4.91,5.5,4.91h11a5.85,5.85,0,0,0,3.89-1.43,4.66,4.66,0,0,0,1.61-3.47V22.5Zm-11-7.28a2.2,2.2,0,1,1-2.2,2.2,2.2,2.2,0,0,1,2.2-2.2Z"/><path class="cls-4" d="M5,21.83.78,23.08a26.43,26.43,0,0,0,0,7.64L5,32a22.47,22.47,0,0,0,2.82,6.81L5.73,42.67a26.37,26.37,0,0,0,5.4,5.41L15,45.94a22.16,22.16,0,0,0,6.8,2.82L23.08,53a26.43,26.43,0,0,0,7.64,0L32,48.76a22.22,22.22,0,0,0,6.81-2.82l3.89,2.14a26.17,26.17,0,0,0,5.41-5.41l-2.14-3.89a22.54,22.54,0,0,0,1.61-3.08M48.76,32,53,30.72a26.43,26.43,0,0,0,0-7.64l-4.27-1.25A22.16,22.16,0,0,0,45.94,15l2.14-3.9a26.37,26.37,0,0,0-5.41-5.4L38.78,7.86A22.47,22.47,0,0,0,32,5L30.72.78a26.43,26.43,0,0,0-7.64,0L21.83,5A22.41,22.41,0,0,0,15,7.86l-3.9-2.13a26.57,26.57,0,0,0-5.4,5.4L7.86,15a22.37,22.37,0,0,0-1.6,3.07M26.9,9.3A17.6,17.6,0,1,1,9.3,26.9,17.61,17.61,0,0,1,26.9,9.3Zm11,13.2h-22V32.83c0,2.72,2.46,4.91,5.5,4.91h11a5.85,5.85,0,0,0,3.89-1.43,4.66,4.66,0,0,0,1.61-3.47V22.5ZM26.9,22v-2m0-4.85a2.2,2.2,0,1,1-2.2,2.2,2.2,2.2,0,0,1,2.2-2.2ZM21.32,26.9l2.47,1.63m8.69-1.63L30,28.53m.17,5.39H23.61"/></g></svg>',
  color4:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 53.8 45"><defs><style>.cls-1{fill:#62acf6;}.cls-1,.cls-2,.cls-3{fill-rule:evenodd;}.cls-2{fill:#def6ff;}.cls-3{fill:#f4dd45;}.cls-4{fill:none;stroke:#000;stroke-linecap:round;stroke-linejoin:round;}</style></defs><g><path class="cls-1" d="M11.5,44.5A11,11,0,0,1,6.08,23.93a12.06,12.06,0,0,1,4.64-8.22,12.45,12.45,0,0,1-.08-1.5A13.71,13.71,0,0,1,38,13.35a7.91,7.91,0,0,1,1.63-.16,8.37,8.37,0,0,1,7.57,11.92A7.9,7.9,0,0,1,48.9,30a8.2,8.2,0,0,1-.17,1.66,6.6,6.6,0,0,1-2,12.88Z"/><path class="cls-2" d="M26.9,14.07A12.84,12.84,0,1,1,14.07,26.9,12.84,12.84,0,0,1,26.9,14.07Z"/><path class="cls-3" d="M34.6,26.9A2.57,2.57,0,0,0,32,24.33H21.77a2.57,2.57,0,0,0,0,5.14H32A2.57,2.57,0,0,0,34.6,26.9Zm5.6-1.42a3.24,3.24,0,0,0-1.14-6.28,3.07,3.07,0,0,0-1.1.2l2.24,6.08Zm-26.59,0a3.24,3.24,0,0,1,1.13-6.28,3.17,3.17,0,0,1,1.11.2l-2.24,6.08Z"/><path class="cls-4" d="M27.45,44.5h-1.1m-3.85,0h-11A11,11,0,0,1,6.08,23.93a12.06,12.06,0,0,1,4.64-8.22,12.45,12.45,0,0,1-.08-1.5A13.71,13.71,0,0,1,38,13.35a7.91,7.91,0,0,1,1.63-.16,8.37,8.37,0,0,1,7.57,11.92A7.9,7.9,0,0,1,48.9,30a8.2,8.2,0,0,1-.17,1.66,6.6,6.6,0,0,1-2,12.88H31.3M26.9,14.07A12.84,12.84,0,1,1,14.07,26.9,12.84,12.84,0,0,1,26.9,14.07Zm0-4.77v8.8m7.7,8.8A2.57,2.57,0,0,0,32,24.33H21.77a2.57,2.57,0,0,0,0,5.14H32A2.57,2.57,0,0,0,34.6,26.9Zm-21-1.42a3.24,3.24,0,0,1,1.13-6.28,3.17,3.17,0,0,1,1.11.2M40.2,25.48a3.24,3.24,0,0,0-1.14-6.28,3.07,3.07,0,0,0-1.1.2"/></g></svg>',
  color5:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 53.8 45"><defs><style>.cls-1{fill:#f4dd45;}.cls-1,.cls-2,.cls-3,.cls-4{fill-rule:evenodd;}.cls-2{fill:#def6ff;}.cls-3{fill:#aaf4a5;}.cls-4{fill:#dd636e;}.cls-5{fill:none;stroke:#000;stroke-linecap:round;stroke-linejoin:round;}</style></defs><g><path class="cls-1" d="M26.9.5a22,22,0,1,1-22,22,22,22,0,0,1,22-22Z"/><path class="cls-2" d="M26.9,4.9A17.6,17.6,0,1,1,9.3,22.5,17.61,17.61,0,0,1,26.9,4.9Z"/><path class="cls-3" d="M4.11,20.06A5.56,5.56,0,0,1,6.06,9.3,5.65,5.65,0,0,1,8,9.63L4.11,20.06Zm45.58,0A5.56,5.56,0,0,0,47.75,9.3a5.66,5.66,0,0,0-1.9.33l3.84,10.43Z"/><path class="cls-4" d="M26.9,31.3a2.2,2.2,0,1,1-2.2,2.2,2.2,2.2,0,0,1,2.2-2.2Zm0-8.8a4.4,4.4,0,1,0-4.4-4.4H18.1a8.8,8.8,0,1,1,11,8.52V29.1H24.7V22.5Z"/><path class="cls-5" d="M15.13,3.91l.49-.3m3-1.49A21.79,21.79,0,0,1,26.9.5,22,22,0,1,1,12.37,6M26.9,4.9A17.6,17.6,0,1,1,9.3,22.5,17.61,17.61,0,0,1,26.9,4.9Zm0,26.4a2.2,2.2,0,1,1-2.2,2.2,2.2,2.2,0,0,1,2.2-2.2ZM4.11,20.06A5.56,5.56,0,0,1,6.06,9.3,5.65,5.65,0,0,1,8,9.63M49.69,20.06A5.56,5.56,0,0,0,47.75,9.3a5.66,5.66,0,0,0-1.9.33M26.9,22.5a4.4,4.4,0,1,0-4.4-4.4H18.1a8.8,8.8,0,1,1,11,8.52V29.1H24.7V22.5Z"/></g></svg>',
  color6:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 53.8 45"><defs><style>.cls-1{fill:#f4dd45;}.cls-1,.cls-3,.cls-4{fill-rule:evenodd;}.cls-2{fill:none;stroke:#000;stroke-linecap:round;stroke-linejoin:round;}.cls-3{fill:#def6ff;}.cls-4{fill:#62acf6;}</style></defs><g><path class="cls-1" d="M48.9,9.3H4.9V33.5a11,11,0,0,0,11,11h22a11,11,0,0,0,11-11V9.3Z"/><path class="cls-2" d="M26.9,9.3V4.9M40.1,20.3l-4.4,2.2,4.4,2.2"/><path class="cls-3" d="M44.5,18.1a2.2,2.2,0,0,0-2.2-2.2H11.5a2.21,2.21,0,0,0-2.2,2.2V35.7a2.2,2.2,0,0,0,2.2,2.2H42.3a2.19,2.19,0,0,0,2.2-2.2V18.1Z"/><path class="cls-4" d="M35.7,29.1H18.1a4.4,4.4,0,0,0,4.4,4.4h8.8a4.4,4.4,0,0,0,4.4-4.4ZM4.9,22.5a4.4,4.4,0,0,0,0,8.8V22.5Zm44,0a4.4,4.4,0,0,1,0,8.8V22.5Zm-33-2.2a2.2,2.2,0,1,1-2.2,2.2,2.2,2.2,0,0,1,2.2-2.2ZM26.9.5a2.2,2.2,0,1,1-2.2,2.2A2.2,2.2,0,0,1,26.9.5Z"/><path class="cls-2" d="M26.35,44.5h1.1m3.85,0h6.61a11,11,0,0,0,11-11V9.3H4.9V33.5a11,11,0,0,0,11,11h6.6M4.9,22.5a4.4,4.4,0,0,0,0,8.8V22.5Zm44,0a4.4,4.4,0,0,1,0,8.8V22.5ZM26.9.5a2.2,2.2,0,1,1-2.2,2.2A2.2,2.2,0,0,1,26.9.5Zm0,8.8V4.9m-11,15.4a2.2,2.2,0,1,1-2.2,2.2,2.2,2.2,0,0,1,2.2-2.2Zm24.2,0-4.4,2.2,4.4,2.2m-4.4,4.4H18.1a4.4,4.4,0,0,0,4.4,4.4h8.8a4.4,4.4,0,0,0,4.4-4.4Zm8.8-11a2.2,2.2,0,0,0-2.2-2.2H11.5a2.21,2.21,0,0,0-2.2,2.2V35.7a2.2,2.2,0,0,0,2.2,2.2H42.3a2.19,2.19,0,0,0,2.2-2.2V18.1Z"/></g></svg>',
};
function getAvatar(){return AVATARS[e.avatarIcon]||AVATARS.robot}

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
  if(!e.logo) return getAvatar();
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
  for(var ii=0;ii<imgs.length;ii++)imgs[ii].onerror=function(){this.outerHTML=getAvatar()};
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

/* Proactive engagement */
var proactiveKey="nova_proactive_"+e.name.replace(/[^a-z0-9]/gi,"_");
var proactiveShown=localStorage.getItem(proactiveKey)==="1";
var hasInteracted=false;

function openChat(){
  var c=document.getElementById("nc"),b=document.getElementById("nb");
  if(c.classList.contains("o")) return;
  c.classList.add("o");b.classList.add("o");
  b.setAttribute("aria-expanded","true");
  var badge=document.getElementById("nb-notif");
  if(badge)badge.style.display="none";
  document.getElementById("ni").focus();
  hasInteracted=true;
  localStorage.setItem(proactiveKey,"1");
  if(e.sendGreeting){
    setTimeout(function(){addMsg(e.welcomeTitle,"bot","ai")},600);
  }
}

/* Notification badge */
var notif=document.getElementById("nb-notif");
if(notif){
  if(e.showNotification&&e.notificationText&&!proactiveShown){
    notif.textContent=e.notificationText.length>6?e.notificationText.slice(0,6)+"...":e.notificationText;
    notif.style.display="flex";
  }else{
    notif.style.display="none";
  }
}

/* Proactive triggers (only once per visit) */
if(e.proactiveEnabled&&!proactiveShown){
  /* Auto-open after delay */
  if(e.autoOpenDelay>0){
    setTimeout(function(){if(!hasInteracted)openChat()},e.autoOpenDelay*1000);
  }
  /* Scroll trigger */
  if(e.scrollTrigger>0){
    var scrollHandler=function(){
      var scrollPct=window.scrollY/(document.documentElement.scrollHeight-window.innerHeight)*100;
      if(scrollPct>=e.scrollTrigger&&!hasInteracted){openChat();window.removeEventListener("scroll",scrollHandler)}
    };
    window.addEventListener("scroll",scrollHandler,{passive:true});
  }
  /* Exit intent */
  if(e.exitIntent){
    var exitHandler=function(ev){
      if(ev.clientY<=0&&!hasInteracted){openChat()}
    };
    document.addEventListener("mouseleave",exitHandler);
  }
}

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
    row.innerHTML='<div class="nba'+aiCls+'" aria-hidden="true">'+getAvatar()+'</div><div class="nmsg-bot"><div class="'+bubbleCls+'">'+renderMarkdown(text)+'</div>'+sourceHtml+'<div class="nts">'+time+'</div></div>';
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
  d.innerHTML='<div class="nba'+(aiMode?" ai":"")+'" aria-hidden="true">'+getAvatar()+'</div><div class="nmsg-bot"><div class="nty-bbl"><div class="nty-label">R\u00e9flexion en cours\u2026</div><div class="nty-dots" aria-hidden="true"><span></span><span></span><span></span></div></div></div>';
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
  hasInteracted=true;
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
  for(var wi2=0;wi2<wimgs.length;wi2++)wimgs[wi2].onerror=function(){this.outerHTML=getAvatar()};
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
  var isOpen=c.classList.contains("o");
  if(isOpen){
    c.classList.remove("o");b.classList.remove("o");
    b.setAttribute("aria-expanded","false");
    nac.classList.remove("o");selIdx=-1;
  }else{
    openChat();
  }
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
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function escapeJs(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/'/g, "\\'").replace(/\n/g, "\\n");
}
