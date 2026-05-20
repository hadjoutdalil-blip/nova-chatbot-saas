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

/* ── Mode IA (localStorage) ── */
var aiKey="nova_ai_"+e.name.replace(/[^a-z0-9]/gi,"_");
var store=localStorage.getItem(aiKey);
var aiMode=store===null||store==="true";

function toggleAI(){
  aiMode=!aiMode;
  localStorage.setItem(aiKey,aiMode?"true":"false");
  var btn=document.getElementById("na-ai");
  if(btn)btn.classList.toggle("on",aiMode);
}

/* ── CSS ── */
var t=document.createElement("style");
t.textContent=".nova-widget *{box-sizing:border-box;font-family:system-ui,-apple-system,sans-serif}@keyframes nf{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes ns{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes nb{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}.nb{position:fixed;bottom:"+e.marginBottom+"px;"+e.position+":"+e.marginRight+"px;width:60px;height:60px;border-radius:50%;background:"+e.primaryColor+";border:none;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,.2);z-index:999999;display:flex;align-items:center;justify-content:center;transition:transform .2s}.nb:hover{transform:scale(1.1)}.nb svg{width:28px;height:28px;color:#fff}.nb.o{transform:rotate(45deg)}.nc{position:fixed;bottom:"+(e.marginBottom+80)+"px;"+e.position+":"+e.marginRight+"px;width:380px;max-width:calc(100vw - 40px);height:580px;max-height:calc(100vh - 120px);background:#fff;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,.15);z-index:999998;display:none;flex-direction:column;overflow:hidden;animation:nf .3s ease}.nc.o{display:flex}.nh{background:"+e.primaryColor+";color:#fff;padding:12px 16px;display:flex;align-items:center;gap:10px}.nh h3{margin:0;font-size:15px;font-weight:600;line-height:1.3}.nh p{margin:0;font-size:11px;opacity:.85}.na{width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0}.na-ai{width:32px;height:32px;border-radius:50%;background:rgba(0,0,0,.15);border:1px solid rgba(255,255,255,.2);color:#fff;font-size:16px;cursor:pointer;transition:all .25s;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-left:auto;line-height:1}.na-ai.on{background:rgba(255,255,255,.25);border-color:#fff;box-shadow:0 0 10px rgba(255,255,255,.25)}.na-ai:hover{background:rgba(255,255,255,.2)}.nm{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:6px;scroll-behavior:smooth}.nmsg{max-width:82%;padding:10px 14px;border-radius:16px;font-size:14px;line-height:1.55;animation:ns .25s ease;white-space:pre-wrap;word-break:break-word}.nmsg.b{align-self:flex-start;background:#f1f3f5;color:#1a1a1a;border-bottom-left-radius:4px}.nmsg.u{align-self:flex-end;background:"+e.primaryColor+";color:#fff;border-bottom-right-radius:4px}.nmsg .nft{display:block;margin-top:6px;font-size:10px;line-height:1.4}.nmsg .nft .nsc{display:inline-block;padding:1px 6px;border-radius:4px;font-weight:700;margin-right:4px}.nmsg .nft .nsc.green{background:#d1fae5;color:#065f46}.nmsg .nft .nsc.orange{background:#fef3c7;color:#92400e}.nmsg .nft .nsc.red{background:#fee2e2;color:#991b1b}.nmsg .nft .nsrc{opacity:.6}.nchips{display:flex;flex-wrap:wrap;gap:6px;align-self:flex-start;margin-top:2px;margin-bottom:4px;animation:ns .3s ease}.nchip{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:6px 14px;font-size:12px;color:#4b5563;cursor:pointer;transition:all .15s;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.nchip:hover{border-color:"+e.primaryColor+";color:"+e.primaryColor+";background:#f5f3ff}.nw{max-width:90%;align-self:flex-start;background:#f1f3f5;border-radius:16px;border-bottom-left-radius:4px;padding:12px 14px;animation:ns .3s ease}.nw strong{display:block;font-size:14px;color:#1a1a1a;margin-bottom:2px}.nw small{font-size:12px;color:#6b7280;display:block;margin-bottom:10px}.nw-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}.nw-chip{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:8px 10px;font-size:12px;color:#374151;cursor:pointer;text-align:center;transition:all .15s;line-height:1.3;overflow:hidden;text-overflow:ellipsis}.nw-chip:hover{border-color:"+e.primaryColor+";color:"+e.primaryColor+";background:#f5f3ff;transform:scale(1.02)}.nmsg.t{align-self:flex-start;background:#f1f3f5;display:flex;gap:5px;padding:14px 18px;border-radius:16px;border-bottom-left-radius:4px}.nmsg.t span{width:7px;height:7px;border-radius:50%;background:#9ca3af;animation:nb 1.2s ease-in-out infinite}.nmsg.t span:nth-child(2){animation-delay:.2s}.nmsg.t span:nth-child(3){animation-delay:.4s}.ni{display:flex;padding:8px 10px;gap:6px;border-top:1px solid #eee;align-items:center;background:#fff;position:relative}.ni input{flex:1;border:1px solid #ddd;border-radius:20px;padding:9px 14px;font-size:13px;outline:none;transition:border .2s}.ni input:focus{border-color:"+e.primaryColor+"}.ni button{width:36px;height:36px;border-radius:50%;background:"+e.primaryColor+";border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:opacity .2s}.ni button:hover{opacity:.85}.ni button svg{width:16px;height:16px;color:#fff}.nf{text-align:center;font-size:10px;color:#bbb;padding:5px;border-top:1px solid #f3f3f3}.nac{position:absolute;bottom:100%;left:12px;right:12px;max-height:200px;overflow-y:auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 -4px 24px rgba(0,0,0,.1);margin-bottom:6px;display:none;z-index:20}.nac.o{display:block}.nac-item{padding:10px 14px;font-size:13px;cursor:pointer;border-bottom:1px solid #f3f4f6;transition:background .12s;color:#1f2937}.nac-item:last-child{border-bottom:none}.nac-item:hover,.nac-item.sel{background:#f5f3ff;color:#7c3aed}";
document.head.appendChild(t);

/* ── HTML ── */
var a=e.logo?'<img src="'+e.logo+'" style="width:34px;height:34px;border-radius:50%;object-fit:cover" />':"\ud83e\udd16";

var btn=document.createElement("button");
btn.className="nb";btn.id="nb";
btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
document.body.appendChild(btn);

/* message de bienvenue avec grille 2×2 */
var welcomeHtml='<div class="nw"><strong>'+e.welcomeTitle+'</strong><small>Que souhaitez-vous savoir\u00a0?</small>';
if(WC.length>0){
  welcomeHtml+='<div class="nw-grid">';
  for(var wi=0;wi<Math.min(WC.length,4);wi++){
    welcomeHtml+='<div class="nw-chip" data-q="'+WC[wi].replace(/"/g,"&quot;")+'">'+WC[wi]+'</div>';
  }
  welcomeHtml+="</div>";
}
welcomeHtml+="</div>";

var card=document.createElement("div");
card.className="nc";card.id="nc";
card.innerHTML='<div class="nh"><div class="na">'+a+'</div><div><h3>'+e.name+'</h3><p>'+e.welcomeSub+'</p></div><button id="na-ai" class="na-ai'+(aiMode?" on":"")+'">\uD83E\uDDE0</button></div><div class="nm" id="nm">'+welcomeHtml+'</div><div class="ni"><div class="nac" id="nac"></div><input id="ni" placeholder="Posez votre question..." /><button id="ns"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button></div>'+(e.showBrand?'<div class="nf">Propuls\u00e9 par Nova Chatbot</div>':"");
document.body.appendChild(card);

/* clic sur les chips du welcome */
var nwChips=card.querySelectorAll(".nw-chip");
for(var wi=0;wi<nwChips.length;wi++){
  nwChips[wi].onclick=function(){sendMessage(this.textContent);};
}

/* ── Message Helpers ── */
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
      ft.innerHTML='<span class="nsc '+cls+'">\u2713 '+score+'%</span><span class="nsrc">Base de connaissances</span>';
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

/* ── Autocomplétion ── */
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

/* ── Envoyer un message → serveur ── */
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
      addMsg("Je n'ai pas trouvé de réponse. Contactez-nous pour plus d'informations.","bot","fallback");
    }
  };
  xhr.onerror=function(){
    hideTyping();
    addMsg("Erreur réseau. Veuillez réessayer.","bot","fallback");
  };
  xhr.send(JSON.stringify({message:text,history:chatHistory.slice(0,-1),aiMode:aiMode}));
}

/* ── Events ── */
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
