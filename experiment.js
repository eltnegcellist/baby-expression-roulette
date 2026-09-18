(()=>{
const stageEl=document.getElementById('stage');
const resultCardEl=document.getElementById('resultCard');
const resultTextEl=document.getElementById('resultText');
const playImageEl=document.getElementById('playImage');
const collectionEl=document.getElementById('labCollection');
if(!stageEl||!resultCardEl||!collectionEl)return;

const CATEGORIES=[
  {name:'写真運',icon:'📸',lines:['今日は名作候補が見つかりそう。','ふとした一瞬がとっておきの一枚に。','カメラを向けたくなる表情に出会えそう。']},
  {name:'ごきげん運',icon:'😊',lines:['にこっとする瞬間を見つけられそう。','今日はゆったり楽しい空気。','小さなごきげんをたくさん拾えそう。']},
  {name:'家族運',icon:'🏠',lines:['みんなで見るとさらに楽しい一枚。','家族の笑い声が増えそう。','あとで見返したくなる時間になりそう。']},
  {name:'発見運',icon:'🔎',lines:['まだ知らない表情を発見できるかも。','意外な仕草に注目の日。','いつもの動画に新しい一瞬が隠れていそう。']},
  {name:'だっこ運',icon:'🤗',lines:['ぬくぬく時間が似合う日。','安心できる時間をのんびり楽しもう。','近くで見る表情がいちばんのごほうび。']},
  {name:'おでかけ運',icon:'🌤️',lines:['いつもと違う景色が新鮮かも。','小さな寄り道が思い出になりそう。','気分転換にちょうどいい日。']}
];
const FORTUNE_BASE={'大吉':5,'吉':4,'中吉':4,'小吉':3,'末吉':3,'凶':2,'大凶':1};
let currentLab=null;
let rareTimer=null;

const extra=document.createElement('div');
extra.id='labFortuneExtra';
extra.innerHTML='<div id="labCategory"></div><button id="labSavePhoto" type="button">♡ 今日の一枚に保存</button>';
resultCardEl.appendChild(extra);
const categoryEl=extra.querySelector('#labCategory');
const saveBtn=extra.querySelector('#labSavePhoto');

const rare=document.createElement('div');
rare.id='labRareBadge';
rare.textContent='✨ 奇跡の一枚 ✨';
stageEl.appendChild(rare);

function stars(n){return '★'.repeat(n)+'☆'.repeat(5-n);}
function pickCategory(fortune){
  const c=CATEGORIES[Math.floor(Math.random()*CATEGORIES.length)];
  const base=FORTUNE_BASE[fortune]??3;
  const score=Math.max(1,Math.min(5,base+(Math.random()<.32?(Math.random()<.5?-1:1):0)));
  return {name:c.name,icon:c.icon,line:c.lines[Math.floor(Math.random()*c.lines.length)],score};
}
function clearLab(){
  clearTimeout(rareTimer);
  rare.classList.remove('show');
  extra.style.display='none';
  currentLab=null;
}
function showLabResult(){
  if(!activeCreation||activeCreation.mode!=='omikuji'||running)return;
  const fortune=(resultTextEl.textContent||'吉').trim();
  const cat=pickCategory(fortune);
  const isRare=Math.random()<0.05;
  currentLab={fortune,category:cat,isRare};
  categoryEl.innerHTML='<div class="labCategoryTitle">'+cat.icon+' '+cat.name+' <span>'+stars(cat.score)+'</span></div><div class="labCategoryLine">'+cat.line+'</div>';
  saveBtn.textContent='♡ 今日の一枚に保存';
  saveBtn.disabled=false;
  extra.style.display='block';
  if(isRare){
    rareTimer=setTimeout(()=>{
      if(!running){
        rare.classList.add('show');
        setTimeout(()=>rare.classList.remove('show'),2100);
      }
    },1600);
  }
}

const previousStop=stopRun;
stopRun=function(){
  previousStop();
  setTimeout(showLabResult,40);
};
const previousStart=startRun;
startRun=function(withSound=true){
  clearLab();
  previousStart(withSound);
};
const previousPrepare=preparePlay;
preparePlay=function(x){
  clearLab();
  previousPrepare(x);
};

saveBtn.addEventListener('pointerdown',async e=>{
  e.preventDefault();e.stopPropagation();
  if(!currentLab||running)return;
  saveBtn.disabled=true;
  saveBtn.textContent='保存中…';
  try{
    await labSave({
      id:'p'+Date.now()+Math.random().toString(36).slice(2,7),
      createdAt:Date.now(),
      image:playImageEl.currentSrc||playImageEl.src,
      fortune:currentLab.fortune,
      category:currentLab.category.name,
      categoryIcon:currentLab.category.icon,
      categoryScore:currentLab.category.score,
      rare:currentLab.isRare
    });
    saveBtn.textContent='✓ 保存しました';
    await renderCollection();
  }catch(err){
    console.error(err);
    saveBtn.disabled=false;
    saveBtn.textContent='保存できませんでした';
  }
},{passive:false});

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
    const old=all.slice(40);
    const db2=await labDB();
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
  const all=await labAll();
  collectionEl.innerHTML='';
  if(!all.length){collectionEl.innerHTML='<div class="note">まだ保存されていません。</div>';return;}
  all.forEach(x=>{
    const card=document.createElement('article');card.className='labPhotoCard';
    const d=new Date(x.createdAt);
    card.innerHTML='<img alt="保存した赤ちゃんの写真"><div class="labPhotoMeta"><strong></strong><span></span></div><button type="button" class="labDelete">削除</button>';
    card.querySelector('img').src=x.image;
    card.querySelector('strong').textContent=(x.rare?'✨ ':'')+x.fortune+' ・ '+(x.categoryIcon||'')+' '+x.category;
    card.querySelector('span').textContent=d.toLocaleString('ja-JP',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
    card.querySelector('.labDelete').addEventListener('click',async()=>{await labDelete(x.id);renderCollection();});
    collectionEl.appendChild(card);
  });
}
renderCollection().catch(console.error);
})();