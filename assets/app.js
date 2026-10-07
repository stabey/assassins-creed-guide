(function(){
"use strict";
var INIT_HASH=location.hash;
var G=window.AC_GAMES,L=window.AC_LINKS,T=window.AC_TYPES,COLS=window.AC_COLS,IMG=window.AC_IMG||{},MOD=window.AC_MODERN_NODES,TH=window.AC_THREADS,LORE=window.AC_LORE;
var byId={};G.forEach(function(g){byId[g.id]=g;});
MOD.forEach(function(m){byId[m.id]=m;m.modern=true;});
var HERO={ac1:["altair"],bloodlines:["altair"],altchron:["altair"],acr:["ezio","altair"],ac2:["ezio"],acb:["ezio"],discovery:["ezio"],embers:["ezio","shaojun"],ac4:["edward"],resynced:["edward"],ac3:["connor","haytham"],rogue:["shay","haytham"],unity:["arno"],deadkings:["arno"],odyssey:["kassandra"],firstblade:["kassandra"],atlantis:["kassandra"],valhalla:["eivor"],druids:["eivor"],siege:["eivor"],origins:["bayek"],hiddenones:["bayek"],pharaohs:["bayek"],shadows:["naoe"],awaji:["naoe"],china:["shaojun"]};
var LT={blood:["血脉","#e05d5d"],char:["角色/剧情","#e0b354"],art:["伊甸碎片/遗物","#4fc3d9"],org:["组织源流","#b07be0"],modern:["现代线","#5ad19a"],seq:["续作/DLC","#8d96a3"]};
var $=function(s,r){return (r||document).querySelector(s);};
var esc=function(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c];});};
function img(k){return "assets/img/"+k+".jpg";}
function credit(k){var c=IMG[k];return c?'<div class="src">图源：<a href="'+esc(c.url)+'" target="_blank" rel="noopener">'+esc(decodeURIComponent(c.url))+'</a></div>':"";}
function srt(a,b){return a.y-b.y;}
G.sort(srt);

/* adjacency */
var adj={};function addAdj(a,b,type,why){(adj[a]=adj[a]||[]).push({id:b,type:type,why:why});}
L.forEach(function(l){addAdj(l[0],l[1],l[2],l[3]);addAdj(l[1],l[0],l[2],l[3]);});
MOD.forEach(function(m){Object.keys(m.links).forEach(function(g){addAdj(m.id,g,"modern",m.links[g]);addAdj(g,m.id,"modern",m.t+"："+m.links[g]);});});

/* filters */
var hidden={};
function renderChips(){
  var h="";Object.keys(T).forEach(function(k){h+='<button class="chip'+(hidden[k]?" off":"")+'" data-type="'+k+'" aria-pressed="'+(!hidden[k])+'"><i style="background:'+T[k].color+'"></i>'+T[k].label+'</button>';});
  $("#chips").innerHTML=h;
}
$("#chips").addEventListener("click",function(e){var b=e.target.closest("[data-type]");if(!b)return;var k=b.dataset.type;hidden[k]=!hidden[k];renderChips();applyFilter();});

/* timeline */
function renderTimeline(){
  var h="",bar="";
  COLS.forEach(function(c){
    var gs=G.filter(function(g){return g.col===c.key;});if(!gs.length)return;
    bar+='<button data-jump="era-'+c.key+'">'+esc(c.label)+'</button>';
    h+='<div class="era-h" id="era-'+c.key+'">'+esc(c.label)+'</div><div class="cards">';
    gs.forEach(function(g){
      var t=T[g.type];
      h+='<button class="card" data-id="'+g.id+'" id="card-'+g.id+'"><div class="th"><img loading="lazy" src="'+img(g.img)+'" alt="'+esc(g.t)+'"></div><div class="bd">'+
        '<div class="tt">'+esc(g.t)+'</div>'+
        '<div class="meta">📅 '+esc(g.era)+'</div><div class="meta">📍 '+esc(g.place)+'</div>'+
        '<span class="tag" style="color:'+t.color+';border-color:'+t.color+'">'+t.label+'</span><span class="tag" style="color:#aab;border-color:#445">发行 '+esc(g.rel.split("（")[0])+'</span>'+
        (g.unc&&g.unc.length?'<span class="tag" style="color:#ff9c8c;border-color:#73403a">含存疑</span>':'')+
        '<div class="why"></div></div></button>';
    });
    h+="</div>";
  });
  $("#tl").innerHTML=h;$("#erabar").innerHTML=bar;
}
$("#erabar").addEventListener("click",function(e){var b=e.target.closest("[data-jump]");if(b)document.getElementById(b.dataset.jump).scrollIntoView({behavior:"smooth",block:"start"});});
$("#tl").addEventListener("click",function(e){var c=e.target.closest(".card");if(!c)return;var id=c.dataset.id;if(cur===id){openDrawer(id);}else{select(id,true);}});

function applyFilter(){
  G.forEach(function(g){var c=document.getElementById("card-"+g.id);if(c)c.classList.toggle("hide",!!hidden[g.type]);var n=document.getElementById("n-"+g.id);if(n)n.style.display=hidden[g.type]?"none":"";});
  document.querySelectorAll(".edge").forEach(function(e){e.style.display=(hidden[(byId[e.dataset.a]||{}).type]||hidden[(byId[e.dataset.b]||{}).type])?"none":"";});
}

/* graph */
var NP={},W=1240,H=650,zoom=1;
function layout(){
  COLS.forEach(function(c,i){var gs=G.filter(function(g){return g.col===c.key;});gs.forEach(function(g,j){NP[g.id]={x:70+i*122,y:82+j*66};});});
  var n=MOD.length;MOD.forEach(function(m,i){NP[m.id]={x:120+i*((W-240)/(n-1)),y:H-58};});
}
function edgePath(a,b){
  var p=NP[a],q=NP[b];if(!p||!q)return"";
  if(Math.abs(p.x-q.x)<2){var bx=p.x+44+Math.abs(p.y-q.y)*0.15;return "M"+p.x+","+p.y+" Q"+bx+","+((p.y+q.y)/2)+" "+q.x+","+q.y;}
  var mx=(p.x+q.x)/2,my=(p.y+q.y)/2-Math.min(80,Math.abs(p.x-q.x)*0.18);
  return "M"+p.x+","+p.y+" Q"+mx+","+my+" "+q.x+","+q.y;
}
function renderGraph(){
  layout();
  var s='<svg id="gsvg" viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="作品关系图谱">';
  s+='<rect x="0" y="0" width="'+W+'" height="'+H+'" fill="transparent" id="gbg"/>';
  COLS.forEach(function(c,i){var x=70+i*122;s+='<line x1="'+x+'" y1="44" x2="'+x+'" y2="'+(H-110)+'" stroke="#222833" stroke-dasharray="3 5"/><text class="colh" x="'+x+'" y="28">'+esc(c.label)+'</text>';});
  s+='<line x1="30" y1="'+(H-96)+'" x2="'+(W-30)+'" y2="'+(H-96)+'" stroke="#2d3a33"/><text class="colh" x="'+(W/2)+'" y="'+(H-102)+'" style="fill:#5ad19a">— 现代线（2012–2025）—</text>';
  s+='<g id="edges">';
  L.forEach(function(l,i){s+='<path class="edge" data-a="'+l[0]+'" data-b="'+l[1]+'" d="'+edgePath(l[0],l[1])+'" stroke="'+LT[l[2]][1]+'"'+(l[3].indexOf("存疑")>=0?' stroke-dasharray="5 5"':'')+'/>';});
  MOD.forEach(function(m){Object.keys(m.links).forEach(function(g){s+='<path class="edge" data-a="'+m.id+'" data-b="'+g+'" d="'+edgePath(m.id,g)+'" stroke="'+LT.modern[1]+'" stroke-dasharray="2 4"/>';});});
  s+='</g><g id="threadlayer"></g><g id="nodes">';
  G.concat(MOD).forEach(function(g){var p=NP[g.id],col=g.modern?LT.modern[1]:T[g.type].color;
    s+='<g class="node" id="n-'+g.id+'" data-id="'+g.id+'" transform="translate('+p.x+','+p.y+')" tabindex="0" role="button" aria-label="'+esc(g.t)+'">'+
      '<circle r="28" fill="transparent"/><circle class="ring" r="19" stroke="'+col+'"/>'+
      '<clipPath id="cp-'+g.id+'"><circle r="16"/></clipPath><image href="'+img(g.img)+'" x="-16" y="-16" width="32" height="32" preserveAspectRatio="xMidYMin slice" clip-path="url(#cp-'+g.id+')"/>'+
      '<text y="35">'+esc(g.short)+'</text></g>';});
  s+='</g></svg>';
  $("#gbox").innerHTML=s;
  var lg="";Object.keys(LT).forEach(function(k){lg+='<span><i style="background:'+LT[k][1]+'"></i>'+LT[k][0]+'</span>';});
  lg+='<span><i style="background:repeating-linear-gradient(90deg,#aaa 0 5px,transparent 5px 9px)"></i>虚线＝推测/存疑或现代连线</span>';
  $("#legend").innerHTML=lg;
  var th="";TH.forEach(function(t){th+='<button class="chip" data-thread="'+t.id+'"><i style="background:'+t.color+'"></i>'+esc(t.name)+'</button>';});
  $("#threads").innerHTML=th;
  if($("#gbox").clientWidth>=980)setZoom(1,"fit");else setZoom(window.innerWidth<700?0.82:1);
}
function setZoom(z,fit){zoom=Math.max(.45,Math.min(2.2,z));var svg=$("#gsvg");
  if(fit==="fit"){svg.style.width="100%";svg.style.height="auto";return;}
  svg.style.width=(W*zoom)+"px";svg.style.height=(H*zoom)+"px";}
$("#zin").onclick=function(){setZoom(zoom*1.2);};
$("#zout").onclick=function(){setZoom(zoom/1.2);};
$("#zfit").onclick=function(){setZoom(1,"fit");};
$("#gbox").addEventListener("click",function(e){var n=e.target.closest(".node");if(n){var id=n.dataset.id;if(cur===id)openDrawer(id);else select(id,false);}else if(e.target.id==="gbg"){clearSel();}});
$("#gbox").addEventListener("keydown",function(e){var n=e.target.closest(".node");if(n&&(e.key==="Enter"||e.key===" ")){e.preventDefault();openDrawer(n.dataset.id);select(n.dataset.id,false);}});
$("#threads").addEventListener("click",function(e){var b=e.target.closest("[data-thread]");if(b)showThread(b.dataset.thread);});

/* selection */
var cur=null,curThread=null;
function related(id){var m={};(adj[id]||[]).forEach(function(r){(m[r.id]=m[r.id]||[]).push(r);});return m;}
function select(id,fromTimeline){
  cur=id;curThread=null;$("#threadlayer").innerHTML="";
  document.querySelectorAll("#threads .chip").forEach(function(c){c.classList.remove("on");});
  var rel=related(id);document.body.classList.add("sel");
  G.forEach(function(g){var c=document.getElementById("card-"+g.id);if(!c)return;c.classList.toggle("cur",g.id===id);c.classList.toggle("rel",!!rel[g.id]);
    c.querySelector(".why").innerHTML=rel[g.id]?rel[g.id].map(function(r){return "🔗 "+esc(r.why);}).join("<br>"):"";});
  G.concat(MOD).forEach(function(g){var n=document.getElementById("n-"+g.id);n.classList.toggle("cur",g.id===id);n.classList.toggle("dim",g.id!==id&&!rel[g.id]);});
  document.querySelectorAll(".edge").forEach(function(e){var on=e.dataset.a===id||e.dataset.b===id;e.classList.toggle("on",on);e.classList.toggle("off",!on);});
  renderPanel(id,rel);
  var g=byId[id];$("#selname").textContent=g.t;$("#selbar").classList.add("show");
  if(history.replaceState)history.replaceState(null,"","#g="+id);
}
function clearSel(){cur=null;curThread=null;document.body.classList.remove("sel");
  document.querySelectorAll(".card").forEach(function(c){c.classList.remove("cur","rel");});
  document.querySelectorAll(".node").forEach(function(n){n.classList.remove("cur","dim");});
  document.querySelectorAll(".edge").forEach(function(e){e.classList.remove("on","off");});
  document.querySelectorAll("#threads .chip").forEach(function(c){c.classList.remove("on");});
  $("#threadlayer").innerHTML="";$("#selbar").classList.remove("show");
  $("#gpanel").innerHTML='<p class="hint" style="margin:0">点按任一节点或下方「主题线索」。再次点按同一节点可打开详情。</p>';
  if(history.replaceState)history.replaceState(null,""," ");
}
function relList(rel){
  var ids=Object.keys(rel).sort(function(a,b){return (byId[a].y||9999)-(byId[b].y||9999);});
  if(!ids.length)return '<p class="hint">暂无记录的关联。</p>';
  return '<ul class="rl">'+ids.map(function(k){var g=byId[k];return '<li><button data-go="'+k+'">'+esc(g.short)+'</button><p>'+rel[k].map(function(r){return '<span class="t" style="background:'+LT[r.type][1]+'">'+LT[r.type][0]+'</span>'+esc(r.why);}).join("<br>")+'</p></li>';}).join("")+'</ul>';
}
function renderPanel(id,rel){
  var g=byId[id];
  $("#gpanel").innerHTML='<h3>'+esc(g.t)+' <small style="color:var(--muted);font-weight:400">· 关联 '+Object.keys(rel).length+' 项</small></h3>'+relList(rel)+
   '<div class="navbtns"><button data-open="'+id+'">查看详情</button>'+(g.modern?'':'<button data-card="'+id+'">在时间线中定位</button>')+'</div>';
}
document.addEventListener("click",function(e){
  var b=e.target.closest("[data-go]");if(b){e.preventDefault();var id=b.dataset.go;select(id,false);if($("#drawer").classList.contains("show"))openDrawer(id);return;}
  b=e.target.closest("[data-open]");if(b){openDrawer(b.dataset.open);return;}
  b=e.target.closest("[data-card]");if(b){closeDrawer();var c=document.getElementById("card-"+b.dataset.card);if(c)c.scrollIntoView({behavior:"smooth",block:"center"});return;}
  b=e.target.closest("[data-graph]");if(b){closeDrawer();select(b.dataset.graph,false);var gb=$("#graph");gb.scrollIntoView({behavior:"smooth"});centerNode(b.dataset.graph);return;}
});
function centerNode(id){var p=NP[id],box=$("#gbox"),svg=$("#gsvg");if(!p)return;var sc=svg.getBoundingClientRect().width/W;box.scrollTo({left:p.x*sc-box.clientWidth/2,top:p.y*sc-box.clientHeight/2,behavior:"smooth"});}
function showThread(tid){
  var t=TH.filter(function(x){return x.id===tid;})[0];if(!t)return;
  clearSel();curThread=tid;document.body.classList.add("sel");
  document.querySelectorAll("#threads .chip").forEach(function(c){c.classList.toggle("on",c.dataset.thread===tid);});
  var ids={};t.steps.forEach(function(s){ids[s[0]]=1;});
  G.concat(MOD).forEach(function(g){document.getElementById("n-"+g.id).classList.toggle("dim",!ids[g.id]);});
  document.querySelectorAll(".edge").forEach(function(e){e.classList.add("off");});
  G.forEach(function(g){var c=document.getElementById("card-"+g.id);c.classList.toggle("rel",!!ids[g.id]);
    var st=t.steps.filter(function(s){return s[0]===g.id;});c.querySelector(".why").innerHTML=st.map(function(s){return "🧵 "+esc(t.name)+"："+esc(s[1]);}).join("<br>");});
  var d="";t.steps.forEach(function(s,i){if(i&&!s[2])d+=" "+edgePath(t.steps[i-1][0],s[0]);});
  $("#threadlayer").innerHTML='<path class="thread" d="'+d+'" stroke="'+t.color+'"/>';
  $("#gpanel").innerHTML='<h3><span style="color:'+t.color+'">●</span> '+esc(t.name)+'</h3><ol style="margin:0;padding-left:20px">'+t.steps.map(function(s){return '<li style="margin:6px 0'+(s[2]?';list-style-type:disclosure-closed':'')+'"><button class="minis" style="display:inline;border:1px solid var(--line);background:var(--bg2);border-radius:8px;padding:2px 8px" data-go="'+s[0]+'">'+esc(byId[s[0]].short)+'</button> '+esc(s[1])+'</li>';}).join("")+'</ol>'+(t.note?'<div class="note">'+esc(t.note)+'</div>':'');
}

/* drawer */
function openDrawer(id){
  var g=byId[id],rel=related(id),h="";
  if(g.modern){
    var lo=LORE.filter(function(x){return x.img===g.img;})[0];
    h='<div class="dimg"><img src="'+img(g.img)+'" alt=""><div><p>'+esc(lo?lo.p:"")+'</p></div></div>'+credit(g.img)+(lo&&lo.unc?'<div class="note">'+esc(lo.unc)+'</div>':'')+'<h4>相关作品</h4>'+relList(rel);
  } else {
    var t=T[g.type];
    h='<div class="dimg"><figure style="margin:0"><img src="'+img(g.img)+'" alt="'+esc(g.t)+'"></figure><div><div style="font-size:13px;color:var(--muted)">'+esc(g.en)+'</div><span class="tag" style="display:inline-block;margin-top:6px;font-size:12px;padding:1px 8px;border-radius:999px;border:1px solid '+t.color+';color:'+t.color+'">'+t.label+'</span></div></div>'+credit(g.img)+
      (HERO[id]?'<h4>主角形象</h4><div style="display:flex;gap:10px;flex-wrap:wrap">'+HERO[id].map(function(k){return '<figure style="margin:0;width:120px"><img loading="lazy" src="'+img(k)+'" alt="" style="border-radius:8px;background:#11141a;max-height:200px;object-fit:contain;width:100%">'+credit(k).replace('class="src"','class="src" style="padding:2px 0"')+'</figure>';}).join('')+'</div>':'')+'<dl class="kv"><dt>年代</dt><dd>'+esc(g.era)+'</dd><dt>地点</dt><dd>'+esc(g.place)+'</dd><dt>主角</dt><dd>'+esc(g.hero)+'</dd><dt>发行</dt><dd>'+esc(g.rel)+'</dd></dl>'+
      '<h4>核心剧情</h4><p>'+esc(g.plot)+'</p><h4>主要人物</h4><p>'+esc(g.chars)+'</p><h4>在刺客—圣殿冲突中的意义</h4><p>'+esc(g.sig)+'</p>'+
      (g.unc||[]).map(function(u){return '<div class="note">'+esc(u)+'</div>';}).join("")+
      '<h4>关联作品（点按跳转）</h4>'+relList(rel)+
      '<div class="navbtns"><button data-graph="'+id+'">在图谱中查看</button><button data-card="'+id+'">在时间线中定位</button></div>';
    var i=G.indexOf(g),pv=G[i-1],nx=G[i+1];
    h+='<div class="navbtns">'+(pv?'<button data-go="'+pv.id+'">← '+esc(pv.short)+'</button>':'')+(nx?'<button data-go="'+nx.id+'">'+esc(nx.short)+' →</button>':'')+'</div>';
  }
  $("#dtitle").textContent=g.t;$("#dbody").innerHTML=h;$("#dbody").scrollTop=0;
  $("#drawer").classList.add("show");$("#scrim").classList.add("show");$("#drawer").setAttribute("aria-hidden","false");
  if(cur!==id&&!g.modern)select(id,true);
}
function closeDrawer(){$("#drawer").classList.remove("show");$("#scrim").classList.remove("show");$("#drawer").setAttribute("aria-hidden","true");}
$("#dclose").onclick=closeDrawer;$("#scrim").onclick=closeDrawer;
document.addEventListener("keydown",function(e){if(e.key==="Escape"){if($("#drawer").classList.contains("show"))closeDrawer();else clearSel();}});
/* swipe down to close (mobile sheet) */
(function(){var y0=null,dh=$(".dhead");dh.addEventListener("touchstart",function(e){y0=e.touches[0].clientY;},{passive:true});
 dh.addEventListener("touchend",function(e){if(y0!==null&&e.changedTouches[0].clientY-y0>60)closeDrawer();y0=null;},{passive:true});})();
$("#selopen").onclick=function(){if(cur)openDrawer(cur);};
$("#selclear").onclick=clearSel;

/* lore */
function renderLore(){
  $("#lore").innerHTML=LORE.map(function(x){return '<article class="lc"><figure><img loading="lazy" src="'+img(x.img)+'" alt="'+esc(x.h)+'"></figure>'+credit(x.img)+'<div class="in"><div class="tg">'+esc(x.tag)+'</div><h3>'+esc(x.h)+'</h3><p>'+esc(x.p)+'</p>'+(x.unc?'<div class="note">'+esc(x.unc)+'</div>':'')+
   '<div class="minis">'+x.rel.map(function(r){return '<button data-open="'+r+'">'+esc(byId[r].short)+'</button>';}).join("")+'</div></div></article>';}).join("");
}
/* notes + credits */
function renderNotes(){
  var u="";G.forEach(function(g){(g.unc||[]).forEach(function(x){u+='<li><b>'+esc(g.short)+'</b>：'+esc(x)+'</li>';});});
  TH.forEach(function(t){if(t.note&&t.note.indexOf("存疑")>=0)u+='<li><b>线索·'+esc(t.name)+'</b>：'+esc(t.note)+'</li>';});
  LORE.forEach(function(x){if(x.unc)u+='<li><b>'+esc(x.h)+'</b>：'+esc(x.unc)+'</li>';});
  $("#unclist").innerHTML=u;
  var used={};G.forEach(function(g){used[g.img]=g.t;});LORE.forEach(function(x){used[x.img]=used[x.img]||x.h;});MOD.forEach(function(m){used[m.img]=used[m.img]||m.t;});
  $("#cred").innerHTML=Object.keys(used).sort().map(function(k){var c=IMG[k];return c?'<tr><td>'+esc(used[k])+'</td><td><a href="'+esc(c.url)+'" target="_blank" rel="noopener">'+esc(decodeURIComponent(c.url))+'</a></td></tr>':'';}).join("");
}
/* nav highlight */
function navSpy(){var secs=["timeline","graph","lore","notes"],y=window.scrollY+120,on="timeline";secs.forEach(function(s){var el=document.getElementById(s);if(el&&el.offsetTop<=y)on=s;});
  document.querySelectorAll(".tabs a").forEach(function(a){a.classList.toggle("on",a.getAttribute("href")==="#"+on);});}
window.addEventListener("scroll",navSpy,{passive:true});

renderChips();renderTimeline();renderGraph();renderLore();renderNotes();clearSel();navSpy();
$("#count").textContent=G.length;
var m=INIT_HASH.match(/g=([\w]+)/);if(m&&byId[m[1]]){select(m[1],true);setTimeout(function(){var c=document.getElementById("card-"+m[1]);if(c)c.scrollIntoView({block:"center"});},50);}
window.__AC_OK=true;
})();
