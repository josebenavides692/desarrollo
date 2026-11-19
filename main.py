import os
import re
import sqlite3
import hashlib
import secrets
import hmac

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, Field
from starlette.middleware.sessions import SessionMiddleware

from fastapi.responses import FileResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles

from app.controllers.events_controller import router as events_router
from app.controllers.auth_controller import router as auth_router
from app.controllers.usuario_controller import router as usuario_router

from app.models.database import inicializar_db

BASE_DIR = Path(__file__).resolve().parent
VIEWS_DIR = BASE_DIR / "app" / "views"

SESSION_SECRET = os.getenv(
    "SESSION_SECRET_KEY",
    "CAMBIAR-ESTA-CLAVE-ANTES-DE-PUBLICAR-MOKEN"
)

if SESSION_SECRET == "CAMBIAR-ESTA-CLAVE-ANTES-DE-PUBLICAR-MOKEN":
    print("ADVERTENCIA: configura SESSION_SECRET_KEY antes de publicar.")

PASSWORD_ITERATIONS = 2**14

@asynccontextmanager
async def lifespan(app: FastAPI):
    inicializar_db()
    yield


app = FastAPI(lifespan=lifespan)

app.include_router(events_router)
app.include_router(auth_router)
app.include_router(usuario_router)

app.mount(
    "/static",
    StaticFiles(directory=str(BASE_DIR / "app" / "static")),
    name="static"
)


app.add_middleware(
    SessionMiddleware,
    secret_key=SESSION_SECRET,
    session_cookie="moken_session",
    same_site="lax",
    https_only=os.getenv("ENVIRONMENT") == "production",
    max_age=60 * 60 * 8
)

class DatosPerfil(BaseModel):
    nombre: str = Field(min_length=2, max_length=100)
    correo: str = Field(min_length=5, max_length=254)
    telefono: str = Field(default="", max_length=25)
    

@app.get("/")
def home():
    return FileResponse(VIEWS_DIR / "principal.html")
    

@app.get("/principal.html")
def pagina_principal():
    return FileResponse(VIEWS_DIR / "principal.html")


@app.get("/registro.html")
def pagina_registro():
    return FileResponse(VIEWS_DIR / "registro.html")


@app.get("/login.html")
def pagina_login():
    return FileResponse(VIEWS_DIR / "login.html")


@app.get("/perfil.html")
def pagina_perfil():
    return FileResponse(VIEWS_DIR / "perfil.html")


@app.get("/general.html")
def pagina_general():
    return FileResponse(VIEWS_DIR / "general.html")


@app.get("/objetivo.html")
def pagina_objetivo():
    return FileResponse(VIEWS_DIR / "objetivo.html")
