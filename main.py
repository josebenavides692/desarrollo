
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

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = Path(os.getenv("DATABASE_PATH", str(BASE_DIR / "usuarios.db")))

SESSION_SECRET = os.getenv(
    "SESSION_SECRET_KEY",
    "CAMBIAR-ESTA-CLAVE-ANTES-DE-PUBLICAR-MOKEN"
)

if SESSION_SECRET == "CAMBIAR-ESTA-CLAVE-ANTES-DE-PUBLICAR-MOKEN":
    print("ADVERTENCIA: configura SESSION_SECRET_KEY antes de publicar.")

PASSWORD_ITERATIONS = 2**14


def conectar_db():
    conexion = sqlite3.connect(DB_PATH)
    conexion.row_factory = sqlite3.Row
    return conexion


def inicializar_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    with conectar_db() as conexion:
        conexion.execute("""
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                correo TEXT NOT NULL UNIQUE,
                clave_hash TEXT NOT NULL,
                telefono TEXT NOT NULL DEFAULT ''
            )
        """)


@asynccontextmanager
async def lifespan(app: FastAPI):
    inicializar_db()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    SessionMiddleware,
    secret_key=SESSION_SECRET,
    session_cookie="moken_session",
    same_site="lax",
    https_only=os.getenv("ENVIRONMENT") == "production",
    max_age=60 * 60 * 8
)


class RegistroUsuario(BaseModel):
    correo: str = Field(min_length=5, max_length=254)
    clave: str = Field(min_length=8, max_length=128)


class DatosPerfil(BaseModel):
    nombre: str = Field(min_length=2, max_length=100)
    correo: str = Field(min_length=5, max_length=254)
    telefono: str = Field(default="", max_length=25)


def validar_correo(correo: str) -> str:
    correo = correo.strip().lower()

    patron = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
    if not re.fullmatch(patron, correo):
        raise HTTPException(
            status_code=422,
            detail="Introduce un correo electrónico válido."
        )

    return correo


def validar_clave(clave: str):
    if not re.search(r"[A-Za-z]", clave) or not re.search(r"\d", clave):
        raise HTTPException(
            status_code=422,
            detail="La contraseña debe contener letras y números."
        )


def crear_hash(clave: str) -> str:
    salt = secrets.token_bytes(16)
    resultado = hashlib.scrypt(
        clave.encode("utf-8"),
        salt=salt,
        n=PASSWORD_ITERATIONS,
        r=8,
        p=1
    )
    return f"{salt.hex()}:{resultado.hex()}"


def verificar_clave(clave: str, almacenado: str) -> bool:
    try:
        salt_hex, hash_hex = almacenado.split(":")
        salt = bytes.fromhex(salt_hex)
        esperado = bytes.fromhex(hash_hex)

        calculado = hashlib.scrypt(
            clave.encode("utf-8"),
            salt=salt,
            n=PASSWORD_ITERATIONS,
            r=8,
            p=1,
            dklen=len(esperado)
        )

        return hmac.compare_digest(calculado, esperado)
    except (ValueError, TypeError):
        return False


def usuario_actual(request: Request):
    usuario_id = request.session.get("usuario_id")

    if usuario_id is None:
        raise HTTPException(
            status_code=401,
            detail="Debes iniciar sesión."
        )

    with conectar_db() as conexion:
        usuario = conexion.execute(
            """
            SELECT id, nombre, correo, telefono
            FROM usuarios
            WHERE id = ?
            """,
            (usuario_id,)
        ).fetchone()

    if usuario is None:
        request.session.clear()
        raise HTTPException(
            status_code=401,
            detail="La sesión ya no es válida."
        )

    return usuario


@app.get("/")
def home():
    return FileResponse(BASE_DIR / "principal.html")


@app.get("/eventos")
def listar_eventos():
    return {"eventos": ["CONIITI 2024", "Taller React", "Charla IA"]}


@app.post("/usuarios", status_code=201)
def registrar_usuario(datos: RegistroUsuario):
    nombre = datos.nombre.strip()
    correo = validar_correo(datos.correo)

    if len(nombre) < 2:
        raise HTTPException(
            status_code=422,
            detail="El nombre debe tener al menos 2 caracteres."
        )

    validar_clave(datos.clave)
    clave_hash = crear_hash(datos.clave)

    try:
        with conectar_db() as conexion:
            cursor = conexion.execute(
                """
                INSERT INTO usuarios (nombre, correo, clave_hash)
                VALUES (?, ?, ?)
                """,
                (nombre, correo, clave_hash)
            )
            usuario_id = cursor.lastrowid
    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=409,
            detail="Ya existe una cuenta con ese correo."
        )

    return {
        "mensaje": "Cuenta creada correctamente.",
        "usuario_id": usuario_id
    }


@app.post("/login")
def iniciar_sesion(datos: LoginUsuario, request: Request):
    correo = validar_correo(datos.correo)

    with conectar_db() as conexion:
        usuario = conexion.execute(
            """
            SELECT id, clave_hash
            FROM usuarios
            WHERE correo = ?
            """,
            (correo,)
        ).fetchone()

    if usuario is None or not verificar_clave(
        datos.clave, usuario["clave_hash"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Correo o contraseña incorrectos."
        )

    request.session.clear()
    request.session["usuario_id"] = usuario["id"]

    return {"mensaje": "Sesión iniciada correctamente."}


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


@app.post("/logout")
def cerrar_sesion(request: Request):
    request.session.clear()
    return {"mensaje": "Sesión cerrada correctamente."}

@app.get("/principal.html")
def pagina_principal():
    return FileResponse(BASE_DIR / "principal.html")


@app.get("/registro.html")
def pagina_registro():
    return FileResponse(BASE_DIR / "registro.html")


@app.get("/login.html")
def pagina_login():
    return FileResponse(BASE_DIR / "login.html")


@app.get("/perfil.html")
def pagina_perfil():
    return FileResponse(BASE_DIR / "perfil.html")


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