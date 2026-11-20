
document.addEventListener("DOMContentLoaded", async () => {

    const nombreUsuario = document.getElementById("nombre-usuario");
    const formulario = document.getElementById("evento-form");
    const listaEventos = document.getElementById("lista-eventos");
    const mensaje = document.getElementById("mensaje-eventos");

    const campoNombre = document.getElementById("evento-nombre");
    const campoDescripcion = document.getElementById("evento-descripcion");
    const campoFecha = document.getElementById("evento-fecha");
    const campoLugar = document.getElementById("evento-lugar");

    const botonGuardar = document.getElementById("boton-guardar");
    const botonCancelar = document.getElementById("cancelar-edicion");

    const tituloFormulario = document.getElementById("titulo-formulario");

    let eventoEditando = null;

    async function solicitar(url, opciones = {}) {
        const respuesta = await fetch(url, {
            credentials: "same-origin",
            ...opciones
        });

        const resultado = await respuesta.json().catch(() => ({}));

        if (!respuesta.ok) {
            if (respuesta.status === 401) {
                window.location.href = "/login.html";
                throw new Error("La sesión ha expirado.");
            }

            throw new Error(
                resultado.detail || "Ocurrió un error en la solicitud."
            );
        }

        return resultado;
    }

    // Comprobar usuario autenticado
    async function cargarUsuario() {
        const usuario = await solicitar("/usuarios/me");
        nombreUsuario.textContent = usuario.nombre;
    }

    async function cargarObjetivos() {
        const lista = document.getElementById("lista-mis-objetivos");
        try {
            const { objetivos } = await solicitar("/objetivos");
            const actual = objetivos[0];
            document.getElementById("habito-actual").textContent =
                actual ? nombreHabito(actual.habito) : "Aún sin objetivo";
            document.getElementById("meta-actual").textContent =
                actual ? `${actual.intencion} · ${actual.hito}` : "Elige el hábito que quieres trabajar y define tu primera meta.";
            lista.replaceChildren();
            if (!objetivos.length) {
                lista.textContent = "Tus objetivos aparecerán aquí cuando guardes el primero.";
            }
            for (const objetivo of objetivos) {
                const tarjeta = document.createElement("article");
                tarjeta.className = "fila-accion objetivo-item";
                const contenido = document.createElement("div");
                const titulo = document.createElement("h3");
                titulo.textContent = nombreHabito(objetivo.habito);
                const meta = document.createElement("p");
                meta.textContent = `${objetivo.intencion} · ${objetivo.hito}`;
                const fecha = document.createElement("small");
                fecha.textContent = objetivo.fecha_limite ? `Fecha límite: ${objetivo.fecha_limite}` : "Sin fecha límite";
                const editar = document.createElement("a");
                editar.href = `/objetivo.html?id=${encodeURIComponent(objetivo.id)}`;
                editar.className = "secundario";
                editar.textContent = "Editar";
                editar.setAttribute("aria-label", `Editar ${titulo.textContent}`);

                const eliminar = document.createElement("button");
                eliminar.type = "button";
                eliminar.className = "secundario eliminar-objetivo";
                eliminar.textContent = "Eliminar";
                eliminar.setAttribute("aria-label", `Eliminar ${titulo.textContent}`);
                eliminar.addEventListener("click", async () => {
                    if (!window.confirm(`¿Quieres eliminar el objetivo «${titulo.textContent}»?`)) return;
                    const aviso = document.getElementById("mensaje-objetivos");
                    aviso.textContent = "";
                    eliminar.disabled = true;
                    try {
                        await solicitar(`/objetivos/${encodeURIComponent(objetivo.id)}`, { method: "DELETE" });
                        await cargarObjetivos();
                        aviso.textContent = "Objetivo eliminado.";
                        aviso.focus();
                    } catch (error) {
                        aviso.textContent = error.message;
                        eliminar.disabled = false;
                    }
                });

                const acciones = document.createElement("div");
                acciones.className = "grupo-acciones";
                acciones.append(editar, eliminar);
                contenido.append(titulo, meta, fecha);
                tarjeta.append(contenido, acciones);
                lista.append(tarjeta);
            }
        } catch (error) {
            lista.textContent = error.message;
        }
    }

    // Consultar eventos del usuario
    async function cargarEventos() {
        listaEventos.textContent = "Cargando eventos...";

        try {
            const resultado = await solicitar("/eventos");
            const eventos = resultado.eventos || [];

            listaEventos.replaceChildren();

            if (eventos.length === 0) {
                const aviso = document.createElement("p");
                aviso.textContent = "Todavía no tienes eventos registrados.";
                listaEventos.appendChild(aviso);
            }

            eventos.forEach(evento => {
                const tarjeta = document.createElement("article");
                tarjeta.className = "tarjeta evento-item";

                const titulo = document.createElement("h3");
                titulo.textContent = evento.nombre;

                const descripcion = document.createElement("p");
                descripcion.textContent =
                    evento.descripcion || "Sin descripción.";

                const fecha = document.createElement("p");
                fecha.textContent =
                    evento.fecha
                        ? `Fecha: ${evento.fecha}`
                        : "Sin fecha asignada.";

                const lugar = document.createElement("p");
                lugar.textContent =
                    evento.lugar
                        ? `Lugar: ${evento.lugar}`
                        : "Sin lugar asignado.";

                const botonEditar = document.createElement("button");
                botonEditar.type = "button";
                botonEditar.textContent = "Editar";

                botonEditar.addEventListener("click", () => {
                    prepararEdicion(evento);
                });

                const botonEliminar = document.createElement("button");
                botonEliminar.type = "button";
                botonEliminar.textContent = "Eliminar";

                botonEliminar.addEventListener("click", () => {
                    eliminarEvento(evento.id);
                });

                tarjeta.append(
                    titulo,
                    descripcion,
                    fecha,
                    lugar,
                    botonEditar,
                    botonEliminar
                );

                listaEventos.appendChild(tarjeta);
            });

            actualizarEstadisticas(eventos);

        } catch (error) {
            listaEventos.textContent = error.message;
        }
    }

    // Actualizar estadísticas
    function actualizarEstadisticas(eventos) {
        document.getElementById("total-eventos").textContent =
            eventos.length;

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const proximos = eventos.filter(evento => {
            if (!evento.fecha) return false;

            const fechaEvento = new Date(`${evento.fecha}T00:00:00`);
            return fechaEvento >= hoy;
        });

        document.getElementById("proximos-eventos").textContent =
            proximos.length;
    }

    // Preparar edición de un evento
    function prepararEdicion(evento) {
        eventoEditando = evento.id;

        campoNombre.value = evento.nombre;
        campoDescripcion.value = evento.descripcion || "";
        campoFecha.value = evento.fecha || "";
        campoLugar.value = evento.lugar || "";

        tituloFormulario.textContent = "Editar evento";
        botonGuardar.textContent = "Actualizar evento";
        botonCancelar.hidden = false;

        formulario.scrollIntoView({ behavior: "smooth" });
    }

    // Limpiar formulario
    function limpiarFormulario() {
        formulario.reset();
        eventoEditando = null;

        tituloFormulario.textContent = "Registrar un evento";
        botonGuardar.textContent = "Guardar evento";
        botonCancelar.hidden = true;
    }

    botonCancelar.addEventListener("click", () => {
        limpiarFormulario();
        mensaje.textContent = "";
    });

    // Crear o actualizar evento
    formulario.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        const datos = {
            nombre: campoNombre.value.trim(),
            descripcion: campoDescripcion.value.trim(),
            fecha: campoFecha.value || null,
            lugar: campoLugar.value.trim()
        };

        if (!datos.nombre) {
            mensaje.textContent = "Debes escribir un nombre para el evento.";
            return;
        }

        botonGuardar.disabled = true;
        mensaje.textContent = "Guardando...";

        try {
            if (eventoEditando !== null) {
                await solicitar(`/eventos/${eventoEditando}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(datos)
                });

                mensaje.textContent = "Evento actualizado correctamente.";

            } else {
                await solicitar("/eventos", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(datos)
                });

                mensaje.textContent = "Evento creado correctamente.";
            }

            limpiarFormulario();
            await cargarEventos();

        } catch (error) {
            mensaje.textContent = error.message;

        } finally {
            botonGuardar.disabled = false;
        }
    });

    // Eliminar evento
    async function eliminarEvento(id) {
        if (!confirm("¿Estás seguro de eliminar este evento?")) {
            return;
        }

        try {
            await solicitar(`/eventos/${id}`, {
                method: "DELETE"
            });

            mensaje.textContent = "Evento eliminado correctamente.";

            if (eventoEditando === id) {
                limpiarFormulario();
            }

            await cargarEventos();

        } catch (error) {
            mensaje.textContent = error.message;
        }
    }

    // Recargar lista
    document.getElementById("recargar-eventos")
        .addEventListener("click", cargarEventos);

    // Cerrar sesión
    document.querySelectorAll(".cerrar-sesion").forEach(boton => {
        boton.addEventListener("click", async () => {
            try {
                await solicitar("/logout", {
                    method: "POST"
                });

                window.location.href = "/";

            } catch (error) {
                alert(error.message);
            }
        });
    });

    // Inicialización
    try {
        await cargarUsuario();
        await Promise.all([cargarEventos(), cargarObjetivos()]);

    } catch (error) {
        console.error(error);
    }
});
