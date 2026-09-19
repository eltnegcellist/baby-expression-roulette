(()=>{
const stageEl=document.getElementById('stage');
const resultCardEl=document.getElementById('resultCard');
const resultTextEl=document.getElementById('resultText');
const messageEl=document.getElementById('message');
const fortuneBadgeEl=document.getElementById('fortuneBadge');
const rouletteBadgeEl=document.getElementById('rouletteBadge');
const tapHintEl=document.getElementById('tapHint');
const playImageEl=document.getElementById('playImage');
const collectionEl=document.getElementById('labCollection');
const historyEl=document.getElementById('labHistory');
const historyEmpty=document.getElementById('labHistoryEmpty');
const makeGifBtn=document.getElementById('labMakeGif');
const clearHistoryBtn=document.getElementById('labClearHistory');
const gifStatus=document.getElementById('labGifStatus');
const gifResult=document.getElementById('labGifResult');
const gifPreview=document.getElementById('labGifPreview');
const gifDownload=document.getElementById('labGifDownload');
if(!stageEl||!resultCardEl||!collectionEl||!historyEl)return;

const gifViewer=document.createElement('div');
gifViewer.id='labGifViewer';
gifViewer.innerHTML=
  '<button id="labGifViewerClose" type="button" aria-label="GIFを閉じる">×</button>'+
  '<div class="labGifViewerInner">'+
    '<div class="labGifViewerTitle">作成したGIF</div>'+
    '<img id="labGifViewerImage" alt="作成したGIF">'+
    '<div class="labGifViewerNote">保存したGIFと同じ内容です</div>'+
    '<button id="labGifViewerDone" type="button">閉じる</button>'+
  '</div>';
document.body.appendChild(gifViewer);
const gifViewerImage=gifViewer.querySelector('#labGifViewerImage');
const gifViewerClose=gifViewer.querySelector('#labGifViewerClose');
const gifViewerDone=gifViewer.querySelector('#labGifViewerDone');
function openGifViewer(){
  if(!gifUrl)return;
  gifViewerImage.src=gifUrl;
  gifViewer.classList.add('show');
  document.body.classList.add('labGifViewerOpen');
}
function closeGifViewer(){
  gifViewer.classList.remove('show');
  gifViewerImage.removeAttribute('src');
  document.body.classList.remove('labGifViewerOpen');
}
gifViewerClose.addEventListener('click',closeGifViewer);
gifViewerDone.addEventListener('click',closeGifViewer);

const MIRACLE_DAIKICHI_RATE=.35;
const MIRACLE_DAIKYO_RATE=.40;
const MIRACLE_REPLAY_LEAD_SECONDS=1.6;
const MIRACLE_REPLAY_RATE=.50;

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
let history=[];
let gifUrl=null;
let dockTimer=null;
let rareTimer=null;
let miracleSequenceToken=0;
let currentMiracleReplay=null;
let miracleAutoCloseTimer=null;
let replaySourceCreationId=null;

const playShellEl=stageEl.closest('.playShell');
const resultDock=document.createElement('div');
resultDock.id='labResultDock';
playShellEl.insertAdjacentElement('afterend',resultDock);

const miracleOverlay=document.createElement('div');
miracleOverlay.id='labMiracleOverlay';
miracleOverlay.innerHTML=
  '<div class="labMiracleBackdrop"><img id="labMiracleBackdropImage" alt=""></div>'+
  '<div class="labMiracleHalo"></div>'+
  '<div class="labMiracleReplayWrap">'+
    '<div id="labMiracleReplayLabel">0.5× SLOW REPLAY</div>'+
    '<video id="labMiracleVideo" playsinline muted preload="metadata"></video>'+
    '<img id="labMiracleStill" alt="奇跡の一枚">'+
  '</div>'+
  '<div class="labMiracleCenter">'+
    '<div class="labMiracleKicker"></div>'+
    '<div class="labMiracleTitle"></div>'+
    '<div class="labMiracleSub"></div>'+
  '</div>'+
  '<div class="labMiracleActions">'+
    '<button id="labReplayAgain" type="button">↻ もう一度リプレイ</button>'+
    '<button id="labMiracleBack" type="button">結果へ戻る</button>'+
  '</div>'+
  '<div class="labMiracleSparkles"></div>';
document.body.appendChild(miracleOverlay);

const miracleKicker=miracleOverlay.querySelector('.labMiracleKicker');
const miracleTitle=miracleOverlay.querySelector('.labMiracleTitle');
const miracleSub=miracleOverlay.querySelector('.labMiracleSub');
const miracleSparkles=miracleOverlay.querySelector('.labMiracleSparkles');
const miracleVideo=miracleOverlay.querySelector('#labMiracleVideo');
const miracleStill=miracleOverlay.querySelector('#labMiracleStill');
const miracleBackdropImage=miracleOverlay.querySelector('#labMiracleBackdropImage');
const miracleReplayLabel=miracleOverlay.querySelector('#labMiracleReplayLabel');
const miracleReplayAgain=miracleOverlay.querySelector('#labReplayAgain');
const miracleBack=miracleOverlay.querySelector('#labMiracleBack');

const extra=document.createElement('div');
extra.id='labFortuneExtra';
extra.innerHTML=
  '<div id="labLucky"></div>'+
  '<div id="labSpecialLine"></div>'+
  '<button id="labReplaySpecial" type="button">✨ 奇跡のリプレイ</button>'+
  '<button id="labSavePhoto" type="button">♡ 今日の一枚に保存</button>';
resultCardEl.appendChild(extra);
const luckyEl=extra.querySelector('#labLucky');
const specialLine=extra.querySelector('#labSpecialLine');
const replaySpecialBtn=extra.querySelector('#labReplaySpecial');
const saveBtn=extra.querySelector('#labSavePhoto');
replaySpecialBtn.style.display='none';

function randomOf(arr){return arr[Math.floor(Math.random()*arr.length)];}
function pickLucky(){return {color:randomOf(LUCKY_COLORS),point:randomOf(LUCKY_POINTS)};}
function renderLucky(lucky){
  if(!lucky)return;
  luckyEl.innerHTML=
    '<div class="labLuckyRow"><span>今日のラッキーカラー</span><b><i style="background:'+lucky.color.hex+'"></i>'+lucky.color.name+'</b></div>'+
    '<div class="labLuckyRow"><span>今日のラッキーポイント</span><b>✨ '+lucky.point+'</b></div>';
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
      tone(1568,.42,.62,.06,'sine');
    }else{
      tone(784,.13,0,.055,'sine');tone(1047,.16,.10,.06,'sine');
      tone(1319,.20,.22,.065,'sine');tone(1568,.34,.37,.07,'sine');
      tone(2093,.45,.58,.055,'sine');
    }
  }catch(e){}
}
function fillMiracleSparkles(){
  miracleSparkles.innerHTML='';
  const chars=['✦','★','✧','●','🌈','✨'];
  for(let i=0;i<72;i++){
    const s=document.createElement('span');
    s.textContent=chars[Math.floor(Math.random()*chars.length)];
    s.style.setProperty('--x',(Math.random()*100)+'vw');
    s.style.setProperty('--y',(Math.random()*100)+'vh');
    s.style.setProperty('--d',(Math.random()*.8)+'s');
    s.style.setProperty('--r',(-180+Math.random()*360)+'deg');
    s.style.fontSize=(12+Math.random()*30)+'px';
    miracleSparkles.appendChild(s);
  }
}
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
function waitForVideoEvent(el,name,timeout=4000){
  return new Promise((resolve,reject)=>{
    let done=false;
    const finish=ok=>{
      if(done)return;
      done=true;
      clearTimeout(to);
      el.removeEventListener(name,on);
      ok?resolve():reject(new Error(name+' timeout'));
    };
    const on=()=>finish(true);
    const to=setTimeout(()=>finish(false),timeout);
    el.addEventListener(name,on,{once:true});
  });
}
function replaySourceUrl(){
  return objectUrl || video?.currentSrc || video?.src || '';
}
function replaySourceAvailable(){
  const src=replaySourceUrl();
  return !!(src&&lastFile&&activeCreation?.times?.length&&replaySourceCreationId===activeCreation?.id);
}
function primeMiracleReplaySource(x){
  const canUse=!!(x&&currentCreation&&x.id===currentCreation.id&&lastFile&&objectUrl);
  replaySourceCreationId=canUse?x.id:null;
  try{miracleVideo.pause();}catch(e){}
  if(!canUse){
    miracleVideo.removeAttribute('src');
    miracleVideo.load();
    return;
  }
  if(miracleVideo.src!==objectUrl){
    miracleVideo.src=objectUrl;
    miracleVideo.load();
  }
  miracleVideo.muted=true;
  miracleVideo.playbackRate=MIRACLE_REPLAY_RATE;
}
function cancelMiracleSequence(clearReplay=false){
  miracleSequenceToken++;
  clearTimeout(miracleAutoCloseTimer);
  miracleAutoCloseTimer=null;
  try{miracleVideo.pause();}catch(e){}
  if(clearReplay)currentMiracleReplay=null;
}
function hideMiracleOverlay(clearReplay=false){
  cancelMiracleSequence(clearReplay);
  miracleOverlay.className='';
  document.body.classList.remove('labMiracleOpen');
  miracleKicker.textContent='';
  miracleTitle.textContent='';
  miracleSub.textContent='';
  miracleSparkles.innerHTML='';
  miracleStill.removeAttribute('src');
  miracleBackdropImage.removeAttribute('src');
  miracleStill.style.display='none';
  miracleVideo.style.display='none';
}
async function attemptReplay(src,targetTime,token,forceReload=false){
  if(token!==miracleSequenceToken)return false;
  try{
    miracleVideo.pause();
    if(forceReload||miracleVideo.src!==src){
      miracleVideo.removeAttribute('src');
      miracleVideo.load();
      miracleVideo.src=src;
      miracleVideo.load();
    }
    if(miracleVideo.readyState<1){
      await waitForVideoEvent(miracleVideo,'loadedmetadata',5000);
    }
    if(token!==miracleSequenceToken)return false;

    const duration=Number.isFinite(miracleVideo.duration)&&miracleVideo.duration>0
      ? miracleVideo.duration
      : video.duration;
    if(!Number.isFinite(duration)||duration<=0)return false;

    const target=Math.max(0,Math.min(duration-.04,Number(targetTime)||0));
    const start=Math.max(0,target-MIRACLE_REPLAY_LEAD_SECONDS);
    miracleVideo.currentTime=start;
    try{await waitForVideoEvent(miracleVideo,'seeked',3000);}catch(e){}
    if(token!==miracleSequenceToken)return false;

    miracleVideo.muted=true;
    miracleVideo.playbackRate=MIRACLE_REPLAY_RATE;
    await miracleVideo.play();

    await new Promise(resolve=>{
      let raf=0;
      const tick=()=>{
        if(token!==miracleSequenceToken){
          cancelAnimationFrame(raf);
          resolve();
          return;
        }
        if(miracleVideo.currentTime>=target-.035||miracleVideo.ended){
          miracleVideo.pause();
          cancelAnimationFrame(raf);
          resolve();
          return;
        }
        raf=requestAnimationFrame(tick);
      };
      tick();
    });
    return token===miracleSequenceToken;
  }catch(err){
    console.warn('miracle replay attempt failed',err);
    try{miracleVideo.pause();}catch(e){}
    return false;
  }
}
async function replayOriginalMoment(targetTime,token){
  if(!replaySourceAvailable())return false;
  const src=replaySourceUrl();
  miracleReplayLabel.textContent='0.5× SLOW REPLAY';
  miracleVideo.style.display='block';
  miracleStill.style.display='none';
  miracleVideo.muted=true;
  miracleVideo.playbackRate=MIRACLE_REPLAY_RATE;

  if(await attemptReplay(src,targetTime,token,false))return true;
  if(token!==miracleSequenceToken)return false;

  miracleReplayLabel.textContent='0.5× SLOW REPLAY · RETRY';
  await sleep(120);
  if(token!==miracleSequenceToken)return false;
  return await attemptReplay(src,targetTime,token,true);
}
function showFinalMiraclePhoto(kind,frameSrc){
  try{miracleVideo.pause();}catch(e){}
  clearTimeout(miracleAutoCloseTimer);
  miracleVideo.style.display='none';
  miracleStill.src=frameSrc;
  miracleBackdropImage.src=frameSrc;
  miracleStill.style.display='block';
  miracleOverlay.className='show final-photo '+(kind==='reversal'?'reversal-mode':'miracle-mode');
  fillMiracleSparkles();

  if(kind==='reversal'){
    miracleKicker.textContent='運勢、ひっくり返りました';
    miracleTitle.textContent='大逆転！';
    miracleSub.textContent='🌈 奇跡の一枚 🌈';
    playSpecialSound('reversal');
    if(navigator.vibrate)navigator.vibrate([120,40,120,40,220,60,320]);
  }else{
    miracleKicker.textContent='大吉の、その先へ';
    miracleTitle.textContent='奇跡の一枚！';
    miracleSub.textContent='✨ MIRACLE PHOTO ✨';
    playSpecialSound('miracle');
    if(navigator.vibrate)navigator.vibrate([90,45,120,55,180,60,260]);
  }
  // Keep the full-screen photo long enough to enjoy, then fully remove
  // the overlay so no invisible layer can intercept taps.
  miracleAutoCloseTimer=setTimeout(()=>{
    if(miracleOverlay.classList.contains('final-photo')){
      hideMiracleOverlay(false);
      dockResult();
    }
  },4200);
}
async function playMiracleSequence(kind,replayAgain=false){
  clearTimeout(miracleAutoCloseTimer);
  miracleAutoCloseTimer=null;
  const frameSrc=currentMiracleReplay?.frameSrc||(playImageEl.currentSrc||playImageEl.src);
  const targetTime=currentMiracleReplay?.targetTime??Number(activeCreation?.times?.[currentIndex]);
  currentMiracleReplay={kind,frameSrc,targetTime,index:currentIndex};
  const token=++miracleSequenceToken;

  document.body.classList.add('labMiracleOpen');
  miracleStill.style.display='none';
  miracleVideo.style.display='none';
  miracleBackdropImage.src=frameSrc;
  miracleSparkles.innerHTML='';

  if(kind==='reversal'&&!replayAgain){
    miracleOverlay.className='show reversal-wait-mode';
    miracleKicker.textContent='大凶……';
    miracleTitle.textContent='……あれ？';
    miracleSub.textContent='まだ終わっていません';
    if(navigator.vibrate)navigator.vibrate([70,80,70]);
    await sleep(780);
  }else{
    miracleOverlay.className='show miracle-intro-mode';
    miracleKicker.textContent=replayAgain?'もう一度、その瞬間へ':'その一瞬を、もう一度';
    miracleTitle.textContent=kind==='reversal'?'大逆転の瞬間':'奇跡の瞬間';
    miracleSub.textContent='まもなくスローリプレイ';
    await sleep(replayAgain?280:520);
  }
  if(token!==miracleSequenceToken)return;

  miracleOverlay.className='show replay-mode '+(kind==='reversal'?'reversal-replay':'miracle-replay');
  miracleKicker.textContent='奇跡の瞬間へ';
  miracleTitle.textContent='';
  miracleSub.textContent='0.5× SLOW REPLAY';

  const replayed=await replayOriginalMoment(targetTime,token);
  if(token!==miracleSequenceToken)return;

  if(!replayed){
    miracleReplayLabel.textContent='PHOTO REVEAL';
    miracleSub.textContent='このセッションでは元動画リプレイを使えないため、写真演出へ';
    await sleep(450);
  }
  if(token!==miracleSequenceToken)return;

  showFinalMiraclePhoto(kind,frameSrc);
}
function undockResult(){
  clearTimeout(dockTimer);
  dockTimer=null;
  if(resultCardEl.parentElement!==stageEl){
    const roulette=document.getElementById('rouletteBadge');
    stageEl.insertBefore(resultCardEl,roulette||null);
  }
  resultCardEl.classList.remove('labDocked');
  resultDock.classList.remove('show');
}
function dockResult(){
  if(running||!currentLab)return;
  resultDock.appendChild(resultCardEl);
  resultCardEl.classList.add('labDocked');
  resultDock.classList.add('show');
}
function clearSpecial(){
  clearTimeout(rareTimer);
  rareTimer=null;
  stageEl.classList.remove('lab-miracle','lab-reversal');
  hideMiracleOverlay(true);
  replaySpecialBtn.style.display='none';
}
function clearLab(){
  clearSpecial();
  undockResult();
  extra.style.display='none';
  specialLine.style.display='none';
  currentLab=null;
}
function showMiracle(kind){
  const frameSrc=playImageEl.currentSrc||playImageEl.src;
  const targetTime=Number(activeCreation?.times?.[currentIndex]);
  currentMiracleReplay={kind,frameSrc,targetTime,index:currentIndex};
  replaySpecialBtn.style.display='block';

  if(kind==='miracle'){
    stageEl.classList.add('lab-miracle');
    specialLine.textContent='✨ '+randomOf(MIRACLE_MESSAGES);
    specialLine.className='miracle';
  }else{
    stageEl.classList.add('lab-reversal');
    specialLine.textContent='🌈 '+randomOf(REVERSAL_MESSAGES);
    specialLine.className='reversal';
  }
  specialLine.style.display='block';
  playMiracleSequence(kind,false);
}

async function replayMiracleImmediately(){
  if(!currentMiracleReplay)return;

  clearTimeout(miracleAutoCloseTimer);
  miracleAutoCloseTimer=null;

  const replay=currentMiracleReplay;
  const token=++miracleSequenceToken;

  document.body.classList.add('labMiracleOpen');
  miracleOverlay.className='show replay-mode '+(replay.kind==='reversal'?'reversal-replay':'miracle-replay');
  miracleKicker.textContent='もう一度、その瞬間へ';
  miracleTitle.textContent='';
  miracleSub.textContent='0.5× SLOW REPLAY';
  miracleReplayLabel.textContent='0.5× SLOW REPLAY';
  miracleSparkles.innerHTML='';
  miracleStill.style.display='none';
  miracleBackdropImage.src=replay.frameSrc;

  try{miracleVideo.pause();}catch(e){}

  const replayed=await replayOriginalMoment(replay.targetTime,token);
  if(token!==miracleSequenceToken)return;

  if(!replayed){
    miracleReplayLabel.textContent='PHOTO REVEAL';
    miracleSub.textContent='動画リプレイを開始できなかったため、写真演出へ';
    await sleep(250);
  }
  if(token!==miracleSequenceToken)return;

  showFinalMiraclePhoto(replay.kind,replay.frameSrc);
}

miracleReplayAgain.addEventListener('pointerdown',e=>{
  e.preventDefault();
  e.stopPropagation();
  replayMiracleImmediately();
},{passive:false});
replaySpecialBtn.addEventListener('pointerdown',e=>{
  e.preventDefault();
  e.stopPropagation();
  replayMiracleImmediately();
},{passive:false});
const closeMiracle=()=>{
  hideMiracleOverlay(false);
  dockResult();
};
miracleBack.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();closeMiracle();});

function renderHistory(){
  historyEl.innerHTML='';
  historyEmpty.style.display=history.length?'none':'block';
  makeGifBtn.disabled=history.length<2;
  clearHistoryBtn.disabled=!history.length;

  history.forEach((x,i)=>{
    const card=document.createElement('button');
    card.type='button';
    card.className='labHistoryItem';
    card.setAttribute('aria-label',(i+1)+'回目 '+x.fortune+' の結果を見る');
    card.innerHTML='<img alt=""><div><strong></strong><span></span><em>結果を見る</em></div>';
    card.querySelector('img').src=x.image;
    card.querySelector('strong').textContent=(i+1)+'回目 ・ '+x.fortune;
    card.querySelector('span').textContent='元動画 '+x.time.toFixed(1)+'秒';
    card.addEventListener('click',()=>showHistoryEntry(x));
    historyEl.appendChild(card);
  });
}
function addHistory(item){
  const time=Number(activeCreation?.times?.[currentIndex]);
  history.push({
    image:playImageEl.currentSrc||playImageEl.src,
    time:Number.isFinite(time)?time:currentIndex,
    targetTime:Number.isFinite(time)?time:currentIndex,
    index:currentIndex,
    fortune:item.fortune,
    lucky:item.lucky,
    special:item.special,
    message:messageEl?.textContent||'',
    drawnAt:Date.now()
  });
  if(history.length>40)history.shift();
  renderHistory();
}
function showHistoryEntry(x){
  clearInterval(timer);
  timer=null;
  running=false;
  stageEl.classList.remove('pulse');
  clearSpecial();
  undockResult();

  const idx=Number.isInteger(x.index)?x.index:
    activeCreation?.times?.reduce((best,t,i)=>Math.abs(t-x.time)<Math.abs((activeCreation.times[best]??Infinity)-x.time)?i:best,0);
  if(Number.isInteger(idx))currentIndex=idx;

  playImageEl.src=x.image;
  fortuneBadgeEl.style.display='block';
  fortuneBadgeEl.textContent=(FORTUNE_ICONS[x.fortune]||'🎴')+' '+x.fortune;
  fortuneBadgeEl.style.color=FORTUNE_COLORS[x.fortune]||'#700';

  resultCardEl.style.display='block';
  resultTextEl.textContent=x.fortune;
  resultTextEl.style.color=FORTUNE_COLORS[x.fortune]||'#700';
  messageEl.textContent=x.message||'このときの結果です。';

  currentLab={fortune:x.fortune,lucky:x.lucky||pickLucky(),special:x.special,fromHistory:true};
  renderLucky(currentLab.lucky);

  specialLine.style.display='none';
  specialLine.className='';
  replaySpecialBtn.style.display='none';
  if(x.special){
    currentMiracleReplay={kind:x.special,frameSrc:x.image,targetTime:x.targetTime??x.time,index:x.index};
    replaySpecialBtn.style.display='block';
    specialLine.textContent=x.special==='reversal'?'🌈 大逆転！奇跡の一枚':'✨ 奇跡の一枚';
    specialLine.className=x.special==='reversal'?'reversal':'miracle';
    specialLine.style.display='block';
  }

  saveBtn.textContent='♡ 今日の一枚に保存';
  saveBtn.disabled=false;
  extra.style.display='block';
  rouletteBadgeEl.style.display='none';

  const photoAction=document.getElementById('photoAction');
  if(photoAction)photoAction.style.display='inline-flex';

  tapHintEl.textContent='履歴を表示中。写真をタップするとルーレットを再開します';
  dockResult();
  document.getElementById('playSection')?.scrollIntoView({behavior:'smooth',block:'start'});
}
function clearGifResult(){
  closeGifViewer();
  if(gifUrl){
    URL.revokeObjectURL(gifUrl);
    gifUrl=null;
  }
  gifResult.style.display='none';
  gifPreview.removeAttribute('src');
  gifDownload.removeAttribute('href');
}
function showLabResult(){
  if(!activeCreation||activeCreation.mode!=='omikuji'||running)return;
  const fortune=(resultTextEl.textContent||'吉').trim();
  const lucky=pickLucky();
  const special=specialFor(fortune);
  const targetTime=Number(activeCreation?.times?.[currentIndex]);

  currentLab={fortune,lucky,special};
  renderLucky(lucky);
  specialLine.style.display='none';
  specialLine.className='';
  replaySpecialBtn.style.display='none';
  saveBtn.textContent='♡ 今日の一枚に保存';
  saveBtn.disabled=false;
  extra.style.display='block';

  if(special){
    currentMiracleReplay={
      kind:special,
      frameSrc:playImageEl.currentSrc||playImageEl.src,
      targetTime:Number.isFinite(targetTime)?targetTime:currentIndex,
      index:currentIndex
    };
    replaySpecialBtn.style.display='block';
  }

  addHistory(currentLab);
  clearTimeout(dockTimer);
  dockTimer=setTimeout(dockResult,special?7000:1550);

  if(special){
    rareTimer=setTimeout(()=>{
      if(!running)showMiracle(special);
    },special==='reversal'?1100:900);
  }
}

/* Distinguish an intentional tap from a scroll gesture. */
let stageGesture=null;
stageEl.addEventListener('pointerdown',e=>{
  if(e.target.closest('button,a,input,label'))return;
  stageGesture={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now(),moved:false};
  e.stopImmediatePropagation();
},true);
window.addEventListener('pointermove',e=>{
  if(!stageGesture||e.pointerId!==stageGesture.id)return;
  if(Math.hypot(e.clientX-stageGesture.x,e.clientY-stageGesture.y)>12)stageGesture.moved=true;
},true);
window.addEventListener('pointerup',e=>{
  if(!stageGesture||e.pointerId!==stageGesture.id)return;
  const g=stageGesture;
  stageGesture=null;
  const moved=g.moved||Math.hypot(e.clientX-g.x,e.clientY-g.y)>12;
  if(moved||performance.now()-g.t>700)return;
  e.preventDefault();
  if(!primed)unlockAudio();
  if(running)stopRun();else startRun();
},true);
window.addEventListener('pointercancel',e=>{
  if(stageGesture&&e.pointerId===stageGesture.id)stageGesture=null;
},true);

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
  history=[];
  renderHistory();
  clearGifResult();
  primeMiracleReplaySource(x);
  previousPrepare(x);
};

saveBtn.addEventListener('pointerdown',async e=>{
  e.preventDefault();
  e.stopPropagation();
  if(!currentLab||running)return;

  saveBtn.disabled=true;
  saveBtn.textContent='保存中…';
  try{
    await labSave({
      id:'p'+Date.now()+Math.random().toString(36).slice(2,7),
      createdAt:Date.now(),
      image:playImageEl.currentSrc||playImageEl.src,
      fortune:currentLab.fortune,
      luckyColor:currentLab.lucky.color.name,
      luckyColorHex:currentLab.lucky.color.hex,
      luckyPoint:currentLab.lucky.point,
      special:currentLab.special,
      targetTime:Number(activeCreation?.times?.[currentIndex])
    });
    saveBtn.textContent='✓ 保存しました';
    await renderCollection();
  }catch(err){
    console.error(err);
    saveBtn.disabled=false;
    saveBtn.textContent='保存できませんでした';
  }
},{passive:false});

clearHistoryBtn.addEventListener('click',()=>{
  history=[];
  renderHistory();
  clearGifResult();
  gifStatus.style.display='none';
});

gifDownload.addEventListener('click',e=>{
  e.preventDefault();
  e.stopPropagation();
  if(!gifUrl)return;

  const a=document.createElement('a');
  a.href=gifUrl;
  a.download='baby-expression-history.gif';
  a.style.display='none';
  document.body.appendChild(a);
  a.click();
  a.remove();

  gifStatus.style.display='block';
  gifStatus.textContent='GIFを保存しました。全画面で表示します。';
  openGifViewer();
});

makeGifBtn.addEventListener('click',async()=>{
  if(history.length<2)return;
  makeGifBtn.disabled=true;
  clearGifResult();
  gifStatus.style.display='block';
  gifStatus.textContent='GIFを作っています… 0/'+history.length;

  try{
    const sorted=history.slice().sort((a,b)=>a.time-b.time||a.drawnAt-b.drawnAt);
    const blob=await makeGif(sorted,(done,total)=>{
      gifStatus.textContent='GIFを作っています… '+done+'/'+total;
    });
    gifUrl=URL.createObjectURL(blob);
    gifPreview.src=gifUrl;
    gifDownload.href=gifUrl;
    gifResult.style.display='block';
    gifStatus.textContent='元動画の時間順に'+sorted.length+'枚を並べてGIFを作りました。';
  }catch(err){
    console.error(err);
    gifStatus.textContent='GIFを作れませんでした: '+err.message;
  }finally{
    makeGifBtn.disabled=history.length<2;
  }
});

async function loadImage(src){
  return new Promise((resolve,reject)=>{
    const img=new Image();
    img.onload=()=>resolve(img);
    img.onerror=()=>reject(new Error('画像を読み込めません'));
    img.src=src;
  });
}
function u16(v){return [v&255,(v>>8)&255];}
function buildAdaptivePalette(data,maxColors=256){
  const hist=new Map();
  for(let i=0;i<data.length;i+=16){
    const r=data[i],g=data[i+1],b=data[i+2];
    const key=((r>>3)<<10)|((g>>3)<<5)|(b>>3);
    const e=hist.get(key);
    if(e){
      e.n++;e.r+=r;e.g+=g;e.b+=b;
    }else{
      hist.set(key,{n:1,r,g,b});
    }
  }
  let points=Array.from(hist.values(),e=>({n:e.n,r:e.r/e.n,g:e.g/e.n,b:e.b/e.n}));
  if(!points.length)points=[{n:1,r:0,g:0,b:0}];

  const boxes=[points];
  const stats=box=>{
    let r0=255,r1=0,g0=255,g1=0,b0=255,b1=0,n=0;
    for(const p of box){
      r0=Math.min(r0,p.r);r1=Math.max(r1,p.r);
      g0=Math.min(g0,p.g);g1=Math.max(g1,p.g);
      b0=Math.min(b0,p.b);b1=Math.max(b1,p.b);
      n+=p.n;
    }
    return {ranges:[r1-r0,g1-g0,b1-b0],n};
  };

  while(boxes.length<maxColors){
    let best=-1,bestScore=-1,bestStats=null;
    for(let i=0;i<boxes.length;i++){
      if(boxes[i].length<2)continue;
      const s=stats(boxes[i]);
      const score=Math.max(...s.ranges)*Math.sqrt(s.n);
      if(score>bestScore){
        best=i;
        bestScore=score;
        bestStats=s;
      }
    }
    if(best<0)break;

    const box=boxes.splice(best,1)[0];
    const channel=bestStats.ranges.indexOf(Math.max(...bestStats.ranges));
    const key=['r','g','b'][channel];
    box.sort((a,b)=>a[key]-b[key]);

    const total=box.reduce((s,p)=>s+p.n,0);
    let acc=0,cut=1;
    for(let i=0;i<box.length-1;i++){
      acc+=box[i].n;
      if(acc>=total/2){cut=i+1;break;}
    }
    boxes.push(box.slice(0,cut),box.slice(cut));
  }

  const palette=boxes.map(box=>{
    let n=0,r=0,g=0,b=0;
    for(const p of box){
      n+=p.n;r+=p.r*p.n;g+=p.g*p.n;b+=p.b*p.n;
    }
    return [Math.round(r/n),Math.round(g/n),Math.round(b/n)];
  });
  while(palette.length<256)palette.push(palette[palette.length-1]||[0,0,0]);
  return palette.slice(0,256);
}
function mapToPalette(data,palette){
  const out=new Uint8Array(data.length/4);
  const lut=new Int16Array(32768);
  lut.fill(-1);

  for(let i=0,p=0;i<data.length;i+=4,p++){
    const r=data[i],g=data[i+1],b=data[i+2];
    const key=((r>>3)<<10)|((g>>3)<<5)|(b>>3);
    let pi=lut[key];

    if(pi<0){
      let best=0,bd=Infinity;
      for(let k=0;k<palette.length;k++){
        const q=palette[k];
        const dr=r-q[0],dg=g-q[1],db=b-q[2];
        const d=dr*dr*2+dg*dg*3+db*db;
        if(d<bd){
          bd=d;
          best=k;
          if(d===0)break;
        }
      }
      pi=best;
      lut[key]=pi;
    }
    out[p]=pi;
  }
  return out;
}
function lzwEncode(pixels,minCodeSize=8){
  const clear=1<<minCodeSize;
  const end=clear+1;
  const codeSize=minCodeSize+1;
  const out=[];
  let bitBuf=0,bitCount=0,sinceClear=0;

  const emit=code=>{
    bitBuf|=code<<bitCount;
    bitCount+=codeSize;
    while(bitCount>=8){
      out.push(bitBuf&255);
      bitBuf>>=8;
      bitCount-=8;
    }
  };

  emit(clear);
  for(let i=0;i<pixels.length;i++){
    emit(pixels[i]);
    sinceClear++;
    if(sinceClear>=200){
      emit(clear);
      sinceClear=0;
    }
  }
  emit(end);
  if(bitCount>0)out.push(bitBuf&255);
  return out;
}
function appendSubBlocks(writer,data){
  for(let i=0;i<data.length;i+=255){
    const n=Math.min(255,data.length-i);
    writer.push(n);
    for(let j=0;j<n;j++)writer.push(data[i+j]);
  }
  writer.push(0);
}
async function makeGif(entries,onProgress){
  const first=await loadImage(entries[0].image);
  const maxW=360,maxH=480;
  const scale=Math.min(1,maxW/first.naturalWidth,maxH/first.naturalHeight);
  const w=Math.max(2,Math.round(first.naturalWidth*scale));
  const h=Math.max(2,Math.round(first.naturalHeight*scale));
  const canvas=document.createElement('canvas');
  canvas.width=w;
  canvas.height=h;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  const bytes=[];

  'GIF89a'.split('').forEach(ch=>bytes.push(ch.charCodeAt(0)));
  bytes.push(...u16(w),...u16(h),0x70,0,0);
  bytes.push(0x21,0xFF,0x0B,...Array.from('NETSCAPE2.0').map(c=>c.charCodeAt(0)),0x03,0x01,0x00,0x00,0x00);

  for(let fi=0;fi<entries.length;fi++){
    const img=fi===0?first:await loadImage(entries[fi].image);
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle='#000';
    ctx.fillRect(0,0,w,h);

    const s=Math.min(w/img.naturalWidth,h/img.naturalHeight);
    const dw=Math.round(img.naturalWidth*s);
    const dh=Math.round(img.naturalHeight*s);
    ctx.drawImage(img,Math.round((w-dw)/2),Math.round((h-dh)/2),dw,dh);

    const d=ctx.getImageData(0,0,w,h).data;
    const palette=buildAdaptivePalette(d,256);
    const idx=mapToPalette(d,palette);
    const delay=32;

    bytes.push(0x21,0xF9,0x04,0x00,...u16(delay),0x00,0x00);
    bytes.push(0x2C,0,0,0,0,...u16(w),...u16(h),0x87);
    for(const q of palette)bytes.push(q[0],q[1],q[2]);
    bytes.push(0x08);
    appendSubBlocks(bytes,lzwEncode(idx,8));

    onProgress?.(fi+1,entries.length);
    await new Promise(r=>setTimeout(r,0));
  }

  bytes.push(0x3B);
  return new Blob([new Uint8Array(bytes)],{type:'image/gif'});
}

const DB='babyExpressionRouletteLabDB';
const STORE='dailyPhotos';

function labDB(){
  return new Promise((resolve,reject)=>{
    const r=indexedDB.open(DB,1);
    r.onupgradeneeded=()=>{
      if(!r.result.objectStoreNames.contains(STORE)){
        r.result.createObjectStore(STORE,{keyPath:'id'});
      }
    };
    r.onsuccess=()=>resolve(r.result);
    r.onerror=()=>reject(r.error);
  });
}
async function labSave(item){
  const db=await labDB();
  await new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,'readwrite');
    tx.objectStore(STORE).put(item);
    tx.oncomplete=resolve;
    tx.onerror=()=>reject(tx.error);
  });

  const all=await labAll();
  if(all.length>40){
    const old=all.slice(40);
    const db2=await labDB();
    await new Promise((resolve,reject)=>{
      const tx=db2.transaction(STORE,'readwrite');
      const st=tx.objectStore(STORE);
      old.forEach(x=>st.delete(x.id));
      tx.oncomplete=resolve;
      tx.onerror=()=>reject(tx.error);
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
    const tx=db.transaction(STORE,'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete=resolve;
    tx.onerror=()=>reject(tx.error);
  });
}
async function renderCollection(){
  const all=await labAll();
  collectionEl.innerHTML='';
  if(!all.length){
    collectionEl.innerHTML='<div class="note">まだ保存されていません。</div>';
    return;
  }

  all.forEach(x=>{
    const card=document.createElement('article');
    card.className='labPhotoCard';
    const d=new Date(x.createdAt);
    card.innerHTML='<img alt="保存した赤ちゃんの写真"><div class="labPhotoMeta"><strong></strong><span></span></div><button type="button" class="labDelete">削除</button>';
    card.querySelector('img').src=x.image;
    const mark=x.special==='reversal'?'🌈 ':x.special==='miracle'?'✨ ':'';
    card.querySelector('strong').textContent=mark+x.fortune+' ・ '+(x.luckyColor||'')+' ・ '+(x.luckyPoint||'');
    card.querySelector('span').textContent=d.toLocaleString('ja-JP',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
    card.querySelector('.labDelete').addEventListener('click',async()=>{
      await labDelete(x.id);
      renderCollection();
    });
    collectionEl.appendChild(card);
  });
}

renderHistory();
renderCollection().catch(console.error);
})();