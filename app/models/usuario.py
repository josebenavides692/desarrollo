

from app.models.database import conectar_db


# Registrar un nuevo usuario
def crear_usuario(nombre, correo, clave_hash):

    with conectar_db() as conexion:
        cursor = conexion.execute(
            """
            INSERT INTO usuarios (nombre, correo, clave_hash)
            VALUES (?, ?, ?)
            """,
            (nombre, correo, clave_hash)
        )

        return cursor.lastrowid


# Buscar un usuario por su correo electrónico
def obtener_usuario_por_correo(correo):

    with conectar_db() as conexion:
        usuario = conexion.execute(
            """
            SELECT id, clave_hash
            FROM usuarios
            WHERE correo = ?
            """,
            (correo,)
        ).fetchone()

    return usuario


# Buscar los datos de un usuario por su ID
def obtener_usuario_por_id(usuario_id):

    with conectar_db() as conexion:
        usuario = conexion.execute(
            """
            SELECT id, nombre, correo, telefono
            FROM usuarios
            WHERE id = ?
            """,
            (usuario_id,)
        ).fetchone()

    return usuario


# Actualizar los datos del perfil
def actualizar_usuario(usuario_id, nombre, correo, telefono):

    with conectar_db() as conexion:
        conexion.execute(
            """
            UPDATE usuarios
            SET nombre = ?, correo = ?, telefono = ?
            WHERE id = ?
            """,
            (nombre, correo, telefono, usuario_id)
        )
