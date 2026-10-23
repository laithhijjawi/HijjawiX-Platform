(() => {
'use strict';
const categories=[
{id:'islamic',icon:'۞',color:'#67e3bd',wash:'#164f4538',ar:'إسلاميات',en:'Islamic',descAr:'تطبيقات للقرآن الكريم والتدبر والمعرفة الإسلامية.',descEn:'Quran, reflection and Islamic learning apps.',apps:[{nameAr:'آية لك',nameEn:'Ayah Lak',icon:'۞',descAr:'آيات قرآنية حسب الموضوع مع مشاركة المحتوى.',descEn:'Discover and share Quran verses by topic.',url:'https://ayahlak.hijjawix.com/'}]},
{id:'engineering',icon:'⌘',color:'#6faaff',wash:'#265eab29',ar:'الهندسة',en:'Engineering',descAr:'أدوات وحلول تقنية للهندسة والطاقة والتحليل.',descEn:'Engineering, energy and technical analysis tools.',apps:[]},
{id:'math',icon:'∑',color:'#b7a2ff',wash:'#7055ac33',ar:'الرياضيات',en:'Mathematics',descAr:'تعلّم وتدريب وحلول تفاعلية للمسائل الرياضية.',descEn:'Interactive maths learning, practice and tools.',apps:[]},
{id:'entertainment',icon:'✦',color:'#ffc391',wash:'#af634433',ar:'الترفيه والألعاب',en:'Games & Fun',descAr:'ألعاب مسلية وتحديات تفاعلية مع الأصدقاء.',descEn:'Fun games and interactive challenges with friends.',apps:[{nameAr:'Fold & Fire',nameEn:'Fold & Fire',icon:'✦',descAr:'لعبة حرب الورق التفاعلية مع اللعب عبر الإنترنت.',descEn:'An interactive paper-battle strategy game.',url:'https://fold-and-fire-online.laith-hijj.workers.dev/'}]},
{id:'education',icon:'✎',color:'#e8adff',wash:'#9e52ae2b',ar:'التعليم',en:'Education',descAr:'تجارب وأدوات تعليمية تساعد على التعلم بذكاء.',descEn:'Smart learning experiences and education tools.',apps:[]},
{id:'utilities',icon:'▦',color:'#7cebd2',wash:'#287e7930',ar:'الأدوات اليومية',en:'Utilities',descAr:'أدوات رقمية مفيدة لتبسيط المهام اليومية.',descEn:'Useful digital tools for everyday tasks.',apps:[]},
{id:'health',icon:'✚',color:'#ffa7b4',wash:'#963d582b',ar:'الصحة والحياة',en:'Health & Life',descAr:'أفكار وتطبيقات لتنظيم العادات والعناية اليومية.',descEn:'Ideas and apps for healthy everyday routines.',apps:[]}
];
const dict={
ar:{navHome:'الرئيسية',navApps:'التطبيقات',navAbout:'عن المطوّر',navContact:'تواصل معنا',explore:'استكشف التطبيقات',eyebrow:'مرحباً بك في عالم HIJJAWI X',heroLine1:'أفكار مبتكرة.',heroLine2:'عالم من الإمكانيات.',heroDescription:'منصة تجمع الإبداع بالتكنولوجيا؛ تطبيقات إسلامية، هندسية، تعليمية، رياضية وترفيهية صُمّمت لتكون مفيدة وسهلة الوصول.',start:'ابدأ الاستكشاف',meetDeveloper:'تعرّف على المطوّر',metricAvailable:'تطبيقات متاحة',metricCategories:'مجالات متنوعة',metricIdeas:'أفكار للمستقبل',floatingAyah:'آية لك',sceneCaption:'تطبيقات مستقلة، تجتمع في مكان واحد.',featuredLabel:'ابدأ من هنا',featuredTitle:'تطبيقات تستحق التجربة ✳',featuredAside:'متاحة الآن على الويب',available:'متاح الآن',ayahName:'آية لك',ayahDescription:'رسائل للتدبر من القرآن الكريم، حسب الموضوع والحالة الشعورية، مع خيارات المشاركة.',openApp:'فتح التطبيق',fireDescription:'لعبة استراتيجية تفاعلية عبر الإنترنت. العب بمفردك أو تحدَّ أصدقاءك.',playNow:'ابدأ اللعب',discoverLabel:'اكتشف عالمنا',categoriesTitle:'كل شغف، وله مساحته.',categoriesDescription:'اختر المجال الذي يهمك واستعرض التطبيقات الخاصة به. التصنيفات الجديدة تظهر حتى قبل إطلاق تطبيقاتها.',categories:'تصنيفات',allCategories:'كل المجالات',availableNow:'المتاح الآن',inDevelopment:'قيد التطوير',noResultsTitle:'لم نجد ما تبحث عنه',noResultsText:'جرّب كلمة أخرى أو استعرض كل التصنيفات.',missionLabel:'من الفكرة إلى المنتج',missionTitle:'التكنولوجيا عندما تلتقي بالشغف',missionText:'Hijjawi X مساحة لبناء ونشر منتجات رقمية ذات معنى؛ بعضها يخدم المعرفة، وبعضها يدعم التعلم والعمل، وبعضها صُمّم ببساطة ليمنحك تجربة ممتعة.',behindLabel:'الشخص خلف الأفكار',developerTitle:'تعرّف على المطوّر',developerRole:'مهندس كهرباء • بحث وتطوير • منتجات رقمية',developerName:'المهندس ليث حجاوي',developerBio:'مهندس متخصص في أنظمة الطاقة والبطاريات، والبحث والتطوير، وتحويل الأفكار الهندسية إلى حلول تقنية عملية. أعمل على تطوير أدوات وبرمجيات وتطبيقات تجمع بين الفائدة والابتكار والتجربة السلسة.',skill1:'هندسة الطاقة',skill2:'تقنيات البطاريات',skill3:'البحث والتطوير',skill4:'تطوير التطبيقات',contactLabel:'هل لديك فكرة؟',contactTitle:'لنبنِ شيئاً مفيداً معاً.',contactDescription:'للاقتراحات والتعاون والملاحظات حول التطبيقات، يسعدنا تواصلك.',contactButton:'راسل المطوّر',footerTagline:'أفكار مبتكرة. أثر يتجاوز الحدود.',rights:'جميع الحقوق محفوظة.',backToCategories:'العودة للتصنيفات ←',appsCount:n=>n===1?'تطبيق واحد':n+' تطبيقات',soon:'قيد التطوير',emptyTitle:'شيء جديد قيد التحضير!',emptyDesc:'نعمل على أفكار لهذا المجال. تابع المنصة للاطلاع على الإصدارات القادمة.',search:'ابحث عن تطبيق أو مجال...',categoryLabel:'استكشف التصنيف',launch:'فتح التطبيق ↗'},
en:{navHome:'Home',navApps:'Apps',navAbout:'About',navContact:'Contact',explore:'Explore Apps',eyebrow:'WELCOME TO THE WORLD OF HIJJAWI X',heroLine1:'Inspired by ideas.',heroLine2:'Built for possibility.',heroDescription:'Where creativity meets technology. Discover Islamic, engineering, educational, mathematical and entertainment apps designed for real life.',start:'Explore the Apps',meetDeveloper:'Meet the Developer',metricAvailable:'Available Apps',metricCategories:'App Categories',metricIdeas:'Future Ideas',floatingAyah:'Ayah Lak',sceneCaption:'Independent apps. One creative universe.',featuredLabel:'GET STARTED',featuredTitle:'Worth Exploring ✳',featuredAside:'Available on the web',available:'Available now',ayahName:'Ayah Lak',ayahDescription:'Reflect on verses from the Quran by topic and mood, with easy sharing.',openApp:'Open App',fireDescription:'An interactive online strategy game. Play solo or challenge friends.',playNow:'Play Now',discoverLabel:'EXPLORE THE UNIVERSE',categoriesTitle:'Something for every passion.',categoriesDescription:'Choose your field to explore its apps. Future categories are visible even before their first release.',categories:'Categories',allCategories:'All Categories',availableNow:'Available',inDevelopment:'In Development',noResultsTitle:'No results found',noResultsText:'Try a different search or browse every category.',missionLabel:'FROM IDEAS TO PRODUCTS',missionTitle:'Where technology meets passion',missionText:'Hijjawi X builds and shares meaningful digital products: apps for knowledge, learning, practical work and simply having fun.',behindLabel:'BEHIND THE IDEAS',developerTitle:'Meet the Developer',developerRole:'Electrical Engineer • R&D • Digital Products',developerName:'Eng. Laith Hijjawi',developerBio:'An engineer focused on energy systems, batteries, research and development, and turning engineering ideas into practical technology. I develop tools and digital applications with usefulness, innovation and a seamless experience in mind.',skill1:'Power Engineering',skill2:'Battery Technology',skill3:'Research & Development',skill4:'App Development',contactLabel:'HAVE AN IDEA?',contactTitle:"Let's build something useful.",contactDescription:'For suggestions, collaborations and feedback about our apps, get in touch.',contactButton:'Contact the Developer',footerTagline:'Inspired by ideas. Beyond limits.',rights:'All rights reserved.',backToCategories:'← Back to Categories',appsCount:n=>n===1?'1 app':n+' apps',soon:'In development',emptyTitle:'Something new is in the works!',emptyDesc:'We are exploring ideas for this field. Follow this platform for future releases.',search:'Search apps and categories...',categoryLabel:'EXPLORE CATEGORY',launch:'Open App ↗'}};
let lang=(()=>{try{return localStorage.getItem('hx-language')==='en'?'en':'ar'}catch{return 'ar'}})();
let filter='all',query='';
const $=id=>document.getElementById(id);
const t=key=>dict[lang][key];
function updateLang(){
document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';
document.querySelectorAll('[data-i18n]').forEach(el=>{const key=el.dataset.i18n;if(typeof t(key)==='string')el.textContent=t(key)});
$('langToggle').innerHTML=(lang==='ar'?'EN':'عربي')+' <span class="globe">◎</span>';
$('searchInput').placeholder=t('search');
$('searchInput').setAttribute('aria-label',t('search'));
document.title=lang==='ar'?'Hijjawi X | منصة تطبيقات وأفكار مبتكرة':'Hijjawi X | Creative Apps & Ideas';
renderCategories();
}
function renderCategories(){
const items=categories.filter(c=>(filter==='all'||filter==='available'&&c.apps.length||filter==='soon'&&!c.apps.length)&&(!query||[c.ar,c.en,c.descAr,c.descEn,...c.apps.flatMap(a=>[a.nameAr,a.nameEn])].join(' ').toLocaleLowerCase().includes(query)));
$('categoryGrid').replaceChildren();
for(const c of items){
const card=document.createElement('button');card.type='button';card.className='category-card';card.dataset.category=c.id;
card.style.setProperty('--accent',c.color);card.style.setProperty('--wash',c.wash);
const name=lang==='ar'?c.ar:c.en,desc=lang==='ar'?c.descAr:c.descEn;
card.innerHTML='<div class="category-head"><span class="category-icon"></span><span class="category-status '+(c.apps.length?'ready':'')+'"></span></div><h3></h3><p></p><div class="category-bottom"><b></b><span class="arrow">↗</span></div>';
card.querySelector('.category-icon').textContent=c.icon;
card.querySelector('.category-status').textContent=c.apps.length?t('available'):t('soon');
card.querySelector('h3').textContent=name;card.querySelector('p').textContent=desc;
card.querySelector('.category-bottom b').textContent=c.apps.length?t('appsCount')(c.apps.length):t('soon');
card.addEventListener('click',()=>openCategory(c));$('categoryGrid').append(card);
}
$('noResults').hidden=!!items.length;
$('categoryCount').textContent=String(categories.length).padStart(2,'0');
}
function openCategory(c){
const dialog=$('categoryDialog');
dialog.dataset.category=c.id;
dialog.style.setProperty('--accent',c.color);dialog.style.setProperty('--wash',c.wash);
$('dialogEyebrow').textContent=t('categoryLabel');
$('dialogIcon').textContent=c.icon;
$('dialogTitle').textContent=lang==='ar'?c.ar:c.en;
$('dialogDescription').textContent=lang==='ar'?c.descAr:c.descEn;
const apps=$('dialogApps');apps.replaceChildren();
if(!c.apps.length){const box=document.createElement('div');box.className='empty-category';box.innerHTML='<div class="empty-icon">✧</div><h3></h3><p></p>';box.querySelector('h3').textContent=t('emptyTitle');box.querySelector('p').textContent=t('emptyDesc');apps.append(box)}
else for(const a of c.apps){const box=document.createElement('div');box.className='dialog-app-card';const symbol=document.createElement('span');symbol.className='dialog-app-symbol';symbol.textContent=a.icon;const content=document.createElement('div');const h=document.createElement('h3');h.textContent=lang==='ar'?a.nameAr:a.nameEn;const p=document.createElement('p');p.textContent=lang==='ar'?a.descAr:a.descEn;const link=document.createElement('a');link.textContent=t('launch');link.href=a.url;link.target='_blank';link.rel='noopener noreferrer';content.append(h,p,link);box.append(symbol,content);apps.append(box)}
if(!dialog.open)dialog.showModal();
}
$('langToggle').addEventListener('click',()=>{lang=lang==='ar'?'en':'ar';try{localStorage.setItem('hx-language',lang)}catch{}updateLang();if($('categoryDialog').open){const c=categories.find(x=>x.id===$('categoryDialog').dataset.category);if(c)openCategory(c)}});
$('filterRow').addEventListener('click',e=>{const btn=e.target.closest('[data-filter]');if(!btn)return;filter=btn.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('active',b===btn);b.setAttribute('aria-pressed',String(b===btn))});renderCategories()});
$('searchInput').addEventListener('input',e=>{query=e.target.value.trim().toLocaleLowerCase();renderCategories()});
$('closeDialog').addEventListener('click',()=>$('categoryDialog').close());
$('dialogBack').addEventListener('click',()=>$('categoryDialog').close());
$('categoryDialog').addEventListener('click',e=>{if(e.target===$('categoryDialog'))$('categoryDialog').close()});
$('currentYear').textContent=new Date().getFullYear();
updateLang();
})();