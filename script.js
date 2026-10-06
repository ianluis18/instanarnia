const REF_W = 1408, REF_H = 1760;
const tela = document.getElementById('tela');
const ctx = tela.getContext('2d');
const K = tela.width / REF_W;
const TINTA = '#1b1a18';

const ATOS = [
  { nome:'O Sobrinho do Mago',                    fonte:s=>`${s}px "Kaushan Script"`,          tam:112 },
  { nome:'O Leão, A Feiticeira e o Guarda-Roupa', fonte:s=>`${s}px "Yesteryear"`,              tam:104 },
  { nome:'Príncipe Caspian',                      fonte:s=>`italic 700 ${s}px "Lobster Two"`,  tam:116 }
];
const FONTE_MANUAL = s => `${s}px "IM Fell English SC"`;
const FONTE_NOME   = s => `${s}px "Berkshire Swash"`;

const estado = { ato:0, foto:null, x:705, y:700, h:900, espelho:false };
const $ = id => document.getElementById(id);

/* ---------- utilidades ---------- */
function mulberry(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

// polígono com contorno levemente tremido, estilo desenhado à mão
function poly(pts, o={}){
  const {fill=null, stroke=TINTA, lw=4, amp=1.3, seed=1, fechar=true} = o;
  const r = mulberry(seed), out = [], n = pts.length;
  const total = fechar ? n : n-1;
  for(let i=0;i<total;i++){
    const a = pts[i], b = pts[(i+1)%n];
    const len = Math.hypot(b[0]-a[0], b[1]-a[1]);
    const passos = Math.max(1, Math.round(len/26));
    for(let s=0;s<passos;s++){
      const t = s/passos;
      out.push([a[0]+(b[0]-a[0])*t+(r()-.5)*amp*2, a[1]+(b[1]-a[1])*t+(r()-.5)*amp*2]);
    }
  }
  if(!fechar) out.push(pts[n-1]);
  ctx.beginPath();
  out.forEach((p,i)=> i? ctx.lineTo(p[0],p[1]) : ctx.moveTo(p[0],p[1]));
  if(fechar) ctx.closePath();
  if(fill){ ctx.fillStyle = fill; ctx.fill(); }
  if(stroke){ ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.lineJoin='round'; ctx.lineCap='round'; ctx.stroke(); }
}
function rect(x,y,w,h){ return [[x,y],[x+w,y],[x+w,y+h],[x,y+h]]; }

function ajustar(txt, fonteFn, tam, maxW){
  ctx.font = fonteFn(tam);
  const w = ctx.measureText(txt).width;
  return w > maxW ? tam*maxW/w : tam;
}

/* ---------- fundo (papel + bola vermelha), desenhado uma vez ---------- */
let fundo = null;
function criarFundo(){
  const c = document.createElement('canvas'); c.width = tela.width; c.height = tela.height;
  const g = c.getContext('2d'); g.scale(K,K);
  const r = mulberry(7);
  // papel
  g.fillStyle = '#f1e8d2'; g.fillRect(0,0,REF_W,REF_H);
  const grad = g.createRadialGradient(REF_W/2,REF_H/2,300,REF_W/2,REF_H/2,1150);
  grad.addColorStop(0,'rgba(255,250,235,0)'); grad.addColorStop(1,'rgba(150,115,60,.30)');
  g.fillStyle = grad; g.fillRect(0,0,REF_W,REF_H);
  // bola vermelha
  g.save();
  g.beginPath();
  for(let i=0;i<=120;i++){
    const a = i/120*Math.PI*2, rr = 385 + Math.sin(a*5+1)*3 + (r()-.5)*3;
    const px = 705+Math.cos(a)*rr, py = 805+Math.sin(a)*rr;
    i? g.lineTo(px,py) : g.moveTo(px,py);
  }
  g.closePath();
  g.fillStyle = '#d82a28'; g.fill();
  g.clip();
  for(let i=0;i<700;i++){
    const x = 320+r()*770, y = 420+r()*770, rad = 6+r()*40;
    g.fillStyle = r()>.5 ? 'rgba(120,10,10,.07)' : 'rgba(255,110,90,.07)';
    g.beginPath(); g.arc(x,y,rad,0,7); g.fill();
  }
  g.restore();
  g.beginPath();
  for(let i=0;i<=120;i++){
    const a = i/120*Math.PI*2, rr = 385 + Math.sin(a*5+1)*3;
    const px = 705+Math.cos(a)*rr, py = 805+Math.sin(a)*rr;
    i? g.lineTo(px,py) : g.moveTo(px,py);
  }
  g.closePath(); g.strokeStyle = 'rgba(27,26,24,.55)'; g.lineWidth = 3; g.stroke();
  // fibras e pintinhas do papel (por cima de tudo)
  for(let i=0;i<1400;i++){
    const x = r()*REF_W, y = r()*REF_H, t = r();
    if(t<.6){ g.fillStyle = `rgba(110,80,40,${.10+r()*.25})`; g.beginPath(); g.arc(x,y,.8+r()*2.2,0,7); g.fill(); }
    else { g.strokeStyle = `rgba(120,90,50,${.12+r()*.2})`; g.lineWidth = 1; g.beginPath(); g.moveTo(x,y); g.lineTo(x+(r()-.5)*22, y+(r()-.5)*10); g.stroke(); }
  }
  for(let i=0;i<10;i++){ g.fillStyle='rgba(90,60,30,.35)'; g.beginPath(); g.arc(r()*REF_W, r()*REF_H, 2+r()*3,0,7); g.fill(); }
  fundo = c;
}

/* ---------- peças ---------- */
function tabua(x,y,w,h,seed,o={}){
  const g = ctx.createLinearGradient(x,y,x,y+h);
  g.addColorStop(0,'#f6f0df'); g.addColorStop(1,'#e8dec3');
  poly(rect(x,y,w,h), {fill:g, lw:4.5, amp:1.4, seed});
  // veios da madeira
  const r = mulberry(seed+50);
  ctx.save(); ctx.strokeStyle='rgba(120,95,60,.18)'; ctx.lineWidth=1.5;
  for(let i=0;i<4;i++){ const yy = y+h*(.2+i*.2)+(r()-.5)*6; ctx.beginPath(); ctx.moveTo(x+14,yy); ctx.lineTo(x+w-14,yy+(r()-.5)*4); ctx.stroke(); }
  ctx.restore();
  // moldura interna
  const m = o.margem ?? 12;
  poly(rect(x+m,y+m,w-2*m,h-2*m), {stroke:'rgba(27,26,24,.75)', lw:2, amp:1, seed:seed+9});
}

function corrente(ax,ay,bx,by){
  const dx = bx-ax, dy = by-ay, len = Math.hypot(dx,dy), ang = Math.atan2(dy,dx)-Math.PI/2;
  const passo = 36, n = Math.floor(len/passo);
  for(let i=0;i<=n;i++){
    const t = i*passo/len, x = ax+dx*t, y = ay+dy*t;
    ctx.save(); ctx.translate(x,y); ctx.rotate(ang+Math.PI);
    if(i%2===0){ // elo de frente
      ctx.beginPath(); ctx.ellipse(0,0,18,28,0,0,7); ctx.fillStyle='#e6e6e1'; ctx.fill(); ctx.lineWidth=4; ctx.strokeStyle=TINTA; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0,0,8,17,0,0,7); ctx.fillStyle='#efe6d0'; ctx.fill(); ctx.lineWidth=3; ctx.stroke();
    } else { // elo de lado
      poly([[-7,-24],[7,-24],[7,24],[-7,24]], {fill:'#c9c9c4', lw:3.5, amp:.5, seed:i+3});
      ctx.strokeStyle='rgba(27,26,24,.5)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(0,-18); ctx.lineTo(0,18); ctx.stroke();
    }
    ctx.restore();
  }
}

function pino(lado, L, R, sy){ // pontas de madeira onde as correntes prendem
  const f = lado<0;
  const base = f ? L : R, d = f ? -1 : 1;
  const pts = [[base-d*30,sy+70],[base+d*70,sy+84],[base+d*98,sy+112],[base+d*72,sy+140],[base-d*30,sy+152]];
  poly(pts, {fill:'#8a5428', lw:4, amp:1.2, seed:f?21:22});
  ctx.strokeStyle='rgba(40,20,5,.55)'; ctx.lineWidth=1.8;
  for(let i=0;i<3;i++){ ctx.beginPath(); ctx.moveTo(base-d*20,sy+90+i*20); ctx.lineTo(base+d*70,sy+98+i*18); ctx.stroke(); }
}

/* ---------- desenho principal ---------- */
function desenhar(){
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,tela.width,tela.height);
  if(fundo) ctx.drawImage(fundo,0,0);
  ctx.setTransform(K,0,0,K,0,0);

  // foto: na frente da bola, atrás dos papéis
  if(estado.foto){
    const ih = estado.h, iw = ih*estado.foto.width/estado.foto.height;
    ctx.save(); ctx.translate(estado.x, estado.y); if(estado.espelho) ctx.scale(-1,1);
    ctx.drawImage(estado.foto, -iw/2, -ih/2, iw, ih); ctx.restore();
  }

  // título e ELENCO
  const ato = ATOS[estado.ato];
  ctx.fillStyle = TINTA; ctx.textAlign='center'; ctx.textBaseline='alphabetic';
  ctx.font = FONTE_MANUAL(76); ctx.fillText('ELENCO', 705, 160);
  const ts = ajustar(ato.nome, ato.fonte, ato.tam, 800);
  ctx.font = ato.fonte(ts); ctx.fillStyle = TINTA;
  const tw = ctx.measureText(ato.nome).width;
  ctx.fillText(ato.nome, 705, 285);
  poly([[705-tw/2-95,262],[705-tw/2-25,262]], {lw:3, fechar:false, seed:31, amp:.8});
  poly([[705+tw/2+25,262],[705+tw/2+95,262]], {lw:3, fechar:false, seed:32, amp:.8});
  poly([[430,345],[968,343]], {lw:3, fechar:false, seed:33, amp:1});

  // layout dos papéis
  const W = 840, L = 705-W/2, R = 705+W/2, SY = 1296, SH = 170;
  // correntes (atrás do papel pendurado)
  corrente(132,10, L-55, SY+108);
  corrente(1276,10, R+55, SY+108);

  // faixa do ator (inclinada)
  ctx.save(); ctx.translate(705,1058); ctx.rotate(-0.17);
  poly([[-372,68],[-292,68],[-292,100],[-346,112]], {fill:'#cdc2a3', lw:3.5, seed:41});
  poly([[292,68],[372,68],[372,112],[322,100]], {fill:'#cdc2a3', lw:3.5, seed:42});
  ctx.strokeStyle='rgba(27,26,24,.7)'; ctx.lineWidth=2.5; ctx.lineCap='round';
  [[-470,52,-385,46],[-440,78,-378,66],[385,-50,468,-60],[380,-30,440,-38]].forEach(l=>{ ctx.beginPath(); ctx.moveTo(l[0],l[1]); ctx.lineTo(l[2],l[3]); ctx.stroke(); });
  tabua(-380,-75,760,150,11);
  const ator = $('ator').value.trim();
  if(ator){
    const s = ajustar(ator, FONTE_NOME, 92, 640);
    ctx.font = FONTE_NOME(s); ctx.fillStyle = TINTA; ctx.textBaseline='middle'; ctx.fillText(ator, 0, 6);
  }
  ctx.restore();

  // COMO
  const px = 705-125, py = 1222;
  poly([[px+14,py],[px+236,py],[px+250,py+14],[px+250,py+56],[px+236,py+70],[px+14,py+70],[px,py+56],[px,py+14]], {fill:'#f3ecd9', lw:4, amp:.9, seed:51});
  poly([[px+20,py+8],[px+230,py+8],[px+242,py+20],[px+242,py+50],[px+230,py+62],[px+20,py+62],[px+8,py+50],[px+8,py+20]], {stroke:'rgba(27,26,24,.7)', lw:1.8, amp:.6, seed:52});
  [[px+14,py+14],[px+236,py+14],[px+14,py+56],[px+236,py+56]].forEach(p=>{ ctx.fillStyle='rgba(27,26,24,.7)'; ctx.beginPath(); ctx.arc(p[0],p[1],2.5,0,7); ctx.fill(); });
  ctx.fillStyle = TINTA; ctx.font = FONTE_MANUAL(46); ctx.textBaseline='middle'; ctx.fillText('COMO', 705, py+37);

  // papel do personagem (pendurado)
  pino(-1,L,R,SY); pino(1,L,R,SY);
  tabua(L,SY,W,SH,61);
  const pers = $('personagem').value.trim();
  if(pers){
    const s = ajustar(pers, FONTE_NOME, 100, W-120);
    ctx.font = FONTE_NOME(s); ctx.fillStyle = TINTA; ctx.textBaseline='middle'; ctx.fillText(pers, 705, SY+SH/2+6);
  }

  // mini-descrição
  if($('usaDesc').checked){
    const d = $('desc').value.trim();
    ctx.font = FONTE_MANUAL(42);
    const tw2 = d ? ctx.measureText(d).width : 0;
    const mw = Math.min(Math.max(tw2+110, 220), 1000), mh = 70, mx = 705-mw/2, my = SY+SH+6;
    tabua(mx,my,mw,mh,71,{margem:8});
    if(d){ ctx.fillStyle=TINTA; ctx.textBaseline='middle'; ctx.font = FONTE_MANUAL(ajustar(d, FONTE_MANUAL, 42, mw-70)); ctx.fillText(d,705,my+mh/2+3); }
  }

  // rodapé
  ctx.textBaseline='alphabetic';
  ctx.fillStyle='rgba(90,70,45,.7)'; ctx.font = FONTE_MANUAL(30); ctx.textAlign='right';
  ctx.fillText('Turma da Sexta', REF_W-36, REF_H-30);
}

/* ---------- interface ---------- */
const boxAtos = $('atos');
ATOS.forEach((a,i)=>{
  const b = document.createElement('button');
  b.textContent = `${i+1}. ${a.nome}`;
  b.onclick = ()=>{ estado.ato = i; marcar(); desenhar(); };
  boxAtos.appendChild(b);
});
function marcar(){ [...boxAtos.children].forEach((b,i)=> b.classList.toggle('ativo', i===estado.ato)); }
marcar();

['ator','personagem','desc'].forEach(id=> $(id).addEventListener('input', desenhar));
$('usaDesc').onchange = e=>{ $('desc').disabled = !e.target.checked; if(e.target.checked) $('desc').focus(); desenhar(); };

$('arquivo').onchange = e=>{
  const f = e.target.files[0]; if(!f) return;
  const img = new Image();
  img.onload = ()=>{ estado.foto = img; estado.espelho = false; estado.h = 900; estado.x = 705; estado.y = 700; $('tamanho').value = 900; desenhar(); };
  img.src = URL.createObjectURL(f);
};
$('tamanho').oninput = e=>{ estado.h = +e.target.value; desenhar(); };
$('espelhar').onclick = ()=>{ estado.espelho = !estado.espelho; desenhar(); };
$('centralizar').onclick = ()=>{ estado.x = 705; estado.y = 700; desenhar(); };
$('removerFoto').onclick = ()=>{ estado.foto = null; $('arquivo').value=''; desenhar(); };

// arrastar a foto
let arrasto = null;
function posRef(e){ const r = tela.getBoundingClientRect(); return [(e.clientX-r.left)/r.width*REF_W, (e.clientY-r.top)/r.height*REF_H]; }
tela.addEventListener('pointerdown', e=>{ if(!estado.foto) return; const p = posRef(e); arrasto = {dx:estado.x-p[0], dy:estado.y-p[1]}; tela.setPointerCapture(e.pointerId); tela.classList.add('arrastando'); });
tela.addEventListener('pointermove', e=>{ if(!arrasto) return; const p = posRef(e); estado.x = p[0]+arrasto.dx; estado.y = p[1]+arrasto.dy; desenhar(); });
['pointerup','pointercancel'].forEach(ev=> tela.addEventListener(ev, ()=>{ arrasto=null; tela.classList.remove('arrastando'); }));
tela.addEventListener('wheel', e=>{ if(!estado.foto) return; e.preventDefault(); estado.h = Math.min(2200, Math.max(300, estado.h*(e.deltaY<0?1.04:.96))); $('tamanho').value = estado.h; desenhar(); }, {passive:false});

// download
$('baixar').onclick = ()=>{
  desenhar();
  tela.toBlob(blob=>{
    const nome = ($('ator').value.trim() || 'ator').toLowerCase().replace(/[^a-z0-9à-ú]+/gi,'-');
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `elenco-${nome}.png`; a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
  }, 'image/png');
};

// iniciar após carregar as fontes
criarFundo(); desenhar();
Promise.all([
  document.fonts.load('40px "Kaushan Script"'), document.fonts.load('40px "Yesteryear"'),
  document.fonts.load('italic 700 40px "Lobster Two"'), document.fonts.load('40px "IM Fell English SC"'), document.fonts.load('40px "Berkshire Swash"')
]).then(()=> desenhar()).catch(()=>{});
document.fonts.ready.then(desenhar);
