"""Senhas e sessões da demonstração; não substituir por login gov.br sem homologação."""
import hashlib
import hmac
import secrets
import time

ITERATIONS = 240_000


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac('sha256', password.encode(), bytes.fromhex(salt), ITERATIONS)
    return f'pbkdf2_sha256${ITERATIONS}${salt}${digest.hex()}'


def verify_password(password: str, saved: str) -> bool:
    try:
        algo, rounds, salt, expected = saved.split('$')
        if algo != 'pbkdf2_sha256':
            return False
        actual = hashlib.pbkdf2_hmac('sha256', password.encode(), bytes.fromhex(salt), int(rounds))
        return hmac.compare_digest(actual.hex(), expected)
    except (ValueError, TypeError):
        return False


def new_token() -> str:
    return secrets.token_urlsafe(40)


def expiry() -> int:
    return int(time.time()) + 60 * 60 * 24 * 7
