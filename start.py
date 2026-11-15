"""Inicie na raiz do projeto: python start.py"""
import os
import uvicorn

if __name__ == '__main__':
    print('Vaga Certa SLZ disponível em http://127.0.0.1:8000')
    uvicorn.run('backend.app.main:app',host=os.getenv('HOST','127.0.0.1'),port=int(os.getenv('PORT','8000')),reload=False)
