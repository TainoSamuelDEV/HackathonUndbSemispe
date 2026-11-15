import './effects.js';
import {api,get,post,put,patch,getToken,setToken} from './api.js';
import {icon,E,toast,openModal,field,textareaField,selectField,formData,tags} from './ui.js';
import {home} from './pages/home.js';
import {jobs,jobDetail,jobCard} from './pages/jobs.js';
import {courses,courseDetail,courseCard} from './pages/courses.js';
import {authPage} from './pages/auth.js';
import {workerDashboard,profilePage,resumePage,applicationsPage,myCoursesPage,myRequestsPage,myServicesPage} from './pages/worker.js';
import {companyPage,jobEditor,candidateReview} from './pages/company.js';
import {adminPage,courseEditor,reviewRequest} from './pages/admin.js';
import {servicesPage,serviceList,serviceEditor} from './pages/services.js';
import {aboutPage,helpPage} from './pages/info.js';
const state={user:null,stats:{},activeCourseCategory:'',activeServiceCategory:''};
const app=document.getElementById('app');
const route=()=>decodeURI(location.hash.replace(/^#\/?/,'')||'').split('/').filter(Boolean);
const roleLink=()=>state.user?.role==='admin'?'#/gestao':state.user?.role==='company'?'#/empresa':'#/painel';
function header(){let path=route()[0]||'';return `<div class="demo-banner"><div class="container"><strong>AMBIENTE DE DEMONSTRAÇÃO</strong> · Dados de vagas, empresas e cursos fictícios. Projeto independente, sem vínculo oficial com a SEMISPE.</div></div><header class="site-header"><nav class="container nav-inner" aria-label="Navegação principal"><a class="brand" href="#/"><img class="brand-logo" src="/assets/img/logo-branco.png" alt="Parque Tecnológico de São Luís"><span class="brand-sep"></span><span class="brand-copy">Vaga Certa <b>SLZ</b></span></a><div class="nav-links" id="main-nav"><a class="${!path?'active':''}" href="#/">Início</a><a class="${path==='vagas'?'active':''}" href="#/vagas">Vagas de emprego</a><a class="${path==='cursos'?'active':''}" href="#/cursos">Cursos gratuitos</a><a class="${path==='servicos'?'active':''}" href="#/servicos">Profissionais</a><a class="${path==='sobre'?'active':''}" href="#/sobre">O projeto</a></div><div class="nav-actions">${state.user?`<a href="${roleLink()}" class="btn btn-soft btn-sm">${icon('user',16)} ${E(state.user.full_name.split(' ')[0])}</a><button class="btn btn-light btn-sm" data-action="logout">Sair</button>`:`<a href="#/entrar" class="btn btn-light">Entrar</a><a href="#/cadastro" class="btn btn-primary">Criar conta ${icon('arrow',15)}</a>`}<button class="icon-button mobile-toggle" data-action="toggle-mobile-menu" aria-label="Abrir menu">${icon('menu',24)}</button></div></nav></header>`}
function footer(){return `<footer class="site-footer"><div class="container"><div class="footer-inner"><div class="footer-brand"><a class="brand" href="#/"><img class="brand-logo" src="/assets/img/logo-branco.png" alt="Parque Tecnológico de São Luís"><span class="brand-sep"></span><span class="brand-copy">Vaga Certa <b>SLZ</b></span></a><p>Oportunidades que transformam. Uma proposta tecnológica para aproximar talentos, empresas e capacitação em São Luís.</p><p style="font-size:11px">MVP de hackathon · Marca provisória · Dados simulados</p></div><div class="footer-col"><h4>Para você</h4><a href="#/vagas">Buscar vagas</a><a href="#/cursos">Cursos</a><a href="#/perfil">Meu currículo</a></div><div class="footer-col"><h4>Conexões</h4><a href="#/empresa">Para empresas</a><a href="#/servicos">Profissionais</a><a href="#/gestao">Painel SEMISPE</a></div><div class="footer-col"><h4>Informações</h4><a href="#/sobre">Sobre o projeto</a><a href="#/ajuda">Central de ajuda</a><a href="https://gorecife.recife.pe.gov.br" target="_blank" rel="noopener noreferrer">Referência: GO Recife</a></div></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} Vaga Certa SLZ. Protótipo independente para estudo e validação.</span><span>Feito para oportunidades em São Luís, Maranhão.</span></div></div></footer>`}
async function bootstrap(){const b=await get('/bootstrap');state.user=b.user;state.stats=b.stats;}
let renderCount=0;
async function render(){const current=++renderCount;const [page,param]=route();let content='';try{
 if(page==='entrar'||page==='cadastro')content=authPage(state,page==='cadastro'?'register':'login');
 else if(page==='vagas')content=param?await jobDetail(state,param):await jobs(state);
 else if(page==='cursos')content=param?await courseDetail(state,param):await courses(state);
 else if(page==='servicos')content=await servicesPage(state);
 else if(page==='empresa')content=await companyPage(state);
 else if(page==='gestao')content=state.user?.role==='admin'?await adminPage(state):accessPage('Gestão SEMISPE');
 else if(['painel','perfil','curriculo','minhas-candidaturas','meus-cursos','minhas-solicitacoes','meus-servicos'].includes(page)){
   if(state.user?.role!=='worker')content=accessPage('Espaço do trabalhador');
   else content=await ({painel:workerDashboard,perfil:profilePage,curriculo:resumePage,'minhas-candidaturas':applicationsPage,'meus-cursos':myCoursesPage,'minhas-solicitacoes':myRequestsPage,'meus-servicos':myServicesPage}[page])(state);
 }
 else if(page==='sobre')content=aboutPage();else if(page==='ajuda')content=helpPage();else content=await home(state);
 if(current!==renderCount)return;
 app.innerHTML=header()+content+footer();
 if(document.querySelector('select[name="role"]'))document.querySelector('select[name="role"]').dispatchEvent(new Event('change'));
 }catch(err){if(current!==renderCount)return;app.innerHTML=header()+`<main class="page-body"><div class="container"><div class="card p28"><h2>Não foi possível carregar esta página.</h2><p>${E(err.message)}</p><button class="btn btn-primary" data-action="reload">Tentar novamente</button></div></div></main>`+footer();}
}
function accessPage(target){return `<div class="section"><div class="container text-center"><div class="card p28" style="max-width:650px;margin:auto"><div class="feature-icon" style="margin:0 auto 15px">${icon('shield',23)}</div><h2>Área de acesso restrito</h2><p class="section-text" style="margin:0 auto 20px">${E(target)}. Entre com o perfil correspondente para continuar.</p><a class="btn btn-primary" href="#/entrar">Entrar ${icon('arrow',16)}</a></div></div></div>`}
function refresh(){return bootstrap().then(render)}
function parseList(value){return String(value||'').split(',').map(x=>x.trim()).filter(Boolean)}
function parseRows(value,keys){return String(value||'').split('\n').map(s=>s.trim()).filter(Boolean).map(line=>Object.fromEntries(keys.map((k,i)=>[k,(line.split('|')[i]||'').trim()])))}
function mustWorker(){if(state.user?.role!=='worker'){toast('Entre com uma conta de trabalhador para continuar.',true);location.hash='#/entrar';return false}return true}
async function authenticate(email,password){const data=await post('/auth/login',{email,password});setToken(data.token);state.user=data.user;await bootstrap();location.hash=roleLink();await render();toast('Bem-vindo(a), '+state.user.full_name.split(' ')[0]+'!')}
async function handleForm(form){const type=form.dataset.form;const data=formData(form);const button=form.querySelector('button[type="submit"]');if(button){button.disabled=true;button.dataset.previous=button.textContent;button.textContent='Salvando...'}
 try{
 if(type==='login'){await authenticate(data.email,data.password);return}
 if(type==='register'){await post('/auth/register',data);location.hash='#/entrar';await render();toast('Conta criada! Agora entre com seus dados.');return}
 if(type==='profile'){
   let p={...data,experience_months:Number(data.experience_months||0),skills:parseList(data.skills),work_history:parseRows(data.work_history,['role','company','period']),education_history:parseRows(data.education_history,['course','school'])};delete p.email;
   await put('/profile',p);await bootstrap();await render();toast('Perfil atualizado com sucesso.');return
 }
 if(type==='job-editor'){
   let p={...data,skills:parseList(data.skills),experience_months:Number(data.experience_months||0),vacancies:Number(data.vacancies||1),pcd:form.querySelector('[name="pcd"]').checked,no_experience:form.querySelector('[name="no_experience"]').checked};const id=p.job_id;delete p.job_id;
   if(id)await put('/company/jobs/'+id,p);else await post('/company/jobs',p);document.querySelector('#active-modal')?.remove();await refresh();toast(id?'Vaga atualizada.':'Vaga publicada.');return
 }
 if(type==='application-review'){await patch('/company/applications/'+data.application_id,{status:data.status,feedback:data.feedback});document.querySelector('#active-modal')?.remove();await render();toast('Status atualizado.');return}
 if(type==='course-editor'){
   await post('/admin/courses',{...data,hours:Number(data.hours||20),seats:Number(data.seats||30),skills:parseList(data.skills)});document.querySelector('#active-modal')?.remove();await refresh();toast('Curso publicado.');return}
 if(type==='course-request'){
   await post('/course-requests',data);document.querySelector('#active-modal')?.remove();await render();toast('Sua solicitação chegou ao painel da SEMISPE.');return}
 if(type==='request-status'){await patch('/admin/requests/'+data.id,{status:data.status});document.querySelector('#active-modal')?.remove();await render();toast('Situação atualizada.');return}
 if(type==='service-editor'){await post('/services',data);document.querySelector('#active-modal')?.remove();await render();toast('Serviço publicado.');return}
 if(type==='service-inquiry'){await post('/services/'+data.id+'/inquire',{message:data.message});document.querySelector('#active-modal')?.remove();toast('Mensagem enviada ao profissional.');return}
 }catch(err){toast(err.message,true)}finally{if(button&&button.isConnected){button.disabled=false;button.textContent=button.dataset.previous||'Enviar'}}}
async function handleClick(target){const action=target.dataset.action;if(!action)return;
 try{
 if(action==='toggle-mobile-menu'){document.getElementById('main-nav')?.classList.toggle('open');return}
 if(action==='logout'){await post('/auth/logout',{}).catch(()=>{});setToken(null);state.user=null;location.hash='#/';await refresh();toast('Você saiu da sua conta.');return}
 if(action==='reload'){await refresh();return}
 if(action==='demo-login'){await authenticate(target.dataset.email,'Demo123!');return}
 if(action==='clear-job-filters'){document.getElementById('jobs-filter-form')?.reset();document.getElementById('job-q').value='';await filterJobs();return}
 if(action==='apply'){if(!mustWorker())return;await post('/applications',{job_id:Number(target.dataset.id)});await render();toast('Candidatura de teste registrada.');return}
 if(action==='enroll'){if(!mustWorker())return;await post('/courses/'+target.dataset.id+'/enroll',{});toast('Inscrição de teste registrada. Confira em Meus cursos.');return}
 if(action==='request-course'){if(!mustWorker())return;openModal(`<h2>Que curso você gostaria de fazer?</h2><p>Sua sugestão será enviada para análise no painel da SEMISPE.</p><form data-form="course-request">${field('Nome do curso','title','','text','required minlength="3"')}${textareaField('Por que essa formação seria importante?','reason','',4)}<button class="btn btn-primary" type="submit" style="width:100%">Enviar minha sugestão ${icon('send',16)}</button></form>`);return}
 if(action==='new-job'){openModal(jobEditor());return}
 if(action==='edit-job'){const j=await get('/jobs/'+target.dataset.id);openModal(jobEditor(j));return}
 if(action==='update-application'){openModal(candidateReview(target.dataset.id,target.dataset.status,target.dataset.feedback||''));return}
 if(action==='view-candidate'){const p=await get('/company/candidates/'+target.dataset.id);openModal(`<h2>Perfil do candidato</h2><p>Informações compartilhadas no contexto desta candidatura.</p><div class="contact-card"><b>${E(p.full_name)}</b><br>${E(p.email)} · ${E(p.phone)}<br>${E(p.neighborhood)}</div><h3>${E(p.headline||'Perfil profissional')}</h3><p>${E(p.summary||'Não informado')}</p><h4>Escolaridade</h4><p>${E(p.education)}</p><h4>Competências</h4>${tags(p.skills)}<h4>Experiências</h4>${p.work_history?.length?p.work_history.map(w=>`<p>${E(w.role)} — ${E(w.company)} (${E(w.period)})</p>`).join(''):'<p>Não informadas.</p>'}`);return}
 if(action==='new-course'){openModal(courseEditor());return}
 if(action==='review-request'){openModal(reviewRequest(target.dataset.id,target.dataset.status));return}
 if(action==='verify-company'){await patch('/admin/companies/'+target.dataset.id,{verified:target.dataset.verified!=='1'});await render();toast('Situação da empresa atualizada.');return}
 if(action==='new-service'){if(!mustWorker())return;openModal(serviceEditor());return}
 if(action==='inquire-service'){if(!state.user){toast('Entre para solicitar um serviço.',true);location.hash='#/entrar';return}openModal(`<h2>Solicitar: ${E(target.dataset.title)}</h2><p>Envie uma mensagem ao profissional. O contato será registrado na plataforma.</p><form data-form="service-inquiry"><input type="hidden" name="id" value="${target.dataset.id}">${textareaField('Sua mensagem','message','Olá! Gostaria de saber mais sobre este serviço.',4)}<button type="submit" class="btn btn-primary" style="width:100%">Enviar mensagem ${icon('send',16)}</button></form>`);return}
 if(action==='print-resume'){window.print();return}
 if(action==='show-gaps'){
  const [j,cs]=await Promise.all([get('/jobs/'+target.dataset.id),get('/courses')]);const m=j.match||{missing_skills:[],notes:[]};
  const recommended=cs.map(c=>({...c,relevance:c.skills.filter(s=>m.missing_skills.some(x=>x.toLowerCase()===s.toLowerCase())).length})).filter(c=>c.relevance>0).sort((a,b)=>b.relevance-a.relevance).slice(0,4);
  openModal(`<h2>Como se preparar para esta vaga?</h2><p><b>${E(j.title)}</b>. Veja uma comparação entre seu perfil e os requisitos informados na vaga.</p><div class="match-summary"><span class="eyebrow">COMPATIBILIDADE</span><div class="between"><strong>${m.score}%</strong>${icon('chart',22)}</div><div class="progress"><span style="width:${m.score}%"></span></div><p>${m.notes.map(E).join('<br>')}</p></div><h3>Cursos relacionados às competências em falta</h3>${recommended.length?recommended.map(c=>`<a class="list-row" href="#/cursos/${c.id}" data-modal-close><span><b>${E(c.title)}</b><p>${E(c.modality)} · ${E(c.provider)}</p></span>${icon('arrow',16)}</a>`).join(''):'<p>Não encontramos cursos cadastrados diretamente relacionados a essas competências.</p>'}<button class="btn btn-soft mt16" data-action="request-course" style="width:100%">Solicitar outro curso ${icon('lightbulb',16)}</button><p class="tiny muted">Essa análise não é o motivo oficial de uma reprovação. Somente a empresa pode informar sua decisão.</p>`);return
 }
 }catch(err){toast(err.message,true)}
}
async function filterJobs(){const f=document.getElementById('jobs-filter-form');if(!f)return;const p=new URLSearchParams();const q=document.getElementById('job-q')?.value||'';if(q)p.set('q',q);['neighborhood','education','modality'].forEach(k=>{let v=f.querySelector(`[name="${k}"]`)?.value;if(v)p.set(k,v)});['no_experience','pcd'].forEach(k=>{if(f.querySelector(`[name="${k}"]`)?.checked)p.set(k,'true')});let items=await get('/jobs?'+p.toString());document.getElementById('job-results').innerHTML=items.length?items.map(jobCard).join(''):`<div class="empty-state">Nenhuma vaga encontrada. Tente remover alguns filtros.</div>`;document.getElementById('job-count').textContent=items.length+' oportunidades encontradas'}
async function filterCourses(){let p=new URLSearchParams();let q=document.getElementById('course-query')?.value||'';if(q)p.set('q',q);if(state.activeCourseCategory)p.set('category',state.activeCourseCategory);let cs=await get('/courses?'+p);document.getElementById('course-results').innerHTML=cs.length?cs.map(courseCard).join(''):`<div class="empty-state">Nenhum curso com esses critérios.</div>`;document.getElementById('course-count').textContent=cs.length+' cursos encontrados';document.querySelectorAll('[data-course-filter]').forEach(a=>a.classList.toggle('active',a.dataset.courseFilter===state.activeCourseCategory));}
async function filterServices(){let p=new URLSearchParams();let q=document.getElementById('service-query')?.value||'';if(q)p.set('q',q);if(state.activeServiceCategory)p.set('category',state.activeServiceCategory);const list=await get('/services?'+p);document.getElementById('service-results').innerHTML=serviceList(list);document.querySelectorAll('[data-service-filter]').forEach(a=>a.classList.toggle('active',a.dataset.serviceFilter===state.activeServiceCategory));}
document.addEventListener('click',async(e)=>{const f=e.target.closest('[data-course-filter]');if(f){e.preventDefault();state.activeCourseCategory=f.dataset.courseFilter;await filterCourses();return}const s=e.target.closest('[data-service-filter]');if(s){e.preventDefault();state.activeServiceCategory=s.dataset.serviceFilter;await filterServices();return}const action=e.target.closest('[data-action]');if(action){e.preventDefault();await handleClick(action)}});
document.addEventListener('submit',async e=>{const f=e.target.closest('form[data-form]');if(!f)return;e.preventDefault();if(f.dataset.form==='filter-jobs'){try{await filterJobs()}catch(err){toast(err.message,true)}return}await handleForm(f)});
document.addEventListener('input',e=>{if(e.target.id==='course-query')filterCourses().catch(err=>toast(err.message,true));if(e.target.id==='service-query')filterServices().catch(err=>toast(err.message,true));});
document.addEventListener('change',e=>{if(e.target.name==='role')document.getElementById('company-name-field')?.classList.toggle('hide',e.target.value!=='company')});
window.addEventListener('hashchange',()=>{state.activeCourseCategory='';state.activeServiceCategory='';render();window.scrollTo(0,0)});
bootstrap().then(render).catch(err=>{app.innerHTML=`<div class="loading-screen"><h2>Servidor indisponível</h2><p>${E(err.message)}</p><p>Execute <code>python start.py</code> na pasta do projeto.</p></div>`});
