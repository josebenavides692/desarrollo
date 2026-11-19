
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

    # Activar las claves foráneas de SQLite
    conexion.execute("PRAGMA foreign_keys = ON")

    return conexion


def inicializar_db():

    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    with conectar_db() as conexion:

        # Tabla de usuarios
        conexion.execute("""
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                correo TEXT NOT NULL UNIQUE,
                clave_hash TEXT NOT NULL,
                telefono TEXT NOT NULL DEFAULT ''
            )
        """)

        # Tabla de eventos
        conexion.execute("""
            CREATE TABLE IF NOT EXISTS eventos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id INTEGER NOT NULL,
                nombre TEXT NOT NULL,
                descripcion TEXT NOT NULL DEFAULT '',
                fecha TEXT,
                lugar TEXT NOT NULL DEFAULT '',
                creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (usuario_id)
                    REFERENCES usuarios(id)
                    ON DELETE CASCADE
            )
        """)

        # Migración para bases de datos existentes
        columnas = conexion.execute(
            "PRAGMA table_info(eventos)"
        ).fetchall()

        nombres_columnas = [
            columna["name"] for columna in columnas
        ]

        if "usuario_id" not in nombres_columnas:

            conexion.execute("""
                ALTER TABLE eventos
                ADD COLUMN usuario_id INTEGER
                REFERENCES usuarios(id)
                ON DELETE CASCADE
            """)

        # Índice para consultar eventos por propietario
        conexion.execute("""
            CREATE INDEX IF NOT EXISTS idx_eventos_usuario
            ON eventos(usuario_id)
        """)
