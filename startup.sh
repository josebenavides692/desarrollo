#!/bin/bash 
# Script de inicio para FastAPI en Azure App Service 
# El puerto lo asigna Azure automáticamente 
PORT=${PORT:-8000} 
echo "==========================================" 
echo "🚀 Iniciando FastAPI en el puerto $PORT" 
echo "📁 Archivo principal: main.py"
echo "🔧 Instancia de FastAPI: app" 
echo "==========================================" 
# Iniciar la aplicación con Gunicorn 
# IMPORTANTE: Si su archivo no es main.py o la instancia no es app,
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:$PORT EOF 
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:$PORT

