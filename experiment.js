(()=>{
const stageEl=document.getElementById('stage');
const resultCardEl=document.getElementById('resultCard');
const resultTextEl=document.getElementById('resultText');
const playImageEl=document.getElementById('playImage');
const collectionEl=document.getElementById('labCollection');
const extremeMode=document.getElementById('labExtremeMode');
const historyEl=document.getElementById('labHistory');
const historyEmpty=document.getElementById('labHistoryEmpty');
const makeGifBtn=document.getElementById('labMakeGif');
const clearHistoryBtn=document.getElementById('labClearHistory');
const gifStatus=document.getElementById('labGifStatus');
const gifResult=document.getElementById('labGifResult');
const gifPreview=document.getElementById('labGifPreview');
const gifDownload=document.getElementById('labGifDownload');
if(!stageEl||!resultCardEl||!collectionEl||!historyEl)return;

const MIRACLE_DAIKICHI_RATE=.20;
const MIRACLE_DAIKYO_RATE=.25;
const LUCKY_COLORS=[
  {name:'さくらピンク',hex:'#f4a7b9'},{name:'ミルクホワイト',hex:'#fffaf2'},
  {name:'おひさまイエロー',hex:'#f6d365'},{name:'そらいろ',hex:'#8ecae6'},
  {name:'若葉グリーン',hex:'#9bd18b'},{name:'ラベンダー',hex:'#c7b2e5'},
  {name:'ももいろ',hex:'#f7b2c4'},{name:'クリーム',hex:'#f4dfad'}
];
const LUCKY_POINTS=[
  'ほっぺ','おてて','あんよ','口もと','まつげ','つむじ','おなか','横顔',
  'にぎった手','ちいさな指','ふわふわの髪','眠そうな目'
];
const MIRACLE_MESSAGES=[
  '大吉のその先へ。この一枚が今日のごほうび。',
  '今日は運勢では測れません。この一枚が大当たり。',
  '大吉を超えて、写真そのものが宝物になりそう。'
];
const REVERSAL_MESSAGES=[
  '大凶……と思いきや、この一枚で全部ひっくり返りました。',
  '運勢は大凶。でも、この表情を見たら今日は最高の日。',
  'まさかの大逆転。最後に残ったのは、とびきり幸せな一枚。'
];

let currentLab=null;
let rareTimer=null;
let rareSecondTimer=null;
let history=[];
let gifUrl=null;

const extra=document.createElement('div');
extra.id='labFortuneExtra';
extra.innerHTML='<div id="labLucky"></div><div id="labSpecialLine"></div><button id="labSavePhoto" type="button">♡ 今日の一枚に保存</button>';
resultCardEl.appendChild(extra);
const luckyEl=extra.querySelector('#labLucky');
const specialLine=extra.querySelector('#labSpecialLine');
const saveBtn=extra.querySelector('#labSavePhoto');

const rare=document.createElement('div');
rare.id='labRareBadge';
stageEl.appendChild(rare);

function randomOf(arr){return arr[Math.floor(Math.random()*arr.length)];}
function pickLucky(){
  return {color:randomOf(LUCKY_COLORS),point:randomOf(LUCKY_POINTS)};
}
function specialFor(fortune){
  if(fortune==='大吉'&&Math.random()<MIRACLE_DAIKICHI_RATE)return 'miracle';
  if(fortune==='大凶'&&Math.random()<MIRACLE_DAIKYO_RATE)return 'reversal';
  return null;
}
function playSpecialSound(kind){
  try{
    if(!primed||!ensureAudio())return;
    if(kind==='reversal'){
      tone(392,.12,0,.05,'triangle');tone(659,.15,.10,.055,'sine');
      tone(988,.20,.23,.06,'sine');tone(1319,.35,.40,.065,'sine');
    }else{
      tone(784,.13,0,.055,'sine');tone(1047,.16,.10,.06,'sine');
      tone(1319,.20,.22,.065,'sine');tone(1568,.34,.37,.07,'sine');
    }
  }catch(e){}
}
function clearSpecial(){
  clearTimeout(rareTimer);clearTimeout(rareSecondTimer);
  rareTimer=rareSecondTimer=null;rare.className='';rare.textContent='';
  stageEl.classList.remove('lab-miracle','lab-reversal');
}
function clearLab(){
  clearSpecial();extra.style.display='none';specialLine.style.display='none';currentLab=null;
}
function showMiracle(kind){
  if(kind==='miracle'){
    rare.textContent='✨ 奇跡の一枚 ✨';rare.className='show miracle';
    stageEl.classList.add('lab-miracle');
    specialLine.textContent='✨ '+randomOf(MIRACLE_MESSAGES);
    specialLine.className='miracle';specialLine.style.display='block';
    playSpecialSound('miracle');
    rareSecondTimer=setTimeout(()=>rare.classList.remove('show'),2200);
    return;
  }
  rare.textContent='……あれ？';rare.className='show reversal-wait';
  rareSecondTimer=setTimeout(()=>{
    if(running)return;
    rare.textContent='🌈 大逆転！奇跡の一枚 🌈';rare.className='show reversal';
    stageEl.classList.add('lab-reversal');
    specialLine.textContent='🌈 '+randomOf(REVERSAL_MESSAGES);
    specialLine.className='reversal';specialLine.style.display='block';
    playSpecialSound('reversal');
    setTimeout(()=>rare.classList.remove('show'),2300);
  },700);
}

function renderHistory(){
  historyEl.innerHTML='';
  historyEmpty.style.display=history.length?'none':'block';
  makeGifBtn.disabled=history.length<2;
  clearHistoryBtn.disabled=!history.length;
  history.forEach((x,i)=>{
    const card=document.createElement('div');card.className='labHistoryItem';
    card.innerHTML='<img alt=""><div><strong></strong><span></span></div>';
    card.querySelector('img').src=x.image;
    card.querySelector('strong').textContent=(i+1)+'回目 ・ '+x.fortune;
    card.querySelector('span').textContent='元動画 '+x.time.toFixed(1)+'秒';
    historyEl.appendChild(card);
  });
}
function addHistory(item){
  const time=Number(activeCreation?.times?.[currentIndex]);
  history.push({
    image:playImageEl.currentSrc||playImageEl.src,
    time:Number.isFinite(time)?time:currentIndex,
    fortune:item.fortune,
    special:item.special,
    drawnAt:Date.now()
  });
  if(history.length>40)history.shift();
  renderHistory();
}
function clearGifResult(){
  if(gifUrl){URL.revokeObjectURL(gifUrl);gifUrl=null;}
  gifResult.style.display='none';gifPreview.removeAttribute('src');gifDownload.removeAttribute('href');
}
function showLabResult(){
  if(!activeCreation||activeCreation.mode!=='omikuji'||running)return;
  const fortune=(resultTextEl.textContent||'吉').trim();
  const lucky=pickLucky();
  const special=specialFor(fortune);
  currentLab={fortune,lucky,special};
  luckyEl.innerHTML=
    '<div class="labLuckyRow"><span>今日のラッキーカラー</span><b><i style="background:'+lucky.color.hex+'"></i>'+lucky.color.name+'</b></div>'+
    '<div class="labLuckyRow"><span>今日のラッキーポイント</span><b>✨ '+lucky.point+'</b></div>';
  specialLine.style.display='none';specialLine.className='';
  saveBtn.textContent='♡ 今日の一枚に保存';saveBtn.disabled=false;
  extra.style.display='block';
  addHistory(currentLab);
  if(special)rareTimer=setTimeout(()=>{if(!running)showMiracle(special);},special==='reversal'?1500:1250);
}

const previousStop=stopRun;
stopRun=function(){
  let restore=null;
  if(extremeMode?.checked&&activeCreation?.mode==='omikuji'&&activeCreation.fortunes){
    restore=activeCreation.fortunes[currentIndex];
    activeCreation.fortunes[currentIndex]=Math.random()<.5?'大吉':'大凶';
  }
  previousStop();
  if(restore!==null)activeCreation.fortunes[currentIndex]=restore;
  setTimeout(showLabResult,40);
};
const previousStart=startRun;
startRun=function(withSound=true){clearLab();previousStart(withSound);};
const previousPrepare=preparePlay;
preparePlay=function(x){
  clearLab();history=[];renderHistory();clearGifResult();previousPrepare(x);
};

saveBtn.addEventListener('pointerdown',async e=>{
  e.preventDefault();e.stopPropagation();
  if(!currentLab||running)return;
  saveBtn.disabled=true;saveBtn.textContent='保存中…';
  try{
    await labSave({
      id:'p'+Date.now()+Math.random().toString(36).slice(2,7),createdAt:Date.now(),
      image:playImageEl.currentSrc||playImageEl.src,fortune:currentLab.fortune,
      luckyColor:currentLab.lucky.color.name,luckyColorHex:currentLab.lucky.color.hex,
      luckyPoint:currentLab.lucky.point,special:currentLab.special
    });
    saveBtn.textContent='✓ 保存しました';await renderCollection();
  }catch(err){console.error(err);saveBtn.disabled=false;saveBtn.textContent='保存できませんでした';}
},{passive:false});

clearHistoryBtn.addEventListener('click',()=>{
  history=[];renderHistory();clearGifResult();gifStatus.style.display='none';
});

makeGifBtn.addEventListener('click',async()=>{
  if(history.length<2)return;
  makeGifBtn.disabled=true;clearGifResult();
  gifStatus.style.display='block';gifStatus.textContent='GIFを作っています… 0/'+history.length;
  try{
    const sorted=history.slice().sort((a,b)=>a.time-b.time||a.drawnAt-b.drawnAt);
    const blob=await makeGif(sorted,(done,total)=>{gifStatus.textContent='GIFを作っています… '+done+'/'+total;});
    gifUrl=URL.createObjectURL(blob);
    gifPreview.src=gifUrl;gifDownload.href=gifUrl;
    gifResult.style.display='block';
    gifStatus.textContent='元動画の時間順に'+sorted.length+'枚を並べてGIFを作りました。';
  }catch(err){
    console.error(err);gifStatus.textContent='GIFを作れませんでした: '+err.message;
  }finally{
    makeGifBtn.disabled=history.length<2;
  }
});

async function loadImage(src){
  return new Promise((resolve,reject)=>{
    const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('画像を読み込めません'));img.src=src;
  });
}
function u16(v){return [v&255,(v>>8)&255];}
function gifPalette(){
  const p=[];
  for(let i=0;i<256;i++){
    const r=Math.round(((i>>5)&7)*255/7),g=Math.round(((i>>2)&7)*255/7),b=Math.round((i&3)*255/3);
    p.push(r,g,b);
  }
  return p;
}
function lzwEncode(pixels,minCodeSize=8){
  const clear=1<<minCodeSize,end=clear+1;
  let next=end+1,codeSize=minCodeSize+1,dict=new Map();
  const out=[];let bitBuf=0,bitCount=0;
  const emit=code=>{
    bitBuf|=code<<bitCount;bitCount+=codeSize;
    while(bitCount>=8){out.push(bitBuf&255);bitBuf>>=8;bitCount-=8;}
  };
  const reset=()=>{dict=new Map();next=end+1;codeSize=minCodeSize+1;};
  emit(clear);
  let prefix=pixels[0]??0;
  for(let i=1;i<pixels.length;i++){
    const k=pixels[i],key=(prefix<<8)|k;
    const found=dict.get(key);
    if(found!==undefined){prefix=found;continue;}
    emit(prefix);
    if(next<4096){
      dict.set(key,next++);
      if(next===(1<<codeSize)&&codeSize<12)codeSize++;
    }else{
      emit(clear);reset();
    }
    prefix=k;
  }
  emit(prefix);emit(end);
  if(bitCount>0)out.push(bitBuf&255);
  return out;
}
function appendSubBlocks(writer,data){
  for(let i=0;i<data.length;i+=255){
    const n=Math.min(255,data.length-i);writer.push(n);
    for(let j=0;j<n;j++)writer.push(data[i+j]);
  }
  writer.push(0);
}
async function makeGif(entries,onProgress){
  const first=await loadImage(entries[0].image);
  const maxW=320,maxH=420;
  const scale=Math.min(1,maxW/first.naturalWidth,maxH/first.naturalHeight);
  const w=Math.max(2,Math.round(first.naturalWidth*scale));
  const h=Math.max(2,Math.round(first.naturalHeight*scale));
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  const bytes=[];
  'GIF89a'.split('').forEach(ch=>bytes.push(ch.charCodeAt(0)));
  bytes.push(...u16(w),...u16(h),0xF7,0,0,...gifPalette());
  bytes.push(0x21,0xFF,0x0B,...Array.from('NETSCAPE2.0').map(c=>c.charCodeAt(0)),0x03,0x01,0x00,0x00,0x00);
  for(let fi=0;fi<entries.length;fi++){
    const img=fi===0?first:await loadImage(entries[fi].image);
    ctx.clearRect(0,0,w,h);ctx.fillStyle='#000';ctx.fillRect(0,0,w,h);
    const s=Math.min(w/img.naturalWidth,h/img.naturalHeight);
    const dw=Math.round(img.naturalWidth*s),dh=Math.round(img.naturalHeight*s);
    ctx.drawImage(img,Math.round((w-dw)/2),Math.round((h-dh)/2),dw,dh);
    const d=ctx.getImageData(0,0,w,h).data;
    const idx=new Uint8Array(w*h);
    for(let i=0,p=0;i<d.length;i+=4,p++)idx[p]=((d[i]>>5)<<5)|((d[i+1]>>5)<<2)|(d[i+2]>>6);
    const delay=35;
    bytes.push(0x21,0xF9,0x04,0x00,...u16(delay),0x00,0x00);
    bytes.push(0x2C,0,0,0,0,...u16(w),...u16(h),0x00,0x08);
    appendSubBlocks(bytes,lzwEncode(idx,8));
    onProgress?.(fi+1,entries.length);
    await new Promise(r=>setTimeout(r,0));
  }
  bytes.push(0x3B);
  return new Blob([new Uint8Array(bytes)],{type:'image/gif'});
}

const DB='babyExpressionRouletteLabDB',STORE='dailyPhotos';
function labDB(){
  return new Promise((resolve,reject)=>{
    const r=indexedDB.open(DB,1);
    r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE,{keyPath:'id'});};
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
  });
}
async function labSave(item){
  const db=await labDB();
  await new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(item);
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
  });
  const all=await labAll();
  if(all.length>40){
    const old=all.slice(40),db2=await labDB();
    await new Promise((resolve,reject)=>{
      const tx=db2.transaction(STORE,'readwrite'),st=tx.objectStore(STORE);
      old.forEach(x=>st.delete(x.id));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
    });
  }
}
async function labAll(){
  const db=await labDB();
  return new Promise((resolve,reject)=>{
    const r=db.transaction(STORE).objectStore(STORE).getAll();
    r.onsuccess=()=>resolve(r.result.sort((a,b)=>b.createdAt-a.createdAt));
    r.onerror=()=>reject(r.error);
  });
}
async function labDelete(id){
  const db=await labDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
  });
}
async function renderCollection(){
  const all=await labAll();collectionEl.innerHTML='';
  if(!all.length){collectionEl.innerHTML='<div class="note">まだ保存されていません。</div>';return;}
  all.forEach(x=>{
    const card=document.createElement('article');card.className='labPhotoCard';
    const d=new Date(x.createdAt);
    card.innerHTML='<img alt="保存した赤ちゃんの写真"><div class="labPhotoMeta"><strong></strong><span></span></div><button type="button" class="labDelete">削除</button>';
    card.querySelector('img').src=x.image;
    const mark=x.special==='reversal'?'🌈 ':x.special==='miracle'?'✨ ':'';
    card.querySelector('strong').textContent=mark+x.fortune+' ・ '+(x.luckyColor||'')+' ・ '+(x.luckyPoint||'');
    card.querySelector('span').textContent=d.toLocaleString('ja-JP',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
    card.querySelector('.labDelete').addEventListener('click',async()=>{await labDelete(x.id);renderCollection();});
    collectionEl.appendChild(card);
  });
}
renderHistory();renderCollection().catch(console.error);
})();