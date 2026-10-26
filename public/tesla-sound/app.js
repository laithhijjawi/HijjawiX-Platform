import {ENGINE_PRESETS,EngineSynth} from './engine-core.js';

const $=id=>document.getElementById(id);
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const messages={
ar:{
 back:'المنصة الرئيسية',heroTitle:'صوت هيدرز. يتغيّر مع كل دعسة.',heroLead:'محرك صوتي جديد يحاكي نبضات اشتعال الأسطوانات والعادم والهيدرز وسحب الهواء والنقلات، لحظة بلحظة، من دون ملفات MP3 مكررة.',
 garageTitle:'اختار محركك',garageSub:'ستة أصوات مصمّمة بمحاكاة صوتية أصلية، وليست تسجيلات أو أصوات المصنع الرسمية.',
 synthesized:'محرك صوتي مباشر',soundCharacter:'اضبط شخصية الصوت',volume:'الصوت',intensity:'استجابة الدعسة',character:'صوت الهيدرز / طابع العادم',crackle:'فرقعة العادم عند رفع القدم',whine:'صفير السوبرتشارجر / الموتور',
 experience:'نوع التجربة',rev:'Park Rev',drive:'Drive Mode',revHint:'ارفع RPM بالدعسة الافتراضية والسيارة على P. لا يقرأ التطبيق دعسة تسلا الحقيقية.',driveHint:'تسارع افتراضي أو صوت يتبع سرعة GPS؛ الاستجابة الحقيقية للدعسة تحتاج بيانات السيارة.',inputSource:'مصدر التسارع',demo:'محاكاة',gps:'GPS',demoHint:'دعسة وفرامل افتراضيتان على الشاشة.',gpsHint:'السرعة من GPS وقد يتأخر الصوت عن دعسة السيارة.',
 off:'متوقف',on:'يعمل',throttle:'دعسة افتراضية',ready:'اختَر محركاً، واضغط تشغيل لتسمع الصوت.',start:'تشغيل صوت المحرك',stop:'إيقاف الصوت',brake:'فرامل',hold:'اضغط باستمرار',revPedal:'ارفع RPM',accelerate:'تسارع',
 demoRun:'اسمع تسارع ونقلات أوتوماتيك',demoEnd:'إيقاف التجربة',gpsNotice:'GPS يقرأ سرعة السيارة فقط، وليس مقدار الضغط الفعلي على الدعسة.',
 sourceDescription:'كل أسطوانة تولّد نبضة عادم، تمر بمرنانات تحاكي أنابيب الهيدرز، ومجاري الهواء، والتيربو، والنقلات. الصوت يُولّد فوراً ولا توجد ملفات صوت.',
 realismNote:'محاكاة أصلية مستوحاة من صوتيات المحركات وليست نسخة من كود TeslaSound.io أو تسجيلات Porsche أو أي مصنع.',feature1:'نبضات محركات حقيقية في النموذج',feature1Desc:'4 أشواط، ترتيب اشتعال الأسطوانات، ضغط العادم ورنين الهيدرز.',
 feature2:'نقلات وفرقعة عند رفع القدم',feature2Desc:'تبديل افتراضي، سحب هواء، هبوط RPM، وCrackle قابل للتعديل.',
 feature3:'بدون جهاز وبدون اشتراك',feature3Desc:'يعمل مباشرة في المتصفح. GPS لا يرسل بيانات الموقع إلى خادمنا.',
 physicsTitle:'كيف يتولّد الصوت؟',physicsBody:'محرك Web Audio يحسب توقيت اشتعال الأسطوانات ونبضات الضغط لكل بنك في المحرك، ثم يمرر الصوت عبر مرنانات ومواسير عادم ومؤثرات ميكانيكية. الـV8 يملك نمط نبضات غير متساوٍ لكل جهة، والـV12 أكثر نعومة، والـFlat-6 أعلى حدة. هذه تقريب صوتي من تصميمنا، وليست محاكاة فيزيائية معتمدة أو نسخة مطابقة للصوت الأصلي.',
 externalTitle:'هل يشتغل على السماعة الخارجية؟',externalSteps:'المتصفح يخرج الصوت إلى سماعات المقصورة. لا يمكن لتطبيق الويب تحديد سماعة تحذير المشاة الخارجية. وضع Boombox/Play Current Media ممكن على P في بعض سيارات تسلا، لكن تشغيل صوت المتصفح عليه غير مضمون، ولا يعمل كحل صوت قيادة خارجي.',
 safety:'لا تستخدم الأزرار أثناء القيادة. اضبط الصوت والسيارة على P، وخلّي صوت تنبيهات الطريق مسموعاً. هذا صوت ترفيهي ولا يتحكم بالسيارة أو بالدعسة أو بسماعة تحذير المشاة.',audioInitializing:'تجهيز المحرك الصوتي…',audioReady:'محرك الصوت يعمل الآن.',audioFailure:'تعذر تشغيل Web Audio. جرّب إعادة فتح الصفحة أو متصفحاً محدثاً.',audioBlocked:'المتصفح منع الصوت. اضغط تشغيل مرة أخرى.',stopped:'المحرك متوقف.',gpsWaiting:'بانتظار إشارة GPS…',gpsReady:'الصوت يتبع السرعة المقاسة من GPS.',gpsNoSpeed:'الموقع متاح لكن لا توجد قراءة سرعة صالحة.',gpsUnavailable:'الموقع غير متاح. اختر المحاكاة.',doneDemo:'انتهت تجربة القيادة. جرّب وضع Park Rev.',worklet:'AUDIO WORKLET · LOW LATENCY',fallback:'COMPATIBILITY AUDIO ENGINE',needsGesture:'اضغط تشغيل للسماح بالصوت.'
},
en:{
 back:'Back to platform',heroTitle:'Open headers. Every rev has character.',heroLead:'A brand-new live sound engine that models cylinder firing, exhaust headers, intake and gearshifts in real time. No repeating MP3 samples.',
 garageTitle:'Choose your engine',garageSub:'Six independent synthesized sound models — not original manufacturer recordings.',
 synthesized:'Live sound model',soundCharacter:'Tune the engine',volume:'Audio volume',intensity:'Throttle intensity',character:'Exhaust character / open headers',crackle:'Overrun crackle',whine:'Supercharger / electric whine',
 experience:'Experience',rev:'Park Rev',drive:'Drive Mode',revHint:'Rev using the virtual pedal while your vehicle is parked. The app cannot read your physical Tesla accelerator.',driveHint:'Virtual accelerator or GPS-derived speed, not real physical pedal position.',inputSource:'Drive input',demo:'Demo',gps:'GPS',demoHint:'Virtual accelerator and brake on screen.',gpsHint:'GPS response may lag actual acceleration.',
 off:'OFF',on:'RUNNING',throttle:'VIRTUAL THROTTLE',ready:'Choose an engine and press Start.',start:'Start live engine',stop:'Stop engine',brake:'Brake',hold:'Press and hold',revPedal:'Rev engine',accelerate:'Accelerate',
 demoRun:'Hear automatic launch & shifts',demoEnd:'Stop demo run',gpsNotice:'GPS measures your speed, not physical accelerator position.',
 sourceDescription:'Each cylinder creates an exhaust pressure event, shaped by independent header resonances, pipe reflections, intake and shift dynamics. No audio files or loops.',
 realismNote:'Independent audio model, not TeslaSound.io code, Porsche OEM sound or any manufacturer recording.',feature1:'Four-stroke firing events',feature1Desc:'Cylinder timing, exhaust pressure, individual banks and header resonance.',
 feature2:'Gear shifts and overrun',feature2Desc:'Virtual shifting, intake roar, falling RPM and adjustable crackle.',
 feature3:'No extra hardware or subscription',feature3Desc:'Runs in the browser; GPS coordinates never leave your device.',
 physicsTitle:'How the sound works',physicsBody:'The Web Audio engine calculates cylinder firing events and exhaust pressure by bank, then models resonances, exhaust pipes and mechanical harmonics. V8 uses uneven bank timing; V12 is smoother and flat-six is sharper. This independent approximation is not an OEM audio replica or a verified full acoustic simulation.',
 externalTitle:'Can it use the outside speaker?',externalSteps:'Browser audio plays through cabin speakers. A website cannot target the pedestrian-warning speaker. Some Tesla models offer Boombox / Play Current Media in Park, but the browser may not be considered the source; there is no supported exterior driving sound mode from this site.',
 safety:'Configure while parked. Do not operate the screen while driving. Keep warnings and surrounding sounds audible. Entertainment only; no vehicle or pedestrian-warning audio control.',audioInitializing:'Starting sound engine…',audioReady:'Engine audio is running.',audioFailure:'Web Audio could not start; reopen the page or update the browser.',audioBlocked:'Audio was blocked. Tap Start again.',stopped:'Engine stopped.',gpsWaiting:'Waiting for GPS…',gpsReady:'Audio follows GPS speed.',gpsNoSpeed:'No valid GPS speed reported yet.',gpsUnavailable:'GPS unavailable; use Demo.',doneDemo:'Demo completed. Try Park Rev next.',worklet:'AUDIO WORKLET · LOW LATENCY',fallback:'COMPATIBILITY AUDIO ENGINE',needsGesture:'Tap Start to enable sound.'
}
};
let lang='ar',profileId='v8',scenario='rev',sourceMode='demo';
let running=false,gas=false,brake=false,gasValue=.9;
let rpm=0,speed=0,throttle=0,gear=1,lastTick=0,lastShift=0;
let gpsWatch=null,gpsAt=0,gpsSpeed=0,gpsPrevious=0,gpsAcceleration=0;
let demoActive=false,demoStarted=0;
let audioCtx=null,master=null,processor=null,fallback=null;
let audioBackend='none',audioError=null;
let lastAudioState=null;
const t=k=>messages[lang][k]||k;

function feedback(key){$('feedback').textContent=t(key)}
function applyLanguage(){
 document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';
 document.querySelectorAll('[data-t]').forEach(el=>{el.textContent=t(el.dataset.t)});
 $('languageButton').textContent=lang==='ar'?'EN':'عربي';
 showProfile();showMode();showRunning();showDemo();
}
$('languageButton').addEventListener('click',()=>{lang=lang==='ar'?'en':'ar';applyLanguage()});
function showProfile(){
 const p=ENGINE_PRESETS[profileId];
 $('currentEngine').textContent=p.name;
 $('profileSubtitle').textContent=p.detail;
 document.querySelectorAll('[data-engine]').forEach(b=>{
  const active=b.dataset.engine===profileId;
  b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));
 });
}
function sendAudio(shift){
 if(!processor&&!fallback)return;
 const state={profile:profileId,rpm,load:throttle,character:Number($('character').value)/100,
  crackle:Number($('crackle').value)/100,whine:Number($('whine').value)/100,
  active:running};
 if(shift)state.shift=shift;
 if(processor)processor.port.postMessage(state);
 else fallback.setState(state);
 lastAudioState=state;
}
function selectProfile(id){
 if(!ENGINE_PRESETS[id])return;
 profileId=id;rpm=running?ENGINE_PRESETS[id].idle:0;gear=1;throttle=0;
 showProfile();render();
 sendAudio();
}
document.querySelectorAll('[data-engine]').forEach(b=>b.addEventListener('click',()=>selectProfile(b.dataset.engine)));
function showMode(){
 const parked=scenario==='rev',manual=sourceMode==='demo';
 $('revMode').classList.toggle('active',parked);$('driveMode').classList.toggle('active',!parked);
 $('revMode').setAttribute('aria-pressed',String(parked));$('driveMode').setAttribute('aria-pressed',String(!parked));
 $('scenarioHint').textContent=t(parked?'revHint':'driveHint');
 $('sourceSetting').hidden=parked;
 $('demoMode').classList.toggle('active',manual);$('gpsMode').classList.toggle('active',!manual);
 $('demoMode').setAttribute('aria-pressed',String(manual));$('gpsMode').setAttribute('aria-pressed',String(!manual));
 $('modeHint').textContent=t(manual?'demoHint':'gpsHint');
 $('gpsNotice').hidden=parked||manual;
 $('demoPedals').hidden=!parked&&!manual;
 $('demoPedals').classList.toggle('rev-pedals',parked);
 $('brakePedal').hidden=parked;
 $('gasPedal').querySelector('strong').textContent=t(parked?'revPedal':'accelerate');
 $('gasPedal').disabled=!running||(!parked&&!manual)||demoActive;
 $('brakePedal').disabled=!running||parked||!manual||demoActive;
 $('gpsQuality').textContent=parked?'PARK • REV':manual?'DRIVE • DEMO':gpsAt?'GPS • LIVE':'GPS • WAITING';
}
function releasePedals(){gas=false;brake=false;document.querySelectorAll('.pedal').forEach(p=>p.classList.remove('pressed'))}
function stopGps(){if(gpsWatch!==null&&navigator.geolocation)navigator.geolocation.clearWatch(gpsWatch);gpsWatch=null;gpsAt=0}
function startGps(){
 if(!navigator.geolocation||!window.isSecureContext){feedback('gpsUnavailable');return}
 feedback('gpsWaiting');
 gpsWatch=navigator.geolocation.watchPosition(pos=>{
  const measured=pos.coords.speed;
  if(measured==null||!Number.isFinite(measured)){feedback('gpsNoSpeed');return}
  const now=performance.now(),kmh=clamp(measured*3.6,0,260),dt=gpsAt?Math.max(.3,(now-gpsAt)/1000):1;
  gpsAcceleration=clamp((kmh-gpsPrevious)/dt,-24,24);
  gpsPrevious=kmh;gpsSpeed=kmh;gpsAt=now;
  feedback('gpsReady');showMode();
 },()=>feedback('gpsUnavailable'),{enableHighAccuracy:true,maximumAge:450,timeout:10000});
}
function setScenario(next){
 if(next===scenario)return;
 demoActive=false;releasePedals();stopGps();scenario=next;sourceMode='demo';
 speed=0;throttle=0;rpm=running?ENGINE_PRESETS[profileId].idle:0;gear=1;
 gpsSpeed=0;gpsPrevious=0;gpsAcceleration=0;
 showMode();showDemo();render();sendAudio();
}
$('revMode').addEventListener('click',()=>setScenario('rev'));
$('driveMode').addEventListener('click',()=>setScenario('drive'));
function setSource(next){
 if(next===sourceMode||scenario==='rev')return;
 demoActive=false;releasePedals();stopGps();sourceMode=next;
 speed=0;throttle=0;gear=1;gpsSpeed=0;gpsPrevious=0;gpsAcceleration=0;
 if(running&&!demoActive&&next==='gps')startGps();
 showMode();showDemo();sendAudio();
}
$('demoMode').addEventListener('click',()=>setSource('demo'));
$('gpsMode').addEventListener('click',()=>setSource('gps'));
async function beginAudio(){
 const Context=window.AudioContext||window.webkitAudioContext;
 if(!Context)throw Error('Web Audio unavailable');
 // Construct and resume immediately from a user gesture, before any await.
 const ctx=new Context({latencyHint:'interactive'});
 audioCtx=ctx;
 const resumed=ctx.resume();
 const filter=ctx.createBiquadFilter();filter.type='highpass';filter.frequency.value=27;
 const bass=ctx.createBiquadFilter();bass.type='lowshelf';bass.frequency.value=135;bass.gain.value=5;
 const compressor=ctx.createDynamicsCompressor();
 compressor.threshold.value=-15;compressor.knee.value=19;compressor.ratio.value=3;
 compressor.attack.value=.006;compressor.release.value=.15;
 master=ctx.createGain();master.gain.value=0;
 filter.connect(bass);bass.connect(compressor);compressor.connect(master);master.connect(ctx.destination);
 audioError=null;
 if(ctx.audioWorklet&&typeof AudioWorkletNode!=='undefined'){
  try{
   await ctx.audioWorklet.addModule('./engine-worklet.js?v=physics-v3');
   const node=new AudioWorkletNode(ctx,'hijjawix-physics-engine-v3',{
     numberOfInputs:0,numberOfOutputs:1,outputChannelCount:[2]});
   node.connect(filter);processor=node;audioBackend='worklet';
  }catch(err){audioError=err}
 }
 if(!processor){
  // Compatibility mode: same physically based DSP, with larger audio buffers.
  if(typeof ctx.createScriptProcessor!=='function')throw audioError||new Error('No supported audio processing API');
  fallback=new EngineSynth(ctx.sampleRate);
  const node=ctx.createScriptProcessor(1024,0,2);
  node.onaudioprocess=event=>fallback.render(event.outputBuffer.getChannelData(0),event.outputBuffer.getChannelData(1));
  node.connect(filter);processor=null;audioBackend='compatibility';
  window.__hijjawixFallbackNode=node; // keep Web Audio node alive on older browsers
 }
 $('audioDevice').textContent=t(audioBackend==='worklet'?'worklet':'fallback');
 await resumed;
 return ctx;
}
function updateVolume(){
 const amount=Number($('volume').value)/100;
 if(master&&audioCtx)master.gain.setTargetAtTime(running?amount*.95:0,audioCtx.currentTime,.06);
}
function showRunning(){
 $('engineStatus').dataset.state=running?'on':'off';
 $('engineStatusText').textContent=t(running?'on':'off');
 $('startLabel').textContent=t(running?'stop':'start');
 $('startSymbol').textContent=running?'■':'▶';
 $('startButton').classList.toggle('running',running);
 showMode();
}
async function start(){
 if(running){stop();return}
 running=true;rpm=ENGINE_PRESETS[profileId].idle;speed=0;throttle=0;gear=1;lastTick=performance.now();
 feedback('audioInitializing');showRunning();render();
 try{
  if(!audioCtx)await beginAudio();
  else if(audioCtx.state!=='running')await audioCtx.resume();
  if(!running)return;
  sendAudio();updateVolume();feedback('audioReady');
  if(scenario==='drive'&&sourceMode==='gps')startGps();
 }catch(err){
  console.error('Tesla Sound X audio start:',err);
  running=false;feedback('audioFailure');showRunning();
 }
}
function stop(){
 demoActive=false;releasePedals();stopGps();
 running=false;speed=0;rpm=0;throttle=0;gear=1;
 sendAudio();updateVolume();feedback('stopped');
 showRunning();showDemo();render();
}
$('startButton').addEventListener('click',()=>{void start()});
for(const [id,key] of [['gasPedal','gas'],['brakePedal','brake']]){
 const el=$(id);
 function press(event){
  if(!running||demoActive||scenario==='drive'&&sourceMode==='gps')return;
  event.preventDefault();
  if(key==='gas'){gas=true;gasValue=clamp(.52+(1-event.offsetY/Math.max(1,el.clientHeight))*.48,.52,1)}
  else brake=true;
  el.classList.add('pressed');
  try{el.setPointerCapture(event.pointerId)}catch{}
 }
 function release(){if(key==='gas')gas=false;else brake=false;el.classList.remove('pressed')}
 el.addEventListener('pointerdown',press);
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(ev,release);
}
window.addEventListener('blur',releasePedals);
document.addEventListener('visibilitychange',()=>{if(document.hidden)releasePedals()});
function showDemo(){
 $('demoRunButton').classList.toggle('running',demoActive);
 $('demoRunButton').querySelector('strong').textContent=t(demoActive?'demoEnd':'demoRun');
 showMode();
}
async function demoRun(){
 if(demoActive){demoActive=false;showDemo();return}
 if(!running)await start();
 if(!running)return;
 if(scenario!=='drive')setScenario('drive');
 if(sourceMode!=='demo')setSource('demo');
 demoActive=true;releasePedals();speed=0;throttle=0;gear=1;demoStarted=performance.now();
 showDemo();
}
$('demoRunButton').addEventListener('click',()=>{void demoRun()});
function demoPedals(seconds){
 const sequence=[
  [0,1.1,0,0],[1.1,3.2,.45,0],[3.2,6.8,.88,0],[6.8,7.5,0,0],
  [7.5,11.1,.98,0],[11.1,11.9,.05,0],[11.9,15.0,.77,0],
  [15.0,17.6,0,0],[17.6,20.0,0,.72],[20.0,22,0,0]
 ];
 for(const [a,b,accelerator,brakeValue] of sequence)if(seconds>=a&&seconds<b)return [accelerator,brakeValue];
 return [0,0];
}
function render(){
 $('rpmNumber').textContent=String(Math.round(rpm/10)*10);
 $('speedNumber').textContent=String(Math.round(speed));
 $('gearDisplay').textContent=running?(scenario==='rev'?'P':ENGINE_PRESETS[profileId].type==='electric'?'D':'G'+gear):'N';
 $('throttleFill').style.width=Math.round(throttle*100)+'%';
 $('throttlePercent').textContent=Math.round(throttle*100)+'%';
 const p=ENGINE_PRESETS[profileId],angle=-125+clamp(rpm/p.limit,0,1)*250;
 $('rpmNeedle').setAttribute('transform','rotate('+angle+' 160 160)');
}
function tick(){
 const now=performance.now();
 if(!lastTick)lastTick=now;
 const dt=clamp((now-lastTick)/1000,.001,.24);
 lastTick=now;
 const p=ENGINE_PRESETS[profileId];
 if(running){
  let inputGas=gas?gasValue:0,inputBrake=brake?1:0;
  if(demoActive){
   const elapsed=(now-demoStarted)/1000;
   if(elapsed>=22){
    demoActive=false;showDemo();feedback('doneDemo');
    inputGas=0;inputBrake=0;
   }else{
    [inputGas,inputBrake]=demoPedals(elapsed);
   }
  }
  if(scenario==='rev'){
   const intensity=Number($('intensity').value)/100;
   throttle+=(inputGas-throttle)*Math.min(1,dt*(inputGas>throttle?3+intensity*5:3.1));
   speed=0;gear=1;
   const target=p.idle+(p.limit-p.idle)*Math.pow(throttle,.8);
   rpm+=(target-rpm)*Math.min(1,dt*(inputGas?6:4));
  }else{
   if(sourceMode==='demo'){
    throttle+=(inputGas-throttle)*Math.min(1,dt*(inputGas>throttle?6:3));
    const driveForce=throttle*24;
    speed=clamp(speed+(driveForce-inputBrake*35-2.4-speed*.04)*dt,0,230);
   }else{
    const fresh=gpsAt&&now-gpsAt<5500;
    const next=fresh?gpsSpeed:0;
    speed+=(next-speed)*Math.min(1,dt*3);
    const measuredThrottle=fresh?clamp(.11+Math.max(0,gpsAcceleration)*.11+speed*.0018,0,1):.08;
    throttle+=(measuredThrottle-throttle)*Math.min(1,dt*2);
   }
   if(p.type==='electric'){
    gear=1;const target=clamp(p.idle+speed*53+throttle*2300,p.idle,p.limit);
    rpm+=(target-rpm)*Math.min(1,dt*5);
   }else{
    const intensity=Number($('intensity').value)/100;
    const ratio=p.ratios[Math.min(gear-1,p.ratios.length-1)];
    const stall= p.idle + throttle*1800;
    const target=clamp(Math.max(stall,speed*ratio+throttle*260),p.idle,p.limit);
    const shiftPoint=p.idle+(p.limit-p.idle)*(.48+intensity*.35+throttle*.12);
    if(gear<p.gears&&target>shiftPoint&&now-lastShift>650&&speed>10){
     gear++;lastShift=now;sendAudio('up');
    }else if(gear>1&&target<p.idle+1050&&now-lastShift>700){
     gear--;lastShift=now;sendAudio('down');
    }
    const actualRatio=p.ratios[Math.min(gear-1,p.ratios.length-1)];
    const setPoint=clamp(Math.max(stall,speed*actualRatio+throttle*260),p.idle,p.limit);
    rpm+=(setPoint-rpm)*Math.min(1,dt*(setPoint<rpm?11:7));
   }
  }
  sendAudio();
 }else{rpm=0;speed=0;throttle=0}
 render();
}
for(const id of ['volume','intensity','character','crackle','whine']){
 const slider=$(id),out=$(id+'Value');
 slider.addEventListener('input',()=>{
  out.textContent=slider.value+'%';
  if(id==='volume')updateVolume();else sendAudio();
 });
}
window.addEventListener('pagehide',()=>{
 clearInterval(loop);releasePedals();stopGps();
 if(audioCtx){try{audioCtx.close()}catch{}}
});
const loop=setInterval(tick,45);
applyLanguage();feedback('ready');render();
