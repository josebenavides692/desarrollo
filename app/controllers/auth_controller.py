
import re
import hashlib
import secrets
import hmac
import sqlite3

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from app.models.usuario import (
    crear_usuario,
    obtener_usuario_por_correo,
    obtener_usuario_por_id
)


router = APIRouter()

PASSWORD_ITERATIONS = 2**14


# -------------------------
# Modelos de datos
# -------------------------

class RegistroUsuario(BaseModel):
    nombre: str = Field(min_length=2, max_length=100)
    correo: str = Field(min_length=5, max_length=254)
    clave: str = Field(min_length=8, max_length=128)


class LoginUsuario(BaseModel):
    correo: str = Field(min_length=5, max_length=254)
    clave: str = Field(min_length=8, max_length=128)


# -------------------------
# Validaciones
# -------------------------

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


# -------------------------
# Seguridad de contraseñas
# -------------------------

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


# -------------------------
# Registro de usuarios
# -------------------------

@router.post("/usuarios", status_code=201)
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
        usuario_id = crear_usuario(
            nombre,
            correo,
            clave_hash
        )

    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=409,
            detail="Ya existe una cuenta con ese correo."
        )

    return {
        "mensaje": "Cuenta creada correctamente.",
        "usuario_id": usuario_id
    }


# -------------------------
# Inicio de sesión
# -------------------------

@router.post("/login")
def iniciar_sesion(datos: LoginUsuario, request: Request):

    correo = validar_correo(datos.correo)

    usuario = obtener_usuario_por_correo(correo)

    if usuario is None or not verificar_clave(
        datos.clave,
        usuario["clave_hash"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Correo o contraseña incorrectos."
        )

    request.session.clear()
    request.session["usuario_id"] = usuario["id"]

    return {
        "mensaje": "Sesión iniciada correctamente."
    }


# -------------------------
# Comprobación de sesión
# -------------------------

def usuario_actual(request: Request):

    usuario_id = request.session.get("usuario_id")

    if usuario_id is None:
        raise HTTPException(
            status_code=401,
            detail="Debes iniciar sesión."
        )

    usuario = obtener_usuario_por_id(usuario_id)

    if usuario is None:
        request.session.clear()

        raise HTTPException(
            status_code=401,
            detail="La sesión ya no es válida."
        )

    return usuario


# -------------------------
# Cierre de sesión
# -------------------------

@router.post("/logout")
def cerrar_sesion(request: Request):

    request.session.clear()

    return {
        "mensaje": "Sesión cerrada correctamente."
    }
