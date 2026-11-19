
from fastapi import APIRouter

from app.models.evento import obtener_eventos

router = APIRouter()


@router.get("/eventos")
def listar_eventos():
    return {
        "eventos": obtener_eventos()
    }
