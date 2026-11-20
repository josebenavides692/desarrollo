
import os

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from starlette.middleware.sessions import SessionMiddleware

# -------------------------
# Controladores
# -------------------------

from app.controllers.auth_controller import router as auth_router
from app.controllers.usuario_controller import router as usuario_router
from app.controllers.events_controller import router as events_router
from app.controllers.objetivos_controller import router as objetivos_router
from app.controllers.calendario_controller import router as calendario_router

# -------------------------
# Base de datos
# -------------------------

from app.models.database import inicializar_db


# -------------------------
# Configuración general
# -------------------------

BASE_DIR = Path(__file__).resolve().parent

VIEWS_DIR = BASE_DIR / "app" / "views"

SESSION_SECRET = os.getenv(
    "SESSION_SECRET_KEY",
    "CAMBIAR-ESTA-CLAVE-ANTES-DE-PUBLICAR-MOKEN"
)

if SESSION_SECRET == "CAMBIAR-ESTA-CLAVE-ANTES-DE-PUBLICAR-MOKEN":
    print(
        "ADVERTENCIA: configura SESSION_SECRET_KEY antes de publicar."
    )


# -------------------------
# Inicialización de la aplicación
# -------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):

    inicializar_db()

    yield


app = FastAPI(lifespan=lifespan)

# -------------------------
# Middleware de sesiones
# -------------------------

app.add_middleware(
    SessionMiddleware,
    secret_key=SESSION_SECRET,
    session_cookie="moken_session",
    same_site="lax",
    https_only=os.getenv("ENVIRONMENT") == "production",
    max_age=60 * 60 * 8
)


# -------------------------
# Registro de controladores
# -------------------------

app.include_router(auth_router)
app.include_router(usuario_router)
app.include_router(events_router)
app.include_router(objetivos_router)
app.include_router(calendario_router)


# -------------------------
# Archivos estáticos
# -------------------------

app.mount(
    "/static",
    StaticFiles(directory=str(BASE_DIR / "app" / "static")),
    name="static"
)


# -------------------------
# Rutas de las vistas
# -------------------------

@app.get("/")
def home():

    return FileResponse(
        VIEWS_DIR / "principal.html"
    )


@app.get("/principal.html")
def pagina_principal():

    return FileResponse(
        VIEWS_DIR / "principal.html"
    )


@app.get("/registro.html")
def pagina_registro():

    return FileResponse(
        VIEWS_DIR / "registro.html"
    )


@app.get("/login.html")
def pagina_login():

    return FileResponse(
        VIEWS_DIR / "login.html"
    )


@app.get("/perfil.html")
def pagina_perfil():

    return FileResponse(
        VIEWS_DIR / "perfil.html"
    )


@app.get("/general.html")
def pagina_general():

    return FileResponse(
        VIEWS_DIR / "general.html"
    )


@app.get("/objetivo.html")
def pagina_objetivo():
    return FileResponse(VIEWS_DIR / "objetivo.html")


@app.get("/calendario.html")
def pagina_calendario():
    return FileResponse(VIEWS_DIR / "calendario.html")
