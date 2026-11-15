"""Todos os dados criados aqui são FICTÍCIOS e servem apenas à demonstração."""
from .database import dump
from .security import hash_password


def seed(db):
    pw = hash_password('Demo123!')
    users = [
      ('worker','Ana Beatriz Costa','morador@demo.slz','(98) 99999-1001','Anjo da Guarda'),
      ('company','Equipe RH Demonstração','empresa@demo.slz','(98) 99999-2001','Vila Maranhão'),
      ('admin','Equipe SEMISPE Demo','semispe@demo.slz','(98) 99999-3001','Centro'),
      ('worker','João Ferreira','joao@demo.slz','(98) 99999-1010','Vila Embratel'),
      ('worker','Mariana Oliveira','mariana@demo.slz','(98) 99999-1011','Fumacê'),
    ]
    for role,name,email,phone,hood in users:
        db.execute('INSERT INTO users(role,full_name,email,password_hash,phone,neighborhood) VALUES(?,?,?,?,?,?)', (role,name,email,pw,phone,hood))
    profiles = [
      (1,'Auxiliar administrativo e operações','Busco oportunidades de desenvolvimento no setor portuário e industrial.','Médio',12,['Excel','Atendimento','Organização','Pacote Office'],[{'role':'Assistente administrativo','company':'Empresa fictícia','period':'2025 - 2026'}],[{'course':'Ensino médio completo','school':'Escola demonstrativa'}]),
      (4,'Assistente de logística','Vivência com rotinas de estoque e transporte.','Técnico',24,['Excel','Logística','Estoque','Segurança do trabalho','Operação portuária'],[],[]),
      (5,'Iniciando a carreira','Disponibilidade para aprender e atuar na região do Itaqui.','Médio',0,['Atendimento','Informática básica'],[],[]),
    ]
    for uid,head,summary,edu,months,skills,wh,eh in profiles:
        db.execute('INSERT INTO profiles(user_id,headline,summary,education,experience_months,skills,work_history,education_history) VALUES (?,?,?,?,?,?,?,?)', (uid,head,summary,edu,months,dump(skills),dump(wh),dump(eh)))
    company_id = db.execute('INSERT INTO companies(user_id,name,sector,location,description,verified) VALUES(?,?,?,?,?,?)', (2,'Porto Norte Logística (fictícia)','Logística portuária','Itaqui-Bacanga, São Luís','Empresa fictícia usada para demonstração.',1)).lastrowid
    jobs = [
      ('Assistente de logística','Apoiar a programação de recebimento e expedição de cargas.','Conhecimentos de Excel e logística.',['Excel','Logística','Organização'],'Médio',0,'R$ 2.150','Presencial','CLT',1,1,'Itaqui',3),
      ('Auxiliar administrativo','Acompanhar documentos, lançamentos e controles internos.','Pacote Office e boa comunicação.',['Excel','Pacote Office','Atendimento'],'Médio',0,'R$ 1.850','Presencial','CLT',1,1,'Anjo da Guarda',2),
      ('Técnico de segurança do trabalho','Realizar inspeções e apoiar rotinas de saúde e segurança.','Curso técnico, NR-10 e inspeções.',['Segurança do trabalho','NR-10','Inspeções'],'Técnico',12,'R$ 3.100','Presencial','CLT',1,0,'Itaqui',1),
      ('Operador de empilhadeira','Movimentação interna e conferência de mercadorias.','Certificação e conhecimentos de segurança.',['Operação de empilhadeira','NR-11','Segurança do trabalho'],'Médio',6,'A combinar','Presencial','CLT',0,0,'Vila Maranhão',2),
      ('Jovem aprendiz administrativo','Apoiar a equipe administrativa e aprender rotinas organizacionais.','Informática básica e disposição para aprender.',['Informática básica','Organização'],'Médio',0,'Bolsa a informar','Presencial','Aprendiz',1,1,'Anjo da Guarda',4),
      ('Assistente de dados operacionais','Elaboração de relatórios e atualização de indicadores logísticos.','Excel, Power BI e análise de dados.',['Excel','Power BI','Análise de dados'],'Técnico',6,'R$ 2.800','Híbrido','CLT',1,0,'Itaqui',1),
      ('Eletricista industrial','Manutenção elétrica preventiva e corretiva.','NR-10, elétrica e leitura de diagramas.',['NR-10','Eletricidade industrial','Manutenção'],'Técnico',12,'R$ 3.400','Presencial','CLT',1,0,'Maracanã',2),
      ('Auxiliar de almoxarifado','Conferência e organização de estoque.','Controle de estoque e organização.',['Estoque','Organização'],'Médio',0,'R$ 1.750','Presencial','CLT',1,1,'Vila Embratel',2),
      ('Analista de suprimentos júnior','Apoiar indicadores e controle de materiais.','Excel e gestão de fornecedores.',['Excel','Gestão de fornecedores','Compras'],'Superior',12,'R$ 3.000','Híbrido','CLT',1,0,'Itaqui',1),
      ('Assistente de atendimento','Atender clientes e registrar solicitações.','Comunicação e pacote Office.',['Atendimento','Pacote Office','Comunicação'],'Médio',0,'R$ 1.700','Presencial','CLT',1,1,'Vila Embratel',3),
      ('Auxiliar de manutenção','Apoiar manutenções preventivas e organização de ferramentas.','Noções de manutenção e segurança.',['Manutenção','Segurança do trabalho'],'Médio',0,'R$ 1.900','Presencial','CLT',0,1,'Itaqui',2),
      ('Assistente de RH','Apoiar processos seletivos e atualização de controles.','Excel, atendimento e organização.',['Excel','Atendimento','Organização'],'Superior',0,'R$ 2.400','Híbrido','CLT',1,1,'Centro',1),
    ]
    for title,desc,req,skills,edu,months,salary,mode,contract,pcd,noexp,hood,n in jobs:
        db.execute('''INSERT INTO jobs(company_id,title,description,requirements,skills,education,experience_months,salary,modality,contract,pcd,no_experience,neighborhood,vacancies,deadline)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)''', (company_id,title,desc,req,dump(skills),edu,months,salary,mode,contract,pcd,noexp,hood,n,'2027-03-30'))
    courses = [
      ('Excel aplicado à logística','Planilhas, fórmulas e indicadores para operações logísticas.','Centro de Formação SLZ (fictício)','Presencial','Anjo da Guarda','Tecnologia',40,30,['Excel','Logística']),
      ('NR-10 — Fundamentos','Segurança em serviços com eletricidade: módulo introdutório.','Instituto Técnico Demo','Presencial','Vila Maranhão','Segurança',40,25,['NR-10']),
      ('Introdução ao Power BI','Dashboards e análise de indicadores.','Centro de Formação SLZ (fictício)','Online','Online','Tecnologia',24,100,['Power BI','Análise de dados']),
      ('Operação de empilhadeira','Noções operacionais e de segurança. A habilitação prática exige avaliação adequada.','Instituto Técnico Demo','Presencial','Itaqui','Indústria',40,20,['Operação de empilhadeira','NR-11']),
      ('Auxiliar de logística','Estoque, expedição e operações portuárias.','Centro de Formação SLZ (fictício)','Presencial','Anjo da Guarda','Logística',60,35,['Logística','Estoque']),
      ('Informática para o primeiro emprego','Computador, internet e ferramentas de escritório.','Centro de Formação SLZ (fictício)','Online','Online','Tecnologia',30,80,['Informática básica','Pacote Office']),
      ('Comunicação profissional','Comunicação, atendimento e entrevistas.','Instituto Cidadania (fictício)','Presencial','Vila Embratel','Comportamental',20,40,['Comunicação','Atendimento']),
      ('Introdução à manutenção industrial','Rotinas de manutenção e prevenção.','Instituto Técnico Demo','Presencial','Itaqui','Indústria',50,20,['Manutenção','Segurança do trabalho']),
    ]
    for title,desc,provider,mode,hood,cat,hours,seats,skills in courses:
        db.execute('INSERT INTO courses(title,description,provider,modality,neighborhood,category,hours,seats,skills,enrollment_deadline) VALUES(?,?,?,?,?,?,?,?,?,?)', (title,desc,provider,mode,hood,cat,hours,seats,dump(skills),'2027-03-25'))
    for uid,title,reason in [(1,'Operação de empilhadeira','Quero aprender e conseguir uma vaga na região.'),(4,'NR-35','As empresas pedem qualificação.'),(5,'Operação de empilhadeira','Meu primeiro curso profissionalizante.'),(1,'Inglês para logística','Preciso do idioma para evoluir.'),(5,'Operação de empilhadeira','Curso perto da Vila Embratel.')]:
        db.execute('INSERT INTO course_requests(worker_id,title,reason) VALUES(?,?,?)',(uid,title,reason))
    for uid,title,cat,desc,hood,price in [(1,'Apoio administrativo e digitação','Administrativo','Digitação de documentos e organização de arquivos.','Anjo da Guarda','A combinar'),(4,'Montagem de planilhas','Tecnologia','Criação e organização de planilhas de estoque.','Vila Embratel','A partir de R$ 80'),(5,'Cuidados com plantas','Jardinagem','Pequenos jardins residenciais.','Fumacê','Sob orçamento')]:
        db.execute('INSERT INTO services(worker_id,title,category,description,neighborhood,price_note) VALUES(?,?,?,?,?,?)',(uid,title,cat,desc,hood,price))
    db.execute('INSERT INTO applications(job_id,worker_id,status) VALUES(1,1,?)', ('em_analise',))
    db.execute('INSERT INTO applications(job_id,worker_id,status,feedback) VALUES(3,4,?,?)', ('nao_selecionado','A seleção buscava experiência específica com inspeções e NR-10.'))
    db.execute('INSERT INTO course_enrollments(course_id,worker_id) VALUES(1,1)')
