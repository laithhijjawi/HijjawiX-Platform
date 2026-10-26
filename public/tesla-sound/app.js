(()=>{'use strict';
const $=id=>document.getElementById(id);
const profiles={
v8:{name:'MASERATI GRANTURISMO S',detail:'V8 / REAL EXHAUST RECORDING',cyl:'V8',idle:780,red:7300,max:7800,filename:'Maserati GranTurismo S Exhaust.ogg',url:'https://upload.wikimedia.org/wikipedia/commons/9/98/Maserati_GranTurismo_S_Exhaust.ogg',source:'https://commons.wikimedia.org/wiki/File:Maserati_GranTurismo_S_Exhaust.ogg',author:'lmartins',license:'CC BY 4.0'},
v10:{name:'LAMBORGHINI GALLARDO',detail:'V10 / GOODWOOD HILLCLIMB RECORDING',cyl:'V10',idle:950,red:8200,max:8800,filename:'Lamborghini Gallardo LP570-4 Superleggera.ogg',url:'https://upload.wikimedia.org/wikipedia/commons/0/0b/Lamborghini_Gallardo_LP570-4_Superleggera.ogg',source:'https://commons.wikimedia.org/wiki/File:Lamborghini_Gallardo_LP570-4_Superleggera.ogg',author:'Edvvc / Ed Pond',license:'CC BY-SA 3.0'},
v12:{name:'PAGANI ZONDA R',detail:'V12 / GOODWOOD HILLCLIMB RECORDING',cyl:'V12',idle:980,red:7600,max:8300,filename:'Pagani Zonda R.ogg',url:'https://upload.wikimedia.org/wikipedia/commons/8/88/Pagani_Zonda_R.ogg',source:'https://commons.wikimedia.org/wiki/File:Pagani_Zonda_R.ogg',author:'Edvvc / Ed Pond',license:'CC BY-SA 3.0'},
flat6:{name:'PORSCHE 911 R',detail:'FLAT-6 / CLASSIC HILLCLIMB RECORDING',cyl:'FLAT-6',idle:880,red:7600,max:8400,filename:'Porsche 911R (1967).ogg',url:'https://upload.wikimedia.org/wikipedia/commons/1/17/Porsche_911R_(1967).ogg',source:'https://commons.wikimedia.org/wiki/File:Porsche_911R_(1967).ogg',author:'Edvvc / Ed Pond',license:'CC BY-SA 3.0'},
electric:{name:'TESLA ROADSTER',detail:'ELECTRIC / REAL ROADSTER RECORDING',cyl:'EV',idle:0,red:8800,max:9500,filename:'Tesla Roadster.ogg',url:'https://upload.wikimedia.org/wikipedia/commons/7/7b/Tesla_Roadster.ogg',source:'https://commons.wikimedia.org/wiki/File:Tesla_Roadster.ogg',author:'Edvvc / Ed Pond',license:'CC BY-SA 3.0'},
taycan:{name:'PORSCHE TAYCAN',detail:'OEM SOUND / LICENSED IMPORT REQUIRED',cyl:'EV',idle:0,red:8500,max:9000,filename:null,url:null,source:'https://newsroom.porsche.com/en_US/2022/products/porsche-sound-of-the-taycan-christophorus-402-27910.html',author:'Porsche / original audio is not bundled',license:'IMPORT'}
};
const dict={
ar:{
back:'المنصة الرئيسية',heroTitle:'صوت حقيقي. حضور استثنائي.',heroLead:'تسجيلات أصلية لمحركات رياضية حقيقية، وتحكّم بالصوت من متصفح تسلا. اختر الشخصية، واستمتع بالمحاكاة دون تعديل أنظمة السيارة.',
garageTitle:'اختار الصوت اللي بناسبك',garageSub:'تسجيلات حقيقية من سيارات مختلفة. بعضها يحتاج الإنترنت للتشغيل.',recorded:'تسجيل حقيقي',requiresFile:'أضف تسجيل مرخّص',soundCharacter:'تحكّم بالتجربة',volume:'مستوى الصوت',intensity:'استجابة الدعسة',experience:'نوع التجربة',rev:'صوت المحرك بالوقوف',drive:'أثناء القيادة',revHint:'دعسة افتراضية أثناء الوقوف. لا يقرأ التطبيق دعسة السيارة الحقيقية.',driveHint:'الصوت يتفاعل مع أزرار المحاكاة أو تغير سرعة GPS، وليس دعسة تسلا الفعلية.',inputSource:'مصدر السرعة',demo:'محاكاة',gps:'GPS',demoHint:'تقدير افتراضي للسرعة من أزرار الشاشة.',gpsHint:'السرعة من GPS وقد يتأخر الصوت عن تسارع السيارة الحقيقي.',off:'متوقف',on:'يعمل',throttle:'دعسة افتراضية',ready:'اختر محركاً واضغط تشغيل.',start:'تشغيل الصوت الحقيقي',stop:'إيقاف الصوت',brake:'فرامل',hold:'اضغط باستمرار',revPedal:'ارفع RPM',accelerate:'تسارع',gpsNotice:'GPS يعرض تقديراً للسرعة، وليس قراءة دعسة السيارة.',remoteSource:'تسجيل حقيقي من مكتبة Wikimedia Commons، ويحتاج إنترنت. قد تسمع أصواتاً محيطة من التسجيل الأصلي.',sourceLink:'المصدر والترخيص ↗',importAudio:'استيراد ملف صوت خاص',fileHint:'ملف صوت لديك حق استخدامه، حتى 25MB.',taycanOfficial:'اسمع مثال Taycan الرسمي من موقع Porsche ↗',feature1:'تسجيلات حقيقية',feature1Desc:'أصوات سيارات أصلية منشورة بتراخيص مفتوحة؛ لا موجات إلكترونية اصطناعية.',feature2:'الصوت يستجيب',feature2Desc:'سرعة التشغيل وطبقة الصوت تتبدل مع الدعسة الافتراضية أو سرعة GPS، وليس مع دعسة السيارة الحقيقية.',feature3:'صوت خارجي؟',feature3Desc:'Boombox قد يشغّل الوسائط خارج السيارة على P إن كانت مزوّدة بـPWS. التطبيق لا يتحكم به مباشرةً.',externalTitle:'كيف أجرّب السماعة الخارجية؟',externalSteps:'السيارة على P: افتح Toybox ثم Boombox، وإذا كان الخيار متوفراً اختر Play Current Media. شغّل الصوت من التطبيق واختبر إن كان متصفح السيارة يُعتبر المصدر الحالي. إذا لم يعمل، فلا يمكن لتطبيق الويب توجيه الصوت للسماعة الخارجية بنفسه. أثناء القيادة لا تحاول تجاوز نظام تحذير المشاة.',licenseTitle:'مصادر الأصوات والتراخيص',safety:'هذه تجربة صوتية ترفيهية غير تابعة لأي شركة سيارات. جهّزها والسيارة على P ولا تستخدم الشاشة أثناء القيادة. الصوت يُشغّل على نظام الوسائط فقط، ولا يتحكم بتسارع السيارة أو سماعة التحذير الخارجية. التسجيلات قد تحتوي أصوات جمهور أو ضجيج محيط، وليست ملفات تشغيل OEM متعددة السرعات.',
needTaycan:'لصوت Taycan الحقيقي، أضف ملفاً تملك حق استخدامه، أو استمع إلى المثال الرسمي عبر الرابط أسفل الشاشة.',missingAudio:'لا يوجد ملف لهذا الصوت بعد. اختر صوتاً آخر أو استورد ملفاً.',loadingAudio:'جاري تحميل التسجيل الحقيقي…',audioError:'تعذّر تحميل التسجيل من المصدر. جرّب اتصال الإنترنت أو استورد ملف MP3/WAV.',playError:'متصفح السيارة لم يسمح بتشغيل هذا التسجيل. جرّب استيراد ملف MP3.',playing:'التسجيل الحقيقي يعمل الآن.',stopped:'توقف الصوت.',gpsWaiting:'بانتظار سرعة GPS…',gpsReady:'يتم استخدام سرعة GPS.',gpsUnavailable:'الموقع غير متاح في هذا المتصفح. استخدم المحاكاة.',gpsNoSpeed:'GPS يعمل لكن لم يرسل قراءة سرعة صالحة.',custom:'صوت مستورد من جهازك',customFile:'ملف مخصص:',tooLarge:'الملف أكبر من 25MB. اختر ملفاً أصغر.',badFile:'اختر ملفاً صوتياً صالحاً MP3 أو WAV أو OGG أو M4A.',sourceReal:'تسجيل حقيقي من Wikimedia Commons',sourceCustom:'ملف صوت محلي اخترته أنت. لا يتم رفعه لخادمنا.',fileSelected:'تم اختيار ملف:',creditsIntro:'المواد الصوتية من Wikimedia Commons. تُشغّل التسجيلات الأصلية مع تغيير معدل التشغيل آنيّاً، ودون توزيع نسخ معدّلة منها.',creditsTail:'تنطبق شروط نسبة العمل للمؤلف وإعادة الترخيص على أي نسخ مشتقة تنشرها لاحقاً.'
},
en:{
back:'Back to platform',heroTitle:'Real sound. Unmistakable presence.',heroLead:'Genuine sports-car recordings and a premium driving sound studio for your Tesla browser. No vehicle system modification.',
garageTitle:'Build your sound identity',garageSub:'Real vehicle recordings from openly licensed sources. Internet is required for remote playback.',recorded:'Real recording',requiresFile:'Import licensed audio',soundCharacter:'Tune the experience',volume:'Media volume',intensity:'Throttle response',experience:'Experience',rev:'Park rev',drive:'Driving',revHint:'On-screen virtual pedal while parked. This does not read your physical accelerator.',driveHint:'Audio reacts to demo pedals or GPS speed changes, not your actual Tesla accelerator.',inputSource:'Speed source',demo:'Simulation',gps:'GPS',demoHint:'On-screen controls simulate speed.',gpsHint:'GPS speed can lag real acceleration.',off:'OFF',on:'PLAYING',throttle:'VIRTUAL THROTTLE',ready:'Choose a car sound, then press Start.',start:'Start real recording',stop:'Stop recording',brake:'Brake',hold:'Press and hold',revPedal:'Rev engine',accelerate:'Accelerate',gpsNotice:'GPS estimates vehicle speed; it does not measure the accelerator position.',remoteSource:'Genuine recording from Wikimedia Commons. Internet required. Background crowd noise may be audible.',sourceLink:'Audio source & license ↗',importAudio:'Import your own sound',fileHint:'Use a file you have rights to, up to 25MB.',taycanOfficial:'Hear the original Taycan example on Porsche Newsroom ↗',feature1:'Recorded audio',feature1Desc:'Real recordings under open licenses, not electronic oscillator tones.',feature2:'Responsive playback',feature2Desc:'Playback rate and pitch respond to virtual pedals or GPS, not the physical accelerator.',feature3:'Exterior speaker?',feature3Desc:'Boombox may play current media outdoors in Park on cars with PWS. The web app cannot choose its output.',externalTitle:'How do I test the external speaker?',externalSteps:'While in Park, open Toybox → Boombox, and choose Play Current Media if available. Start the app and see whether the vehicle treats browser audio as current media. The website cannot force external playback. Do not bypass pedestrian warnings while driving.',licenseTitle:'Recordings and licenses',safety:'Independent entertainment software, not affiliated with Tesla or other manufacturers. Configure while parked and do not touch the display while driving. Audio only; no vehicle control or pedestrian speaker override. Single recordings may include ambient noise and are not multi-RPM OEM sound libraries.',
needTaycan:'To play the exact Taycan audio, import a recording you are licensed to use, or hear Porsche’s official sample below.',missingAudio:'No audio selected. Choose another profile or import a recording.',loadingAudio:'Loading the original recording…',audioError:'Source could not load. Check the connection or import an MP3/WAV.',playError:'Playback was blocked. Try importing an MP3 recording.',playing:'Real recording is playing.',stopped:'Audio stopped.',gpsWaiting:'Waiting for GPS speed…',gpsReady:'Using GPS speed.',gpsUnavailable:'Location not available. Use Demo instead.',gpsNoSpeed:'GPS has not supplied speed yet.',custom:'Your imported audio',customFile:'Custom file:',tooLarge:'Audio file is over 25MB.',badFile:'Please select MP3, WAV, OGG or M4A audio.',sourceReal:'Genuine Wikimedia Commons recording',sourceCustom:'Audio loaded locally from your device. It is not uploaded to our server.',fileSelected:'Selected:',creditsIntro:'Original recordings hosted by Wikimedia Commons. Playback pitch/rate is adjusted live; no remixed audio files are redistributed.',creditsTail:'If you publish derived files, credit and ShareAlike license requirements may apply.'
}
};
let lang='ar',profileId='v8',scenario='rev',sourceMode='demo',running=false,gas=false,brake=false;
let rpm=0,speed=0,throttle=0,gear=1,last=0,gpsWatch=null,gpsLast=0,gpsValue=0,gpsPrev=0,gpsAccel=0;
let audio=null,audioVersion=0,customFiles=new Map(),objectUrls=new Map();
const tr=key=>dict[lang][key]||key;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
function setFeedback(key){$('feedback').textContent=tr(key)}
function updateLanguage(){
 document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';
 document.querySelectorAll('[data-t]').forEach(node=>{node.textContent=tr(node.dataset.t)});
 $('languageButton').textContent=lang==='ar'?'EN':'عربي';
 document.querySelectorAll('[data-engine]').forEach(button=>{const label=button.querySelector('.engine-footer [data-t]');if(label)label.textContent=tr(label.dataset.t)});
 renderProfile();renderModes();renderStatus();renderCredits();
}
$('languageButton').addEventListener('click',()=>{lang=lang==='ar'?'en':'ar';updateLanguage()});
function renderCredits(){
 const parent=$('creditsList');parent.replaceChildren();
 for(const [id,p] of Object.entries(profiles)){
  if(!p.filename)continue;
  const wrap=document.createElement('div');wrap.className='credits-row';
  const a=document.createElement('a');a.href=p.source;a.target='_blank';a.rel='noopener noreferrer';a.textContent=p.name+' / '+p.author+' / '+p.license;
  const note=document.createElement('small');note.textContent=lang==='ar'?'التسجيل الأصلي — يمكن تعديل سرعة تشغيله داخل التطبيق':'Original recording — playback rate is adjusted in-browser';
  wrap.append(a,note);parent.append(wrap);
 }
 const info=document.createElement('small');info.textContent=tr('creditsIntro')+' '+tr('creditsTail');parent.append(info);
}
function hasCustom(id){return customFiles.has(id)}
function sourceFor(id){return hasCustom(id)?customFiles.get(id).url:profiles[id].url}
function renderProfile(){
 const p=profiles[profileId],custom=customFiles.get(profileId);
 document.querySelectorAll('[data-engine]').forEach(b=>{const is=b.dataset.engine===profileId;b.classList.toggle('selected',is);b.setAttribute('aria-pressed',String(is))});
 $('currentEngine').textContent=p.name;
 $('profileSubtitle').textContent=custom?'CUSTOM • '+custom.name:p.detail;
 $('sourcePill').textContent=custom?'LOCAL AUDIO':p.license;
 $('sourceDescription').textContent=custom?tr('sourceCustom'):p.url?tr('remoteSource'):tr('needTaycan');
 $('creditLink').hidden=!!custom||!p.url;
 if(!custom&&p.url)$('creditLink').href=p.source;
 $('taycanOfficial').hidden=profileId!=='taycan';
 $('fileLabel').textContent=custom?tr('fileSelected')+' '+custom.name:tr('fileHint');
 $('sourcePill').style.borderColor=custom?'#6d99a4':'';
}
function stopAudio(){
 audioVersion++;
 if(!audio)return;
 try{audio.pause();audio.removeAttribute('src');audio.load()}catch{}
 audio=null;
}
function prepareAudio(){
 stopAudio();
 const url=sourceFor(profileId);
 if(!url)return false;
 const current=++audioVersion;
 const a=new Audio();
 a.preload='auto';a.loop=true;a.src=url;a.volume=0;a.playbackRate=1;
 try{a.preservesPitch=false;a.mozPreservesPitch=false;a.webkitPreservesPitch=false}catch{}
 a.addEventListener('error',()=>{if(audio===a&&audioVersion===current)setFeedback('audioError')});
 a.addEventListener('canplay',()=>{if(audio===a&&audioVersion===current&&!running)setFeedback('ready')});
 audio=a;
 return true;
}
function switchProfile(id){
 if(!profiles[id])return;
 const wasRunning=running;
 if(wasRunning){running=false;stopAudio()}
 profileId=id;
 prepareAudio();renderProfile();renderStatus();
 if(wasRunning)start();
 else setFeedback(id==='taycan'&&!hasCustom(id)?'needTaycan':'ready');
}
document.querySelectorAll('[data-engine]').forEach(button=>button.addEventListener('click',()=>switchProfile(button.dataset.engine)));
function renderModes(){
 const park=scenario==='rev';
 $('revMode').classList.toggle('active',park);$('driveMode').classList.toggle('active',!park);
 $('revMode').setAttribute('aria-pressed',String(park));$('driveMode').setAttribute('aria-pressed',String(!park));
 $('scenarioHint').textContent=tr(park?'revHint':'driveHint');
 $('sourceSetting').hidden=park;
 $('demoMode').classList.toggle('active',sourceMode==='demo');$('gpsMode').classList.toggle('active',sourceMode==='gps');
 $('demoMode').setAttribute('aria-pressed',String(sourceMode==='demo'));
 $('gpsMode').setAttribute('aria-pressed',String(sourceMode==='gps'));
 $('modeHint').textContent=tr(sourceMode==='demo'?'demoHint':'gpsHint');
 $('gpsNotice').hidden=park||sourceMode!=='gps';
 $('demoPedals').hidden=!park&&sourceMode==='gps';
 $('demoPedals').classList.toggle('rev-pedals',park);
 $('brakePedal').hidden=park;
 $('gasPedal').querySelector('strong').textContent=tr(park?'revPedal':'accelerate');
 $('gpsQuality').textContent=park?'PARK • DEMO':sourceMode==='demo'?'DRIVE • DEMO':gpsLast?'GPS • LIVE':'GPS • WAITING';
 $('gasPedal').disabled=!running||(!park&&sourceMode==='gps');
 $('brakePedal').disabled=!running||park||sourceMode==='gps';
}
function releasePedals(){
 gas=false;brake=false;
 for(const pedal of document.querySelectorAll('.pedal'))pedal.classList.remove('pressed');
}
function stopGps(){if(gpsWatch!==null&&navigator.geolocation)navigator.geolocation.clearWatch(gpsWatch);gpsWatch=null;gpsLast=0}
function startGps(){
 if(!navigator.geolocation||!window.isSecureContext){setFeedback('gpsUnavailable');return}
 setFeedback('gpsWaiting');
 gpsWatch=navigator.geolocation.watchPosition(pos=>{
  const measured=pos.coords.speed;
  if(!Number.isFinite(measured)){setFeedback('gpsNoSpeed');return}
  const now=performance.now(),value=clamp(measured*3.6,0,260),dt=gpsLast?Math.max(.3,(now-gpsLast)/1000):1;
  gpsAccel=clamp((value-gpsPrev)/dt,-30,30);gpsPrev=value;gpsValue=value;gpsLast=now;
  setFeedback('gpsReady');renderModes();
 },()=>setFeedback('gpsUnavailable'),{enableHighAccuracy:true,maximumAge:300,timeout:9000});
}
function chooseScenario(next){
 if(next===scenario)return;
 releasePedals();stopGps();scenario=next;sourceMode='demo';speed=0;throttle=0;rpm=running?profiles[profileId].idle:0;gear=1;
 gpsValue=0;gpsPrev=0;gpsAccel=0;renderModes();render();
}
$('revMode').addEventListener('click',()=>chooseScenario('rev'));
$('driveMode').addEventListener('click',()=>chooseScenario('drive'));
function chooseSource(next){
 if(next===sourceMode||scenario==='rev')return;
 releasePedals();stopGps();sourceMode=next;speed=0;throttle=0;gear=1;
 gpsValue=0;gpsPrev=0;gpsAccel=0;
 if(running&&next==='gps')startGps();
 renderModes();
}
$('demoMode').addEventListener('click',()=>chooseSource('demo'));
$('gpsMode').addEventListener('click',()=>chooseSource('gps'));
function renderStatus(){
 $('engineStatus').dataset.state=running?'on':'off';
 $('engineStatusText').textContent=tr(running?'on':'off');
 $('startLabel').textContent=tr(running?'stop':'start');
 $('startSymbol').textContent=running?'■':'▶';
 $('startButton').classList.toggle('running',running);
 renderModes();
}
function start(){
 if(running){stop();return}
 if(!sourceFor(profileId)){setFeedback(profileId==='taycan'?'needTaycan':'missingAudio');return}
 if(!audio)prepareAudio();
 running=true;last=performance.now();rpm=profiles[profileId].idle;
 renderStatus();render();setFeedback('loadingAudio');
 try{
  const attempt=audio.play();
  if(attempt&&typeof attempt.then==='function'){
   attempt.then(()=>{if(running&&audio&&!audio.paused)setFeedback('playing')})
    .catch(()=>{if(running)setFeedback('playError')});
  }else setFeedback('playing');
 }catch{setFeedback('playError')}
 if(scenario==='drive'&&sourceMode==='gps')startGps();
}
function stop(){
 running=false;releasePedals();stopGps();
 if(audio)try{audio.pause();audio.currentTime=0;audio.volume=0}catch{}
 rpm=0;speed=0;throttle=0;gear=1;
 renderStatus();render();setFeedback('stopped');
}
$('startButton').addEventListener('click',start);
for(const [id,key] of [['gasPedal','gas'],['brakePedal','brake']]){
 const element=$(id);
 function press(event){if(!running||scenario==='drive'&&sourceMode==='gps')return;
  event.preventDefault();if(key==='gas')gas=true;else brake=true;
  element.classList.add('pressed');try{element.setPointerCapture(event.pointerId)}catch{}
 }
 function release(){if(key==='gas')gas=false;else brake=false;element.classList.remove('pressed')}
 element.addEventListener('pointerdown',press);
 for(const event of ['pointerup','pointercancel','lostpointercapture'])element.addEventListener(event,release);
}
window.addEventListener('blur',releasePedals);
document.addEventListener('visibilitychange',()=>{if(document.hidden)releasePedals()});
function updateAudio(){
 if(!audio||!running)return;
 const value=Number($('volume').value)/100;
 const influence=Number($('intensity').value)/100;
 const dynamic=clamp(throttle*.68+speed/360,0,1);
 const targetRate=clamp(.76+dynamic*(.68*influence+.18),.7,1.75);
 try{
  if(!audio.paused){
   audio.playbackRate+=clamp(targetRate-audio.playbackRate,-.05,.05);
   audio.volume=clamp(value*(.28+.72*throttle),0,.8);
  }
 }catch{}
}
function render(){
 $('rpmNumber').textContent=String(Math.round(rpm/10)*10);
 $('speedNumber').textContent=String(Math.round(speed));
 $('gearDisplay').textContent=running?(scenario==='rev'?'P':profiles[profileId].cyl==='EV'?'D':'G'+gear):'N';
 $('throttleFill').style.width=Math.round(throttle*100)+'%';
 $('throttlePercent').textContent=Math.round(throttle*100)+'%';
 const angle=-125+clamp(rpm/profiles[profileId].max,0,1)*250;
 $('rpmNeedle').setAttribute('transform','rotate('+angle+' 160 160)');
}
function tick(){
 const time=performance.now();
 if(!last)last=time;
 const dt=clamp((time-last)/1000,.001,.25);last=time;
 const p=profiles[profileId];
 if(running){
  if(scenario==='rev'){
   throttle+=(Number(gas)-throttle)*Math.min(1,dt*(gas?4:2.5));
   speed=0;gear=1;
   const target=p.idle+(p.red-p.idle)*Math.pow(throttle,.85);
   rpm+=(target-rpm)*Math.min(1,dt*(gas?7:3.5));
  }else{
   if(sourceMode==='demo'){
    throttle+=(Number(gas)-throttle)*Math.min(1,dt*(gas?4:2.2));
    speed=clamp(speed+(throttle*14-Number(brake)*24-2.2-speed*.025)*dt,0,220);
   }else{
    const fresh=gpsLast&&time-gpsLast<5500;
    speed+=( (fresh?gpsValue:0)-speed)*Math.min(1,dt*2.5);
    const virtualDemand=fresh?clamp(.14+gpsAccel*.09+speed*.002,0,1):.08;
    throttle+=(virtualDemand-throttle)*Math.min(1,dt*2);
   }
   if(p.cyl==='EV'){
    gear=1;
    const target=Math.min(p.red,Math.max(p.idle,speed*37+throttle*2700));
    rpm+=(target-rpm)*Math.min(1,dt*4.2);
   }else{
    const up=[18,43,75,115,165],down=[0,10,30,58,92,135];
    if(gear<6&&speed>up[gear-1]+(throttle>.5?10:0)&&rpm>p.red*.55)gear++;
    if(gear>1&&speed<down[gear-1])gear--;
    const ratios=[1,.63,.43,.32,.25,.21];
    const target=Math.min(p.red,Math.max(p.idle,(900+speed*62*ratios[gear-1])*(.86+throttle*.20)));
    rpm+=(target-rpm)*Math.min(1,dt*(throttle>.3?8:4));
   }
  }
  updateAudio();
 }else{rpm=0;speed=0;throttle=0}
 render();
}
$('volume').addEventListener('input',()=>{$('volumeValue').textContent=$('volume').value+'%'});
$('intensity').addEventListener('input',()=>{$('intensityValue').textContent=$('intensity').value+'%'});
$('soundFile').addEventListener('change',event=>{
 const file=event.target.files&&event.target.files[0];if(!file)return;
 if(file.size>25*1024*1024){setFeedback('tooLarge');event.target.value='';return}
 if(!/\.(mp3|wav|ogg|m4a)$/i.test(file.name)&&!file.type.startsWith('audio/')){setFeedback('badFile');event.target.value='';return}
 const old=objectUrls.get(profileId);if(old)URL.revokeObjectURL(old);
 const url=URL.createObjectURL(file);
 objectUrls.set(profileId,url);customFiles.set(profileId,{url,name:file.name});
 if(running)stop();
 prepareAudio();renderProfile();setFeedback('fileSelected');
 event.target.value='';
});
window.addEventListener('pagehide',()=>{
 clearInterval(loop);stopGps();stopAudio();for(const url of objectUrls.values())URL.revokeObjectURL(url);
});
const loop=setInterval(tick,50);
prepareAudio();updateLanguage();render();setFeedback('ready');
})();