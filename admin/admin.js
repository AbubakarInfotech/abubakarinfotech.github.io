(function(){
var D=SITE_DEFAULTS,IC=SITE_ICONS,$=function(s,r){return(r||document).querySelector(s)},$$=function(s,r){return[].slice.call((r||document).querySelectorAll(s))};
var FB,db,f,auth,S={config:{},projects:[],certs:[],services:[],skills:[],education:[]},ST={view:'dash',pageTab:'home',edit:null},cache={},loginPass='';
var THEMES=[['slate','Slate Purple','Purple and cyan on dark charcoal (current)',['#121316','#8B5CF6','#22D3EE']],['midnight','Midnight Blue','Blue and sky on deep navy',['#0A1020','#3B82F6','#38BDF8']],['orange','Charcoal Orange','Orange and amber on charcoal',['#141414','#F97316','#FBBF24']],['emerald','Emerald Dark','Emerald and teal on dark green',['#0B1512','#10B981','#2DD4BF']]];
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function toast(m,bad){var t=$('#toast');t.textContent=m;t.className=bad?'bad':'';t.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(function(){t.style.display='none'},bad?6000:2800)}
function fail(e){console.error(e);toast(/permission|insufficient/i.test(e.message||e.code)?'Not allowed. Make sure you are signed in and the security rules from the setup guide are published.':'Something went wrong: '+(e.message||e),true)}
function show(id){$('#login').hidden=id!=='login';$('#force').hidden=id!=='force';$('#app').classList.toggle('on',id==='app')}
function theme(t){document.documentElement.setAttribute('data-theme',t);try{localStorage.setItem('cms_theme',t)}catch(e){}}
function tl(s){return String(s||'').split(',').map(function(x){return x.trim()}).filter(Boolean)}
function Fl(l,i,h){return'<label class="f"><span>'+l+'</span>'+i+(h?'<small>'+h+'</small>':'')+'</label>'}
function inp(id,v,type,ph){return'<input id="'+id+'" type="'+(type||'text')+'" value="'+esc(v)+'"'+(ph?' placeholder="'+esc(ph)+'"':'')+'>'}
function ref(c,id){return f.doc(db,c,id)}
function eff(k){var t=S.config.texts||{};return t[k]!=null?t[k]:D.texts[k]}
/* ---------- images ---------- */
function getImg(id){if(cache[id])return cache[id];return cache[id]=f.getDoc(ref('images',id)).then(function(s){return s.exists()?s.data().data:null}).catch(function(){return null})}
function hydrate(r){$$('img[data-img]',r).forEach(function(i){getImg(i.dataset.img).then(function(s){if(s)i.src=s})})}
function im(id){return id?'<img data-img="'+esc(id)+'" alt="">':''}
function readImg(file,max){return new Promise(function(res,rej){if(!/^image\//.test(file.type))return rej(new Error('That file is not a picture.'));var r=new FileReader();r.onload=function(){var i=new Image();i.onload=function(){var s=Math.min(1,max/Math.max(i.width,i.height)),w=Math.round(i.width*s),h=Math.round(i.height*s),c=document.createElement('canvas');c.width=w;c.height=h;var x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,w,h);x.drawImage(i,0,0,w,h);var q=.88,d;do{d=c.toDataURL('image/jpeg',q);q-=.08}while(d.length>880000&&q>.3);d.length>950000?rej(new Error('That picture is too large even after shrinking.')):res({data:d,w:w,h:h})};i.onerror=function(){rej(new Error('That file is not a picture.'))};i.src=r.result};r.readAsDataURL(file)})}
function upload(file,max){return readImg(file,max||1600).then(function(o){return f.addDoc(f.collection(db,'images'),{data:o.data,w:o.w,h:o.h,at:Date.now()}).then(function(d){cache[d.id]=Promise.resolve(o.data);return d.id})})}
function delImg(id){if(id)f.deleteDoc(ref('images',id)).catch(function(){})}
function pick(multi){return new Promise(function(res){var i=document.createElement('input');i.type='file';i.accept='image/*';i.multiple=!!multi;i.onchange=function(){res([].slice.call(i.files))};i.click()})}
async function saveCfg(p){await f.setDoc(ref('site','config'),p,{merge:true})}
/* ---------- boot ---------- */
async function boot(){
  if(!fbConfigured()){$('#lerr').textContent='Firebase is not connected yet. Follow Step 5 of the setup guide (paste your Firebase details into assets/firebase-config.js).';$('#lb').disabled=true;return}
  try{FB=await fbInit(true)}catch(e){$('#lerr').textContent='Could not reach Firebase. Check your internet connection.';return}
  f=FB.f;db=FB.db;auth=FB.auth;
  f.onAuthStateChanged(auth,function(u){if(u)gate(u);else show('login')});
}
async function gate(u){
  try{var st=await f.getDoc(ref('admin','state'));
    if(!st.exists()||!st.data().passwordChanged){show('force');return}
    await start()}
  catch(e){await f.signOut(auth);show('login');$('#lerr').textContent='This account is not allowed to use the Admin Panel, or the security rules are not published yet (Step 4 of the guide).'}
}
async function start(){
  var c=await f.getDoc(ref('site','config'));
  if(!c.exists()){toast('First-time setup: loading your current website content…');await seed()}
  await loadAll();theme(S.config.theme||'slate');show('app');go(ST.view)
}
async function seed(){
  var b=f.writeBatch(db);b.set(ref('site','config'),{texts:{},contact:D.contact,theme:D.theme,images:{},seeded:true});
  ['projects','certs','services'].forEach(function(n){D[n].forEach(function(x){var o=Object.assign({},x);delete o.id;b.set(ref(n,x.id),o)})});await b.commit()
}
async function loadAll(){
  var c=await f.getDoc(ref('site','config'));S.config=c.exists()?c.data():{};
  for(var n of['projects','certs','services']){var q=await f.getDocs(f.query(f.collection(db,n),f.orderBy('order')));S[n]=q.docs.map(function(d){return Object.assign({id:d.id},d.data())})}
  for(var n2 of['skills','education']){try{var q2=await f.getDocs(f.query(f.collection(db,n2),f.orderBy('order')));S[n2]=q2.docs.map(function(d){return Object.assign({id:d.id},d.data())})}catch(e){S[n2]=[]}}
}
/* ---------- login / password ---------- */
$('#lf').onsubmit=async function(e){e.preventDefault();$('#lerr').textContent='';var b=$('#lb');b.disabled=true;
  try{loginPass=$('#lp').value;await f.signInWithEmailAndPassword(auth,$('#le').value.trim(),loginPass)}
  catch(x){$('#lerr').textContent=/too-many/.test(x.code)?'Too many attempts. Please wait a few minutes and try again.':'Wrong email or password.'}b.disabled=false};
$('#forgot').onclick=async function(){var m=$('#le').value.trim();if(!m){$('#lerr').textContent='Type your email above first, then press "Forgot password?".';return}
  try{await f.sendPasswordResetEmail(auth,m)}catch(e){}$('#lerr').textContent='If that email belongs to the admin account, a reset link has been sent.'};
$('#fout').onclick=function(){f.signOut(auth)};
function pwOk(p){return p.length>=10&&/[A-Za-z]/.test(p)&&/\d/.test(p)}
$('#ff').onsubmit=async function(e){e.preventDefault();var a=$('#fp1').value,b=$('#fp2').value,er=$('#ferr');er.textContent='';
  if(!pwOk(a)){er.textContent='Use at least 10 characters, with both letters and numbers.';return}
  if(a!==b){er.textContent='The two passwords do not match.';return}
  if(a===loginPass){er.textContent='Your new password must be different from the temporary one.';return}
  try{await f.updatePassword(auth.currentUser,a);await f.setDoc(ref('admin','state'),{passwordChanged:true,at:Date.now()});loginPass='';$('#ff').reset();await start();toast('Password changed. Welcome!')}
  catch(x){er.textContent=x.code==='auth/requires-recent-login'?'Please sign out, sign in again, and retry.':'Could not change the password: '+(x.message||x)}};
/* ---------- navigation ---------- */
$('#nav').onclick=function(e){var b=e.target.closest('button');if(b){ST.edit=null;go(b.dataset.v);$('#side').classList.remove('open')}};
$('#burger').onclick=function(){$('#side').classList.toggle('open')};
var V={dash:vDash,pages:vPages,projects:vProjects,certs:vCerts,services:vServices,skills:vSkills,education:vEdu,contact:vContact,images:vImages,themes:vThemes,account:vAccount};
function go(v){ST.view=v;ST.others=null;$$('#nav button').forEach(function(b){b.classList.toggle('on',b.dataset.v===v)});$('#main').innerHTML=V[v]();hydrate($('#main'));scrollTo(0,0)}
function rerender(){var y=scrollY;$('#main').innerHTML=V[ST.view]();hydrate($('#main'));scrollTo(0,y)}
$('#main').addEventListener('click',function(e){var b=e.target.closest('[data-act]');if(!b)return;var fn=ACT[b.dataset.act];if(fn){Promise.resolve(fn(b.dataset.id,b,e)).catch(fail)}});
function btn(act,label,cls,id){return'<button class="btn '+(cls||'')+'" data-act="'+act+'"'+(id!=null?' data-id="'+esc(id)+'"':'')+'>'+label+'</button>'}
var ACT={};
/* ---------- dashboard ---------- */
function vDash(){
  var t=function(v,n,l){return'<div class="card tile" data-act="goto" data-id="'+v+'"><b>'+n+'</b>'+l+'</div>'};
  return'<h1>Dashboard</h1><p class="muted">Everything you save here goes live on your website immediately. Pick a section:</p><div class="grid3" style="margin-top:1rem">'+
   t('pages',Object.keys(D.pageLabels).length,'Pages — edit the text on every page')+t('projects',S.projects.length,'Projects — add, edit, remove')+t('certs',S.certs.length,'Certifications &amp; achievements')+t('services',S.services.length,'Services &amp; prices')+t('skills',S.skills.length,'Skills — cards on the Skills page')+t('education',S.education.length,'Education — degree, inter, matric')+
   t('contact','@','Contact &amp; social links')+t('images','🖼','Images — photo and screenshots')+t('themes','🎨','Themes — 4 colour styles')+t('account','🔒','Account / password')+'</div>'+
   '<div class="note">Current theme: <b>'+esc((THEMES.filter(function(x){return x[0]===(S.config.theme||'slate')})[0]||THEMES[0])[1])+'</b> · Signed in as <b>'+esc(auth.currentUser.email)+'</b></div>'}
ACT.goto=function(id){go(id)};
/* ---------- pages ---------- */
function vPages(){
  var tab=ST.pageTab,tabs=Object.keys(D.pageLabels).map(function(k){return'<button class="'+(k===tab?'on':'')+'" data-act="ptab" data-id="'+k+'">'+D.pageLabels[k]+'</button>'}).join('');
  var groups={},order=[];D.textMeta.filter(function(m){return m.page===tab}).forEach(function(m){if(!groups[m.group]){groups[m.group]=[];order.push(m.group)}groups[m.group].push(m)});
  var h='<h1>Pages</h1><p class="muted">Edit the words on each page. Press <b>Save</b> at the bottom of the tab.</p><div class="tabs">'+tabs+'</div>';
  var lk={home:'Services shown on Home → <a href="#" data-act="goto" data-id="services">Services</a> · Featured work → <a href="#" data-act="goto" data-id="projects">Projects</a> · Certifications → <a href="#" data-act="goto" data-id="certs">Certifications</a> · Photo → <a href="#" data-act="goto" data-id="images">Images</a>',portfolio:'The project cards come from <a href="#" data-act="goto" data-id="projects">Projects</a>.',achievements:'The entries come from <a href="#" data-act="goto" data-id="certs">Certifications</a>.',services:'The service cards come from <a href="#" data-act="goto" data-id="services">Services</a>.',contact:'Email, WhatsApp and social links are in <a href="#" data-act="goto" data-id="contact">Contact &amp; Social Links</a>.',about:'Your photo is in <a href="#" data-act="goto" data-id="images">Images</a>.'};
  h+='<div class="note">'+lk[tab]+'</div>';
  order.forEach(function(g){h+='<div class="grp2">'+esc(g)+'</div><div class="card">'+groups[g].map(function(m){var v=eff(m.key),c=m.kind==='long'?'<textarea data-k="'+m.key+'">'+esc(v)+'</textarea>':'<input data-k="'+m.key+'" type="'+(m.kind==='number'?'number':'text')+'" value="'+esc(v)+'">';
    return'<div class="f"><span>'+esc(m.label)+'</span><div class="field">'+c+'<button class="btn sm" title="Put back the original text" data-act="rst" data-id="'+m.key+'">↺</button></div></div>'}).join('')+'</div>'});
  return h+'<div class="row">'+btn('savepage','Save '+D.pageLabels[tab]+' page','pri')+'</div>'}
ACT.ptab=function(id){ST.pageTab=id;rerender()};
ACT.rst=function(k){var e=$('[data-k="'+k+'"]');e.value=D.texts[k]};
ACT.savepage=async function(){var m={};$$('[data-k]').forEach(function(e){var k=e.dataset.k,v=e.value;m[k]=v===D.texts[k]?f.deleteField():v});
  await saveCfg({texts:m});S.config.texts=S.config.texts||{};Object.keys(m).forEach(function(k){var v=$('[data-k="'+k+'"]').value;if(v===D.texts[k])delete S.config.texts[k];else S.config.texts[k]=v});toast('Saved. The website is updated.')};
/* ---------- generic list helpers ---------- */
function maxOrder(n){return S[n].reduce(function(a,x){return Math.max(a,x.order||0)},0)+1}
async function move(n,id,d){var a=S[n],i=a.findIndex(function(x){return x.id===id}),j=i+d;if(j<0||j>=a.length)return;var A=a[i],B=a[j],o=A.order;
  var b=f.writeBatch(db);b.update(ref(n,A.id),{order:B.order});b.update(ref(n,B.id),{order:o});await b.commit();A.order=B.order;B.order=o;a.sort(function(x,y){return x.order-y.order});rerender()}
function strip(o){var c=Object.assign({},o);delete c.id;return c}
async function del(n,id){var x=S[n].find(function(z){return z.id===id});if(!confirm('Delete "'+(x.title||x.name)+'"? This cannot be undone.'))return;
  await f.deleteDoc(ref(n,id));(x.shots||[]).forEach(delImg);S[n]=S[n].filter(function(z){return z.id!==id});rerender();toast('Deleted.')}
ACT.up=function(id,b){return move(b.dataset.col,id,-1)};ACT.down=function(id,b){return move(b.dataset.col,id,1)};ACT.del=function(id,b){return del(b.dataset.col,id)};
function ctl(col,id){return btn('up','↑','sm',id).replace('<button','<button data-col="'+col+'" title="Move up"')+btn('down','↓','sm',id).replace('<button','<button data-col="'+col+'" title="Move down"')+btn('edit','Edit','sm',id).replace('<button','<button data-col="'+col+'"')+btn('del','Delete','sm dan',id).replace('<button','<button data-col="'+col+'"')}
ACT.edit=function(id,b){var col=b.dataset.col;ST.edit={col:col,data:JSON.parse(JSON.stringify(S[col].find(function(x){return x.id===id}))),orig:(S[col].find(function(x){return x.id===id}).shots||[]).slice(),added:[]};rerender()};
ACT.add=function(id,b){var col=b.dataset.col,t={projects:{title:'',short:'',long:'',tags:[],cats:['android'],repo:'',status:'done',shots:[],featured:true},certs:{name:'',issuer:'',year:String(new Date().getFullYear()),credId:'',type:'Online course',why:''},services:{title:'',desc:'',tags:[],icon:'web',priceMode:'quote',price:''},skills:{name:'',desc:'',pct:70,icon:'',color:'#ff6a1f'},education:{title:'',place:'',period:'',details:'',kind:'other'}}[col];ST.edit={col:col,data:t,orig:[],added:[]};rerender()};
ACT.cancel=function(){(ST.edit.added||[]).forEach(delImg);ST.edit=null;rerender()};
function grab(){var e=ST.edit,d=e.data,g=function(i){var x=$('#'+i);return x?x.value.trim():''};
  if(e.col==='projects'){d.title=g('f_title');d.short=g('f_short');d.long=g('f_long');d.tags=tl(g('f_tags'));d.repo=g('f_repo');d.status=g('f_status');d.featured=$('#f_feat').checked;d.cats=$$('.cat:checked').map(function(x){return x.value})}
  if(e.col==='certs'){d.name=g('f_name');d.issuer=g('f_issuer');d.year=g('f_year');d.credId=g('f_cid');d.type=g('f_type');d.why=g('f_why')}
  if(e.col==='services'){d.title=g('f_title');d.desc=g('f_desc');d.tags=tl(g('f_tags'));d.icon=g('f_icon');d.priceMode=($('[name=pm]:checked')||{}).value||'quote';d.price=g('f_price')}
  if(e.col==='skills'){d.name=g('f_name');d.desc=g('f_desc');d.pct=g('f_pct')===''?'':Math.max(0,Math.min(100,+g('f_pct')||0));d.icon=g('f_icon');d.color=g('f_color')||'#ff6a1f'}
  if(e.col==='education'){d.title=g('f_title');d.place=g('f_place');d.period=g('f_period');d.details=g('f_details');d.kind=g('f_kind')}}
ACT.save=async function(){grab();var e=ST.edit,d=e.data,col=e.col;
  if(!(d.title||d.name)){toast('Please fill in the title/name first.',true);return}
  if(col==='projects'&&!d.cats.length){toast('Pick at least one category.',true);return}
  if(col==='services'&&d.priceMode==='from'&&!d.price){toast('Type the starting price, or choose "Contact for a quote".',true);return}
  if(d.repo&&!/^https?:\/\//.test(d.repo)){toast('The GitHub link must start with https://',true);return}
  var id=d.id;if(!id){id=f.doc(f.collection(db,col)).id;d.id=id;d.order=maxOrder(col)}
  await f.setDoc(ref(col,id),strip(d));
  (e.orig||[]).filter(function(x){return(d.shots||[]).indexOf(x)<0}).forEach(delImg);
  var i=S[col].findIndex(function(x){return x.id===id});if(i<0)S[col].push(d);else S[col][i]=d;S[col].sort(function(a,b){return a.order-b.order});ST.edit=null;rerender();toast('Saved. The website is updated.')};
/* ---------- projects ---------- */
function vProjects(){var e=ST.edit;if(e&&e.col==='projects')return pEditor();
  return'<div class="row"><h1 class="sp">Projects</h1>'+btn('add','+ Add project','pri').replace('<button','<button data-col="projects"')+'</div><p class="muted">These appear on the Portfolio page, and the ones ticked "Show on Home page" appear in Featured work.</p>'+
  (S.projects.length?S.projects.map(function(p){var cn={android:'Android Apps',ai:'AI Tools',web:'Web Projects'};
   return'<div class="item"><div class="th">'+im((p.shots||[])[0])+'</div><div class="tx"><b>'+esc(p.title)+'</b>'+(p.cats||[]).map(function(c){return'<span class="pill">'+cn[c]+'</span>'}).join('')+'<span class="muted">'+({done:'Completed',wip:'In progress',private:'Private'}[p.status]||'')+(p.featured?' · On Home':'')+'</span></div><div class="row">'+ctl('projects',p.id)+'</div></div>'}).join(''):'<div class="card muted">No projects yet. Press “Add project”.</div>')}
function pEditor(){var d=ST.edit.data,c=function(v,l){return'<label><input type="checkbox" class="cat" value="'+v+'"'+((d.cats||[]).indexOf(v)>-1?' checked':'')+'> '+l+'</label>'};
  return'<h1>'+(d.id?'Edit project':'New project')+'</h1><div class="card">'+Fl('Project title',inp('f_title',d.title))+Fl('Short description','<input id="f_short" value="'+esc(d.short)+'">','Shown on the project card.')+Fl('Full description','<textarea id="f_long">'+esc(d.long)+'</textarea>','Shown when a visitor opens the project.')+
  Fl('Technology tags',inp('f_tags',(d.tags||[]).join(', ')),'Separate with commas, for example: Kotlin, Android, Gemini API')+'<div class="f"><span>Category</span><div class="chk">'+c('android','Android Apps')+c('ai','AI Tools')+c('web','Web Projects')+'</div></div>'+
  Fl('GitHub link (optional)',inp('f_repo',d.repo,'url','https://github.com/AbubakarInfotech/…'))+Fl('Status','<select id="f_status">'+[['done','Completed'],['wip','In progress'],['private','Private repository']].map(function(o){return'<option value="'+o[0]+'"'+(d.status===o[0]?' selected':'')+'>'+o[1]+'</option>'}).join('')+'</select>')+
  '<div class="chk"><label><input type="checkbox" id="f_feat"'+(d.featured?' checked':'')+'> Show on Home page (Featured work)</label></div>'+
  '<div class="f"><span>Screenshots</span><div class="shots">'+(d.shots||[]).map(function(s,i){return'<div class="shot"><div class="im">'+im(s)+'</div><div class="bar">'+(i?btn('cover','Make cover','sm',i):'<span class="pill">Cover</span>')+btn('rmshot','Remove','sm dan',i)+'</div></div>'}).join('')+'</div>'+btn('addshot','+ Add screenshots','sm')+'<small>The first picture is the cover image on cards. Pictures are shrunk automatically.</small></div></div>'+
  '<div class="row">'+btn('save','Save project','pri')+btn('cancel','Cancel')+'</div>'}
ACT.addshot=async function(){grab();var fs=await pick(true),e=ST.edit;if(!fs.length)return;toast('Uploading…');for(var x of fs){try{var id=await upload(x,1600);e.data.shots.push(id);e.added.push(id)}catch(er){fail(er)}}rerender();toast('Uploaded. Press Save project to publish.')};
ACT.rmshot=function(i){grab();var e=ST.edit,id=e.data.shots.splice(+i,1)[0];if(e.added.indexOf(id)>-1){delImg(id);e.added=e.added.filter(function(x){return x!==id})}rerender()};
ACT.cover=function(i){grab();var s=ST.edit.data.shots;s.unshift(s.splice(+i,1)[0]);rerender()};
/* ---------- certifications ---------- */
function vCerts(){var e=ST.edit;if(e&&e.col==='certs'){var d=e.data;return'<h1>'+(d.id?'Edit entry':'New certification / achievement')+'</h1><div class="card">'+Fl('Name',inp('f_name',d.name))+Fl('Issuer (who gave it)',inp('f_issuer',d.issuer))+'<div class="row"><div class="sp">'+Fl('Year',inp('f_year',d.year))+'</div><div class="sp">'+Fl('Credential ID (optional)',inp('f_cid',d.credId))+'</div></div>'+
  Fl('Type','<input id="f_type" list="types" value="'+esc(d.type)+'"><datalist id="types"><option>Online course</option><option>Workshop</option><option>Job simulation</option><option>E-learning</option><option>Certification</option><option>Award</option><option>Projects</option></datalist>')+Fl('Why it matters (one short line)','<textarea id="f_why" style="min-height:70px">'+esc(d.why)+'</textarea>')+'</div><div class="row">'+btn('save','Save','pri')+btn('cancel','Cancel')+'</div>'}
  return'<div class="row"><h1 class="sp">Certifications &amp; Achievements</h1>'+btn('add','+ Add new','pri').replace('<button','<button data-col="certs"')+'</div>'+
   (S.certs.length?S.certs.map(function(c){return'<div class="item"><div class="tx"><b>'+esc(c.name)+'</b><span class="pill">'+esc(c.type)+'</span><span class="muted">'+esc(c.issuer)+(c.year?' · '+esc(c.year):'')+(c.credId?' · ID '+esc(c.credId):'')+'</span></div><div class="row">'+ctl('certs',c.id)+'</div></div>'}).join(''):'<div class="card muted">Nothing here yet.</div>')}
/* ---------- services ---------- */
function vServices(){var e=ST.edit;if(e&&e.col==='services'){var d=e.data;return'<h1>'+(d.id?'Edit service':'New service')+'</h1><div class="card">'+Fl('Service name',inp('f_title',d.title))+Fl('Description','<textarea id="f_desc">'+esc(d.desc)+'</textarea>')+Fl('Tags',inp('f_tags',(d.tags||[]).join(', ')),'Separate with commas.')+
  Fl('Icon','<select id="f_icon">'+[['android','Phone / Android'],['ai','AI sparkle'],['web','Code'],['data','Charts / data'],['cloud','Cloud'],['design','Design'],['globe','Globe'],['award','Award']].map(function(o){return'<option value="'+o[0]+'"'+(d.icon===o[0]?' selected':'')+'>'+o[1]+'</option>'}).join('')+'</select>')+
  '<div class="f"><span>Price</span><div class="chk"><label><input type="radio" name="pm" value="quote"'+(d.priceMode!=='from'?' checked':'')+'> Contact for a quote</label><label><input type="radio" name="pm" value="from"'+(d.priceMode==='from'?' checked':'')+'> Starting price</label></div>'+inp('f_price',d.price,'text','For example PKR 15,000 or $50')+'<small>Only used when “Starting price” is selected. Include the currency.</small></div></div><div class="row">'+btn('save','Save service','pri')+btn('cancel','Cancel')+'</div>'}
  return'<div class="row"><h1 class="sp">Services</h1>'+btn('add','+ Add service','pri').replace('<button','<button data-col="services"')+'</div><p class="muted">The first four also appear on the Home page.</p>'+
   (S.services.length?S.services.map(function(s){return'<div class="item"><div class="tx"><b>'+esc(s.title)+'</b><span class="muted">'+(s.priceMode==='from'&&s.price?'Starting at '+esc(s.price):'Contact for a quote')+'</span></div><div class="row">'+ctl('services',s.id)+'</div></div>'}).join(''):'<div class="card muted">No services yet.</div>')}
/* ---------- skills & education ---------- */
var SK_DEF=[['Py','Python','Programming language',78,'#FFD43B'],['Dj','Django','Backend framework',72,'#44B78B'],['5','HTML','Web structure',82,'#FF6A1F'],['✳','CSS','Web styling',78,'#2F7BFF'],['▤','MySQL','Database',68,'#4DA3FF'],['⌘','Git','Version control',65,'#FF7A59'],['◈','GitHub','Code hosting',70,'#C9B8FF'],['✦','Currently learning','Deeper Python fundamentals, Django concepts, debugging and writing code with confidence.','','#FF6A1F']].map(function(r){return{icon:r[0],name:r[1],desc:r[2],pct:r[3],color:r[4]}});
var ED_DEF=[{title:'BS Information Technology',place:'University of Sindh, Jamshoro',period:'Final Year',details:'Python, Django, Web Development, MySQL',kind:'degree'}];
async function seedCol(col){var list=col==='skills'?SK_DEF:ED_DEF,b=f.writeBatch(db);
  list.forEach(function(x,i){var o=Object.assign({},x,{order:i+1}),id=f.doc(f.collection(db,col)).id;b.set(ref(col,id),o);S[col].push(Object.assign({id:id},o))});
  await b.commit();rerender();toast('Starter list loaded. You can now edit it.')}
ACT.seed=function(col){return seedCol(col)};
function vSkills(){var e=ST.edit;if(e&&e.col==='skills'){var d=e.data;
  return'<h1>'+(d.id?'Edit skill':'New skill')+'</h1><div class="card">'+Fl('Skill name',inp('f_name',d.name))+Fl('Short description',inp('f_desc',d.desc))+
  '<div class="row"><div class="sp">'+Fl('Icon text',inp('f_icon',d.icon),'1–2 letters or a symbol, for example Py')+'</div><div class="sp">'+Fl('Level bar (%)',inp('f_pct',d.pct,'number'),'0 to 100. Leave empty for a note card with no bar.')+'</div></div>'+
  Fl('Colour','<input id="f_color" type="color" value="'+esc(/^#[0-9a-f]{6}$/i.test(d.color)?d.color:'#ff6a1f')+'">')+'</div><div class="row">'+btn('save','Save skill','pri')+btn('cancel','Cancel')+'</div>'}
  return'<div class="row"><h1 class="sp">Skills</h1>'+btn('add','+ Add skill','pri').replace('<button','<button data-col="skills"')+'</div><p class="muted">These cards appear on the Skills page, in this order.</p>'+
   (S.skills.length?S.skills.map(function(s){return'<div class="item"><div class="tx"><b>'+esc(s.name)+'</b><span class="muted">'+esc(s.desc)+(s.pct!==''&&s.pct!=null?' · '+esc(s.pct)+'%':'')+'</span></div><div class="row">'+ctl('skills',s.id)+'</div></div>'}).join(''):'<div class="card"><p class="muted">No skills saved yet, so the Skills page shows its built-in list.</p>'+btn('seed','Load starter list (Python, Django, HTML…)','pri','skills')+'</div>')}
function vEdu(){var e=ST.edit;if(e&&e.col==='education'){var d=e.data;
  return'<h1>'+(d.id?'Edit education':'New education entry')+'</h1><div class="card">'+Fl('Title',inp('f_title',d.title),'For example: BS Information Technology, Intermediate (HSC), Matriculation (SSC)')+Fl('School / college / university',inp('f_place',d.place))+Fl('Year or period',inp('f_period',d.period),'For example: 2018–2020, or Final Year')+
  Fl('Board, grade or details (optional)','<textarea id="f_details" style="min-height:70px">'+esc(d.details)+'</textarea>','For a degree: separate subjects with commas, they show as small tags.')+
  Fl('Style','<select id="f_kind"><option value="degree"'+(d.kind==='degree'?' selected':'')+'>Main degree (big card)</option><option value="other"'+(d.kind!=='degree'?' selected':'')+'>Normal (timeline card)</option></select>')+'</div><div class="row">'+btn('save','Save','pri')+btn('cancel','Cancel')+'</div>'}
  return'<div class="row"><h1 class="sp">Education</h1>'+btn('add','+ Add education','pri').replace('<button','<button data-col="education"')+'</div><p class="muted">Your degree, Intermediate and Matric. They appear on the Education page.</p>'+
   (S.education.length?S.education.map(function(s){return'<div class="item"><div class="tx"><b>'+esc(s.title)+'</b><span class="muted">'+esc(s.place)+(s.period?' · '+esc(s.period):'')+'</span></div><div class="row">'+ctl('education',s.id)+'</div></div>'}).join(''):'<div class="card"><p class="muted">Nothing saved yet, so the Education page shows its built-in text.</p>'+btn('seed','Load my degree (BS IT)','pri','education')+'</div>')}
/* ---------- contact ---------- */
var OT=[['instagram','Instagram'],['x','X / Twitter'],['youtube','YouTube'],['facebook','Facebook'],['other','Other link']];
function ctRows(){var o=ST.others;return o.map(function(x,i){return'<div class="field" style="margin-bottom:.5rem"><select class="ot" style="max-width:160px">'+OT.map(function(t){return'<option value="'+t[0]+'"'+(x.type===t[0]?' selected':'')+'>'+t[1]+'</option>'}).join('')+'</select><input class="ou" value="'+esc(x.url)+'" placeholder="https://…">'+btn('rmo','✕','sm dan',i)+'</div>'}).join('')}
function vContact(){var c=Object.assign({},D.contact,S.config.contact||{});if(!ST.others)ST.others=JSON.parse(JSON.stringify(c.others||[]));
  return'<h1>Contact &amp; Social Links</h1><div class="card">'+Fl('Contact email',inp('c_email',c.email,'email'),'Visitors’ messages are sent to this address.')+Fl('WhatsApp number',inp('c_wa',c.whatsapp,'text','+92 300 1234567'),'Include the country code. Leave empty to show “Available on request”.')+Fl('GitHub link',inp('c_gh',c.github,'url'))+Fl('LinkedIn link',inp('c_li',c.linkedin,'url','https://www.linkedin.com/in/…'))+
  '<div class="f"><span>Other social links</span><div id="others">'+ctRows()+'</div>'+btn('addo','+ Add another link','sm')+'</div></div><div class="row">'+btn('savecontact','Save contact details','pri')+'</div>'}
function grabO(){ST.others=$$('#others .field').map(function(r){return{type:$('.ot',r).value,url:$('.ou',r).value.trim()}})}
ACT.addo=function(){grabO();ST.others.push({type:'instagram',url:''});$('#others').innerHTML=ctRows()};
ACT.rmo=function(i){grabO();ST.others.splice(+i,1);$('#others').innerHTML=ctRows()};
ACT.savecontact=async function(){grabO();var em=$('#c_email').value.trim(),u=function(v){return!v||/^https?:\/\//.test(v)};
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)){toast('That email address does not look right.',true);return}
  var c={email:em,whatsapp:$('#c_wa').value.trim(),github:$('#c_gh').value.trim(),linkedin:$('#c_li').value.trim(),others:ST.others.filter(function(o){return o.url})};
  if(!u(c.github)||!u(c.linkedin)||c.others.some(function(o){return!u(o.url)})){toast('Links must start with https://',true);return}
  await saveCfg({contact:c});S.config.contact=c;ST.others=null;toast('Saved. The website is updated.')};
/* ---------- images ---------- */
function slot(key,label,hint){var id=(S.config.images||{})[key];return'<div class="item"><div class="th" style="width:110px;height:130px">'+im(id)+'</div><div class="tx"><b>'+label+'</b><span class="muted">'+hint+'</span></div><div class="row">'+btn('setslot',id?'Change':'Upload','sm',key)+(id?btn('rmslot','Remove','sm dan',key):'')+'</div></div>'}
function vImages(){return'<h1>Images</h1><p class="muted">Upload or change every picture on the website. Pictures are resized automatically.</p><div class="grp2">Photos of you</div>'+slot('profile','Profile photo','Home page hero. Also used on the About page unless you set a separate one below. Portrait photos work best.')+slot('about','About page photo (optional)','Leave empty to reuse the profile photo.')+
  '<div class="grp2">Project screenshots (Home “Featured work” and the Portfolio page)</div>'+(S.projects.length?S.projects.map(function(p){return'<div class="card"><div class="row"><b class="sp">'+esc(p.title)+'</b>'+btn('addpshot','+ Add screenshot','sm',p.id)+'</div><div class="shots" style="margin:.8rem 0 0">'+((p.shots||[]).length?p.shots.map(function(s,i){return'<div class="shot"><div class="im">'+im(s)+'</div><div class="bar">'+btn('replshot','Replace','sm',p.id+'|'+i)+btn('rmpshot','Remove','sm dan',p.id+'|'+i)+'</div></div>'}).join(''):'<span class="muted">No screenshot yet.</span>')+'</div></div>'}).join(''):'<div class="card muted">Add a project first.</div>')}
ACT.setslot=async function(k){var fs=await pick(false);if(!fs[0])return;toast('Uploading…');var id=await upload(fs[0],1100),im0=(S.config.images||{})[k];S.config.images=Object.assign({},S.config.images,(function(){var o={};o[k]=id;return o})());await saveCfg({images:S.config.images});delImg(im0);rerender();toast('Photo updated on the website.')};
ACT.rmslot=async function(k){var im0=S.config.images[k];delete S.config.images[k];var o={};o['images.'+k]=f.deleteField();await f.updateDoc(ref('site','config'),o);delImg(im0);rerender();toast('Photo removed.')};
async function saveProj(p){await f.updateDoc(ref('projects',p.id),{shots:p.shots})}
ACT.addpshot=async function(id){var p=S.projects.find(function(x){return x.id===id}),fs=await pick(true);if(!fs.length)return;toast('Uploading…');for(var x of fs){p.shots=(p.shots||[]).concat(await upload(x,1600))}await saveProj(p);rerender();toast('Screenshots added to the website.')};
ACT.replshot=async function(v){var a=v.split('|'),p=S.projects.find(function(x){return x.id===a[0]}),fs=await pick(false);if(!fs[0])return;toast('Uploading…');var old=p.shots[+a[1]],nid=await upload(fs[0],1600);p.shots[+a[1]]=nid;await saveProj(p);delImg(old);rerender();toast('Screenshot replaced.')};
ACT.rmpshot=async function(v){var a=v.split('|'),p=S.projects.find(function(x){return x.id===a[0]});if(!confirm('Remove this screenshot?'))return;var old=p.shots.splice(+a[1],1)[0];await saveProj(p);delImg(old);rerender();toast('Screenshot removed.')};
/* ---------- themes ---------- */
function vThemes(){var cur=S.config.theme||'slate';return'<h1>Themes</h1><p class="muted">Pick a colour style. It changes every page of the live website instantly.</p><div class="themes">'+THEMES.map(function(t){return'<button class="th2'+(t[0]===cur?' on':'')+'" data-act="theme" data-id="'+t[0]+'"><div class="sw"><i style="background:'+t[3][0]+'"></i><i style="background:'+t[3][1]+'"></i><i style="background:'+t[3][2]+'"></i></div><b>'+t[1]+(t[0]===cur?' ✓':'')+'</b><div class="muted">'+t[2]+'</div></button>'}).join('')+'</div>'}
ACT.theme=async function(id){theme(id);await saveCfg({theme:id});S.config.theme=id;rerender();toast('Theme applied to the whole website.')};
/* ---------- account ---------- */
function vAccount(){return'<h1>Account / Password</h1><div class="card"><p>Signed in as <b>'+esc(auth.currentUser.email)+'</b></p><h2 style="margin:1rem 0">Change password</h2>'+Fl('Current password','<input id="a0" type="password" autocomplete="current-password">')+Fl('New password','<input id="a1" type="password" autocomplete="new-password">','At least 10 characters, with letters and numbers.')+Fl('Repeat new password','<input id="a2" type="password" autocomplete="new-password">')+'<div class="row">'+btn('chpw','Change password','pri')+'</div></div><div class="row">'+btn('out','Sign out')+'</div>'}
ACT.chpw=async function(){var a0=$('#a0').value,a1=$('#a1').value,a2=$('#a2').value;
  if(!pwOk(a1)){toast('Use at least 10 characters, with letters and numbers.',true);return}if(a1!==a2){toast('The new passwords do not match.',true);return}if(a1===a0){toast('The new password must be different.',true);return}
  try{await f.reauthenticateWithCredential(auth.currentUser,f.EmailAuthProvider.credential(auth.currentUser.email,a0))}catch(e){toast('Your current password is wrong.',true);return}
  await f.updatePassword(auth.currentUser,a1);rerender();toast('Password changed.')};
ACT.out=function(){return f.signOut(auth).then(function(){S={config:{},projects:[],certs:[],services:[],skills:[],education:[]};show('login')})};
boot();
})();
