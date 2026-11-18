/* Makes every public page "live": reads the content saved by the Admin Panel and updates the page instantly. */
(function(){
var D=window.SITE_DEFAULTS,doc=document,IC=window.SITE_ICONS,SI=window.SOCIAL_ICONS;
var $=function(s,r){return(r||doc).querySelector(s)},$$=function(s,r){return[].slice.call((r||doc).querySelectorAll(s))};
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
var live={config:null,projects:null,certs:null,services:null},dbp=null,imgs={};
try{var c0=JSON.parse(localStorage.getItem('cms_cache')||'null');if(c0)live=c0}catch(e){}
function view(){var c=live.config||{},sd=!!c.seeded;
  return{texts:c.texts||{},contact:Object.assign({},D.contact,c.contact||{}),theme:c.theme||D.theme,images:c.images||{},
   projects:sd&&live.projects?live.projects:D.projects,certs:sd&&live.certs?live.certs:D.certs,services:sd&&live.services?live.services:D.services}}
function svg(p,cls){return'<svg viewBox="0 0 24 24" aria-hidden="true"'+(cls||'')+'>'+p+'</svg>'}
function certIcon(t){t=(t||'').toLowerCase();return/job|analytic/.test(t)?IC.data:/work/.test(t)?IC.cloud:/course/.test(t)?IC.table:/learn/.test(t)?IC.globe:/project/.test(t)?IC.web:IC.award}
function img(id,alt){return'<img data-img="'+esc(id)+'" alt="'+esc(alt||'')+'">'}
function getImg(id){if(imgs[id])return imgs[id];return imgs[id]=(dbp||Promise.reject()).then(function(o){return o.f.getDoc(o.f.doc(o.db,'images',id))}).then(function(s){return s.exists()?s.data().data:null}).catch(function(){return null}).then(function(d){if(!d)delete imgs[id];return d})}
function hydrate(root){$$('img[data-img]',root).forEach(function(i){var id=i.dataset.img;if(i.dataset.done===id)return;i.dataset.done=id;
  getImg(id).then(function(src){if(src)i.src=src;else i.remove()})})}
function theme(t){doc.documentElement.setAttribute('data-theme',t);try{localStorage.setItem('cms_theme',t)}catch(e){}}
function set(el,v){if(el&&el.textContent!==v)el.textContent=v}
function render(){
  var v=view();theme(v.theme);window.CMS_EMAIL=v.contact.email;
  D.textMeta.forEach(function(m){var val=v.texts[m.key]!=null?v.texts[m.key]:D.texts[m.key];
    if(m.kind==='number'){var e=$('[data-cms-n="'+m.key+'"]');if(e){e.dataset.n=val;if(e.textContent!=='0')e.textContent=val}}
    else if(m.kind==='list'){var id=m.key==='home_tech'?'cms-tech':'cms-orgs',h=val.split(',').map(function(x){return x.trim()}).filter(Boolean).map(function(x){return'<span>'+esc(x)+'</span>'}).join(''),t=doc.getElementById(id);if(t&&t.dataset.h!==h){t.dataset.h=h;t.innerHTML=h+h}}
    else set($('[data-cms="'+m.key+'"]'),val)});
  // photos
  var pr=$('.hero .pic'),ab=$('.story .pic');
  function photo(box,id){if(!box)return;var d=box.firstElementChild;if(id){if(d.dataset.pid!==id){d.dataset.pid=id;d.innerHTML=img(id,'Abubakar Khoso');box.removeAttribute('aria-label');box.removeAttribute('role');hydrate(d)}}else if(d.dataset.pid){d.dataset.pid='';location.reload()}}
  photo(pr,v.images.profile);photo(ab,v.images.about||v.images.profile);
  // contact + socials
  var ct=v.contact,digits=(ct.whatsapp||'').replace(/\D/g,'');
  var links=[];if(ct.github)links.push(['github',ct.github,'GitHub']);if(ct.linkedin)links.push(['linkedin',ct.linkedin,'LinkedIn']);
  (ct.others||[]).forEach(function(o){if(o.url)links.push([o.type||'other',o.url,(o.type||'Link')])});
  if(digits)links.push(['whatsapp','https://wa.me/'+digits,'WhatsApp']);
  if(ct.email)links.push(['email','mailto:'+ct.email,'Email']);
  var lh=links.map(function(l){var ext=l[1].indexOf('mailto:')!==0;return'<a href="'+esc(l[1])+'"'+(ext?' target="_blank" rel="noopener"':'')+' aria-label="'+esc(l[2])+'"><svg viewBox="0 0 24 24">'+'<path d="'+(SI[l[0]]||SI.other)+'"/></svg></a>'}).join('');
  $$('.soc').forEach(function(b){b.innerHTML=lh});
  $$('.sl').forEach(function(b){var sp=b.firstElementChild;b.innerHTML=sp.outerHTML+lh});
  var mr=$('#mailrow');if(mr){mr.href='mailto:'+ct.email;set($('#mailtxt'),ct.email);var ok=$('#okmail');if(ok){ok.href='mailto:'+ct.email;ok.textContent=ct.email}}
  var wt=$('#watxt');if(wt){var wr=$('#warow');set(wt,ct.whatsapp||'Available on request');if(wr&&digits){if(wr.tagName!=='A'){var a=doc.createElement('a');a.className=wr.className;a.id='warow';a.innerHTML=wr.innerHTML;wr.replaceWith(a);wr=a}wr.href='https://wa.me/'+digits;wr.target='_blank';wr.rel='noopener'}}
  // services
  var sv=$('#cms-services');if(sv){sv.innerHTML=v.services.slice(0,4).map(function(s){return'<article style="animation:fu .6s both"><div class="ico">'+svg(IC[s.icon]||IC.web)+'</div><h3>'+esc(s.title)+'</h3><p>'+esc(s.desc)+'</p></article>'}).join('')}
  var sp=$('#cms-svcpage');if(sp){sp.innerHTML=v.services.map(function(s){var pr=s.priceMode==='from'&&s.price?'Starting at <b>'+esc(s.price)+'</b>':'<b>Contact for a quote</b>';
    return'<article class="sv rv in"><div class="ico">'+svg(IC[s.icon]||IC.web)+'</div><h2>'+esc(s.title)+'</h2><p>'+esc(s.desc)+'</p><div class="chips">'+(s.tags||[]).map(function(t){return'<span>'+esc(t)+'</span>'}).join('')+'</div><p class="price">'+pr+'</p><a href="contact.html" class="btn btn-main" aria-label="Get a quote for '+esc(s.title)+'">Get a quote</a></article>'}).join('')}
  // featured work
  var fw=$('#cms-featured');if(fw){var fl=v.projects.filter(function(p){return p.featured});if(!fl.length)fl=v.projects.slice(0,5);
    fw.innerHTML=fl.slice(0,6).map(function(p,n){var cov=p.shots&&p.shots[0];var tg=(p.tags&&p.tags.length?p.tags:[]).slice(0,2).map(function(t){return'<span>'+esc(t)+'</span>'}).join('');
      return'<a href="portfolio.html" class="pj" style="animation:fu .6s both"><i class="g'+(n%5+1)+'">'+(cov?img(cov,p.title):'')+'</i><span class="tg">'+tg+'</span><figcaption><h3>'+esc(p.title)+'</h3><p>'+esc(p.short)+'</p></figcaption></a>'}).join('')}
  // certifications
  var tk=$('#track');if(tk){tk.innerHTML=v.certs.map(function(c){return'<article class="cc"><div class="ci">'+svg(certIcon(c.type))+'</div><span class="ty">'+esc(c.type||'Certification')+'</span><h3>'+esc(c.name)+'</h3><p>'+esc(c.issuer)+(c.year?' · '+esc(c.year):'')+'</p></article>'}).join('');window.dispatchEvent(new Event('cms:certs'))}
  var ac=$('#cms-achv');if(ac){ac.innerHTML=v.certs.map(function(c){return'<li class="rv in"><article class="ac"><div class="top"><div class="ai">'+svg(certIcon(c.type))+'</div><div><div class="meta"><span>'+esc(c.type||'Certification')+'</span>'+(c.year?'<span>'+esc(c.year)+'</span>':'')+'</div><h2>'+esc(c.name)+'</h2></div></div>'+(c.issuer?'<p class="by">Issued by <b>'+esc(c.issuer)+'</b></p>':'')+(c.credId?'<p class="by">Credential ID: <b>'+esc(c.credId)+'</b></p>':'')+(c.why?'<p class="why">'+esc(c.why)+'</p>':'')+'</article></li>'}).join('')}
  if(window.onCmsProjects)window.onCmsProjects(v.projects);
  hydrate(doc);
}
var raf;function changed(){try{localStorage.setItem('cms_cache',JSON.stringify(live))}catch(e){}cancelAnimationFrame(raf);raf=requestAnimationFrame(render)}
window.CMS={hydrate:hydrate,render:render};
var ok=window.fbConfigured&&fbConfigured();if(ok)dbp=fbInit(false);
render();
if(ok){
  dbp.then(function(o){var f=o.f,db=o.db;
    f.onSnapshot(f.doc(db,'site','config'),function(s){live.config=s.exists()?s.data():null;changed()});
    ['projects','certs','services'].forEach(function(n){f.onSnapshot(f.query(f.collection(db,n),f.orderBy('order')),function(s){live[n]=s.docs.map(function(d){return Object.assign({id:d.id},d.data())});changed()})})
  }).catch(function(){});
}
})();
