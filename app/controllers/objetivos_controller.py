
from typing import Optional, Literal

from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel, Field

from app.controllers.auth_controller import usuario_actual

from app.models.objetivos import (
    crear_objetivo,
    obtener_objetivos,
    obtener_objetivo_por_id,
    actualizar_objetivo,
    eliminar_objetivo
)


router = APIRouter(tags=["Objetivos"])


# -------------------------
# Esquemas de los objetivos
# -------------------------

class ObjetivoCrear(BaseModel):

    habito: str = Field(min_length=1, max_length=150)
    intencion: str = Field(min_length=5, max_length=500)
    hito: str = Field(min_length=1, max_length=200)
    fecha_limite: Optional[str] = None
    privacidad: Literal["privado", "publico"] = "privado"


class ObjetivoActualizar(BaseModel):

    habito: str = Field(min_length=1, max_length=150)
    intencion: str = Field(min_length=5, max_length=500)
    hito: str = Field(min_length=1, max_length=200)
    fecha_limite: Optional[str] = None
    privacidad: Literal["privado", "publico"] = "privado"


# -------------------------
# Obtener todos los objetivos
# -------------------------

@router.get("/objetivos")
def listar_objetivos(request: Request):

    usuario = usuario_actual(request)

    objetivos = obtener_objetivos(usuario["id"])

    return {
        "objetivos": objetivos
    }


# -------------------------
# Crear un objetivo
# -------------------------

@router.post(
    "/objetivos",
    status_code=status.HTTP_201_CREATED
)
def registrar_objetivo(datos: ObjetivoCrear, request: Request):

    usuario = usuario_actual(request)

    objetivo_id = crear_objetivo(
        usuario["id"],
        datos.habito.strip(),
        datos.intencion.strip(),
        datos.hito.strip(),
        datos.fecha_limite,
        datos.privacidad
    )

    objetivo = obtener_objetivo_por_id(
        objetivo_id,
        usuario["id"]
    )

    return {
        "mensaje": "Objetivo creado correctamente",
        "objetivo": objetivo
    }


# -------------------------
# Obtener un objetivo por ID
# -------------------------

@router.get("/objetivos/{objetivo_id}")
def consultar_objetivo(objetivo_id: int, request: Request):

    usuario = usuario_actual(request)

    objetivo = obtener_objetivo_por_id(
        objetivo_id,
        usuario["id"]
    )

    if objetivo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El objetivo no existe"
        )

    return objetivo


# -------------------------
# Actualizar un objetivo
# -------------------------

@router.put("/objetivos/{objetivo_id}")
def modificar_objetivo(
    objetivo_id: int,
    datos: ObjetivoActualizar,
    request: Request
):

    usuario = usuario_actual(request)

    actualizado = actualizar_objetivo(
        objetivo_id,
        usuario["id"],
        datos.habito.strip(),
        datos.intencion.strip(),
        datos.hito.strip(),
        datos.fecha_limite,
        datos.privacidad
    )

    if not actualizado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El objetivo no existe"
        )

    objetivo = obtener_objetivo_por_id(
        objetivo_id,
        usuario["id"]
    )

    return {
        "mensaje": "Objetivo actualizado correctamente",
        "objetivo": objetivo
    }


# -------------------------
# Eliminar un objetivo
# -------------------------

@router.delete("/objetivos/{objetivo_id}")
def borrar_objetivo(objetivo_id: int, request: Request):

    usuario = usuario_actual(request)

    eliminado = eliminar_objetivo(
        objetivo_id,
        usuario["id"]
    )

    if not eliminado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El objetivo no existe"
        )

    return {
        "mensaje": "Objetivo eliminado correctamente"
    }
