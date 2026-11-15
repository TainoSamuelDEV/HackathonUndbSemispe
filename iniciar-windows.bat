@echo off
cd /d "%~dp0"
python -m pip install -r backend\requirements.txt
if errorlevel 1 (
 echo Nao foi possivel instalar as dependencias. Verifique Python 3.10+ e conexao com a internet.
 pause
 exit /b 1
)
start "Vaga Certa SLZ - Servidor" /B python start.py
timeout /t 3 /nobreak >nul
start "" http://127.0.0.1:8000
echo.
echo Vaga Certa SLZ: http://127.0.0.1:8000
echo Para encerrar, feche esta janela.
pause
