// Campus cart tracker. 3D campus map (MapLibre + OpenStreetMap buildings, ported from lpu-wayfinder by Dushyant Pal);
// carts are simulated on the real campus roads from our stopwatch data. Coordinates: local metres, x = lng*KX, y = lat*KY.

// ---------- config ----------
const GAPS=[69,105,43,64,94,54,159,92,107,68,42,73,55,104,39,83,34,50,44,76,31,62,52,144,34,39,109,67,80,124,32,43,41,93,88,81,155,53,276,78,175,111,664,356,293,30,71,258,72,308,209,110,60,207,61,98,237,167,144,180,144,100,59,187,461,70,135,31,372,76,160,165,128]; // our 73 stopwatch gaps (s)
const SIM_SPEED=1;                             // carts run in real time
const SPEED_KMH=[16.5,19.5];                   // km/h; 18 km/h average makes the A-B trip about 5:37
const P_FULL=0.65,P_PICKUP=0.30,P_DETOUR=0.30; // carts leaving full / filling on the way / taking another path
const CORNER=6;                                // corner rounding radius in metres
// Stops [lng, lat]. shortcut: A and B are the old approximate GPS anchors and 54 is not placed yet; replace with measured spots.
const DEF_STOPS=window.CART_ROUTE?{A:CART_ROUTE.A,B:CART_ROUTE.B,V:null}:{A:[75.7059,31.2512],B:[75.7016,31.2584],V:null}; // the team's drawn route (map/cart-route.js) sets A and B
// Developer option (tap the logo): stops placed on the map are kept in this browser and override the defaults.
let STOPS=DEF_STOPS,DEV_STOPS=false;
try{const d=JSON.parse(localStorage.getItem('devStops'));if(d&&(d.A||d.B)){STOPS={...DEF_STOPS,...d};DEV_STOPS=true;}}catch(_){}
const END_NAME={A:'Main Stop',B:'2nd Stop'};
const CART_ROADS={residential:1,service:1,unclassified:1,tertiary:1,tertiary_link:1,living_street:1,pedestrian:1}; // OSM roads carts may use
const KX=111320*Math.cos(31.25*Math.PI/180),KY=110574;
const toXY=p=>[p[0]*KX,p[1]*KY],toLL=(x,y)=>[x/KX,y/KY];

// ---------- campus from OpenStreetMap (map/campus-osm.js) ----------
const REL=21599790;
const same=(a,b)=>a[0]===b[0]&&a[1]===b[1];
function stitch(segs){const rings=[],pool=segs.map(s=>s.slice());
  while(pool.length){let cur=pool.shift(),g=0;
    while(!same(cur[0],cur[cur.length-1])&&g++<5000){let f=false;
      for(let i=0;i<pool.length;i++){const s=pool[i];
        if(same(cur[cur.length-1],s[0])){cur=cur.concat(s.slice(1));pool.splice(i,1);f=true;break;}
        if(same(cur[cur.length-1],s[s.length-1])){cur=cur.concat(s.slice(0,-1).reverse());pool.splice(i,1);f=true;break;}}
      if(!f)break;}
    if(cur.length>3){if(!same(cur[0],cur[cur.length-1]))cur.push(cur[0]);rings.push(cur);}}
  return rings;}
function inRing(p,r){let c=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const [xi,yi]=r[i],[xj,yj]=r[j];if(yi>p[1]!==yj>p[1]&&p[0]<(xj-xi)*(p[1]-yi)/(yj-yi)+xi)c=!c;}return c;}
const els=window.OSM.elements,relEl=els.find(e=>e.type==='relation'&&e.id===REL);
const RINGS=stitch(relEl.members.filter(m=>m.geometry&&(m.role==='outer'||m.role==='')).map(m=>m.geometry));
const inside=p=>RINGS.some(r=>inRing(p,r));
const mid=g=>{let x=0,y=0;g.forEach(p=>{x+=p[0];y+=p[1]});return [x/g.length,y/g.length];};
const feats=RINGS.map(r=>({type:'Feature',properties:{kind:'outline'},geometry:{type:'Polygon',coordinates:[r]}}));
const PLACES=[];                               // named spots in metres, for "near X" text
const N={},E0=[];const nk=p=>p[0]+','+p[1];
els.forEach(e=>{if(e.type!=='way')return;const t=e.tags||{},g=e.geometry,closed=g.length>3&&same(g[0],g[g.length-1]);
  if(t.building&&closed){const c=mid(g);if(!inside(c))return;
    let h=parseFloat(t.height);if(!(h>0)){const lv=parseFloat(t['building:levels']);h=lv>0?lv*3.2:9;}
    const bt=/dormitory|residential|apartments|hostel/.test(t.building)?'hostel':/university|college|school|civic|public|office/.test(t.building)?'academic':'other';
    feats.push({type:'Feature',properties:{kind:'building',h:Math.max(5,Math.min(h,45)),bt},geometry:{type:'Polygon',coordinates:[g]}});
    if(t.name||t.ref)PLACES.push([...toXY(c),t.ref&&/^\d/.test(t.ref)?'Block '+t.ref:t.name||t.ref]);}
  else if(t.highway){let run=[];const flush=()=>{if(run.length>1)feats.push({type:'Feature',properties:{kind:/footway|path|steps|track|cycleway/.test(t.highway)?'path':'road'},geometry:{type:'LineString',coordinates:run}});run=[];};
    g.forEach(p=>inside(p)?run.push(p):flush());flush();
    if(!window.CART_ROUTE&&CART_ROADS[t.highway])for(let i=1;i<g.length;i++)if(inside(g[i-1])&&inside(g[i])){N[nk(g[i-1])]=toXY(g[i-1]);N[nk(g[i])]=toXY(g[i]);E0.push([nk(g[i-1]),nk(g[i])]);}
    if(t.name)PLACES.push([...toXY(g[g.length>>1]),t.name]);}
  else if((t.leisure||t.landuse)&&closed&&inside(mid(g)))feats.push({type:'Feature',properties:{kind:'green'},geometry:{type:'Polygon',coordinates:[g]}});});
const CAMPUS={type:'FeatureCollection',features:feats};
// carts use only the roads the team drew (map/cart-route.js); lines join where they share a point
if(window.CART_ROUTE)Object.values(CART_ROUTE.lines).forEach(g=>{for(let i=1;i<g.length;i++){N[nk(g[i-1])]=toXY(g[i-1]);N[nk(g[i])]=toXY(g[i]);E0.push([nk(g[i-1]),nk(g[i])]);}});

// ---------- graph ----------
// Carts only use roads that lie on some A-B route, so dead-end spurs are pruned from the network.
// Stop 54 (V_NODE) is a via point, not an end: carts run A -> 54 -> B and B -> 54 -> A.
const dist=(a,b)=>Math.hypot(N[a][0]-N[b][0],N[a][1]-N[b][1]);
const ekey=(a,b)=>a<b?a+'|'+b:b+'|'+a;
function nearestEdge(es,x,y){let best=null;es.forEach(([a,b],i)=>{const p=N[a],q=N[b],dx=q[0]-p[0],dy=q[1]-p[1],l2=dx*dx+dy*dy;
    let t=((x-p[0])*dx+(y-p[1])*dy)/(l2||1);t=Math.max(0,Math.min(1,t));const px=p[0]+dx*t,py=p[1]+dy*t,d=Math.hypot(x-px,y-py);
    if(!best||d<best.d)best={i,a,b,t,x:px,y:py,d};});return best;}
function addStop(es,name,ll){if(!ll)return null;const s=nearestEdge(es,...toXY(ll));N[name]=[s.x,s.y];es.splice(s.i,1,[s.a,name],[name,s.b]);return name;}
let E=E0.slice();const A_NODE=addStop(E,'A',STOPS.A),B_NODE=addStop(E,'B',STOPS.B),V_NODE=addStop(E,'V',STOPS.V);
E=E.filter(([a,b])=>a!==b&&dist(a,b)>0);
for(;;){const deg={};E.forEach(e=>{deg[e[0]]=(deg[e[0]]||0)+1;deg[e[1]]=(deg[e[1]]||0)+1});
  const keep=E.filter(e=>[e[0],e[1]].every(k=>deg[k]>1||k===A_NODE||k===B_NODE||k===V_NODE));if(keep.length===E.length)break;E=keep;}
const adj={};E.forEach(([p,q])=>{const d=dist(p,q);(adj[p]=adj[p]||[]).push([q,d]);(adj[q]=adj[q]||[]).push([p,d]);});
const NODES=Object.keys(adj);
function dijkstra(s,wf,stop){ // wf(edgeKey) = weight multiplier; binary heap
  const D={},P={},h=[[0,s]];D[s]=0;
  const push=x=>{h.push(x);let i=h.length-1;while(i){const j=(i-1)>>1;if(h[j][0]<=h[i][0])break;[h[i],h[j]]=[h[j],h[i]];i=j;}};
  const pop=()=>{const top=h[0],l=h.pop();if(h.length){h[0]=l;let i=0;for(;;){let m=i;const a=2*i+1,b=a+1;if(a<h.length&&h[a][0]<h[m][0])m=a;if(b<h.length&&h[b][0]<h[m][0])m=b;if(m===i)break;[h[i],h[m]]=[h[m],h[i]];i=m;}}return top;};
  while(h.length){const [du,u]=pop();if(du>D[u])continue;if(u===stop)break;
    adj[u].forEach(([v,d])=>{const nd=du+d*(wf?wf(ekey(u,v)):1);if(!(nd>=D[v])){D[v]=nd;P[v]=u;push([nd,v]);}});}
  return {D,P};
}
function path(s,t,wf){const {P}=dijkstra(s,wf,t);const r=[t];while(r[0]!==s){if(P[r[0]]===undefined)return null;r.unshift(P[r[0]]);}return r;}
const via=(a,b,wf)=>V_NODE?path(a,V_NODE,wf).concat(path(V_NODE,b,wf).slice(1)):path(a,b,wf);
const mainPath=via(A_NODE,B_NODE);
if(!mainPath){
  if(DEV_STOPS){try{localStorage.removeItem('devStops')}catch(_){}alert('No cart road joins the placed Point A and Point B. Going back to the default stops.');location.reload();}
  throw new Error('No road joins stop A to stop B');}
const mainKeys=new Set(mainPath.slice(1).map((k,i)=>ekey(mainPath[i],k)));

// ---------- routes with rounded corners ----------
function mkRoute(nodes){
  const pts=nodes.map(k=>N[k]),cum=[0],rad=[0];
  for(let i=1;i<pts.length;i++)cum.push(cum[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));
  for(let i=1;i<pts.length-1;i++)rad.push(Math.min(CORNER,(cum[i]-cum[i-1])*.45,(cum[i+1]-cum[i])*.45));
  rad.push(0);
  return {nodes,pts,cum,rad,len:cum[cum.length-1]};
}
function randomRoute(from,to){
  const w={},jit=k=>w[k]===undefined?(w[k]=1+Math.random()*.15):w[k];
  if(Math.random()<P_DETOUR){ // a different path: make the usual roads look longer so another loop gets chosen
    const pen=1.4+Math.random()*1.6;return mkRoute(via(from,to,k=>jit(k)*(mainKeys.has(k)&&Math.random()<.8?pen:1)));
  }
  return mkRoute(via(from,to,jit));
}
// position at distance s along the route; corners are quadratic curves
function posAt(r,s){
  s=Math.max(0,Math.min(r.len,s));let i=1;while(i<r.cum.length-1&&r.cum[i]<s)i++;
  let v=-1,u=0;
  if(r.rad[i]>0&&s>r.cum[i]-r.rad[i]){v=i;u=(s-(r.cum[i]-r.rad[i]))/(2*r.rad[i]);}
  else if(r.rad[i-1]>0&&s<r.cum[i-1]+r.rad[i-1]){v=i-1;u=(s-(r.cum[v]-r.rad[v]))/(2*r.rad[v]);}
  if(v<0){const t=(s-r.cum[i-1])/((r.cum[i]-r.cum[i-1])||1),p=r.pts[i-1],q=r.pts[i];return {x:p[0]+(q[0]-p[0])*t,y:p[1]+(q[1]-p[1])*t};}
  const V=r.pts[v],P=r.pts[v-1],Q=r.pts[v+1],R=r.rad[v],l1=r.cum[v]-r.cum[v-1],l2=r.cum[v+1]-r.cum[v];
  const ax=V[0]+(P[0]-V[0])*R/l1,ay=V[1]+(P[1]-V[1])*R/l1,bx=V[0]+(Q[0]-V[0])*R/l2,by=V[1]+(Q[1]-V[1])*R/l2,w=1-u;
  return {x:w*w*ax+2*w*u*V[0]+u*u*bx,y:w*w*ay+2*w*u*V[1]+u*u*by};
}

// ---------- carts ----------
let carts=[],nextId=1,spawnT={A:0,B:0};
function spawn(dir,progress){
  const r=randomRoute(dir==='A'?A_NODE:B_NODE,dir==='A'?B_NODE:A_NODE);
  const full=Math.random()<P_FULL,s=(progress||0)*r.len;
  const pickupAt=(!full&&Math.random()<P_PICKUP)?r.len*(0.2+Math.random()*0.65):null;
  const c={id:nextId++,dir,route:r,s,v:(SPEED_KMH[0]+Math.random()*(SPEED_KMH[1]-SPEED_KMH[0]))/3.6,full,pickupAt,flash:0,ok:false,eta:null};
  if(pickupAt!==null&&pickupAt<=s){c.full=true;c.pickupAt=null;}
  carts.push(c);
}
const nextGap=()=>GAPS[Math.floor(Math.random()*GAPS.length)]; // time until the next cart leaves, from our stopwatch gaps
for(let i=0;i<6;i++)spawn(i%2?'A':'B',0.08+0.84*Math.random());
spawnT.A=nextGap()*Math.random();spawnT.B=nextGap()*Math.random();

// ---------- snapping to roads ----------
function snap(x,y){const b=nearestEdge(E,x,y);return b&&{a:b.a,b:b.b,t:b.t,x:b.x,y:b.y,d:b.d};}
function label(sn){let b=null,bd=90;PLACES.forEach(([x,y,n])=>{const d=Math.hypot(x-sn.x,y-sn.y);if(d<bd){bd=d;b=n}});return b||'the cart road';}
// distance along route r (from its start) where point sn lies, at or ahead of s0
function routeDist(r,sn,s0){
  for(let i=0;i<r.nodes.length-1;i++){
    const a=r.nodes[i],b=r.nodes[i+1],seg=r.cum[i+1]-r.cum[i];let d=null;
    if(a===sn.a&&b===sn.b)d=r.cum[i]+sn.t*seg; else if(a===sn.b&&b===sn.a)d=r.cum[i]+(1-sn.t)*seg;
    if(d!==null&&d>=s0)return d;
  }
  return null;
}

// ---------- state ----------
const $=id=>document.getElementById(id);
let riding=null,follow=false,me=null,gpsFix=null,watchId=null,devPlace=null,dest=null,paused=false,spi=0,best=null,simClock=0,toastT=null,rideFor=null,threeD=true;
function toast(msg,ms){const t=$('toast');t.textContent=msg;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),ms||2600);}
const put=(id,s)=>{const el=$(id);if(el.textContent!==s)el.textContent=s;};
const cid=c=>String(c.id).padStart(2,'0');
function setMe(sn){me=sn;update();}
function setDest(sn,fromList){dest=sn;const s=$('dsel');
  if(!sn)s.value='';else if(!fromList){const o=s.querySelector('[value=x]');o.textContent=label(sn);o.hidden=false;s.value='x';}
  update();}
function evaluate(){
  const list=[];
  carts.forEach(c=>{
    c.ok=false;c.eta=null;
    const dm=routeDist(c.route,me,c.s);if(dm===null)return;           // already past you, or on another path
    let dd=null;
    if(dest){dd=routeDist(c.route,dest,dm);if(dd===null)return;}        // does not go on to your destination
    c.dm=dm;c.dd=dd;c.eta=(dm-c.s)/c.v;c.ok=!c.full;
    list.push(c);
  });
  return list.sort((a,b)=>a.eta-b.eta);
}
const mmss=s=>{s=Math.max(0,Math.round(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
const medGap=GAPS.slice().sort((a,b)=>a-b)[GAPS.length>>1];
function update(){
  if(riding){const c=riding,end=c.rideEnd,left=Math.max(0,(end-c.s)/c.v);   // on a cart: count down to where you get off
    $('next').classList.remove('none','noride');put('chip','On Cart '+cid(c));put('via','to '+c.rideTo);put('cdl','to go');
    put('cd',mmss(left));put('ns',follow?'The map is following your cart':'Tap the location button to follow your cart');
    put('rt',mmss(left));put('rd',c.rideTo);if(ready)map.getSource('coming').setData(EMPTY);return;}
  put('cdl','min wait');
  if(!me)return;
  const list=evaluate(),good=list.filter(c=>c.ok);
  best=good[0]||null;
  $('next').classList.toggle('none',!best);
  const html=(id,s)=>{const el=$(id);if(el.k!==s){el.k=s;el.innerHTML=s;}};   // only our own strings and OSM names go in here
  const esc=s=>s.replace(/[&<>"]/g,ch=>'&#'+ch.charCodeAt(0)+';');
  html('dl','From <b>'+esc(label(me))+'</b> → '+(dest?esc(label(dest)):'pick a destination'));
  if(best){put('chip','Cart '+cid(best));put('via','to '+END_NAME[best.dir==='A'?'B':'A']);put('cd',mmss(best.eta));put('ns','Empty cart, will pass you');}
  else{put('chip','No empty cart');put('via','');put('cd','--:--');put('ns','No empty cart on the way right now. One usually comes every '+mmss(medGap)+'.');}
  const ride=best&&dest&&best.dd!==null;
  $('next').classList.toggle('noride',!ride);
  put('rt',ride?mmss((best.dd-best.dm)/best.v):'--:--');put('rd',dest?label(dest):'No destination');
  put('km',ride?((best.dd-best.dm)/1000).toFixed(1)+' km':'');
  setRide(ride?best:null);
  if(ready){const fs=list.map(c=>{const r=c.route,a=posAt(r,c.s),b=posAt(r,c.dm),cs=[toLL(a.x,a.y)];
      for(let i=1;i<r.cum.length&&r.cum[i]<c.dm;i++)if(r.cum[i]>c.s)cs.push(toLL(...r.pts[i]));cs.push(toLL(b.x,b.y));
      return {type:'Feature',properties:{ok:c.ok},geometry:{type:'LineString',coordinates:cs}};});
    map.getSource('coming').setData({type:'FeatureCollection',features:fs});}
  const rows=list.slice(0,3),ul=$('list');
  while(ul.children.length<rows.length){const li=document.createElement('li');li.innerHTML='<i></i><div><div class="n"><span></span><em></em></div><div class="s"></div></div><div class="e"><span></span><small></small></div>';ul.appendChild(li);}
  while(ul.children.length>rows.length)ul.lastChild.remove();
  rows.forEach((c,i)=>{const li=ul.children[i],k=c.id+(c.ok?'e':'f')+(c===best),e=mmss(c.eta),q=s=>li.querySelector(s);
    if(li.k!==k){li.k=k;li.className=(c.ok?'':'f')+(c===best?' best':'');q('.n span').textContent='Cart '+cid(c);q('.n em').textContent=c.ok?'Empty':'Full';
      q('.s').textContent=c.ok?'Heading to '+END_NAME[c.dir==='A'?'B':'A']:'Passing, no seats';q('.e small').textContent=c.ok?'ETA':'Passes';}
    if(q('.e span').textContent!==e)q('.e span').textContent=e;});
}

// ---------- map ----------
const EMPTY={type:'FeatureCollection',features:[]};
const line=cs=>({type:'FeatureCollection',features:[{type:'Feature',properties:{},geometry:{type:'LineString',coordinates:cs}}]});
const NET={type:'FeatureCollection',features:E.map(([a,b])=>({type:'Feature',properties:{},geometry:{type:'LineString',coordinates:[toLL(...N[a]),toLL(...N[b])]}}))};
// opening view: the A-B route, not every loop
const BOUNDS=(()=>{let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;mainPath.forEach(k=>{const [x,y]=toLL(...N[k]);x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);});return [[x0,y0],[x1,y1]];})();
const wrap=$('mapwrap'),cv=$('c'),ctx=cv.getContext('2d');let W=0,H=0,dpr=1,ready=false;
const map=new maplibregl.Map({container:'map',pixelRatio:Math.min(2,window.devicePixelRatio||1),fadeDuration:0,renderWorldCopies:false, // 2x is sharp enough and much lighter than 3x phones
  bounds:BOUNDS,fitBoundsOptions:{padding:{top:40,bottom:40,left:20,right:60}},pitch:50,maxPitch:70,maxZoom:20,attributionControl:false,bearingSnap:0,
  style:{version:8,sources:{},layers:[{id:'bg',type:'background',paint:{'background-color':'#ece6da'}}]}});
const kind=k=>['==',['get','kind'],k];
map.on('load',()=>{
  map.addSource('campus',{type:'geojson',data:CAMPUS});map.addSource('net',{type:'geojson',data:NET});map.addSource('ride',{type:'geojson',data:EMPTY});
  map.addLayer({id:'outline',type:'fill',source:'campus',filter:kind('outline'),paint:{'fill-color':'#f8f6f1'}});
  map.addLayer({id:'green',type:'fill',source:'campus',filter:kind('green'),paint:{'fill-color':'#dfe8d3'}});
  map.addLayer({id:'road',type:'line',source:'campus',filter:kind('road'),layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#e2dbcf','line-width':['interpolate',['linear'],['zoom'],14,1.5,19,11]}});
  map.addLayer({id:'path',type:'line',source:'campus',filter:kind('path'),paint:{'line-color':'#cfc6b8','line-width':1,'line-dasharray':[2,2]}});
  map.addLayer({id:'net',type:'line',source:'net',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#b9aea0','line-width':['interpolate',['linear'],['zoom'],14,2,19,9]}});
  map.addSource('coming',{type:'geojson',data:EMPTY});   // carts coming to your place: dashed, on the road itself
  map.addLayer({id:'coming',type:'line',source:'coming',layout:{'line-cap':'butt','line-join':'round'},paint:{'line-color':['case',['get','ok'],'#15803d','#78716c'],'line-opacity':['case',['get','ok'],.9,.6],'line-width':['interpolate',['linear'],['zoom'],14,2,19,6],'line-dasharray':[2,1.5]}});
  map.addLayer({id:'ride',type:'line',source:'ride',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#6b1d12','line-width':['interpolate',['linear'],['zoom'],14,3,19,10]}});
  map.addLayer({id:'bld',type:'fill-extrusion',source:'campus',filter:kind('building'),paint:{'fill-extrusion-color':['match',['get','bt'],'academic','#d6cfc2','hostel','#d9cbbf','#ddd7cc'],'fill-extrusion-height':['get','h'],'fill-extrusion-opacity':.9}});
  map.addLayer({id:'outline-line',type:'line',source:'campus',filter:kind('outline'),paint:{'line-color':'#6b1d12','line-width':1.5,'line-opacity':.5}});
  // no zooming out past a little more than the whole route
  const fitZ=map.cameraForBounds(BOUNDS,{padding:20});if(fitZ&&fitZ.zoom)map.setMinZoom(fitZ.zoom-0.5);
  ready=true;rideFor=undefined;update();
});
map.on('error',e=>console.warn(e&&e.error));
function setRide(c){ // the stretch your cart will drive, from you to your destination
  const k=c?c.id+':'+c.dm+':'+c.dd:null;if(!ready||k===rideFor)return;rideFor=k;
  const cs=[];if(c){for(let d=c.dm;;d+=4){const e=Math.min(d,c.dd),p=posAt(c.route,e);cs.push(toLL(p.x,p.y));if(e>=c.dd)break;}}
  map.getSource('ride').setData(cs.length>1?line(cs):EMPTY);
}
function size(){const r=wrap.getBoundingClientRect();dpr=Math.min(2,window.devicePixelRatio||1);W=r.width;H=r.height;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);map.resize();}
new ResizeObserver(size).observe(wrap);size();
const P=(x,y)=>map.project(toLL(x,y));

// ---------- drawing the overlay: stops, you, carts ----------
function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function chip(t,x,y,bg,fg,ln){
  ctx.font='600 11px system-ui,sans-serif';const w=ctx.measureText(t).width+14;x=Math.max(w/2+4,Math.min(W-w/2-4,x));y=Math.max(14,Math.min(H-34,y));   // H-34: the bottom sheet overlaps the map's last 16 px
  rr(x-w/2,y-10,w,20,4);ctx.fillStyle=bg;ctx.fill();if(ln){ctx.strokeStyle=ln;ctx.lineWidth=1;ctx.stroke();}
  ctx.fillStyle=fg;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(t,x,y+.5);}
const onScreen=p=>p.x>-40&&p.y>-40&&p.x<W+40&&p.y<H+40;
function drawCart(c){
  const a=posAt(c.route,c.s),b=posAt(c.route,c.s+3),p=P(a.x,a.y),q=P(b.x,b.y);if(!onScreen(p))return;
  ctx.save();ctx.translate(p.x,p.y);
  if(c.flash>0){ctx.globalAlpha=c.flash*.8;ctx.strokeStyle='#78716c';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,(1-c.flash)*18+10,0,7);ctx.stroke();}
  ctx.globalAlpha=c.ok||c.full?1:.45;
  const r=c.ok?11:8;ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.fillStyle=c.full?'#78716c':'#15803d';ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
  if(c.full){ctx.fillStyle='#fff';ctx.font='600 9px system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(c.id,0,.5);}
  else{ctx.rotate(Math.atan2(q.y-p.y,q.x-p.x));ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(r*.5,0);ctx.lineTo(-r*.3,-r*.4);ctx.lineTo(-r*.3,r*.4);ctx.fill();}   // arrow: which way it is going
  if(c===riding){ctx.globalAlpha=1;ctx.strokeStyle='#2563eb';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,17,0,7);ctx.stroke();}   // you are on this one
  ctx.restore();
  if(c===riding)chip('YOU',p.x,p.y-26,'#2563eb','#fff');
  else if(c.ok&&c.eta!==null)chip('C-'+cid(c)+' · '+mmss(c.eta),p.x,p.y-24,'#15803d','#fff');
}
function drawEnds(){
  [[A_NODE,'A','#1c1917'],[V_NODE,'54','#fff'],[B_NODE,'B','#6b1d12']].forEach(([k,l,bg])=>{if(!k)return;const p=P(...N[k]),light=bg==='#fff';
    ctx.beginPath();ctx.arc(p.x,p.y,11,0,7);ctx.fillStyle=bg;ctx.fill();ctx.strokeStyle=light?'#6b1d12':'#fff';ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle=light?'#1c1917':'#fff';ctx.font='600 '+(l.length>1?10:12)+'px system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(l,p.x,p.y+.5);
    chip(END_NAME[l]||'Stop 54 (via)',p.x,p.y-26,bg,light?'#1c1917':'#fff',light?'#b9aea0':null);});
  if(dest){const p=P(dest.x,dest.y);ctx.beginPath();ctx.arc(p.x,p.y,7,0,7);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='#6b1d12';ctx.lineWidth=3;ctx.stroke();}
  if(gpsFix){const p=map.project(gpsFix.ll);   // just the blue dot (no accuracy ring)
    if(gpsFix.heading!==null){const h=(gpsFix.heading-map.getBearing())*Math.PI/180;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(h);ctx.fillStyle='#2563eb';ctx.beginPath();ctx.moveTo(0,-15);ctx.lineTo(-5,-7);ctx.lineTo(5,-7);ctx.fill();ctx.restore();} // which way you are walking
    ctx.beginPath();ctx.arc(p.x,p.y,6,0,7);ctx.fillStyle='#2563eb';ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();}
  if(me&&!riding){const p=P(me.x,me.y);ctx.fillStyle='rgba(107,29,18,.18)';ctx.beginPath();ctx.arc(p.x,p.y,15,0,7);ctx.fill();
    ctx.beginPath();ctx.arc(p.x,p.y,7,0,7);ctx.fillStyle='#6b1d12';ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();chip($('psel').value==='gps'?'YOU ARE HERE':'PICKUP: '+pickName,p.x,p.y+26>H-34?p.y-26:p.y+26,'#1c1917','#fff');}
}
let t0=performance.now(),lastEval=0;
function frame(now){
  requestAnimationFrame(frame);
  if(now-t0<30)return;                            // about 30 fps
  const dt=Math.min(0.1,(now-t0)/1000);t0=now;
  if(!paused){
    const sd=dt*SIM_SPEED;simClock+=sd;
    for(const c of carts){c.s+=c.v*sd;if(c.flash>0)c.flash=Math.max(0,c.flash-dt*1.2);
      if(c.pickupAt!==null&&c.s>=c.pickupAt){c.full=true;c.pickupAt=null;c.flash=1;}}
    if(carts.some(c=>c.s>=c.route.len))carts=carts.filter(c=>c.s<c.route.len);
    for(const d of ['A','B']){spawnT[d]-=sd;if(spawnT[d]<=0){spawn(d,0);spawnT[d]+=nextGap();}}
  }
  // get on: the empty cart you are waiting for has reached you
  if(!riding&&best&&best.ok&&carts.includes(best)&&best.s>=best.dm-1){const c=riding=best;follow=true;stopGps();
    c.rideEnd=dest&&c.dd!==null?c.dd:c.route.len;c.rideTo=dest&&c.dd!==null?label(dest):END_NAME[c.dir==='A'?'B':'A'];
    c.pickupAt=null;toast('You got on Cart '+cid(c),2200);if(navigator.vibrate)navigator.vibrate(30);update();}
  if(riding){const c=riding,q=posAt(c.route,Math.min(c.s,c.rideEnd));
    if(follow&&!map.isMoving())map.jumpTo({center:toLL(q.x,q.y)});   // don't cut off a zoom in progress
    if(c.s>=c.rideEnd||!carts.includes(c)){riding=null;follow=false;me=snap(q.x,q.y);dest=null;$('dsel').value='';
      toast('You have arrived at '+c.rideTo,3000);if(navigator.vibrate)navigator.vibrate([30,60,30]);update();}}
  if(now-lastEval>200){update();lastEval=now;}
  put('sim',paused?'Paused':mmss(simClock));
  map.triggerRepaint();                           // carts moved: draw them with the next map frame
}
// the overlay is drawn in the map's own frame, so stops and carts stay pinned to the ground while you pan, zoom or tilt
function drawOverlay(){
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
  drawEnds();
  for(const on of [false,true])for(const c of carts)if(c.ok===on)drawCart(c);   // carts you can take are drawn on top
}
map.on('render',drawOverlay);
setMe(snap(...N[mainPath[mainPath.length>>1]]));
if(!V_NODE)toast('Stop 54 is not placed on the map yet, carts run A to B',4000);
requestAnimationFrame(frame);

// ---------- input: tap = the place you wait at (carts coming there are shown), long-press or right-click = destination ----------
let pickName='';
function choosePlace(sn,key){stopGps();pickName=key?END_NAME[key]:label(sn);setMe(sn);const s=$('psel');
  if(key)s.value=key;else{const o=s.querySelector('[value=x]');o.textContent=label(sn);o.hidden=false;s.value='x';}
  toast('Showing carts coming to '+(key?END_NAME[key]:label(sn)),1800);}
function pick(e){const m=toXY([e.lngLat.lng,e.lngLat.lat]),sn=snap(...m),p=P(sn.x,sn.y);
  if(Math.hypot(p.x-e.point.x,p.y-e.point.y)>46){toast('Tap closer to the cart route');return null;}return sn;}
map.on('click',e=>{
  if(devPlace){const d={A:STOPS.A,B:STOPS.B,[devPlace]:[+e.lngLat.lng.toFixed(6),+e.lngLat.lat.toFixed(6)]};
    try{localStorage.setItem('devStops',JSON.stringify(d));}catch(_){toast('Could not save the stop in this browser');return;}
    toast('Point '+devPlace+' placed, reloading',1200);devPlace=null;setTimeout(()=>location.reload(),900);return;}
  const sn=pick(e);if(sn)choosePlace(sn);});
map.on('contextmenu',e=>{const sn=pick(e);if(sn){setDest(sn);toast('Going to '+label(sn),1800);if(navigator.vibrate)navigator.vibrate(15);}});
// touch long-press: browsers differ on contextmenu, so time it ourselves
let pressT=null;
map.on('touchstart',e=>{clearTimeout(pressT);if(e.originalEvent.touches.length!==1)return;pressT=setTimeout(()=>map.fire('contextmenu',{lngLat:e.lngLat,point:e.point}),550);});
['touchend','touchcancel','movestart','zoomstart'].forEach(ev=>map.on(ev,()=>clearTimeout(pressT)));
wrap.addEventListener('contextmenu',e=>e.preventDefault());

// ---------- buttons ----------
$('pause').onclick=()=>{paused=!paused;$('pico').setAttribute('d',paused?'M7 4l13 8-13 8z':'M6 4h4v16H6zM14 4h4v16h-4z');$('pause').setAttribute('aria-label',paused?'Resume simulation':'Pause simulation');};
// zoom button: 1x = the whole route; each tap goes to the next step in (2x, 4x, 8x) from where the map is now, then back to 1x
let FITZ=null;   // zoom that shows the whole route, worked out once (it shifts with tilt and bearing otherwise)
const ZOOMS=[1,2,4,8],fitZoom=()=>FITZ||(FITZ=map.cameraForBounds(BOUNDS,{padding:20,bearing:0,pitch:0}).zoom);
const zoomNow=()=>Math.pow(2,map.getZoom()-fitZoom());
function zoomLabel(){const f=zoomNow();let best=ZOOMS[0];ZOOMS.forEach(z=>{if(Math.abs(Math.log2(z/f))<Math.abs(Math.log2(best/f)))best=z;});put('spd',best+'x');}
map.on('zoomend',zoomLabel);map.once('load',zoomLabel);
$('spd').onclick=()=>{const f=zoomNow(),next=ZOOMS.find(z=>z>f*1.15);
  if(!next){map.fitBounds(BOUNDS,{padding:20,duration:500});return;}
  const c=riding?posAt(riding.route,riding.s):me;
  map.easeTo({zoom:fitZoom()+Math.log2(next),center:c?toLL(c.x,c.y):undefined,duration:500});};
$('fit').onclick=()=>map.fitBounds(BOUNDS,{padding:{top:40,bottom:40,left:20,right:60},pitch:threeD?50:0,bearing:0});
$('d3').onclick=e=>{threeD=!threeD;e.currentTarget.textContent=threeD?'2D':'3D';
  if(ready)map.setPaintProperty('bld','fill-extrusion-height',threeD?['get','h']:0);map.easeTo({pitch:threeD?50:0,duration:500});};
$('stops').textContent=V_NODE?END_NAME.A+' · Stop 54 · '+END_NAME.B:END_NAME.A+' · '+END_NAME.B;
if(!V_NODE)$('dsel').options[2].remove();
$('psel').onchange=e=>{const v=e.target.value;if(v==='gps')startGps();else if(v==='A'||v==='B')choosePlace(snap(...N[v==='A'?A_NODE:B_NODE]),v);};
$('dsel').onchange=e=>{const k={A:A_NODE,V:V_NODE,B:B_NODE}[e.target.value];if(k)setDest(snap(...N[k]),true);else if(!e.target.value)setDest(null);};
// live GNSS, as in lpu-wayfinder: a quick rough fix first (the phone's last known spot), then high-accuracy GPS;
// if GPS is too slow (indoors) fall back to network location; a brief GPS drop keeps the last spot.
// Starts when the app opens; the button turns it off and on again.
const LAST_FIX='cartLastFix';
let gotFix=false,firstCentre=true,touchedMap=false,centredAt=0;
function gpsBtn(state){const b=$('gps');b.classList.toggle('busy',state==='asking');b.classList.toggle('on',state==='on');}
function onPos(pos){
  if(watchId===null||riding)return;                                                 // a late fix after you picked a place by hand
  const ll=[pos.coords.longitude,pos.coords.latitude],acc=Math.round(pos.coords.accuracy),sp=pos.coords.speed,hd=pos.coords.heading;
  gotFix=true;gpsBtn('on');
  gpsFix={ll,acc,heading:typeof hd==='number'&&!isNaN(hd)&&(sp||0)>0.6?hd:null};   // heading only while moving
  if(!inside(ll)){if(firstCentre&&acc<=150){firstCentre=false;toast('You seem to be outside the campus (±'+acc+' m)',4200);}return;}
  if(acc>500)return;                                                        // too rough to place you
  try{localStorage.setItem(LAST_FIX,JSON.stringify({ll,t:Date.now()}));}catch(_){}
  setMe(snap(...toXY(ll)));
  if(firstCentre){firstCentre=false;centredAt=Date.now();map.easeTo({center:ll,zoom:Math.max(map.getZoom(),16.5),duration:300});toast((acc>80?'Rough location, ±':'Live location on, ±')+acc+' m');}
  else if(!touchedMap&&acc<=60&&Date.now()-centredAt<60000){const c=map.project(ll);if(Math.hypot(c.x-W/2,c.y-H/2)>60)map.easeTo({center:ll,duration:300});} // first minute: stay on you while GPS sharpens
}
function startGps(){
  if(!navigator.geolocation){toast('GPS is not available here. Tap the map or pick From to choose your place',4200);return;}
  stopGps();$('psel').value='gps';gpsBtn('asking');gotFix=false;firstCentre=true;touchedMap=false;
  const follow=high=>{watchId=navigator.geolocation.watchPosition(onPos,err=>{
      if(err.code===1){stopGps();toast('Location permission denied. Tap the map or pick From to choose your place',4200);return;}
      if(gotFix)return;                                                     // keep the last known spot on a brief drop
      if(high){navigator.geolocation.clearWatch(watchId);follow(false);}    // GPS too slow: use network location
      else{stopGps();toast('Could not get your location. Tap the map or pick From to choose your place',4200);}
    },{enableHighAccuracy:high,maximumAge:high?3000:60000,timeout:high?12000:30000});};
  navigator.geolocation.getCurrentPosition(onPos,()=>{},{enableHighAccuracy:false,maximumAge:600000,timeout:4000});
  follow(true);
}
function stopGps(){if(watchId!==null)navigator.geolocation.clearWatch(watchId);watchId=null;gpsFix=null;gpsBtn('off');}
$('gps').onclick=()=>{if(riding){follow=true;update();return;}if(watchId!==null){stopGps();toast('Live location off');}else startGps();};
['dragstart','zoomstart','rotatestart'].forEach(ev=>map.on(ev,e=>{if(e.originalEvent){touchedMap=true;if(ev==='dragstart')follow=false;}}));
try{const l=JSON.parse(localStorage.getItem(LAST_FIX));if(l&&Date.now()-l.t<12*3600e3&&inside(l.ll)){setMe(snap(...toXY(l.ll)));map.jumpTo({center:l.ll,zoom:16.5});}}catch(_){} // open where this phone last was (12 h)
startGps();

// ---------- developer option: place Point A and Point B ----------
const fmt=p=>p?p[1].toFixed(6)+', '+p[0].toFixed(6):'not set';
function devShow(){$('devc').textContent='A '+fmt(STOPS.A)+'  \u00b7  B '+fmt(STOPS.B)+(DEV_STOPS?'  (placed)':'  (default)');
  $('devA').classList.toggle('on',devPlace==='A');$('devB').classList.toggle('on',devPlace==='B');}
$('logo').onclick=()=>{$('dev').hidden=!$('dev').hidden;devPlace=null;devShow();};
['A','B'].forEach(k=>$('dev'+k).onclick=()=>{devPlace=devPlace===k?null:k;devShow();if(devPlace)toast('Tap the map where Point '+k+' should be',3000);});
$('devR').onclick=()=>{try{localStorage.removeItem('devStops')}catch(_){}location.reload();};
$('devX').onclick=()=>{$('dev').hidden=true;devPlace=null;};

// ---------- bottom sheet: drag the handle down (or tap it) to show only the countdown, up to show it all ----------
{const sh=$('sheet'),g=$('grab');let y0=null;
 const setMin=on=>{if(sh.classList.contains('min')===on)return;
   // animate the height: measure both sizes, then slide from one to the other (map grows or shrinks with it)
   const h0=sh.offsetHeight;sh.classList.toggle('min',on);const h1=sh.offsetHeight;
   if(!matchMedia('(prefers-reduced-motion: reduce)').matches){sh.style.overflow='hidden';sh.style.height=h0+'px';sh.offsetHeight;sh.style.transition='height .3s cubic-bezier(.2,.8,.2,1)';sh.style.height=h1+'px';
     const done=()=>{sh.style.height=sh.style.transition=sh.style.overflow='';sh.removeEventListener('transitionend',done);};sh.addEventListener('transitionend',done);setTimeout(done,450);}
  g.setAttribute('aria-expanded',String(!on));g.setAttribute('aria-label',on?'Show more':'Show less');};
 g.onclick=()=>{if(y0===null)setMin(!sh.classList.contains('min'));};
 sh.addEventListener('pointerdown',e=>{if(e.target===g||e.target.closest('#next')){y0=e.clientY;}});
 addEventListener('pointerup',e=>{if(y0===null)return;const dy=e.clientY-y0;if(dy>30)setMin(true);else if(dy<-30)setMin(false);else if(e.target===g)setMin(!sh.classList.contains('min'));setTimeout(()=>{y0=null},0);});}
