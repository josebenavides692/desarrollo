
import os
import sqlite3
from pathlib import Path


# -------------------------
# Configuración de la base de datos
# -------------------------

BASE_DIR = Path(__file__).resolve().parents[2]

DB_PATH = Path(
    os.getenv("DATABASE_PATH", str(BASE_DIR / "usuarios.db"))
)


# -------------------------
# Conexión con SQLite
# -------------------------

def conectar_db():

    conexion = sqlite3.connect(DB_PATH)

    conexion.row_factory = sqlite3.Row

    # Activar claves foráneas
    conexion.execute("PRAGMA foreign_keys = ON")

    return conexion


# -------------------------
# Inicialización de la base
# de datos y sus tablas
# -------------------------

def inicializar_db():

    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    with conectar_db() as conexion:

        # -------------------------
        # Tabla de usuarios
        # -------------------------

        conexion.execute("""
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                correo TEXT NOT NULL UNIQUE,
                clave_hash TEXT NOT NULL,
                telefono TEXT NOT NULL DEFAULT ''
            )
        """)

        # -------------------------
        # Tabla de eventos
        # -------------------------

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

        # -------------------------
        # Migración de eventos
        # para bases de datos anteriores
        # -------------------------

        columnas_eventos = conexion.execute(
            "PRAGMA table_info(eventos)"
        ).fetchall()

        nombres_columnas_eventos = [
            columna["name"]
            for columna in columnas_eventos
        ]

        if "usuario_id" not in nombres_columnas_eventos:

            conexion.execute("""
                ALTER TABLE eventos
                ADD COLUMN usuario_id INTEGER
                REFERENCES usuarios(id)
                ON DELETE CASCADE
            """)

        # Índice de eventos por usuario
        conexion.execute("""
            CREATE INDEX IF NOT EXISTS idx_eventos_usuario
            ON eventos(usuario_id)
        """)

        # -------------------------
        # Tabla de objetivos
        # -------------------------

        conexion.execute("""
            CREATE TABLE IF NOT EXISTS objetivos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id INTEGER NOT NULL,
                habito TEXT NOT NULL,
                intencion TEXT NOT NULL,
                hito TEXT NOT NULL,
                fecha_limite TEXT,
                privacidad TEXT NOT NULL DEFAULT 'privado',
                creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (usuario_id)
                    REFERENCES usuarios(id)
                    ON DELETE CASCADE
            )
        """)

        # Índice de objetivos por usuario
        conexion.execute("""
            CREATE INDEX IF NOT EXISTS idx_objetivos_usuario
            ON objetivos(usuario_id)
        """)

        conexion.execute("""
            CREATE TABLE IF NOT EXISTS registros_diarios (
                usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
                fecha TEXT NOT NULL,
                resultado TEXT NOT NULL CHECK (resultado IN ('cumplida', 'dificil')),
                estado TEXT,
                nota TEXT NOT NULL,
                PRIMARY KEY (usuario_id, fecha)
            )
        """)
