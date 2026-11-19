
from app.models.database import conectar_db


# -------------------------
# Crear un evento
# -------------------------

def crear_evento(usuario_id, nombre, descripcion="", fecha=None, lugar=""):

    with conectar_db() as conexion:

        cursor = conexion.execute(
            """
            INSERT INTO eventos (
                usuario_id,
                nombre,
                descripcion,
                fecha,
                lugar
            )
            VALUES (?, ?, ?, ?, ?)
            """,
            (usuario_id, nombre, descripcion, fecha, lugar)
        )

        return cursor.lastrowid


# -------------------------
# Obtener eventos de un usuario
# -------------------------

def obtener_eventos(usuario_id):

    with conectar_db() as conexion:

        eventos = conexion.execute(
            """
            SELECT id, usuario_id, nombre, descripcion,
                   fecha, lugar, creado_en
            FROM eventos
            WHERE usuario_id = ?
            ORDER BY id DESC
            """,
            (usuario_id,)
        ).fetchall()

        return [dict(evento) for evento in eventos]


# -------------------------
# Obtener un evento por ID
# -------------------------

def obtener_evento_por_id(evento_id, usuario_id):

    with conectar_db() as conexion:

        evento = conexion.execute(
            """
            SELECT id, usuario_id, nombre, descripcion,
                   fecha, lugar, creado_en
            FROM eventos
            WHERE id = ? AND usuario_id = ?
            """,
            (evento_id, usuario_id)
        ).fetchone()

        return dict(evento) if evento else None


# -------------------------
# Actualizar un evento
# -------------------------

def actualizar_evento(
    evento_id,
    usuario_id,
    nombre,
    descripcion,
    fecha,
    lugar
):

    with conectar_db() as conexion:

        cursor = conexion.execute(
            """
            UPDATE eventos
            SET nombre = ?,
                descripcion = ?,
                fecha = ?,
                lugar = ?
            WHERE id = ? AND usuario_id = ?
            """,
            (
                nombre,
                descripcion,
                fecha,
                lugar,
                evento_id,
                usuario_id
            )
        )

        return cursor.rowcount > 0


# -------------------------
# Eliminar un evento
# -------------------------

def eliminar_evento(evento_id, usuario_id):

    with conectar_db() as conexion:

        cursor = conexion.execute(
            """
            DELETE FROM eventos
            WHERE id = ? AND usuario_id = ?
            """,
            (evento_id, usuario_id)
        )

        return cursor.rowcount > 0
