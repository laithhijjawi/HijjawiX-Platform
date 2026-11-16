(()=>{'use strict';
const button=document.getElementById('langBtn');
let lang='ar';
try{lang=localStorage.getItem('hx-language')==='en'?'en':'ar'}catch{}
const translations=()=>document.querySelectorAll('[data-ar][data-en]').forEach(node=>node.textContent=node.getAttribute('data-'+lang));
const safeFacebook=url=>{try{const u=new URL(url);return u.protocol==='https:'&&['facebook.com','www.facebook.com','m.facebook.com','web.facebook.com'].includes(u.hostname)}catch{return false}};
const safePhoto=src=>typeof src==='string'&&/^\/hussein-hijjawi-est\/media\/[a-zA-Z0-9_\-/]+\.(?:jpg|jpeg|png|webp)$/i.test(src);
const projects=[];
function appendText(tag,text,parent,className){const node=document.createElement(tag);node.textContent=text||'';if(className)node.className=className;parent.append(node);return node}
function render(){
 document.documentElement.lang=lang;
 document.documentElement.dir=lang==='ar'?'rtl':'ltr';
 document.body.dir=document.documentElement.dir;
 translations();
 button.textContent=lang==='ar'?'English':'العربية';
 document.title=lang==='ar'?'مؤسسة حسين حجاوي | أنظمة التبريد بالرذاذ':'Hussein Hijjawi Est. | Fog & Mist Cooling';
 const grid=document.getElementById('projectGallery'),empty=document.getElementById('galleryEmpty');
 grid.replaceChildren();
 for(const project of projects){
  if(project.status!=='verified'||!safeFacebook(project.sourceUrl)||!Array.isArray(project.images))continue;
  for(const picture of project.images){
   if(!picture||!safePhoto(picture.src))continue;
   const card=document.createElement('article');card.className='gallery-card';
   const img=document.createElement('img');img.className='gallery-photo';img.src=picture.src;img.loading='lazy';img.decoding='async';img.alt=lang==='ar'?(picture.altAr||project.titleAr||'صورة مشروع'):(picture.altEn||project.titleEn||'Project photograph');
   card.append(img);
   const body=document.createElement('div');body.className='gallery-body';
   appendText('h3',lang==='ar'?project.titleAr:project.titleEn,body);
   appendText('p',lang==='ar'?project.descriptionAr:project.descriptionEn,body);
   if(project.date)appendText('div',project.date,body,'gallery-meta');
   const a=document.createElement('a');a.href=project.sourceUrl;a.target='_blank';a.rel='noopener noreferrer';a.className='gallery-origin';
   a.textContent=lang==='ar'?'مشاهدة المنشور الأصلي ↗':'View original Facebook post ↗';body.append(a);card.append(body);grid.append(card);
  }
 }
 empty.hidden=grid.childElementCount>0;
 grid.hidden=grid.childElementCount===0;
}
document.getElementById('year').textContent=new Date().getFullYear();
button.addEventListener('click',()=>{lang=lang==='ar'?'en':'ar';try{localStorage.setItem('hx-language',lang)}catch{}render()});
fetch('/hussein-hijjawi-est/projects.json',{cache:'no-store'}).then(res=>{if(!res.ok)throw Error('Project data unavailable');return res.json()}).then(data=>{if(data&&Array.isArray(data.projects))projects.push(...data.projects);render()}).catch(()=>render());
render();
})();