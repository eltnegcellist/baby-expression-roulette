(()=>{
const stageEl=document.getElementById('stage');
const resultCardEl=document.getElementById('resultCard');
const resultTextEl=document.getElementById('resultText');
const messageEl=document.getElementById('message');
const playImageEl=document.getElementById('playImage');
const playSectionEl=document.getElementById('playSection');
const collectionEl=document.getElementById('labCollection');
if(!stageEl||!resultCardEl||!playSectionEl||!collectionEl)return;

const MIRACLE_DAIKICHI_RATE=.20;
const MIRACLE_DAIKYO_RATE=.25;
const CATEGORIES=[
  {name:'写真運',icon:'📸',lines:['今日は名作候補が見つかりそう。','ふとした一瞬がとっておきの一枚に。','カメラを向けたくなる表情に出会えそう。']},
  {name:'ごきげん運',icon:'😊',lines:['にこっとする瞬間を見つけられそう。','今日はゆったり楽しい空気。','小さなごきげんをたくさん拾えそう。']},
  {name:'家族運',icon:'🏠',lines:['みんなで見るとさらに楽しい一枚。','家族の笑い声が増えそう。','あとで見返したくなる時間になりそう。']},
  {name:'発見運',icon:'🔎',lines:['まだ知らない表情を発見できるかも。','意外な仕草に注目の日。','いつもの動画に新しい一瞬が隠れていそう。']},
  {name:'だっこ運',icon:'🤗',lines:['ぬくぬく時間が似合う日。','安心できる時間をのんびり楽しもう。','近くで見る表情がいちばんのごほうび。']},
  {name:'おでかけ運',icon:'🌤️',lines:['いつもと違う景色が新鮮かも。','小さな寄り道が思い出になりそう。','気分転換にちょうどいい日。']}
];
const FORTUNE_BASE={'大吉':5,'吉':4,'中吉':4,'小吉':3,'末吉':3,'凶':2,'大凶':1};
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
let storyResults=[];

const extra=document.createElement('div');
extra.id='labFortuneExtra';
extra.innerHTML='<div id="labCategory"></div><div id="labSpecialLine"></div><button id="labSavePhoto" type="button">♡ 今日の一枚に保存</button>';
resultCardEl.appendChild(extra);
const categoryEl=extra.querySelector('#labCategory');
const specialLine=extra.querySelector('#labSpecialLine');
const saveBtn=extra.querySelector('#labSavePhoto');

const rare=document.createElement('div');
rare.id='labRareBadge';
stageEl.appendChild(rare);

const storyProgress=document.createElement('div');
storyProgress.id='labStoryProgress';
storyProgress.textContent='ストーリー 0/3';
playSectionEl.insertBefore(storyProgress,playSectionEl.querySelector('.row'));

const storySection=document.createElement('section');
storySection.id='labStorySection';
storySection.className='card';
storySection.style.display='none';
storySection.innerHTML='<div class="step">STORY</div><h2>今日のストーリー</h2><p class="note">3回引いた表情を、ひとつの小さな物語にしました。</p><div id="labStoryFrames"></div>';
playSectionEl.insertAdjacentElement('afterend',storySection);
const storyFrames=storySection.querySelector('#labStoryFrames');

function stars(n){return '★'.repeat(n)+'☆'.repeat(5-n);}
function randomOf(arr){return arr[Math.floor(Math.random()*arr.length)];}
function pickCategory(fortune){
  const c=randomOf(CATEGORIES);
  const base=FORTUNE_BASE[fortune]??3;
  const score=Math.max(1,Math.min(5,base+(Math.random()<.32?(Math.random()<.5?-1:1):0)));
  return {name:c.name,icon:c.icon,line:randomOf(c.lines),score};
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
      tone(392,.12,0,.05,'triangle');
      tone(659,.15,.10,.055,'sine');
      tone(988,.20,.23,.06,'sine');
      tone(1319,.35,.40,.065,'sine');
    }else{
      tone(784,.13,0,.055,'sine');
      tone(1047,.16,.10,.06,'sine');
      tone(1319,.20,.22,.065,'sine');
      tone(1568,.34,.37,.07,'sine');
    }
  }catch(e){}
}
function clearSpecial(){
  clearTimeout(rareTimer);clearTimeout(rareSecondTimer);
  rareTimer=rareSecondTimer=null;
  rare.className='';
  rare.textContent='';
  stageEl.classList.remove('lab-miracle','lab-reversal');
}
function clearLab(){
  clearSpecial();
  extra.style.display='none';
  specialLine.style.display='none';
  currentLab=null;
}
function showMiracle(kind){
  if(kind==='miracle'){
    rare.textContent='✨ 奇跡の一枚 ✨';
    rare.className='show miracle';
    stageEl.classList.add('lab-miracle');
    specialLine.textContent='✨ '+randomOf(MIRACLE_MESSAGES);
    specialLine.className='miracle';
    specialLine.style.display='block';
    playSpecialSound('miracle');
    rareSecondTimer=setTimeout(()=>rare.classList.remove('show'),2200);
    return;
  }
  rare.textContent='……あれ？';
  rare.className='show reversal-wait';
  rareSecondTimer=setTimeout(()=>{
    if(running)return;
    rare.textContent='🌈 大逆転！奇跡の一枚 🌈';
    rare.className='show reversal';
    stageEl.classList.add('lab-reversal');
    specialLine.textContent='🌈 '+randomOf(REVERSAL_MESSAGES);
    specialLine.className='reversal';
    specialLine.style.display='block';
    playSpecialSound('reversal');
    setTimeout(()=>rare.classList.remove('show'),2300);
  },700);
}
function renderStory(){
  storyFrames.innerHTML='';
  const labels=['はじまり','つづき','今日の一枚'];
  storyResults.forEach((x,i)=>{
    const card=document.createElement('div');
    card.className='labStoryFrame'+(x.special?' special':'');
    card.innerHTML='<div class="labStoryLabel"></div><img alt=""><div class="labStoryCaption"></div>';
    card.querySelector('.labStoryLabel').textContent=labels[i];
    card.querySelector('img').src=x.image;
    const special=x.special==='reversal'?'🌈 大逆転':x.special==='miracle'?'✨ 奇跡':'';
    card.querySelector('.labStoryCaption').textContent=(special?special+' ・ ':'')+x.fortune+' ・ '+x.category.icon+x.category.name;
    storyFrames.appendChild(card);
  });
  storySection.style.display='block';
  storySection.scrollIntoView({behavior:'smooth',block:'nearest'});
  storyResults=[];
  storyProgress.textContent='ストーリー完成！ 次は 0/3';
}
function addStoryResult(item){
  storyResults.push({
    image:playImageEl.currentSrc||playImageEl.src,
    fortune:item.fortune,
    category:item.category,
    special:item.special
  });
  if(storyResults.length>=3)renderStory();
  else storyProgress.textContent='ストーリー '+storyResults.length+'/3';
}
function showLabResult(){
  if(!activeCreation||activeCreation.mode!=='omikuji'||running)return;
  const fortune=(resultTextEl.textContent||'吉').trim();
  const cat=pickCategory(fortune);
  const special=specialFor(fortune);
  currentLab={fortune,category:cat,special};
  categoryEl.innerHTML='<div class="labCategoryTitle">'+cat.icon+' '+cat.name+' <span>'+stars(cat.score)+'</span></div><div class="labCategoryLine">'+cat.line+'</div>';
  specialLine.style.display='none';
  specialLine.className='';
  saveBtn.textContent='♡ 今日の一枚に保存';
  saveBtn.disabled=false;
  extra.style.display='block';
  addStoryResult(currentLab);
  if(special){
    rareTimer=setTimeout(()=>{if(!running)showMiracle(special);},special==='reversal'?1500:1250);
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
  storyResults=[];
  storyProgress.textContent='ストーリー 0/3';
  storySection.style.display='none';
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
      special:currentLab.special
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
    const mark=x.special==='reversal'?'🌈 ':x.special==='miracle'?'✨ ':'';
    card.querySelector('strong').textContent=mark+x.fortune+' ・ '+(x.categoryIcon||'')+' '+x.category;
    card.querySelector('span').textContent=d.toLocaleString('ja-JP',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
    card.querySelector('.labDelete').addEventListener('click',async()=>{await labDelete(x.id);renderCollection();});
    collectionEl.appendChild(card);
  });
}
renderCollection().catch(console.error);
})();