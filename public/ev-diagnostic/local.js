import {SPEEDS,parseSlcanLine,validateProfile,decodeFrame,csvText} from './can-protocol.mjs';

const $ = id => document.getElementById(id);
const i18n = {
 ar:{cloud:'الحساب السحابي',title:'فحص بطاريات السيارات الكهربائية',subtitle:'راقب رسائل CAN الحقيقية وسجلها، واعرض قراءات الخلايا فقط عند توفير تعريف BMS موثّق.',disconnected:'غير متصل',connected:'متصل',connecting:'جار الاتصال...',demoConnected:'محاكاة فقط',connection:'الاتصال بالجهاز',adapter:'نوع الاتصال',modeUsb:'MKS CANable · USB Serial (SLCAN)',modeDemo:'تجربة الواجهة (بيانات محاكاة)',usbSpeed:'سرعة USB Serial',canSpeed:'سرعة CAN',passive:'وضع استقبال فقط (لا أوامر تشخيص أو كتابة)',connect:'اتصال USB',tryDemo:'تشغيل المحاكاة',disconnect:'فصل',clear:'مسح القراءات',compatibility:'يشترط أن تكون القطعة تعمل ببرنامج SLCAN وتظهر كمنفذ Serial. Firmware من نوع candleLight/gs_usb يحتاج جسراً مختلفاً. لا تغيّر Firmware قبل تحديد النوع.',vehicle:'ملف تعريف البطارية',brand:'الشركة',other:'أخرى',profile:'تعريف إشارات CAN',noProfile:'بدون تعريف — CAN خام فقط',profileFile:'ملف JSON موثّق (قراءة محلية)',chooseProfile:'اختر ملف JSON',undecoded:'لم يتم تحميل تعريف خلايا موثّق',profileNote:'لا يجوز استنتاج مواقع الخلايا من CAN ID فقط. الملف يجب أن يكون مطابقاً لطراز السيارة وسنة الصنع ونوع البطارية.',architecture:'تفاصيل بنية الفحص',frames:'عدد الرسائل',unique:'معرفات CAN',cellCount:'الخلايا المقروءة',voltageDelta:'فرق أعلى وأقل خلية',soc:'SOC',packVoltage:'جهد الحزمة',cells:'خلايا البطارية',cellsNotice:'لا توجد قراءات خلايا موثّقة بعد. اتصال CAN وحده لا يكفي.',rawFrames:'مراقبة رسائل CAN',exportCsv:'تصدير CSV',exportCells:'تصدير الخلايا',time:'الوقت',waiting:'بانتظار الرسائل...',storage:'البيانات داخل المتصفح محلياً ولا تُرفع إلى السحابة. يُحتفظ بآخر 10,000 رسالة في الذاكرة.',safety:'للاختبار المبدئي فقط: فحص استقبال دون إرسال رسائل CAN. لا توصل أسلاكاً غير مؤكدة أو خط الجهد العالي.',home:'العودة للمنصة',noData:'لا بيانات',emptyCells:'ستظهر الخلايا هنا فور وصول قراءات موثّقة من ملف تعريف متوافق.',unsupported:'هذا المتصفح لا يوفر Web Serial. جرّب Chrome أو Edge على اللابتوب، أو بوابة Wi-Fi للهاتف.',ready:'اختر اتصال USB وأذن للمتصفح باستخدام المنفذ. تأكد من أن Firmware يدعم SLCAN.',running:'المراقبة فعالة؛ أي خلايا لن تظهر إلا بملف تعريف مطابق.',demoWarning:'وضع محاكاة واضح — ليست بيانات حقيقية ولا تصلح لتقرير بطارية.',noCellExport:'لا تتوفر خلايا مقروءة لتصديرها.',noFrameExport:'لا توجد رسائل للتصدير.',fileLoaded:'تم تحميل تعريف: ',fileError:'ملف التعريف غير صالح: ',serialError:'فشل الاتصال: ',noProfileMsg:'قراءة CAN الخام فقط. لا يمكن حساب حالة الخلايا دون ملف تعريف موثّق.',stopped:'تم إيقاف المراقبة.',demoLabel:'SIMULATED · محاكاة',realLabel:'LIVE · حقيقي',stale:'توقف وصول بيانات جديدة',profileMismatch:'الملف المختار لم يُتحقق من تطابقه مع السيارة. تحقق يدوياً من التعريف.'},
 en:{cloud:'Cloud account',title:'Electric Vehicle Battery Diagnostics',subtitle:'Monitor and record real CAN traffic. Cell voltages only appear with a verified BMS decoding profile.',disconnected:'Disconnected',connected:'Connected',connecting:'Connecting...',demoConnected:'Simulation only',connection:'Device connection',adapter:'Connection type',modeUsb:'MKS CANable · USB Serial (SLCAN)',modeDemo:'UI demo (simulated data)',usbSpeed:'USB Serial baud',canSpeed:'CAN speed',passive:'Receive-only mode (no diagnostics or write commands)',connect:'Connect USB',tryDemo:'Start simulation',disconnect:'Disconnect',clear:'Clear readings',compatibility:'The adapter must be running SLCAN firmware and expose a serial port. candleLight/gs_usb requires a different bridge. Do not flash firmware before identifying it.',vehicle:'Battery profile',brand:'Manufacturer',other:'Other',profile:'CAN signal profile',noProfile:'No profile — raw CAN only',profileFile:'Verified local JSON profile',chooseProfile:'Choose JSON file',undecoded:'No validated cell decoder loaded',profileNote:'Cell locations cannot be guessed from CAN IDs. Profiles must match the model, production year and pack variant.',architecture:'Diagnostic architecture',frames:'Total frames',unique:'Unique CAN IDs',cellCount:'Cells decoded',voltageDelta:'Max/min cell delta',soc:'SOC',packVoltage:'Pack voltage',cells:'Battery cells',cellsNotice:'No verified cell readings available yet. A CAN connection alone is insufficient.',rawFrames:'Raw CAN monitor',exportCsv:'Export CSV',exportCells:'Export cells',time:'Time',waiting:'Waiting for frames...',storage:'Data stays locally in this browser; no cloud uploads. The latest 10,000 frames are retained in memory.',safety:'Initial read-only testing only. Do not connect unverified wiring or any high-voltage conductor.',home:'Back to platform',noData:'No data',emptyCells:'Cells will appear after validated signals arrive through a compatible profile.',unsupported:'Web Serial is unavailable in this browser/device. Try desktop Chrome/Edge or a Wi-Fi bridge for phones.',ready:'Select USB connection and grant serial port access. SLCAN firmware is required.',running:'Capture is active. Cells require a matching profile.',demoWarning:'Clearly simulated data — not vehicle measurements or a battery report.',noCellExport:'No decoded cells to export.',noFrameExport:'No frames to export.',fileLoaded:'Loaded profile: ',fileError:'Invalid profile: ',serialError:'Connection failed: ',noProfileMsg:'Raw CAN capture only. A validated battery signal profile is needed for cell measurements.',stopped:'Capture stopped.',demoLabel:'SIMULATED',realLabel:'LIVE',stale:'No recent CAN traffic',profileMismatch:'Profile is not confirmed compatible with this vehicle. Verify its identity before interpreting readings.'}
};
let language = localStorage.getItem('hxed-local-lang')==='en'?'en':'ar';
let port=null, reader=null, writer=null, task=null, demoTimer=null, active=false, isDemo=false, profile=null;
let rows=[], lastFrameTimes=[], ids=new Set(), cells=new Map(), metrics={};
let renderPending=false, currentError='';
function t(key){return i18n[language][key]||key;}
function setMsg(message){currentError=message;$('supportMessage').textContent=message;}
function translate(){
 document.documentElement.lang=language;document.documentElement.dir=language==='ar'?'rtl':'ltr';
 document.querySelectorAll('[data-i18n]').forEach(node=>{if(i18n[language][node.dataset.i18n])node.textContent=t(node.dataset.i18n)});
 $('language').textContent=language==='ar'?'EN':'عربي';
 $('connect').textContent=t(active?(isDemo?'tryDemo':'connect'):($('mode').value==='demo'?'tryDemo':'connect'));
 $('connectionStatus').textContent=active?t(isDemo?'demoConnected':'connected'):t('disconnected');
 if(!active)setMsg(navigator.serial?t('ready'):t('unsupported'));
 else setMsg(isDemo?t('demoWarning'):t('running'));
 display();
}
function status(connected){
 $('light').classList.toggle('good',connected);
 $('connectionStatus').textContent=t(connected?(isDemo?'demoConnected':'connected'):'disconnected');
 $('dataSource').textContent=connected?t(isDemo?'demoLabel':'realLabel'):t('noData');
 $('connect').disabled=connected;$('disconnect').disabled=!connected;
 $('mode').disabled=connected;$('canBaud').disabled=connected;$('serialBaud').disabled=connected;
}
function clearData(){rows=[];ids.clear();cells.clear();metrics={};lastFrameTimes=[];display();}
function store(frame){
 const now=Date.now();rows.push(frame);if(rows.length>10000)rows.shift();
 ids.add(frame.idHex + (frame.extended?'X':'S'));lastFrameTimes.push(now);
 while(lastFrameTimes.length && lastFrameTimes[0]<now-1000)lastFrameTimes.shift();
 if(profile && !isDemo){
  for(const signal of decodeFrame(frame,profile)){
   if(signal.key==='cell'){
    // Reject clearly implausible readings; do not silently coerce battery data.
    if(signal.value>=0.5 && signal.value<=5.5)cells.set(signal.cell,{value:signal.value,module:signal.module||null,at:now});
   } else metrics[signal.key]={value:signal.value,at:now};
  }
 }
 if(!renderPending){renderPending=true;requestAnimationFrame(()=>{renderPending=false;display();});}
}
function showNumber(value,unit='',digits=2){return Number.isFinite(value)?value.toFixed(digits)+unit:'—';}
function display(){
 $('totalFrames').textContent=rows.length.toLocaleString();
 $('uniqueIds').textContent=ids.size.toLocaleString();
 const now=Date.now();const recent=[...cells.entries()].filter(([,c])=>now-c.at<10000).sort((a,b)=>a[0]-b[0]);
 $('cellCount').textContent=recent.length?String(recent.length):'—';
 const volts=recent.map(([,c])=>c.value);
 const delta=volts.length>=2?(Math.max(...volts)-Math.min(...volts))*1000:null;
 $('cellDelta').textContent=delta===null?'—':showNumber(delta,' mV',1);
 const validMetric=key=>metrics[key]&&now-metrics[key].at<10000?metrics[key].value:null;
 $('soc').textContent=showNumber(validMetric('soc'), ' %', 1);
 $('packVoltage').textContent=showNumber(validMetric('packVoltage'), ' V', 1);
 $('frameRate').textContent=lastFrameTimes.filter(x=>x>now-1000).length+' frames/s';
 $('cells').replaceChildren();
 if(!recent.length){const div=document.createElement('div');div.className='empty-local';div.textContent=t('emptyCells');$('cells').append(div);}
 else {const min=Math.min(...volts);for(const [index,cell] of recent){const div=document.createElement('div');div.className='cell'+(cell.value-min>=0.1?' critical':cell.value-min>=0.02?' warning':'');const small=document.createElement('small');small.textContent='CELL '+String(index).padStart(3,'0')+(cell.module?' · M'+cell.module:'');const strong=document.createElement('strong');strong.textContent=showNumber(cell.value,' V',3);div.append(small,strong);$('cells').append(div);}}
 const recentRows=rows.slice(-90).reverse();
 $('framesBody').replaceChildren();
 if(!recentRows.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=5;td.className='muted';td.textContent=t('waiting');tr.append(td);$('framesBody').append(tr);}
 else {const fragment=document.createDocumentFragment();for(const frame of recentRows){const tr=document.createElement('tr');const date=new Date(frame.receivedAt).toLocaleTimeString(language==='ar'?'ar-JO':'en-US',{hour12:false});for(const value of [date,frame.idHex,frame.fd?'CAN-FD':frame.remote?'RTR':'CAN',frame.dlc,frame.data.map(x=>x.toString(16).toUpperCase().padStart(2,'0')).join(' ')]){const td=document.createElement('td');td.textContent=value;tr.append(td);}fragment.append(tr);}$('framesBody').append(fragment);}
}
async function writeCommand(text){if(!writer)throw Error('Serial writer unavailable');await writer.write(new TextEncoder().encode(text+'\r'));}
async function connectUSB(){
 if(!('serial' in navigator))throw new Error(t('unsupported'));
 // Only traditional Lawicel SLCAN. The browser cannot speak gs_usb/candleLight.
 port=await navigator.serial.requestPort();
 await port.open({baudRate:Number($('serialBaud').value),bufferSize:16384});
 writer=port.writable.getWriter();
 try{
   await writeCommand('C');
   await writeCommand(SPEEDS[Number($('canBaud').value)]);
   // Lawicel Listen-only command: L. No O command, no t/T transmit frames.
   await writeCommand('L');
 }catch(e){try{writer.releaseLock();}catch{}writer=null;await port.close().catch(()=>{});port=null;throw e;}
 active=true;isDemo=false;status(true);setMsg(t('running'));
 task=readLoop(port);
}
async function readLoop(p){
 const decoder=new TextDecoder();let buffer='';
 try{
  reader=p.readable.getReader();
  while(active && !isDemo){
   const {value,done}=await reader.read();if(done)break;
   buffer+=decoder.decode(value,{stream:true});
   if(buffer.length>65536)buffer=buffer.slice(-8192);
   const lines=buffer.split(/[\r\n]/);buffer=lines.pop()||'';
   for(const line of lines){const frame=parseSlcanLine(line);if(frame)store(frame);}
  }
 }catch(e){if(active)setMsg(t('serialError')+e.message);}
 finally {try{reader?.releaseLock();}catch{}reader=null;if(active)await disconnect();}
}
function simulate(){
 active=true;isDemo=true;let count=0;status(true);setMsg(t('demoWarning'));
 demoTimer=setInterval(()=>{
  count++;const data=Array.from({length:8},(_,i)=>Math.floor((count*7+i*13)%256));
  const frame={id:0x220+(count%14),idHex:(0x220+(count%14)).toString(16).toUpperCase(),extended:false,remote:false,fd:false,dlc:8,data,receivedAt:Date.now()};
  store(frame);
  // Demo values are never connected to actual frame decoder/profile.
  const now=Date.now();for(let i=1;i<=24;i++)cells.set(i,{value:3.68+(i%9)*.003+Math.sin(count/18+i)*.001,module:Math.ceil(i/6),at:now});
  metrics.soc={value:64.2,at:now};metrics.packVoltage={value:353.6,at:now};display();
 },270);
}
async function disconnect(){
 if(!active && !port)return;
 active=false;if(demoTimer)clearInterval(demoTimer);demoTimer=null;
 try{await reader?.cancel();}catch{}
 // Close SLCAN without sending a CAN data frame; port may already be gone.
 try{if(writer){await writeCommand('C');writer.releaseLock();}}catch{}
 writer=null;
 try{await port?.close();}catch{}
 port=null;status(false);setMsg(t('stopped'));display();
}
function download(filename,content){const blob=new Blob(['\uFEFF',content],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);}
function exportRaw(){if(!rows.length){setMsg(t('noFrameExport'));return;}download('hijjawix-can-'+Date.now()+'.csv',csvText([['timestamp','CAN_ID','extended','FD','DLC','DATA_HEX','simulated'],...rows.map(f=>[new Date(f.receivedAt).toISOString(),f.idHex,f.extended,f.fd,f.dlc,f.data.map(x=>x.toString(16).padStart(2,'0')).join(''),isDemo]) ]));}
function exportCells(){if(!cells.size){setMsg(t('noCellExport'));return;}download('hijjawix-cells-'+Date.now()+'.csv',csvText([['cell','module','voltage_v','timestamp','simulated','profile'],...[...cells].sort((a,b)=>a[0]-b[0]).map(([i,c])=>[i,c.module||'',c.value,new Date(c.at).toISOString(),isDemo,profile?.name||'none'])]));}
$('mode').onchange=()=>{$('connect').textContent=t($('mode').value==='demo'?'tryDemo':'connect');setMsg($('mode').value==='demo'?t('demoWarning'):t('ready'));};
$('profileMode').onchange=()=>{$('profileFileLabel').hidden=$('profileMode').value!=='file';if($('profileMode').value==='none'){profile=null;cells.clear();metrics={};$('profileStatus').textContent=t('undecoded');display();}};
$('profileFile').onchange=async()=>{
 const file=$('profileFile').files?.[0];if(!file)return;
 try{if(file.size>200000)throw Error('File too large (200 KB max)');
  profile=validateProfile(JSON.parse(await file.text()));
  cells.clear();metrics={};$('profileStatus').textContent=t('fileLoaded')+profile.name;setMsg(t('profileMismatch'));display();
 }catch(e){profile=null;$('profileStatus').textContent=t('undecoded');setMsg(t('fileError')+e.message);}
};
$('connect').onclick=async()=>{if(active)return;clearData();status(false);try{if($('mode').value==='demo')simulate();else await connectUSB();}catch(e){setMsg(t('serialError')+e.message);await disconnect();setMsg(t('serialError')+e.message);}};
$('disconnect').onclick=disconnect;
$('clear').onclick=clearData;
$('exportFrames').onclick=exportRaw;
$('exportCells').onclick=exportCells;
$('language').onclick=()=>{language=language==='ar'?'en':'ar';localStorage.setItem('hxed-local-lang',language);translate();};
window.addEventListener('pagehide',()=>{if(active)disconnect();});
setInterval(()=>{if(active && !isDemo && lastFrameTimes.length && Date.now()-lastFrameTimes.at(-1)>5000) { $('frameRate').textContent='0 frames/s'; $('connectionStatus').textContent=t('stale'); }},1000);
translate();status(false);
