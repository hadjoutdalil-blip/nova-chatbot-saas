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
  if(btn)btn.classList.toggle("on",aiMode);
}

/* CSS */
var t=document.createElement("style");
var C="";
C+=".nova-widget *{box-sizing:border-box;font-family:system-ui,-apple-system,sans-serif}";
C+="@keyframes nf{from{opacity:0;transform:translateY(16px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}";
C+="@keyframes ns{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}";
C+="@keyframes nb{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}";
/* button */
C+=".nb{position:fixed;bottom:"+e.marginBottom+"px;"+e.position+":"+e.marginRight+"px;width:56px;height:56px;border-radius:50%;background:"+e.primaryColor+";border:none;cursor:pointer;box-shadow:0 6px 24px "+e.primaryColor+"55;z-index:999999;display:flex;align-items:center;justify-content:center;transition:all .25s cubic-bezier(.34,1.56,.64,1)}";
C+=".nb:hover{transform:scale(1.12);box-shadow:0 8px 32px "+e.primaryColor+"66}";
C+=".nb svg{width:26px;height:26px;color:#fff;transition:transform .3s}";
C+=".nb.o{box-shadow:0 4px 16px rgba(0,0,0,.12)}.nb.o svg{transform:rotate(45deg)}";
/* card */
C+=".nc{position:fixed;bottom:"+(e.marginBottom+72)+"px;"+e.position+":"+e.marginRight+"px;width:380px;max-width:calc(100vw - 32px);height:580px;max-height:calc(100vh - 120px);background:#fff;border-radius:16px;box-shadow:0 8px 48px rgba(0,0,0,.14);z-index:999998;display:none;flex-direction:column;overflow:hidden;animation:nf .3s cubic-bezier(.34,1.56,.64,1)}";
C+=".nc.o{display:flex}";
C+="@media(max-width:480px){.nc{bottom:0;"+e.position+":0;width:100vw;max-width:100vw;height:100vh;max-height:100vh;border-radius:0}}";
/* maximized */
C+=".nc.max{bottom:16px;"+e.position+":16px;width:720px;max-width:calc(100vw - 32px);height:640px;max-height:calc(100vh - 40px);border-radius:20px}";
C+="@media(min-width:1200px){.nc.max{width:860px;height:680px}}";
C+="@media(max-width:760px){.nc.max{bottom:0;"+e.position+":0;width:100vw;max-width:100vw;height:100vh;max-height:100vh;border-radius:0}}";
/* header */
C+=".nh{background:"+e.primaryColor+";color:#fff;padding:14px 16px;display:flex;align-items:center;gap:10px;flex-shrink:0}";
C+=".nh h3{margin:0;font-size:14px;font-weight:600;line-height:1.3}";
C+=".nh p{margin:0;font-size:11px;opacity:.85}";
C+=".na{width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0}";
C+=".nh-actions{display:flex;align-items:center;gap:6px;margin-left:auto}";
C+=".nh-btn{width:30px;height:30px;border-radius:8px;background:rgba(0,0,0,.12);border:1px solid rgba(255,255,255,.15);color:#fff;font-size:13px;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;flex-shrink:0;line-height:1;padding:0}";
C+=".nh-btn:hover{background:rgba(255,255,255,.2);border-color:rgba(255,255,255,.3)}";
C+=".nh-btn svg{width:15px;height:15px}";
C+=".na-ai{width:30px;height:30px;border-radius:8px;background:rgba(0,0,0,.12);border:1px solid rgba(255,255,255,.15);color:#fff;font-size:14px;cursor:pointer;transition:all .25s;display:flex;align-items:center;justify-content:center;flex-shrink:0;line-height:1;padding:0}";
C+=".na-ai svg{width:15px;height:15px}";
C+=".na-ai.on{background:rgba(255,255,255,.22);border-color:#fff;box-shadow:0 0 12px rgba(255,255,255,.2)}";
C+=".na-ai:hover{background:rgba(255,255,255,.18)}";
C+=".na-ai.on:hover{background:rgba(255,255,255,.28)}";
/* messages */
C+=".nm{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:#f8f9fc;scroll-behavior:smooth}";
C+=".nm::-webkit-scrollbar{width:4px}.nm::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:4px}";
C+=".nmsg{max-width:82%;padding:10px 14px;font-size:13.5px;line-height:1.5;animation:ns .25s ease;word-wrap:break-word}";
C+=".nmsg.u{align-self:flex-end;background:"+e.primaryColor+";color:#fff;border-radius:14px 14px 4px 14px}";
C+=".nmsg.b{align-self:flex-start;background:#fff;color:#1f2937;border-radius:14px 14px 14px 4px;box-shadow:0 1px 4px rgba(0,0,0,.06)}";
C+=".nmsg.t{align-self:flex-start;background:#fff;padding:14px 18px;border-radius:14px;box-shadow:0 1px 4px rgba(0,0,0,.06);display:flex;gap:4px}";
C+=".nmsg.t span{width:7px;height:7px;border-radius:50%;background:#9ca3af;animation:nb 1s ease-in-out infinite}";
C+=".nmsg.t span:nth-child(2){animation-delay:.15s}.nmsg.t span:nth-child(3){animation-delay:.3s}";
C+=".nft{display:flex;align-items:center;gap:6px;margin-top:6px;flex-wrap:wrap}";
C+=".nsc{font-size:10px;font-weight:600;padding:1px 6px;border-radius:4px;line-height:1.4}";
C+=".nsc.green{background:#d1fae5;color:#065f46}.nsc.orange{background:#fef3c7;color:#92400e}.nsc.red{background:#fee2e2;color:#991b1b}";
C+=".nsrc{font-size:10px;color:#6b7280;line-height:1.4}";
/* welcome */
C+=".nw{padding:8px 0 4px}";
C+=".nw strong{display:block;font-size:14px;color:#1f2937;margin-bottom:2px}";
C+=".nw small{font-size:12px;color:#6b7280}";
C+=".nw-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}";
C+=".nw-chip{padding:8px 12px;border:1px solid #e5e7eb;border-radius:10px;font-size:12px;color:#374151;cursor:pointer;transition:all .15s;text-align:center;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.03)}";
C+=".nw-chip:hover{border-color:"+e.primaryColor+";color:"+e.primaryColor+";background:"+e.primaryColor+"0d;box-shadow:0 2px 8px "+e.primaryColor+"15}";
/* suggestions */
C+=".nchips{display:flex;flex-wrap:wrap;gap:6px;padding:4px 0}";
C+=".nchip{padding:6px 12px;border:1px solid #e5e7eb;border-radius:8px;font-size:12px;color:#374151;cursor:pointer;transition:all .15s;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.03)}";
C+=".nchip:hover{border-color:"+e.primaryColor+";color:"+e.primaryColor+";background:"+e.primaryColor+"0d}";
/* input */
C+=".ni{border-top:1px solid #e5e7eb;padding:10px 12px 12px;background:#fff;position:relative;flex-shrink:0}";
C+=".ni-inner{display:flex;align-items:center;gap:8px;background:#f3f4f6;border-radius:12px;padding:4px 4px 4px 14px;transition:all .2s;border:1px solid transparent}";
C+=".ni-inner:focus-within{border-color:"+e.primaryColor+";background:#fff;box-shadow:0 0 0 3px "+e.primaryColor+"1a}";
C+=".ni-inner input{flex:1;border:none;outline:none;font-size:13px;background:transparent;color:#1f2937;padding:6px 0;min-width:0}";
C+=".ni-inner input::placeholder{color:#9ca3af}";
C+=".ni-inner button{width:34px;height:34px;border-radius:10px;border:none;background:"+e.primaryColor+";color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s}";
C+=".ni-inner button:hover{opacity:.9;transform:scale(1.05)}";
C+=".ni-inner button svg{width:16px;height:16px}";
/* autocomplete */
C+=".nac{position:absolute;bottom:100%;left:12px;right:12px;background:#fff;border-radius:12px 12px 0 0;box-shadow:0 -4px 24px rgba(0,0,0,.1);display:none;max-height:200px;overflow-y:auto;padding:6px 0;margin-bottom:4px}";
C+=".nac.o{display:block}.nac .nac-item{padding:8px 14px;font-size:13px;color:#374151;cursor:pointer;transition:background .1s}";
C+=".nac .nac-item:hover,.nac .nac-item.sel{background:"+e.primaryColor+"0d;color:"+e.primaryColor+"}";
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
  reset:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>'
};

/* HTML */
var avatarHtml=e.logo?'<img src="'+e.logo+'" style="width:34px;height:34px;border-radius:50%;object-fit:cover" />':"\\ud83e\\udd16";

/* floating button */
var btn=document.createElement("button");
btn.className="nb";btn.id="nb";btn.innerHTML=ICONS.chat;
document.body.appendChild(btn);

/* welcome message */
var welcomeHtml='<div class="nw"><strong>'+e.welcomeTitle+'</strong><small>Que souhaitez-vous savoir ?</small>';
if(WC.length>0){
  welcomeHtml+='<div class="nw-grid">';
  for(var wi=0;wi<Math.min(WC.length,4);wi++){
    welcomeHtml+='<div class="nw-chip" data-q="'+WC[wi].replace(/"/g,"&quot;")+'">'+WC[wi]+'</div>';
  }
  welcomeHtml+="</div>";
}
welcomeHtml+="</div>";

/* chat card */
var card=document.createElement("div");
card.className="nc";card.id="nc";
card.innerHTML='<div class="nh"><div class="na">'+avatarHtml+'</div><div><h3>'+e.name+'</h3><p>'+e.welcomeSub+'</p></div><div class="nh-actions"><button id="na-ai" class="na-ai'+(aiMode?" on":"")+'">'+ICONS.brain+'</button><button id="na-reset" class="nh-btn" title="R\u00e9initialiser">'+ICONS.reset+'</button><button id="na-max" class="nh-btn" title="Agrandir">'+ICONS.maximize+'</button></div></div><div class="nm" id="nm">'+welcomeHtml+'</div><div class="ni"><div class="nac" id="nac"></div><div class="ni-inner"><input id="ni" placeholder="Posez votre question..." /><button id="ns">'+ICONS.send+'</button></div></div>'+(e.showBrand?'<div class="nf">Propuls\u00e9 par Nova Chatbot</div>':"");
document.body.appendChild(card);

/* welcome chip clicks */
var nwChips=card.querySelectorAll(".nw-chip");
for(var wi=0;wi<nwChips.length;wi++){
  nwChips[wi].onclick=function(){sendMessage(this.textContent);};
}

/* Message Helpers */
var chatHistory=[];

function addMsg(text,role,source,provider,clientName,score){
  var box=document.getElementById("nm"),msg=document.createElement("div");
  msg.className="nmsg "+(role==="user"?"u":"b");
  var txt=document.createTextNode(text);
  msg.appendChild(txt);
  if(source){
    var ft=document.createElement("span");ft.className="nft";
    if(source==="kb"&&score!=null){
      var cls=score>70?"green":score>40?"orange":"red";
      ft.innerHTML='<span class="nsc '+cls+'">\\u2713 '+score+'%</span><span class="nsrc">Base de connaissances</span>';
    }else if(source==="ai"&&provider){
      ft.innerHTML='<span class="nsrc">Propuls\u00e9 par '+provider+(clientName?" + contexte "+clientName:"")+"</span>";
    }
    msg.appendChild(ft);
  }
  box.appendChild(msg);
  box.scrollTop=box.scrollHeight;
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
  var d=document.createElement("div");d.className="nmsg t";d.id="nty";
  d.innerHTML="<span></span><span></span><span></span>";
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
document.getElementById("ni").oninput=function(){renderSuggestions(this.value);};
document.getElementById("ni").onblur=function(){setTimeout(function(){nac.classList.remove("o");selIdx=-1;},200);};

/* Send message */
function sendMessage(text){
  if(!text.trim()) return;
  nac.classList.remove("o");selIdx=-1;
  chatHistory.push({role:"user",content:text});
  addMsg(text,"user");
  document.getElementById("ni").value="";
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
  var welcomeHtml='<div class="nw"><strong>'+e.welcomeTitle+'</strong><small>Que souhaitez-vous savoir ?</small>';
  if(WC.length>0){
    welcomeHtml+='<div class="nw-grid">';
    for(var wi=0;wi<Math.min(WC.length,4);wi++){
      welcomeHtml+='<div class="nw-chip" data-q="'+WC[wi].replace(/"/g,"&quot;")+'">'+WC[wi]+'</div>';
    }
    welcomeHtml+="</div>";
  }
  welcomeHtml+="</div>";
  box.innerHTML=welcomeHtml;
  var nwChips=box.querySelectorAll(".nw-chip");
  for(var wi=0;wi<nwChips.length;wi++){
    nwChips[wi].onclick=function(){sendMessage(this.textContent);};
  }
};

/* Events */
document.getElementById("nb").onclick=function(){
  var c=document.getElementById("nc"),b=document.getElementById("nb");
  c.classList.toggle("o");b.classList.toggle("o");
  if(c.classList.contains("o")){document.getElementById("ni").focus();}else{nac.classList.remove("o");selIdx=-1;}
};
document.getElementById("na-ai").onclick=toggleAI;
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
  if(e.key==="Enter"){
    if(open&&selIdx>=0){
      e.preventDefault();
      selectSuggestion(nac.querySelectorAll(".nac-item")[selIdx].textContent);
    }else{
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
