"""Testes básicos de funções e API usando banco temporário, sem alterar demo."""
import tempfile
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from backend.app import database
from backend.app.main import app
from backend.app.matching import calculate_match

@pytest.fixture()
def client(monkeypatch):
    with tempfile.TemporaryDirectory() as tmp:
        monkeypatch.setattr(database,'DB_PATH',Path(tmp)/'test.db')
        with TestClient(app) as c:
            yield c


def login(c,email):
    resp=c.post('/api/auth/login',json={'email':email,'password':'Demo123!'})
    assert resp.status_code==200,resp.text
    return {'Authorization':'Bearer '+resp.json()['token']}


def test_health_and_public_catalog(client):
    assert client.get('/api/health').status_code==200
    assert client.get('/api/bootstrap').json()['stats']['jobs']==12
    assert len(client.get('/api/jobs').json())==12
    assert len(client.get('/api/courses').json())==8
    assert len(client.get('/api/services').json())==3
    assert client.get('/').status_code==200
    assert client.get('/assets/styles.css').status_code==200
    assert client.get('/js/main.js').status_code==200


def test_login_and_authorization(client):
    assert client.get('/api/profile').status_code==401
    assert client.post('/api/auth/login',json={'email':'foo','password':'bad'}).status_code==401
    h=login(client,'morador@demo.slz')
    assert client.get('/api/profile',headers=h).status_code==200
    assert client.get('/api/admin/overview',headers=h).status_code==403
    assert client.get('/api/company/overview',headers=h).status_code==403
    assert client.get('/api/bootstrap',headers=h).json()['user']['role']=='worker'


def test_worker_profile_matching_and_application(client):
    h=login(client,'morador@demo.slz')
    matches=client.get('/api/matches',headers=h).json()
    assert len(matches)==12
    assert matches[0]['match']['score']>=matches[-1]['match']['score']
    assert len(client.get('/api/applications/my',headers=h).json())==1
    resp=client.post('/api/applications',headers=h,json={'job_id':2})
    assert resp.status_code==201,resp.text
    assert client.post('/api/applications',headers=h,json={'job_id':2}).status_code==409
    assert len(client.get('/api/applications/my',headers=h).json())==2
    data=client.get('/api/profile',headers=h).json()
    data.update({'headline':'Auxiliar de estoque','skills':['Excel','Estoque','Logística']})
    assert client.put('/api/profile',headers=h,json=data).status_code==200
    assert 'Estoque' in client.get('/api/profile',headers=h).json()['skills']


def test_course_and_requests(client):
    h=login(client,'morador@demo.slz')
    assert client.post('/api/courses/2/enroll',headers=h).status_code==201
    assert client.post('/api/courses/2/enroll',headers=h).status_code==409
    assert client.post('/api/course-requests',headers=h,json={'title':'NR-35','reason':'Trabalho em altura'}).status_code==201
    assert len(client.get('/api/course-requests/my',headers=h).json())==3
    ah=login(client,'semispe@demo.slz')
    result=client.get('/api/admin/overview',headers=ah).json()
    assert result['stats']['course_requests']==6
    assert any(x['title']=='NR-35' for x in result['request_groups'])
    assert client.patch('/api/admin/requests/1',headers=ah,json={'status':'planejado'}).status_code==200
    assert client.post('/api/admin/courses',headers=ah,json={'title':'NR-35','hours':20,'seats':30}).status_code==201


def test_company_status_and_feedback(client):
    ch=login(client,'empresa@demo.slz')
    result=client.get('/api/company/overview',headers=ch).json()
    assert result['company']['verified']==1
    assert len(result['jobs'])==12
    ah=login(client,'morador@demo.slz')
    assert client.patch('/api/company/applications/1',headers=ah,json={'status':'aprovado'}).status_code==403
    assert client.patch('/api/company/applications/1',headers=ch,json={'status':'nao_selecionado','feedback':'A vaga exigia experiência adicional.'}).status_code==200
    data=client.get('/api/applications/my',headers=ah).json()
    assert data[0]['feedback']=='A vaga exigia experiência adicional.'
    assert client.get('/api/company/candidates/1',headers=ch).json()['full_name']=='Ana Beatriz Costa'
    resp=client.post('/api/company/jobs',headers=ch,json={'title':'Auxiliar de compras','description':'Controles e notas fiscais','skills':['Excel']})
    assert resp.status_code==201,resp.text


def test_registration_and_company_verification(client):
    body={'full_name':'Empresa Teste','email':'nova@teste.com','password':'Senha123!','role':'company','company_name':'Nova Companhia'}
    assert client.post('/api/auth/register',json=body).status_code==201
    assert client.post('/api/auth/register',json=body).status_code==409
    resp=client.post('/api/auth/login',json={'email':'nova@teste.com','password':'Senha123!'})
    ch={'Authorization':'Bearer '+resp.json()['token']}
    assert client.post('/api/company/jobs',headers=ch,json={'title':'Cargo Teste','description':'Uma vaga'}).status_code==403
    admin=login(client,'semispe@demo.slz')
    cs=client.get('/api/admin/overview',headers=admin).json()['companies']
    cid=next(c['id'] for c in cs if c['name']=='Nova Companhia')
    assert client.patch(f'/api/admin/companies/{cid}',headers=admin,json={'verified':True}).status_code==200
    assert client.post('/api/company/jobs',headers=ch,json={'title':'Cargo Teste','description':'Uma vaga'}).status_code==201


def test_services_and_contact(client):
    h=login(client,'morador@demo.slz')
    assert client.post('/api/services',headers=h,json={'title':'Consultoria administrativa','description':'Planilhas'}).status_code==201
    assert len(client.get('/api/services/my',headers=h).json())==2
    other=login(client,'joao@demo.slz')
    assert client.post('/api/services/1/inquire',headers=other,json={'message':'Gostaria de conversar sobre os serviços.'}).status_code==201
    assert len(client.get('/api/services/inquiries/my',headers=h).json())==1


def test_match_is_explainable():
    p={'skills':['excel','comunicacao'],'education':'Médio','experience_months':0}
    j={'skills':['Excel','Comunicação','NR-10'],'education':'Técnico','experience_months':12}
    m=calculate_match(p,j)
    assert m['found_skills']==['Excel','Comunicação']
    assert m['missing_skills']==['NR-10']
    assert m['score']==47
    assert 'não é chance de contratação' in m['disclaimer']
