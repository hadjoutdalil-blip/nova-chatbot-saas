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
      if (k.alt_questions) qs.push(...k.alt_questions.split(",").map((s: string) => s.trim()).filter(Boolean));
      return qs;
    })
  );
  const WC_JSON = JSON.stringify(kbEntries.slice(0, 4).map((k: any) => k.question));

  const script = `(function(){
var e={chatUrl:"${escapeJs(chatUrl)}",name:"${escapeJs(name)}",logo:"${escapeJs(logo)}",primaryColor:"${escapeJs(primaryColor)}",position:"${escapeJs(pos)}",marginBottom:${mb},marginRight:${mr},welcomeTitle:"${escapeJs(welcomeTitle)}",welcomeSub:"${escapeJs(welcomeSub)}",showBrand:${showBrand}};

var KQ=${KQ_JSON};
var WC=${WC_JSON};

/* Mode IA */
var aiKey="nova_ai_"+e.name.replace(/[^a-z0-9]/gi,"_");
var store=localStorage.getItem(aiKey);
var aiMode=store===null||store==="true";

function toggleAI(){
  aiMode=!aiMode;
  localStorage.setItem(aiKey,aiMode?"true":"false");
  var btn=document.getElementById("na-ai");
  var av=document.getElementById("na-av");
  var sb=document.getElementById("na-sb");
  var ib=document.getElementById("na-ind");
  var iw=document.getElementById("na-iw");
  var sk=document.getElementById("na-sk");
  if(btn)btn.classList.toggle("on",aiMode);
  if(av)av.classList.toggle("ai-mode",aiMode);
  if(sb)sb.style.display=aiMode?"flex":"none";
  if(ib)ib.style.display=aiMode?"inline-flex":"none";
  if(iw)iw.classList.toggle("ai-focus",aiMode);
  if(sk)sk.classList.toggle("ai-mode",aiMode);
}

/* CSS */
var t=document.createElement("style");
var C="";
var op=e.position==="right"?"left":"right";
C+=".nova-widget *{box-sizing:border-box;font-family:system-ui,-apple-system,sans-serif}";
C+="@keyframes nf{from{opacity:0;transform:translateY(16px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}";
C+="@keyframes nr{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}";
C+="@keyframes nl{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:translateX(0)}}";
C+="@keyframes nb{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}";
C+="@keyframes na-pulse{0%,100%{box-shadow:0 0 0 0 rgba(168,85,247,.7)}50%{box-shadow:0 0 0 5px rgba(168,85,247,0)}}";
C+="@keyframes nfade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}";
/* button */
C+=".nb{position:fixed;bottom:"+e.marginBottom+"px;"+op+":auto;"+e.position+":"+e.marginRight+"px;width:62px;height:62px;border-radius:50%;background:linear-gradient(135deg,"+e.primaryColor+","+e.primaryColor+"dd);border:none;cursor:pointer;box-shadow:0 8px 32px "+e.primaryColor+"55;z-index:999999;display:flex;align-items:center;justify-content:center;transition:all .3s cubic-bezier(.4,0,.2,1)}";
C+=".nb:hover{transform:scale(1.08) translateY(-2px);box-shadow:0 10px 36px "+e.primaryColor+"66}";
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
/* header */
C+=".nh{background:linear-gradient(135deg,"+e.primaryColor+","+e.primaryColor+"dd);padding:14px 16px;display:flex;align-items:center;gap:12px;flex-shrink:0;position:relative}";
C+=".nh h3{margin:0;font-size:14px;font-weight:700;line-height:1.3;color:#fff}";
C+=".nh p{margin:0;font-size:11px;opacity:.85;color:#fff}";
C+=".na{width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,.18);border:2px solid rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;position:relative}";
C+=".na::after{content:'';position:absolute;bottom:2px;right:2px;width:11px;height:11px;background:#16a34a;border-radius:50%;border:2px solid "+e.primaryColor+"}";
C+=".na.ai-mode{background:linear-gradient(135deg,#7c3aed,#9333ea)}";
C+=".na.ai-mode::after{background:#a855f7;border-color:#7c3aed;animation:na-pulse 2s infinite}";
C+=".na img{width:38px;height:38px;border-radius:50%;object-fit:cover}";
C+=".nh-actions{display:flex;align-items:center;gap:6px;margin-left:auto}";
C+=".nh-btn{width:34px;height:34px;border-radius:8px;background:rgba(255,255,255,.1);border:none;color:#fff;font-size:13px;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center;flex-shrink:0;line-height:1;padding:0}";
C+=".nh-btn:hover{background:rgba(255,255,255,.22);transform:scale(1.06)}";
C+=".nh-btn svg{width:15px;height:15px}";
C+=".na-ai{width:34px;height:34px;border-radius:8px;background:rgba(255,255,255,.1);border:none;color:#fff;font-size:14px;cursor:pointer;transition:all .25s;display:flex;align-items:center;justify-content:center;flex-shrink:0;line-height:1;padding:0}";
C+=".na-ai svg{width:15px;height:15px}";
C+=".na-ai.on{background:rgba(168,85,247,.4)}";
C+=".na-ai:hover{background:rgba(255,255,255,.22)}";
C+=".na-ai.on:hover{background:rgba(168,85,247,.5)}";
/* status bar */
C+=".n-powered{padding:7px 14px;font-size:11px;color:#6b7280;border-bottom:1px solid #e5e7eb;background:#fcfcfe;display:flex;align-items:center;justify-content:center;gap:10px;flex-shrink:0}";
C+=".n-ind{display:none;align-items:center;gap:4px;background:linear-gradient(90deg,#7c3aed,#9333ea);color:#fff;padding:2px 9px;border-radius:12px;font-size:10px;font-weight:600}";
/* messages */
C+=".nm{flex:1;overflow-y:auto;padding:18px 16px;display:flex;flex-direction:column;gap:12px;background:#f4f7fb;scroll-behavior:smooth}";
C+=".nm::-webkit-scrollbar{width:5px}.nm::-webkit-scrollbar-thumb{background:#dde6ef;border-radius:3px}";
/* user message */
C+=".nmsg.u{align-self:flex-end;max-width:84%;animation:nr .28s ease}";
C+=".nmsg.u .nmsg-bbl{background:linear-gradient(135deg,"+e.primaryColor+","+e.primaryColor+"dd);color:#fff;padding:12px 15px;border-radius:18px 18px 4px 18px;font-size:13.5px;line-height:1.6;box-shadow:0 3px 10px "+e.primaryColor+"33}";
/* bot message row */
C+=".nmsg.b{display:flex;gap:9px;max-width:92%;animation:nl .28s ease}";
C+=".nba{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,"+e.primaryColor+",#4a90d9);display:flex;align-items:center;justify-content:center;font-size:13px;color:#fff;flex-shrink:0;margin-top:2px}";
C+=".nba.ai{background:linear-gradient(135deg,#7c3aed,#9333ea)}";
C+=".nmsg-bot{flex:1;min-width:0}";
C+=".nmsg-bbl{background:#fff;border:1px solid #e5e7eb;padding:12px 15px;border-radius:18px 18px 18px 4px;font-size:13.5px;line-height:1.72;color:#0d1b2a;box-shadow:0 1px 6px rgba(0,0,0,.05)}";
C+=".nmsg-bbl.ai-enhanced{border-left:3px solid #7c3aed;background:linear-gradient(135deg,#fff,#f5f3ff)}";
C+=".nft{display:flex;align-items:center;gap:6px;margin-top:5px;flex-wrap:wrap}";
C+=".nsc{font-size:10.5px;font-weight:600;padding:1px 6px;border-radius:4px;line-height:1.4}";
C+=".nsc.green{background:#d1fae5;color:#065f46}.nsc.orange{background:#fef3c7;color:#92400e}.nsc.red{background:#fee2e2;color:#991b1b}";
C+=".nsrc{font-size:10.5px;color:#6b7280;line-height:1.4;font-style:italic}";
C+=".nsrc.ai{color:#7c3aed;font-weight:500;font-style:normal}";
/* welcome */
C+=".nw{text-align:center;padding:14px 8px}";
C+=".nw-icon{width:56px;height:56px;background:linear-gradient(135deg,"+e.primaryColor+",#00b4cc);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:22px;color:#fff;box-shadow:0 6px 20px "+e.primaryColor+"44}";
C+=".nw-title{font-size:15px;font-weight:800;color:#0d1b2a;margin-bottom:6px}";
C+=".nw-sub{font-size:12.5px;color:#6b7280;line-height:1.7;margin-bottom:16px}";
C+=".nw-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:0}";
C+=".nw-chip{background:#f4f7fb;border:1.5px solid #e5e7eb;border-radius:12px;padding:10px 7px;text-align:center;cursor:pointer;font-size:12px;font-weight:600;color:#0d1b2a;transition:all .14s}";
C+=".nw-chip:hover{border-color:"+e.primaryColor+";color:"+e.primaryColor+";background:"+e.primaryColor+"0a}";
C+=".nw-chip .nw-chip-icon{font-size:17px;display:block;margin-bottom:3px}";
/* suggestion chips */
C+=".nchips{display:flex;flex-wrap:wrap;gap:7px;margin-top:9px;margin-left:41px}";
C+=".nchip{padding:5px 13px;background:#fff;border:1px solid #e5e7eb;border-radius:20px;font-size:12px;color:#0d1b2a;font-weight:600;cursor:pointer;transition:all .14s}";
C+=".nchip:hover{background:"+e.primaryColor+";color:#fff;border-color:"+e.primaryColor+";transform:translateY(-1px)}";
/* typing */
C+=".nty{display:flex;gap:9px;max-width:92%;animation:nl .2s ease}";
C+=".nty-bbl{background:#fff;border:1px solid #e5e7eb;padding:14px 16px;border-radius:18px 18px 18px 4px}";
C+=".nty-label{font-size:11px;color:#7c3aed;margin-bottom:6px}";
C+=".nty-dots{display:flex;gap:5px}";
C+=".nty-dots span{width:7px;height:7px;background:#d1d5db;border-radius:50%;animation:nb .8s infinite ease-in-out}";
C+=".nty-dots span:nth-child(2){animation-delay:.16s}.nty-dots span:nth-child(3){animation-delay:.32s}";
/* input */
C+=".ni{border-top:1px solid #e5e7eb;padding:14px;background:#fff;position:relative;flex-shrink:0}";
C+=".ni-inner{display:flex;align-items:flex-end;gap:9px;background:#f4f7fb;border:2px solid #e5e7eb;border-radius:18px;padding:5px 5px 5px 14px;transition:all .2s}";
C+=".ni-inner:focus-within{border-color:"+e.primaryColor+";box-shadow:0 0 0 4px "+e.primaryColor+"15}";
C+=".ni-inner.ai-focus:focus-within{border-color:#7c3aed;box-shadow:0 0 0 4px rgba(124,58,237,.18)}";
C+=".ni-inner textarea{flex:1;border:none;outline:none;font-size:14px;background:transparent;color:#0d1b2a;resize:none;min-height:38px;max-height:96px;font-family:inherit;line-height:1.5;padding:7px 0}";
C+=".ni-inner textarea::placeholder{color:#6b7280}";
C+=".ni-inner button{width:38px;height:38px;border-radius:12px;border:none;background:"+e.primaryColor+";color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .14s}";
C+=".ni-inner button:hover:not(:disabled){background:"+e.primaryColor+"dd;transform:scale(1.05)}";
C+=".ni-inner button:disabled{opacity:.45;cursor:not-allowed}";
C+=".ni-inner button.ai-mode{background:#7c3aed}";
C+=".ni-inner button.ai-mode:hover:not(:disabled){background:#6d28d9}";
C+=".ni-inner button svg{width:16px;height:16px}";
/* autocomplete */
C+=".nac{position:absolute;bottom:100%;left:12px;right:12px;background:#fff;border:1px solid #e5e7eb;border-radius:12px 12px 0 0;box-shadow:0 -4px 24px rgba(0,0,0,.1);display:none;max-height:200px;overflow-y:auto;padding:6px 0;margin-bottom:6px}";
C+=".nac.o{display:block;animation:nfade .18s ease}";
C+=".nac-item{padding:8px 14px;font-size:13px;color:#374151;cursor:pointer;transition:background .1s}";
C+=".nac-item:hover,.nac-item.sel{background:"+e.primaryColor+"0d;color:"+e.primaryColor+"}";
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
  robot:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>'
};

/* HTML */
var avatarHtml=e.logo?'<img src="'+e.logo+'" />':ICONS.robot;

/* floating button */
var btn=document.createElement("button");
btn.className="nova-widget nb";btn.id="nb";btn.innerHTML=ICONS.chat+'<span class="nb-notif" id="nb-notif"></span>';
document.body.appendChild(btn);

/* welcome message */
var welcomeHtml='<div class="nw"><div class="nw-icon">'+ICONS.robot+'</div><div class="nw-title">'+e.welcomeTitle+'</div><div class="nw-sub">'+e.welcomeSub+'</div>';
if(WC.length>0){
  welcomeHtml+='<div class="nw-grid">';
  for(var wi=0;wi<Math.min(WC.length,4);wi++){
    welcomeHtml+='<div class="nw-chip" data-q="'+WC[wi].replace(/"/g,"&quot;")+'"><span class="nw-chip-icon">\\ud83d\\udcac</span>'+WC[wi]+'</div>';
  }
  welcomeHtml+="</div>";
}
welcomeHtml+="</div>";

/* chat card */
var card=document.createElement("div");
card.className="nova-widget nc";card.id="nc";
card.innerHTML='<div class="nh"><div class="na" id="na-av">'+avatarHtml+'</div><div><h3>'+e.name+'</h3><p>'+e.welcomeSub+'</p></div><div class="nh-actions"><button id="na-ai" class="na-ai'+(aiMode?" on":"")+'" title="Activer / D\u00e9sactiver le mode IA">'+ICONS.brain+'</button><button id="na-max" class="nh-btn" title="Agrandir">'+ICONS.maximize+'</button><button id="na-reset" class="nh-btn" title="R\u00e9initialiser">'+ICONS.reset+'</button></div></div><div class="n-powered" id="na-pw"><span id="na-sb" style="display:'+(aiMode?"flex":"none")+'"><span class="n-ind" id="na-ind" style="display:'+(aiMode?"inline-flex":"none")+'">'+ICONS.brain+' IA Active</span></span><span id="na-sk" style="color:#6b7280">Base de connaissances</span></div><div class="nm" id="nm">'+welcomeHtml+'</div><div class="ni"><div class="nac" id="nac"></div><div class="ni-inner'+(aiMode?" ai-focus":"")+'" id="na-iw"><textarea id="ni" placeholder="Posez votre question..." rows="1"></textarea><button id="ns'+(aiMode?" ai-mode":"")+'">'+ICONS.send+'</button></div></div>'+(e.showBrand?'<div class="nf">Propuls\u00e9 par Nova Chatbot</div>':"");
document.body.appendChild(card);

/* auto-resize textarea */
document.getElementById("ni").oninput=function(){
  this.style.height="auto";
  this.style.height=Math.min(this.scrollHeight,90)+"px";
  renderSuggestions(this.value);
};

/* welcome chip clicks */
var nwChips=card.querySelectorAll(".nw-chip");
for(var wi=0;wi<nwChips.length;wi++){
  nwChips[wi].onclick=function(){sendMessage(this.textContent.trim());};
}

/* Show notification badge initially */
var notif=document.getElementById("nb-notif");
if(notif)notif.style.display="flex";

/* Message Helpers */
var chatHistory=[];

function addMsg(text,role,source,provider,clientName,score){
  var box=document.getElementById("nm"),row=document.createElement("div");
  if(role==="user"){
    row.className="nmsg u";
    row.innerHTML='<div class="nmsg-bbl">'+escHtml(text)+'</div>';
  }else{
    row.className="nmsg b";
    var aiCls=(source==="ai"||aiMode)?" ai":"";
    var bubbleCls=(source==="ai"||aiMode)?" nmsg-bbl ai-enhanced":" nmsg-bbl";
    var sourceHtml="";
    if(source==="kb"&&score!=null){
      var cls=score>70?"green":score>40?"orange":"red";
      sourceHtml='<div class="nft"><span class="nsc '+cls+'">\\u2713 '+score+'%</span><span class="nsrc">Base de connaissances</span></div>';
    }else if(source==="ai"&&provider){
      sourceHtml='<div class="nft"><span class="nsrc ai">Propuls\u00e9 par '+provider+(clientName?" + contexte "+clientName:"")+'</span></div>';
    }else if(source==="fallback"){
      sourceHtml='<div class="nft"><span class="nsrc">Fallback</span></div>';
    }
    row.innerHTML='<div class="nba'+aiCls+'">'+ICONS.robot+'</div><div class="nmsg-bot"><div class="'+bubbleCls+'">'+escHtml(text)+'</div>'+sourceHtml+'</div>';
  }
  box.appendChild(row);
  box.scrollTop=box.scrollHeight;
}
function escHtml(s){
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
function addSuggestions(questions){
  if(!questions||questions.length===0) return;
  var box=document.getElementById("nm"),cp=document.createElement("div");cp.className="nchips";
  for(var ri=0;ri<questions.length;ri++){
    var cc=document.createElement("div");cc.className="nchip";
    cc.textContent=questions[ri];
    cc.onclick=function(){sendMessage(this.textContent);};
    cp.appendChild(cc);
  }
  box.appendChild(cp);
  box.scrollTop=box.scrollHeight;
}
function showTyping(){
  var box=document.getElementById("nm");
  if(document.getElementById("nty")) return;
  var d=document.createElement("div");d.className="nty";d.id="nty";
  d.innerHTML='<div class="nba'+(aiMode?" ai":"")+'">'+ICONS.robot+'</div><div class="nmsg-bot"><div class="nty-bbl"><div class="nty-label">R\u00e9flexion en cours</div><div class="nty-dots"><span></span><span></span><span></span></div></div></div>';
  box.appendChild(d);box.scrollTop=box.scrollHeight;
}
function hideTyping(){var d=document.getElementById("nty");if(d)d.remove();}

/* Autocompletion */
var selIdx=-1,nac=document.getElementById("nac");

function renderSuggestions(val){
  if(val.length<2||KQ.length===0){
    nac.classList.remove("o");selIdx=-1;return;
  }
  var vl=val.toLowerCase();
  var items=[];
  for(var i=0;i<KQ.length;i++){
    if(KQ[i].toLowerCase().includes(vl)) items.push({q:KQ[i],i:i});
  }
  nac.innerHTML="";
  var max=Math.min(items.length,8);
  for(var i=0;i<max;i++){
    var d=document.createElement("div");
    d.className="nac-item";d.textContent=items[i].q;d.dataset.idx=i;
    d.onclick=function(){selectSuggestion(this.textContent);};
    nac.appendChild(d);
  }
  nac.classList.add("o");selIdx=-1;
}
function selectSuggestion(q){
  nac.classList.remove("o");selIdx=-1;
  document.getElementById("ni").value=q;
  sendMessage(q);
}
document.getElementById("ni").onblur=function(){setTimeout(function(){nac.classList.remove("o");selIdx=-1;},200);};

/* Send message */
function sendMessage(text){
  if(!text.trim()) return;
  nac.classList.remove("o");selIdx=-1;
  chatHistory.push({role:"user",content:text});
  addMsg(text,"user");
  document.getElementById("ni").value="";
  document.getElementById("ni").style.height="auto";
  showTyping();
  var xhr=new XMLHttpRequest();
  xhr.open("POST",e.chatUrl,true);
  xhr.setRequestHeader("Content-Type","application/json");
  xhr.onload=function(){
    hideTyping();
    try{
      var resp=JSON.parse(xhr.responseText);
      addMsg(resp.response,"bot",resp.source,resp.provider,resp.clientName,resp.score);
      chatHistory.push({role:"assistant",content:resp.response});
      if(chatHistory.length>20) chatHistory=chatHistory.slice(-20);
      addSuggestions(resp.suggestions);
    }catch(_){
      addMsg("Je n'ai pas trouv\u00e9 de r\u00e9ponse. Contactez-nous pour plus d'informations.","bot","fallback");
    }
  };
  xhr.onerror=function(){
    hideTyping();
    addMsg("Erreur r\u00e9seau. Veuillez r\u00e9essayer.","bot","fallback");
  };
  xhr.send(JSON.stringify({message:text,history:chatHistory.slice(0,-1),aiMode:aiMode}));
}

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
  var welcomeHtml='<div class="nw"><div class="nw-icon">'+ICONS.robot+'</div><div class="nw-title">'+e.welcomeTitle+'</div><div class="nw-sub">'+e.welcomeSub+'</div>';
  if(WC.length>0){
    welcomeHtml+='<div class="nw-grid">';
    for(var wi=0;wi<Math.min(WC.length,4);wi++){
      welcomeHtml+='<div class="nw-chip" data-q="'+WC[wi].replace(/"/g,"&quot;")+'"><span class="nw-chip-icon">\\ud83d\\udcac</span>'+WC[wi]+'</div>';
    }
    welcomeHtml+="</div>";
  }
  welcomeHtml+="</div>";
  box.innerHTML=welcomeHtml;
  var nwChips=box.querySelectorAll(".nw-chip");
  for(var wi=0;wi<nwChips.length;wi++){
    nwChips[wi].onclick=function(){sendMessage(this.textContent.trim());};
  }
};

/* AI toggle events */
document.getElementById("na-ai").onclick=toggleAI;

/* Events */
document.getElementById("nb").onclick=function(){
  var c=document.getElementById("nc"),b=document.getElementById("nb");
  c.classList.toggle("o");b.classList.toggle("o");
  var notif=document.getElementById("nb-notif");
  if(notif)notif.style.display="none";
  if(c.classList.contains("o")){document.getElementById("ni").focus();}else{nac.classList.remove("o");selIdx=-1;}
};
document.getElementById("ns").onclick=function(){sendMessage(document.getElementById("ni").value)};
document.getElementById("ni").onkeydown=function(e){
  var open=nac.classList.contains("o");
  if(open&&(e.key==="ArrowDown"||e.key==="ArrowUp")){
    e.preventDefault();
    var items=nac.querySelectorAll(".nac-item");
    if(e.key==="ArrowDown"&&selIdx<items.length-1) selIdx++;
    if(e.key==="ArrowUp"&&selIdx>0) selIdx--;
    for(var i=0;i<items.length;i++) items[i].classList.toggle("sel",i===selIdx);
    if(selIdx>=0) items[selIdx].scrollIntoView({block:"nearest"});
    return;
  }
  if(e.key==="Enter"&&!e.shiftKey){
    if(open&&selIdx>=0){
      e.preventDefault();
      selectSuggestion(nac.querySelectorAll(".nac-item")[selIdx].textContent);
    }else{
      e.preventDefault();
      sendMessage(e.target.value);
    }
    return;
  }
  if(e.key==="Escape"&&open){nac.classList.remove("o");selIdx=-1;}
};
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
