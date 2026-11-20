
document.addEventListener("DOMContentLoaded", () => {

    const formulario = document.getElementById("objetivo-form");
    const habito = document.getElementById("habito");
    const habitoPersonalizado = document.getElementById("habito-personalizado");
    const intencion = document.getElementById("intencion");
    const hito = document.getElementById("hito");
    const fechaLimite = document.getElementById("fecha-limite");
    const privacidad = document.getElementById("privacidad");
    const mensaje = document.getElementById("mensaje-objetivo");
    const botonGuardar = document.getElementById("guardar-objetivo");
    const id = new URLSearchParams(window.location.search).get("id");
    const ruta = id ? `/objetivos/${encodeURIComponent(id)}` : "/objetivos";
    let fechaOriginal = "";

    // Mostrar u ocultar el campo de hábito personalizado.
    habito.addEventListener("change", () => {

        const seleccionarOtro = habito.value === "otro";

        habitoPersonalizado.style.display =
            seleccionarOtro ? "block" : "none";

        habitoPersonalizado.required = seleccionarOtro;

        if (!seleccionarOtro) {
            habitoPersonalizado.value = "";
        }
    });

    // Mostrar mensajes al usuario.
    function mostrarMensaje(texto, tipo = "error") {
        mensaje.textContent = texto;
        mensaje.className = tipo;
    }

    // Validar que la fecha no sea anterior al día actual.
    function validarFecha(fecha) {

        if (!fecha || fecha === fechaOriginal) {
            return true;
        }

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const fechaSeleccionada = new Date(`${fecha}T00:00:00`);

        return fechaSeleccionada >= hoy;
    }

    // Enviar el objetivo al backend.
    formulario.addEventListener("submit", async (event) => {

        event.preventDefault();

        mostrarMensaje("");

        const nombreHabito =
            habito.value === "otro"
                ? habitoPersonalizado.value.trim()
                : habito.value;

        if (!nombreHabito) {
            mostrarMensaje("Debes seleccionar o escribir un hábito.");
            return;
        }

        if (intencion.value.trim().length < 5) {
            mostrarMensaje("Describe tu intención con un poco más de detalle.");
            return;
        }

        if (!hito.value.trim()) {
            mostrarMensaje("Debes establecer un objetivo.");
            return;
        }

        if (!validarFecha(fechaLimite.value)) {
            mostrarMensaje("La fecha límite no puede estar en el pasado.");
            return;
        }

        const datosObjetivo = {
            habito: nombreHabito,
            intencion: intencion.value.trim(),
            hito: hito.value.trim(),
            fecha_limite: fechaLimite.value || null,
            privacidad: privacidad.value
        };

        botonGuardar.disabled = true;
        botonGuardar.textContent = "Guardando...";

        try {

            const respuesta = await fetch(ruta, {
                method: id ? "PUT" : "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(datosObjetivo)
            });

            if (respuesta.status === 401) {
                window.location.href = "/login.html";
                return;
            }

            const resultado = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(
                    resultado.detail || "No se pudo guardar el objetivo."
                );
            }

            window.location.assign("/general.html#mis-objetivos");

        } catch (error) {

            console.error("Error al guardar el objetivo:", error);

            mostrarMensaje(
                error.message === "Failed to fetch"
                    ? "No se pudo conectar con el servidor. Comprueba que esté funcionando."
                    : error.message
            );

        } finally {

            botonGuardar.disabled = false;
            botonGuardar.textContent = "Guardar objetivo";

        }

    });

    if (id) cargarObjetivo();

    async function cargarObjetivo() {
        document.querySelector("h1").textContent = "Editar objetivo";
        botonGuardar.disabled = true;
        try {
            const respuesta = await fetch(ruta);
            if (respuesta.status === 401) {
                window.location.replace("/login.html");
                return;
            }
            if (!respuesta.ok) throw new Error("No se pudo cargar el objetivo.");
            const objetivo = await respuesta.json();
            habito.value = objetivo.habito;
            const personalizado = !habito.value || habito.value === "otro";
            if (personalizado) habito.value = "otro";
            habito.dispatchEvent(new Event("change"));
            if (personalizado) habitoPersonalizado.value = objetivo.habito;
            intencion.value = objetivo.intencion;
            hito.value = objetivo.hito;
            fechaOriginal = objetivo.fecha_limite || "";
            fechaLimite.value = fechaOriginal;
            privacidad.value = objetivo.privacidad;
            botonGuardar.disabled = false;
        } catch (error) {
            mostrarMensaje(error.message);
        }
    }

});
