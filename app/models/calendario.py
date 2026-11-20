from contextlib import closing

from app.models.database import conectar_db


def listar_registros(usuario_id):
    with closing(conectar_db()) as conexion:
        filas = conexion.execute(
            """
            SELECT fecha, resultado, estado, nota
            FROM registros_diarios
            WHERE usuario_id = ?
            ORDER BY fecha
            """,
            (usuario_id,),
        ).fetchall()
    return [dict(fila) for fila in filas]


def guardar_registro(usuario_id, fecha, resultado, estado, nota):
    with closing(conectar_db()) as conexion, conexion:
        conexion.execute(
            """
            INSERT INTO registros_diarios (usuario_id, fecha, resultado, estado, nota)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(usuario_id, fecha) DO UPDATE SET
                resultado = excluded.resultado, estado = excluded.estado, nota = excluded.nota
            """,
            (usuario_id, fecha, resultado, estado, nota),
        )
