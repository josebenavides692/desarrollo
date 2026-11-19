
import sqlite3

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from app.models.usuario import actualizar_usuario
from app.controllers.auth_controller import usuario_actual, validar_correo


router = APIRouter()


# -------------------------
# Modelo de actualización
# -------------------------

class ActualizarPerfil(BaseModel):
    nombre: str = Field(min_length=2, max_length=100)
    correo: str = Field(min_length=5, max_length=254)
    telefono: str = Field(default="", max_length=20)


# -------------------------
# Consultar perfil
# -------------------------

@router.get("/perfil")
def consultar_perfil(request: Request):

    usuario = usuario_actual(request)

    return {
        "id": usuario["id"],
        "nombre": usuario["nombre"],
        "correo": usuario["correo"],
        "telefono": usuario["telefono"]
    }


# -------------------------
# Actualizar perfil
# -------------------------

@router.put("/perfil")
def actualizar_perfil(datos: ActualizarPerfil, request: Request):

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
        actualizar_usuario(
            usuario["id"],
            nombre,
            correo,
            telefono
        )

    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=409,
            detail="Ya existe otro usuario con ese correo."
        )

    return {
        "mensaje": "Perfil actualizado correctamente.",
        "nombre": nombre,
        "correo": correo,
        "telefono": telefono
    }
