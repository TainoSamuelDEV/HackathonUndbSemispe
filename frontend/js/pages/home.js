import {icon, E, badge, tags} from '../ui.js';
import {get} from '../api.js';
export async function home(state){
  const [jobs,courses] = await Promise.all([get('/jobs'),get('/courses')]);
  const features=[
    ['briefcase','Encontre a vaga certa','Oportunidades de trabalho na região de São Luís, com filtros por perfil e localização.','/#/vagas','Explorar vagas'],
    ['graduation','Aprenda e evolua','Cursos de qualificação para desenvolver o conhecimento que o mercado pede.','/#/cursos','Conhecer cursos'],
    ['users','Seu talento tem espaço','Um perfil profissional completo ajuda empresas a encontrar pessoas com as competências certas.','/#/perfil','Criar currículo'],
  ];
  return `<section class="hero"><div class="container"><div class="hero-layout"><div class="hero-content">
   <span class="eyebrow eyebrow-light">${icon('spark',14)} TALENTOS DE SÃO LUÍS, GRANDES OPORTUNIDADES</span>
   <h1>Seu futuro começa com uma <em>conexão.</em></h1>
   <p>Vagas de emprego, capacitação e desenvolvimento profissional em um só lugar. Mais oportunidades para quem vive e trabalha em São Luís.</p>
   <div class="hero-actions"><a class="btn btn-amber btn-large" href="#/vagas">Encontrar oportunidades ${icon('arrow')}</a><a class="btn btn-outline btn-large" style="color:white;border-color:#71938a" href="#/cursos">Explorar cursos</a></div>
   <div class="hero-note">${icon('shield',16)} Plataforma gratuita · Projeto demonstrativo para a SEMISPE</div>
  </div><div class="hero-visual" aria-label="Ilustração da jornada profissional">
   <div class="float-card second-float"><span class="float-icon">${icon('check')}</span><span><b>Nova oportunidade</b><small>Na região do Itaqui</small></span></div>
   <div class="float-card main-float"><div class="float-heading"><div><strong>Compatibilidade profissional</strong><br><span>Análise baseada no seu perfil</span></div>${icon('spark',20)}</div><span class="chip-float">ASSISTENTE DE LOGÍSTICA</span><div class="float-row"><strong>Seu perfil</strong><b class="match-number">86%</b></div><div class="progress"><span style="width:86%"></span></div><div style="display:flex;gap:6px;margin-top:15px"><span class="tag">Excel</span><span class="tag">Organização</span></div></div>
   <div class="float-card third-float"><span class="float-icon">${icon('graduation')}</span><span><b>Seu próximo passo</b><small>Curso de capacitação</small></span></div><span class="ornament-dot"></span>
  </div></div></div></section>
  <div class="stats-strip"><div class="container"><div class="stats-inner">
    <div class="stat-cell"><strong>${state.stats?.jobs??jobs.length}</strong><span>Vagas fictícias no ambiente</span></div>
    <div class="stat-cell"><strong>${state.stats?.courses??courses.length}</strong><span>Cursos demonstrativos</span></div>
    <div class="stat-cell"><strong>${state.stats?.workers??0}</strong><span>Perfis de teste</span></div>
    <div class="stat-cell"><strong>100%</strong><span>Gratuito para o cidadão</span></div>
  </div></div></div>
  <section class="section"><div class="container"><div class="section-heading"><div><span class="eyebrow">COMO PODEMOS AJUDAR</span><h2 class="section-title">Um caminho para cada conquista.</h2><p class="section-text">Da busca pelo primeiro emprego à próxima qualificação. Explore o que faz sentido para você.</p></div></div>
  <div class="grid cols-3">${features.map(f=>`<a href="${f[3]}" class="card feature-card"><div class="feature-icon">${icon(f[0],23)}</div><h3>${f[1]}</h3><p>${f[2]}</p><span class="feature-link">${f[4]} ${icon('arrow',16)}</span></a>`).join('')}</div></div></section>
  <section class="section pale-section"><div class="container"><div class="section-heading"><div><span class="eyebrow">OPORTUNIDADES EM DESTAQUE</span><h2 class="section-title">Encontre seu próximo passo.</h2><p class="section-text">Conheça vagas de exemplo inspiradas em áreas profissionais da região.</p></div><a href="#/vagas" class="btn btn-light">Ver todas as vagas ${icon('arrow',16)}</a></div>
  <div class="grid cols-3">${jobs.slice(0,3).map(j=>`<a href="#/vagas/${j.id}" class="card job-card"><div class="job-top"><div class="company-avatar">${icon('building',24)}</div>${badge(j.contract)}</div><div><h3>${E(j.title)}</h3><p style="margin-top:6px">${E(j.company_name)}</p></div><div class="job-meta"><span>${icon('map',14)} ${E(j.neighborhood)}</span><span>${icon('briefcase',14)} ${E(j.modality)}</span></div><div class="job-footer"><strong>${E(j.salary)}</strong><span class="feature-link" style="margin:0">Ver vaga ${icon('arrow',16)}</span></div></a>`).join('')}</div></div></section>
  <section class="callout-section"><div class="container"><div class="split-feature"><div class="illustration-panel"><div class="illus-grid"></div><div class="illustration-window"><div class="between" style="margin-bottom:9px"><b style="font-size:14px">Jornada profissional</b>${badge('Seu crescimento')}</div>
   <div class="illus-row"><div class="feature-icon" style="width:35px;height:35px;margin:0">${icon('user',17)}</div><div><b style="font-size:12px">Seu perfil</b><div class="small muted">Suas experiências e competências</div></div>${icon('check',17)}</div>
   <div class="illus-row"><div class="feature-icon" style="width:35px;height:35px;margin:0">${icon('briefcase',17)}</div><div><b style="font-size:12px">Oportunidades</b><div class="small muted">Vagas alinhadas aos seus objetivos</div></div>${icon('check',17)}</div>
   <div class="illus-row"><div class="feature-icon" style="width:35px;height:35px;margin:0">${icon('book',17)}</div><div><b style="font-size:12px">Aprendizado</b><div class="small muted">Formação para ir mais longe</div></div>${icon('arrow',17)}</div></div><div class="illustration-floating">${icon('spark',17)} Evolução contínua</div></div>
   <div><span class="eyebrow">MAIS DO QUE VAGAS</span><h2 class="section-title">Uma plataforma que acompanha sua evolução.</h2><p class="section-text">Acreditamos que uma oportunidade não termina em uma candidatura. Quem ainda não atende a algum requisito pode encontrar caminhos concretos para se preparar.</p>
   <ul class="check-list"><li>${icon('check',19)} Perfil profissional e currículo personalizável</li><li>${icon('check',19)} Compatibilidade com requisitos explicada claramente</li><li>${icon('check',19)} Cursos disponíveis e espaço para sugerir novos</li><li>${icon('check',19)} Decisões públicas orientadas por demandas reais</li></ul><a href="#/perfil" class="btn btn-primary">Começar meu perfil ${icon('arrow',16)}</a></div></div></div></section>
  <section class="section pale-section"><div class="container"><div class="section-heading"><div><span class="eyebrow">CAPACITAÇÃO</span><h2 class="section-title">Aprender abre caminhos.</h2><p class="section-text">Conheça formações de exemplo pensadas para competências profissionais do território.</p></div><a href="#/cursos" class="btn btn-light">Explorar cursos ${icon('arrow',16)}</a></div>
  <div class="grid cols-3">${courses.slice(0,3).map(c=>`<a href="#/cursos/${c.id}" class="card course-card"><div class="course-banner">${icon('graduation',45)}</div>${badge(c.modality)}<h3>${E(c.title)}</h3><p>${E(c.provider)}</p><div class="job-meta"><span>${icon('clock',14)} ${c.hours}h</span><span>${icon('map',14)} ${E(c.neighborhood)}</span></div><div class="job-footer"><strong>Gratuito</strong><span class="feature-link" style="margin:0">Conhecer ${icon('arrow',16)}</span></div></a>`).join('')}</div></div></section>
  <section class="section" style="background:white"><div class="container"><div class="cta-band"><div><span class="eyebrow eyebrow-light">PARA EMPRESAS E INSTITUIÇÕES</span><h2>Talento local. Impacto real.</h2><p>Publique oportunidades e colabore com o desenvolvimento da nossa cidade.</p></div><a class="btn btn-amber btn-large" href="#/empresa">Acessar área da empresa ${icon('arrow',17)}</a></div></div></section>`;
}
