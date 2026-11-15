"""Score determinístico, explicável e SEM IA; não prediz contratação.

70% competências, 20% escolaridade, 10% experiência. O peso dos requisitos
é apenas uma escolha inicial de produto, ajustável após validação da SEMISPE.
"""
import json
import re
import unicodedata

EDUCATION_LEVELS = ['Não informado', 'Fundamental', 'Médio', 'Técnico', 'Superior', 'Pós-graduação']


def normalize(value):
    txt = unicodedata.normalize('NFKD', str(value or '').lower())
    txt = ''.join(ch for ch in txt if not unicodedata.combining(ch))
    return re.sub(r'\s+', ' ', txt).strip()


def as_list(value):
    if isinstance(value, list):
        return value
    if not value:
        return []
    try:
        parsed = json.loads(value)
        if isinstance(parsed, list):
            return parsed
    except (ValueError, TypeError):
        pass
    return [x.strip() for x in str(value).split(',') if x.strip()]


def calculate_match(profile: dict, job: dict):
    candidate = {normalize(s) for s in as_list(profile.get('skills'))}
    needed = as_list(job.get('skills'))
    found = [s for s in needed if normalize(s) in candidate]
    missing = [s for s in needed if normalize(s) not in candidate]
    skill_score = len(found) / len(needed) if needed else 1
    required = job.get('education') or 'Não informado'
    mine = profile.get('education') or 'Não informado'
    edu_score = int(EDUCATION_LEVELS.index(mine) >= EDUCATION_LEVELS.index(required)) if mine in EDUCATION_LEVELS and required in EDUCATION_LEVELS else 0
    required_months = max(0, int(job.get('experience_months') or 0))
    mine_months = max(0, int(profile.get('experience_months') or 0))
    exp_score = 1 if not required_months else min(1, mine_months / required_months)
    score = round(100 * (0.7 * skill_score + 0.2 * edu_score + 0.1 * exp_score))
    notes = []
    if missing:
        notes.append('Competências a desenvolver: ' + ', '.join(missing))
    if not edu_score:
        notes.append('Escolaridade exigida: ' + required)
    if exp_score < 1:
        notes.append(f'Experiência: {required_months} meses exigidos; {mine_months} informados')
    if not notes:
        notes.append('Você atende aos critérios estruturados avaliados.')
    return {'score': score, 'found_skills': found, 'missing_skills': missing,
            'education_ok': bool(edu_score), 'experience_ok': exp_score >= 1,
            'notes': notes, 'weights': {'skills': 70, 'education': 20, 'experience': 10},
            'disclaimer': 'Compatibilidade com requisitos declarados; não é chance de contratação nem decisão seletiva.'}
