"""API REST do Vaga Certa SLZ - projeto independente inspirado em fluxos públicos do GO Recife.
Execute na pasta raiz: uvicorn backend.app.main:app --reload
"""
import hashlib
import secrets
import sqlite3
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, HTTPException, Header, Query, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel, EmailStr, Field

from .database import connect, init_db, one, many, unpack, dump
from .matching import calculate_match, as_list
from .security import hash_password, verify_password, new_token, expiry

BASE = Path(__file__).resolve().parents[2]
FRONTEND = BASE / 'frontend'

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(title='Vaga Certa SLZ · API', version='0.9.0', description='Projeto demonstrativo para hackathon — sem vínculo oficial com SEMISPE ou empresas.', lifespan=lifespan)


class Credentials(BaseModel):
    email: str
    password: str

class Registration(Credentials):
    full_name: str = Field(min_length=3, max_length=120)
    phone: str = ''
    neighborhood: str = ''
    role: str = 'worker'
    company_name: str = ''

class ProfileInput(BaseModel):
    full_name: str = Field(min_length=3, max_length=120)
    phone: str = ''
    neighborhood: str = ''
    headline: str = ''
    summary: str = ''
    education: str = 'Médio'
    experience_months: int = Field(default=0, ge=0, le=900)
    skills: list[str] = []
    work_history: list[dict] = []
    education_history: list[dict] = []

class JobInput(BaseModel):
    title: str = Field(min_length=3, max_length=140)
    description: str = Field(min_length=5)
    requirements: str = ''
    skills: list[str] = []
    education: str = 'Médio'
    experience_months: int = Field(default=0, ge=0)
    salary: str = 'A combinar'
    modality: str = 'Presencial'
    contract: str = 'CLT'
    pcd: bool = False
    no_experience: bool = False
    neighborhood: str = 'Itaqui'
    vacancies: int = Field(default=1, ge=1)
    deadline: str = ''
    status: str = 'aberta'

class ApplicationStatus(BaseModel):
    status: str
    feedback: str = ''

class CourseInput(BaseModel):
    title: str = Field(min_length=3)
    description: str = ''
    provider: str = ''
    modality: str = 'Presencial'
    neighborhood: str = ''
    category: str = ''
    hours: int = Field(default=20, ge=1)
    seats: int = Field(default=30, ge=1)
    skills: list[str] = []
    enrollment_deadline: str = ''
    status: str = 'aberto'

class CourseRequestInput(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    reason: str = Field(default='', max_length=1000)

class ServiceInput(BaseModel):
    title: str = Field(min_length=3)
    category: str = 'Outros'
    description: str = ''
    neighborhood: str = ''
    price_note: str = 'Sob consulta'

class InquiryInput(BaseModel):
    message: str = Field(min_length=5)


def fail(status: int, detail: str):
    raise HTTPException(status_code=status, detail=detail)


def user_from_token(auth: Optional[str], db):
    if not auth or not auth.startswith('Bearer '):
        return None
    digest = hashlib.sha256(auth[7:].encode()).hexdigest()
    return one(db, '''SELECT u.id,u.role,u.full_name,u.email,u.phone,u.neighborhood,u.created_at
          FROM sessions s JOIN users u ON u.id=s.user_id
          WHERE s.token_hash=? AND s.expires_at>?''', (digest, int(time.time())))


def require_user(db, auth, roles=None):
    user = user_from_token(auth, db)
    if not user:
        fail(401, 'Faça login para continuar.')
    if roles and user['role'] not in roles:
        fail(403, 'Seu perfil não permite esta ação.')
    return user


def public_user(u):
    return {k: u[k] for k in ('id','role','full_name','email','phone','neighborhood')}


def profile_of(db, uid):
    data = one(db, '''SELECT u.id,u.full_name,u.email,u.phone,u.neighborhood,p.headline,p.summary,
            p.education,p.experience_months,p.skills,p.work_history,p.education_history
            FROM users u LEFT JOIN profiles p ON p.user_id=u.id WHERE u.id=?''', (uid,))
    return unpack(data, 'skills','work_history','education_history')


def public_jobs(db, where='', args=()):
    sql = '''SELECT j.*, c.name AS company_name, c.sector AS company_sector
       FROM jobs j JOIN companies c ON c.id=j.company_id '''+where+' ORDER BY j.id DESC'
    return [unpack(row,'skills') for row in many(db,sql,args)]


def public_courses(db, where='', args=()):
    return [unpack(row,'skills') for row in many(db, 'SELECT * FROM courses '+where+' ORDER BY id DESC',args)]


@app.get('/api/health')
def health():
    return {'status':'ok','version':'0.9.0'}

@app.get('/api/bootstrap')
def bootstrap(authorization: Optional[str]=Header(default=None)):
    with connect() as db:
        user=user_from_token(authorization,db)
        jobs=one(db,"SELECT COUNT(*) as total FROM jobs WHERE status='aberta'")['total']
        courses=one(db,"SELECT COUNT(*) as total FROM courses WHERE status='aberto'")['total']
        residents=one(db,"SELECT COUNT(*) as total FROM users WHERE role='worker'")['total']
        return {'user': public_user(user) if user else None, 'stats':{'jobs':jobs,'courses':courses,'workers':residents},'demo':True}

@app.post('/api/auth/register',status_code=201)
def register(body: Registration):
    if body.role not in ('worker','company'):
        fail(422,'Perfil de cadastro inválido.')
    if len(body.password)<8:
        fail(422,'A senha deve conter pelo menos 8 caracteres.')
    if '@' not in body.email or '.' not in body.email.split('@')[-1]:
        fail(422,'Informe um e-mail válido.')
    if body.role=='company' and len(body.company_name.strip())<3:
        fail(422,'Informe o nome da empresa.')
    with connect() as db:
        try:
            cur=db.execute('INSERT INTO users(role,full_name,email,password_hash,phone,neighborhood) VALUES(?,?,?,?,?,?)',
                   (body.role,body.full_name.strip(),body.email.lower().strip(),hash_password(body.password),body.phone,body.neighborhood))
            uid=cur.lastrowid
            if body.role=='worker':
                db.execute('INSERT INTO profiles(user_id) VALUES(?)',(uid,))
            else:
                db.execute('INSERT INTO companies(user_id,name,location,verified) VALUES(?,?,?,0)',(uid,body.company_name,'São Luís - MA'))
            db.commit()
        except sqlite3.IntegrityError:
            fail(409,'Este e-mail já foi cadastrado.')
    return {'message':'Cadastro realizado. Entre com seu e-mail e senha.'}

@app.post('/api/auth/login')
def login(body: Credentials):
    with connect() as db:
        u=one(db,'SELECT * FROM users WHERE email=?',(body.email.lower().strip(),))
        if not u or not verify_password(body.password,u['password_hash']):
            fail(401,'E-mail ou senha inválidos.')
        token=new_token()
        db.execute('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)', (hashlib.sha256(token.encode()).hexdigest(),u['id'],expiry()))
        db.commit()
        return {'token':token,'user':public_user(u)}

@app.post('/api/auth/logout')
def logout(authorization: Optional[str]=Header(default=None)):
    if authorization and authorization.startswith('Bearer '):
        with connect() as db:
            db.execute('DELETE FROM sessions WHERE token_hash=?',(hashlib.sha256(authorization[7:].encode()).hexdigest(),))
            db.commit()
    return {'ok':True}

@app.get('/api/profile')
def get_profile(authorization: Optional[str]=Header(default=None)):
    with connect() as db:
        u=require_user(db,authorization)
        return profile_of(db,u['id'])

@app.put('/api/profile')
def save_profile(body:ProfileInput,authorization:Optional[str]=Header(default=None)):
    with connect() as db:
        u=require_user(db,authorization,('worker',))
        db.execute('UPDATE users SET full_name=?,phone=?,neighborhood=? WHERE id=?',(body.full_name,body.phone,body.neighborhood,u['id']))
        db.execute('''INSERT INTO profiles(user_id,headline,summary,education,experience_months,skills,work_history,education_history)
         VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET headline=excluded.headline,summary=excluded.summary,
         education=excluded.education,experience_months=excluded.experience_months,skills=excluded.skills,
         work_history=excluded.work_history,education_history=excluded.education_history,updated_at=CURRENT_TIMESTAMP''',
          (u['id'],body.headline,body.summary,body.education,body.experience_months,dump(body.skills),dump(body.work_history),dump(body.education_history)))
        db.commit()
        return profile_of(db,u['id'])

@app.get('/api/jobs')
def get_jobs(q:str='', neighborhood:str='', education:str='', modality:str='', no_experience:bool=False,pcd:bool=False,
              authorization:Optional[str]=Header(default=None)):
    with connect() as db:
        cond=["j.status='aberta'"]; args=[]
        if q:cond.append('(LOWER(j.title) LIKE ? OR LOWER(j.description) LIKE ? OR LOWER(c.name) LIKE ?)');args += ['%'+q.lower()+'%']*3
        if neighborhood:cond.append('j.neighborhood=?');args.append(neighborhood)
        if education:cond.append('j.education=?');args.append(education)
        if modality:cond.append('j.modality=?');args.append(modality)
        if no_experience:cond.append('j.no_experience=1')
        if pcd:cond.append('j.pcd=1')
        jobs=public_jobs(db,' WHERE '+' AND '.join(cond),args)
        u=user_from_token(authorization,db)
        if u and u['role']=='worker':
            p=profile_of(db,u['id'])
            for j in jobs: j['match']=calculate_match(p,j)
        return jobs

@app.get('/api/jobs/{job_id}')
def get_job(job_id:int,authorization:Optional[str]=Header(default=None)):
    with connect() as db:
        items=public_jobs(db,' WHERE j.id=?',(job_id,))
        if not items:fail(404,'Vaga não encontrada.')
        j=items[0]
        u=user_from_token(authorization,db)
        if u and u['role']=='worker':
            j['match']=calculate_match(profile_of(db,u['id']),j)
            j['applied']=bool(one(db,'SELECT 1 FROM applications WHERE job_id=? AND worker_id=?',(job_id,u['id'])))
        return j

@app.get('/api/matches')
def matches(authorization:Optional[str]=Header(default=None)):
    with connect() as db:
        u=require_user(db,authorization,('worker',))
        p=profile_of(db,u['id'])
        jobs=public_jobs(db," WHERE j.status='aberta'")
        return sorted([{'job':j,'match':calculate_match(p,j)} for j in jobs],key=lambda j:-j['match']['score'])

@app.post('/api/applications',status_code=201)
def apply(body:dict,authorization:Optional[str]=Header(default=None)):
    with connect() as db:
        u=require_user(db,authorization,('worker',))
        job_id=body.get('job_id')
        j=one(db,"SELECT id FROM jobs WHERE id=? AND status='aberta'",(job_id,))
        if not j:fail(404,'Vaga indisponível.')
        p=profile_of(db,u['id'])
        if not p.get('headline') or not p.get('skills'):
            fail(422,'Complete seu perfil profissional antes de se candidatar.')
        try:
            db.execute('INSERT INTO applications(job_id,worker_id) VALUES(?,?)',(job_id,u['id']))
            db.commit()
        except sqlite3.IntegrityError:
            fail(409,'Você já se candidatou a esta vaga.')
        return {'message':'Candidatura enviada. Acompanhe o status em Minhas candidaturas.'}

@app.get('/api/applications/my')
def my_applications(authorization:Optional[str]=Header(default=None)):
    with connect() as db:
        u=require_user(db,authorization,('worker',))
        return many(db,'''SELECT a.*, j.title as job_title,j.skills, c.name as company_name
          FROM applications a JOIN jobs j ON j.id=a.job_id JOIN companies c ON c.id=j.company_id
          WHERE a.worker_id=? ORDER BY a.id DESC''',(u['id'],))

@app.get('/api/courses')
def get_courses(q:str='', modality:str='', category:str=''):
    with connect() as db:
        cond=["status='aberto'"];args=[]
        if q:cond.append('(LOWER(title) LIKE ? OR LOWER(description) LIKE ?)');args += ['%'+q.lower()+'%']*2
        if modality:cond.append('modality=?');args.append(modality)
        if category:cond.append('category=?');args.append(category)
        return public_courses(db,' WHERE '+' AND '.join(cond),args)

@app.get('/api/courses/{course_id}')
def get_course(course_id:int):
    with connect() as db:
        r=one(db,'SELECT * FROM courses WHERE id=?',(course_id,))
        if not r:fail(404,'Curso não encontrado.')
        return unpack(r,'skills')

@app.post('/api/courses/{course_id}/enroll',status_code=201)
def enroll(course_id:int,authorization:Optional[str]=Header(default=None)):
    with connect() as db:
        u=require_user(db,authorization,('worker',))
        course=one(db,"SELECT * FROM courses WHERE id=? AND status='aberto'",(course_id,))
        if not course:fail(404,'Curso indisponível.')
        qty=one(db,'SELECT COUNT(*) as total FROM course_enrollments WHERE course_id=?',(course_id,))['total']
        if qty>=course['seats']:fail(409,'As vagas deste curso foram preenchidas.')
        try:
            db.execute('INSERT INTO course_enrollments(course_id,worker_id) VALUES(?,?)',(course_id,u['id']))
            db.commit()
        except sqlite3.IntegrityError:fail(409,'Você já está inscrito neste curso.')
        return {'message':'Inscrição recebida. A matrícula dependerá de confirmação da instituição.'}

@app.get('/api/courses/my')
def my_courses(authorization:Optional[str]=Header(default=None)):
    with connect() as db:
        u=require_user(db,authorization,('worker',))
        return many(db,'''SELECT e.*,c.title,c.provider,c.modality FROM course_enrollments e JOIN courses c ON c.id=e.course_id WHERE worker_id=?''',(u['id'],))

@app.post('/api/course-requests',status_code=201)
def create_course_request(body:CourseRequestInput,authorization:Optional[str]=Header(default=None)):
    with connect() as db:
        u=require_user(db,authorization,('worker',))
        db.execute('INSERT INTO course_requests(worker_id,title,reason) VALUES(?,?,?)',(u['id'],body.title.strip(),body.reason.strip()))
        db.commit()
        return {'message':'Solicitação registrada para avaliação pela SEMISPE.'}

@app.get('/api/course-requests/my')
def my_course_requests(authorization:Optional[str]=Header(default=None)):
    with connect() as db:
        u=require_user(db,authorization,('worker',))
        return many(db,'SELECT * FROM course_requests WHERE worker_id=? ORDER BY id DESC',(u['id'],))

@app.get('/api/services')
def get_services(q:str='',category:str=''):
    with connect() as db:
        cond=[];args=[]
        if q:cond.append('(LOWER(s.title) LIKE ? OR LOWER(s.description) LIKE ?)');args += ['%'+q.lower()+'%']*2
        if category:cond.append('s.category=?');args.append(category)
        where='WHERE '+' AND '.join(cond) if cond else ''
        return many(db,'''SELECT s.*,u.full_name as professional_name FROM services s JOIN users u ON u.id=s.worker_id '''+where+' ORDER BY s.id DESC',args)

@app.post('/api/services',status_code=201)
def create_service(body:ServiceInput,authorization:Optional[str]=Header(default=None)):
    with connect() as db:
        u=require_user(db,authorization,('worker',))
        db.execute('INSERT INTO services(worker_id,title,category,description,neighborhood,price_note) VALUES(?,?,?,?,?,?)',(u['id'],body.title,body.category,body.description,body.neighborhood or u['neighborhood'],body.price_note))
        db.commit()
        return {'message':'Serviço publicado na vitrine.'}

@app.get('/api/services/my')
def my_services(authorization:Optional[str]=Header(default=None)):
    with connect() as db:
        u=require_user(db,authorization,('worker',))
        return many(db,'SELECT * FROM services WHERE worker_id=? ORDER BY id DESC',(u['id'],))

@app.post('/api/services/{service_id}/inquire',status_code=201)
def inquire(service_id:int,body:InquiryInput,authorization:Optional[str]=Header(default=None)):
    with connect() as db:
        u=require_user(db,authorization)
        s=one(db,'SELECT * FROM services WHERE id=?',(service_id,))
        if not s:fail(404,'Serviço não encontrado.')
        if s['worker_id']==u['id']:fail(422,'Não é possível contratar seu próprio serviço.')
        db.execute('INSERT INTO service_inquiries(service_id,sender_id,message) VALUES(?,?,?)',(service_id,u['id'],body.message))
        db.commit()
        return {'message':'Sua solicitação foi enviada ao profissional.'}

@app.get('/api/services/inquiries/my')
def received_inquiries(authorization:Optional[str]=Header(default=None)):
    with connect() as db:
        u=require_user(db,authorization,('worker',))
        return many(db,'''SELECT i.*,s.title AS service_title,u.full_name AS sender_name,u.email AS sender_email
          FROM service_inquiries i JOIN services s ON s.id=i.service_id JOIN users u ON u.id=i.sender_id
          WHERE s.worker_id=? ORDER BY i.id DESC''',(u['id'],))


def company_for_user(db,u):
    company=one(db,'SELECT * FROM companies WHERE user_id=?',(u['id'],))
    if not company:fail(403,'Empresa não cadastrada.')
    return company

@app.get('/api/company/overview')
def company_overview(authorization:Optional[str]=Header(default=None)):
    with connect() as db:
        u=require_user(db,authorization,('company',))
        c=company_for_user(db,u)
        jobs=public_jobs(db,' WHERE j.company_id=?',(c['id'],))
        apps=many(db,'''SELECT a.*,j.title AS job_title,u.full_name AS candidate_name,u.neighborhood AS candidate_neighborhood
          FROM applications a JOIN jobs j ON j.id=a.job_id JOIN users u ON u.id=a.worker_id
          WHERE j.company_id=? ORDER BY a.id DESC''',(c['id'],))
        return {'company':c,'jobs':jobs,'applications':apps}

@app.post('/api/company/jobs',status_code=201)
def create_job(body:JobInput,authorization:Optional[str]=Header(default=None)):
    with connect() as db:
        u=require_user(db,authorization,('company',))
        c=company_for_user(db,u)
        if not c['verified']:fail(403,'A conta empresarial precisa ser aprovada pela administração antes de publicar vagas.')
        keys=['company_id','title','description','requirements','skills','education','experience_months','salary','modality','contract','pcd','no_experience','neighborhood','vacancies','deadline','status']
        values=[c['id'],body.title,body.description,body.requirements,dump(body.skills),body.education,body.experience_months,body.salary,body.modality,body.contract,int(body.pcd),int(body.no_experience),body.neighborhood,body.vacancies,body.deadline,'aberta']
        cur=db.execute(f"INSERT INTO jobs({','.join(keys)}) VALUES({','.join(['?']*len(keys))})",values)
        db.commit()
        return {'message':'Vaga publicada.','id':cur.lastrowid}

@app.put('/api/company/jobs/{job_id}')
def edit_job(job_id:int,body:JobInput,authorization:Optional[str]=Header(default=None)):
    with connect() as db:
        u=require_user(db,authorization,('company',))
        c=company_for_user(db,u)
        if not one(db,'SELECT id FROM jobs WHERE id=? AND company_id=?',(job_id,c['id'])):
            fail(404,'Vaga não encontrada nesta empresa.')
        db.execute('''UPDATE jobs SET title=?,description=?,requirements=?,skills=?,education=?,experience_months=?,salary=?,modality=?,contract=?,pcd=?,no_experience=?,neighborhood=?,vacancies=?,deadline=?,status=? WHERE id=?''',
            (body.title,body.description,body.requirements,dump(body.skills),body.education,body.experience_months,body.salary,body.modality,body.contract,int(body.pcd),int(body.no_experience),body.neighborhood,body.vacancies,body.deadline,body.status,job_id))
        db.commit();return {'message':'Vaga atualizada.'}

@app.get('/api/company/candidates/{application_id}')
def candidate_profile(application_id:int,authorization:Optional[str]=Header(default=None)):
    with connect() as db:
        u=require_user(db,authorization,('company',))
        c=company_for_user(db,u)
        a=one(db,'''SELECT a.worker_id,j.id as job_id FROM applications a JOIN jobs j ON j.id=a.job_id WHERE a.id=? AND j.company_id=?''',(application_id,c['id']))
        if not a:fail(404,'Candidatura não encontrada.')
        return profile_of(db,a['worker_id'])

@app.patch('/api/company/applications/{application_id}')
def update_application(application_id:int,body:ApplicationStatus,authorization:Optional[str]=Header(default=None)):
    allowed=('enviada','em_analise','entrevista','aprovado','nao_selecionado')
    if body.status not in allowed:fail(422,'Status inválido.')
    with connect() as db:
        u=require_user(db,authorization,('company',))
        c=company_for_user(db,u)
        a=one(db,'''SELECT a.id FROM applications a JOIN jobs j ON j.id=a.job_id WHERE a.id=? AND j.company_id=?''',(application_id,c['id']))
        if not a:fail(404,'Candidatura não encontrada.')
        db.execute('UPDATE applications SET status=?, feedback=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',(body.status,body.feedback,application_id))
        db.commit();return {'message':'Status atualizado. O candidato verá o feedback na plataforma.'}

@app.get('/api/admin/overview')
def admin_overview(authorization:Optional[str]=Header(default=None)):
    with connect() as db:
        require_user(db,authorization,('admin',))
        def total(sql):return one(db,sql)['n']
        stats={
          'workers':total("SELECT COUNT(*) n FROM users WHERE role='worker'"),
          'companies':total('SELECT COUNT(*) n FROM companies'),
          'open_jobs':total("SELECT COUNT(*) n FROM jobs WHERE status='aberta'"),
          'applications':total('SELECT COUNT(*) n FROM applications'),
          'courses':total('SELECT COUNT(*) n FROM courses'),
          'course_requests':total('SELECT COUNT(*) n FROM course_requests'),
          'approvals':total("SELECT COUNT(*) n FROM applications WHERE status='aprovado'")}
        requests=many(db,'''SELECT r.*,u.neighborhood AS neighborhood,u.full_name AS resident_name
            FROM course_requests r JOIN users u ON u.id=r.worker_id ORDER BY r.id DESC''')
        groups=many(db,'''SELECT LOWER(TRIM(title)) AS normalized_title, MIN(title) AS title,
            COUNT(*) AS requests, COUNT(DISTINCT worker_id) AS unique_residents
            FROM course_requests GROUP BY LOWER(TRIM(title)) ORDER BY unique_residents DESC, requests DESC''')
        all_jobs=public_jobs(db)
        skill_counts={}
        for job in all_jobs:
            if job['status']=='aberta':
                for skill in job['skills']:
                    skill_counts[skill]=skill_counts.get(skill,0)+1
        skills=sorted([{'skill':k,'job_count':v} for k,v in skill_counts.items()],key=lambda v:-v['job_count'])[:12]
        neighborhoods=many(db,"SELECT neighborhood,COUNT(*) as n FROM users WHERE role='worker' GROUP BY neighborhood ORDER BY n DESC")
        companies=many(db,'SELECT c.*,u.email FROM companies c JOIN users u ON u.id=c.user_id ORDER BY c.id DESC')
        recent=many(db,'''SELECT a.id,a.status,a.created_at,j.title AS job_title,u.neighborhood
           FROM applications a JOIN jobs j ON j.id=a.job_id JOIN users u ON u.id=a.worker_id ORDER BY a.id DESC LIMIT 10''')
        return {'stats':stats,'request_groups':groups,'requests':requests,'skills':skills,
                'neighborhoods':neighborhoods,'companies':companies,'recent_applications':recent}

@app.patch('/api/admin/requests/{request_id}')
def admin_request_update(request_id:int,body:dict,authorization:Optional[str]=Header(default=None)):
    if body.get('status') not in ('pendente','em_analise','planejado','atendido'):
        fail(422,'Status inválido.')
    with connect() as db:
        require_user(db,authorization,('admin',))
        cur=db.execute('UPDATE course_requests SET status=? WHERE id=?',(body['status'],request_id))
        if not cur.rowcount:fail(404,'Solicitação não encontrada.')
        db.commit();return {'message':'Solicitação atualizada.'}

@app.post('/api/admin/courses',status_code=201)
def admin_create_course(body:CourseInput,authorization:Optional[str]=Header(default=None)):
    with connect() as db:
        require_user(db,authorization,('admin',))
        cur=db.execute('''INSERT INTO courses(title,description,provider,modality,neighborhood,category,hours,seats,skills,enrollment_deadline,status)
           VALUES(?,?,?,?,?,?,?,?,?,?,?)''',(body.title,body.description,body.provider,body.modality,body.neighborhood,body.category,body.hours,body.seats,dump(body.skills),body.enrollment_deadline,'aberto'))
        db.commit();return {'message':'Curso publicado.','id':cur.lastrowid}

@app.patch('/api/admin/companies/{company_id}')
def admin_verify_company(company_id:int,body:dict,authorization:Optional[str]=Header(default=None)):
    with connect() as db:
        require_user(db,authorization,('admin',))
        cur=db.execute('UPDATE companies SET verified=? WHERE id=?',(int(bool(body.get('verified'))),company_id))
        if not cur.rowcount:fail(404,'Empresa não encontrada.')
        db.commit();return {'message':'Cadastro empresarial atualizado.'}

# Hospedagem integrada do frontend: o servidor atende a SPA sem CORS, npm ou build.
@app.get('/')
def index():
    return FileResponse(FRONTEND/'index.html')

@app.get('/{file_path:path}',include_in_schema=False)
def frontend_files(file_path:str):
    # Path traversal protegido por resolve + relative_to
    target=(FRONTEND/file_path).resolve()
    if not target.is_relative_to(FRONTEND.resolve()) or not target.is_file():
        fail(404,'Arquivo não encontrado.')
    return FileResponse(target)
