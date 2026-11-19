
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional

from app.models.events import (
    crear_evento,
    obtener_eventos,
    obtener_evento_por_id,
    actualizar_evento,
    eliminar_evento
)

router = APIRouter(tags=["Eventos"])


# -------------------------
# Esquemas de los eventos
# -------------------------

class EventoCrear(BaseModel):
    nombre: str = Field(min_length=1)
    descripcion: str = ""
    fecha: Optional[str] = None
    lugar: str = ""


class EventoActualizar(BaseModel):
    nombre: str = Field(min_length=1)
    descripcion: str = ""
    fecha: Optional[str] = None
    lugar: str = ""


# -------------------------
# Obtener todos los eventos
# -------------------------

@router.get("/eventos")
def listar_eventos():

    eventos = obtener_eventos()

    return {
        "eventos": eventos
    }


# -------------------------
# Crear un evento
# -------------------------

@router.post("/eventos", status_code=status.HTTP_201_CREATED)
def registrar_evento(datos: EventoCrear):

    evento_id = crear_evento(
        datos.nombre,
        datos.descripcion,
        datos.fecha,
        datos.lugar
    )

    evento = obtener_evento_por_id(evento_id)

    return {
        "mensaje": "Evento creado correctamente",
        "evento": evento
    }


# -------------------------
# Obtener un evento por ID
# -------------------------

@router.get("/eventos/{evento_id}")
def consultar_evento(evento_id: int):

    evento = obtener_evento_por_id(evento_id)

    if evento is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El evento no existe"
        )

    return evento


# -------------------------
# Actualizar un evento
# -------------------------

@router.put("/eventos/{evento_id}")
def modificar_evento(evento_id: int, datos: EventoActualizar):

    evento = obtener_evento_por_id(evento_id)

    if evento is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El evento no existe"
        )

    actualizar_evento(
        evento_id,
        datos.nombre,
        datos.descripcion,
        datos.fecha,
        datos.lugar
    )

    evento_actualizado = obtener_evento_por_id(evento_id)

    return {
        "mensaje": "Evento actualizado correctamente",
        "evento": evento_actualizado
    }


# -------------------------
# Eliminar un evento
# -------------------------

@router.delete("/eventos/{evento_id}")
def borrar_evento(evento_id: int):

    eliminado = eliminar_evento(evento_id)

    if not eliminado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El evento no existe"
        )

    return {
        "mensaje": "Evento eliminado correctamente"
    }
