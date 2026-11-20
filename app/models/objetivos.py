
from app.models.database import conectar_db


# -------------------------
# Crear un objetivo
# -------------------------

def crear_objetivo(
    usuario_id,
    habito,
    intencion,
    hito,
    fecha_limite=None,
    privacidad="privado"
):

    with conectar_db() as conexion:

        cursor = conexion.execute(
            """
            INSERT INTO objetivos (
                usuario_id,
                habito,
                intencion,
                hito,
                fecha_limite,
                privacidad
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                usuario_id,
                habito,
                intencion,
                hito,
                fecha_limite,
                privacidad
            )
        )

        return cursor.lastrowid


# -------------------------
# Obtener todos los objetivos
# de un usuario
# -------------------------

def obtener_objetivos(usuario_id):

    with conectar_db() as conexion:

        objetivos = conexion.execute(
            """
            SELECT id, usuario_id, habito, intencion,
                   hito, fecha_limite, privacidad, creado_en
            FROM objetivos
            WHERE usuario_id = ?
            ORDER BY id DESC
            """,
            (usuario_id,)
        ).fetchall()

        return [dict(objetivo) for objetivo in objetivos]


# -------------------------
# Obtener un objetivo por ID
# -------------------------

def obtener_objetivo_por_id(objetivo_id, usuario_id):

    with conectar_db() as conexion:

        objetivo = conexion.execute(
            """
            SELECT id, usuario_id, habito, intencion,
                   hito, fecha_limite, privacidad, creado_en
            FROM objetivos
            WHERE id = ? AND usuario_id = ?
            """,
            (objetivo_id, usuario_id)
        ).fetchone()

        return dict(objetivo) if objetivo else None


# -------------------------
# Actualizar un objetivo
# -------------------------

def actualizar_objetivo(
    objetivo_id,
    usuario_id,
    habito,
    intencion,
    hito,
    fecha_limite,
    privacidad
):

    with conectar_db() as conexion:

        cursor = conexion.execute(
            """
            UPDATE objetivos
            SET habito = ?,
                intencion = ?,
                hito = ?,
                fecha_limite = ?,
                privacidad = ?
            WHERE id = ? AND usuario_id = ?
            """,
            (
                habito,
                intencion,
                hito,
                fecha_limite,
                privacidad,
                objetivo_id,
                usuario_id
            )
        )

        return cursor.rowcount > 0


# -------------------------
# Eliminar un objetivo
# -------------------------

def eliminar_objetivo(objetivo_id, usuario_id):

    with conectar_db() as conexion:

        cursor = conexion.execute(
            """
            DELETE FROM objetivos
            WHERE id = ? AND usuario_id = ?
            """,
            (objetivo_id, usuario_id)
        )

        return cursor.rowcount > 0
