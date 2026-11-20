from datetime import date
from typing import Literal, Optional

from fastapi import APIRouter, Request
from pydantic import BaseModel, Field

from app.controllers.auth_controller import usuario_actual
from app.models.calendario import guardar_registro, listar_registros


router = APIRouter(prefix="/registros-diarios", tags=["Calendario"])


class RegistroDiario(BaseModel):
    resultado: Literal["cumplida", "dificil"]
    estado: Optional[Literal["calma", "energia", "ansiedad", "desanimo"]] = None
    nota: str = Field(default="", max_length=2000)


@router.get("")
def consultar_calendario(request: Request):
    usuario = usuario_actual(request)
    return {"registros": listar_registros(usuario["id"])}


@router.put("/{fecha}")
def actualizar_registro(fecha: date, datos: RegistroDiario, request: Request):
    usuario = usuario_actual(request)
    guardar_registro(usuario["id"], fecha.isoformat(), datos.resultado, datos.estado, datos.nota)
    return {"fecha": fecha, "resultado": datos.resultado, "estado": datos.estado, "nota": datos.nota}
