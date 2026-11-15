"""Persistência SQLite: fácil de estudar e migrar posteriormente para PostgreSQL."""
import json
import os
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DB_PATH = Path(os.getenv('DATABASE_PATH', str(ROOT / 'data' / 'conecta.db')))

SCHEMA = '''
CREATE TABLE IF NOT EXISTS users (
 id INTEGER PRIMARY KEY, role TEXT NOT NULL CHECK(role IN ('worker','company','admin')),
 full_name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
 phone TEXT DEFAULT '', neighborhood TEXT DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS sessions (
 token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS profiles (
 user_id INTEGER PRIMARY KEY REFERENCES users(id), headline TEXT DEFAULT '', summary TEXT DEFAULT '',
 education TEXT DEFAULT 'Médio', experience_months INTEGER DEFAULT 0, skills TEXT DEFAULT '[]',
 work_history TEXT DEFAULT '[]', education_history TEXT DEFAULT '[]', updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS companies (
 id INTEGER PRIMARY KEY, user_id INTEGER UNIQUE REFERENCES users(id), name TEXT NOT NULL,
 sector TEXT DEFAULT '', location TEXT DEFAULT '', description TEXT DEFAULT '', verified INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS jobs (
 id INTEGER PRIMARY KEY, company_id INTEGER NOT NULL REFERENCES companies(id), title TEXT NOT NULL,
 description TEXT NOT NULL, requirements TEXT DEFAULT '', skills TEXT DEFAULT '[]', education TEXT DEFAULT 'Médio',
 experience_months INTEGER DEFAULT 0, salary TEXT DEFAULT 'A combinar', modality TEXT DEFAULT 'Presencial',
 contract TEXT DEFAULT 'CLT', pcd INTEGER DEFAULT 0, no_experience INTEGER DEFAULT 0,
 location TEXT DEFAULT 'São Luís - MA', neighborhood TEXT DEFAULT '', vacancies INTEGER DEFAULT 1,
 status TEXT DEFAULT 'aberta', deadline TEXT DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS applications (
 id INTEGER PRIMARY KEY, job_id INTEGER REFERENCES jobs(id), worker_id INTEGER REFERENCES users(id),
 status TEXT DEFAULT 'enviada', feedback TEXT DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(job_id,worker_id));
CREATE TABLE IF NOT EXISTS courses (
 id INTEGER PRIMARY KEY, title TEXT NOT NULL, description TEXT DEFAULT '', provider TEXT DEFAULT '',
 modality TEXT DEFAULT 'Presencial', neighborhood TEXT DEFAULT '', category TEXT DEFAULT 'Geral',
 hours INTEGER DEFAULT 20, seats INTEGER DEFAULT 30, skills TEXT DEFAULT '[]',
 enrollment_deadline TEXT DEFAULT '', status TEXT DEFAULT 'aberto', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS course_enrollments (
 id INTEGER PRIMARY KEY, course_id INTEGER REFERENCES courses(id), worker_id INTEGER REFERENCES users(id),
 status TEXT DEFAULT 'inscrito', created_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(course_id,worker_id));
CREATE TABLE IF NOT EXISTS course_requests (
 id INTEGER PRIMARY KEY, worker_id INTEGER REFERENCES users(id), title TEXT NOT NULL, reason TEXT DEFAULT '',
 status TEXT DEFAULT 'pendente', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS services (
 id INTEGER PRIMARY KEY, worker_id INTEGER REFERENCES users(id), title TEXT NOT NULL, category TEXT DEFAULT '',
 description TEXT DEFAULT '', neighborhood TEXT DEFAULT '', price_note TEXT DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS service_inquiries (
 id INTEGER PRIMARY KEY, service_id INTEGER REFERENCES services(id), sender_id INTEGER REFERENCES users(id),
 message TEXT NOT NULL, status TEXT DEFAULT 'enviada', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_app_worker ON applications(worker_id);
CREATE INDEX IF NOT EXISTS idx_course_requests_title ON course_requests(title);
'''


def connect():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=15)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA foreign_keys=ON')
    conn.execute('PRAGMA busy_timeout=15000')
    return conn


def init_db():
    with connect() as db:
        db.executescript(SCHEMA)
        if not db.execute('SELECT 1 FROM users LIMIT 1').fetchone():
            from .seed import seed
            seed(db)


def one(db, sql, args=()):
    result = db.execute(sql, args).fetchone()
    return dict(result) if result else None


def many(db, sql, args=()):
    return [dict(row) for row in db.execute(sql, args).fetchall()]


def dump(value):
    return json.dumps(value, ensure_ascii=False)


def unpack(record, *fields):
    if not record:
        return record
    result = dict(record)
    for f in fields:
        if f in result:
            try:
                result[f] = json.loads(result[f] or '[]')
            except ValueError:
                result[f] = []
    return result
