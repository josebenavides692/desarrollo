
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
from app.controllers.evento_controller import router as evento_router
from app.controllers.auth_controller import router as auth_router
from app.controllers.evento_controller import router as evento_router
from app.models.database import conectar_db, inicializar_db

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

app.include_router(evento_router)
app.include_router(auth_router)

pp.mount(
    "/static",
    StaticFiles(directory="app/static"),
    name="static"
)

templates = Jinja2Templates(
    directory="app/views"
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


@app.get("/eventos")
def listar_eventos():
    return {"eventos": ["CONIITI 2024", "Taller React", "Charla IA"]}
    

@app.get("/usuarios/me")
def consultar_perfil(request: Request):
    usuario = usuario_actual(request)

    return {
        "nombre": usuario["nombre"],
        "correo": usuario["correo"],
        "telefono": usuario["telefono"]
    }


@app.put("/usuarios/me")
def actualizar_perfil(datos: DatosPerfil, request: Request):
    usuario = usuario_actual(request)

    nombre = datos.nombre.strip()
    correo = validar_correo(datos.correo)
    telefono = datos.telefono.strip()

    if len(nombre) < 2:
        raise HTTPException(
            status_code=422,
            detail="El nombre debe tener al menos 2 caracteres."
        )

    try:
        with conectar_db() as conexion:
            conexion.execute(
                """
                UPDATE usuarios
                SET nombre = ?, correo = ?, telefono = ?
                WHERE id = ?
                """,
                (nombre, correo, telefono, usuario["id"])
            )
    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=409,
            detail="Ese correo ya pertenece a otra cuenta."
        )

    return {"mensaje": "Perfil actualizado correctamente."}
    

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


@app.get("/style.css")
def estilo_principal():
    return FileResponse(BASE_DIR / "style.css")


@app.get("/registro.css")
def estilo_registro():
    return FileResponse(BASE_DIR / "registro.css")


@app.get("/perfil.css")
def estilo_perfil():
    return FileResponse(BASE_DIR / "perfil.css")


@app.get("/registro.js")
def javascript_registro():
    return FileResponse(BASE_DIR / "registro.js")


@app.get("/login.js")
def javascript_login():
    return FileResponse(BASE_DIR / "login.js")


@app.get("/perfil.js")
def javascript_perfil():
    return FileResponse(BASE_DIR / "perfil.js")


@app.get("/code.js")
def javascript_principal():
    return FileResponse(BASE_DIR / "code.js")
