
import os
import sqlite3
from pathlib import Path


# Directorio principal del proyecto
BASE_DIR = Path(__file__).resolve().parents[2]

# Ubicación de la base de datos
DB_PATH = Path(
    os.getenv("DATABASE_PATH", str(BASE_DIR / "usuarios.db"))
)


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
