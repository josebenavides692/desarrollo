
const formulario = document.getElementById("perfil-form");
const mensaje = document.getElementById("mensaje");
const botonGuardar = formulario.querySelector(
    'button[type="submit"]'
);

async function cargarPerfil() {
    mensaje.textContent = "Cargando perfil...";

    try {
        const respuesta = await fetch("/usuarios/me", {
            credentials: "same-origin"
        });

        if (!respuesta.ok) {
            throw new Error(
                respuesta.status === 401
                    ? "Debes iniciar sesión para consultar tu perfil."
                    : "No fue posible cargar el perfil."
            );
        }

        const usuario = await respuesta.json();

        document.getElementById("nombre").value =
            usuario.nombre ?? "";

        document.getElementById("correo").value =
            usuario.correo ?? "";

        document.getElementById("telefono").value =
            usuario.telefono ?? "";

        mensaje.textContent = "";
    } catch (error) {
        mensaje.textContent = error.message;
    }
}

formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    botonGuardar.disabled = true;
    mensaje.textContent = "Guardando cambios...";

    const datos = {
        nombre: document.getElementById("nombre").value.trim(),
        correo: document.getElementById("correo").value.trim(),
        telefono: document.getElementById("telefono").value.trim()
    };

    try {
        const respuesta = await fetch("/usuarios/me", {
            method: "PUT",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(datos)
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                resultado.detail || "No se pudieron guardar los cambios."
            );
        }

        mensaje.textContent = "Perfil actualizado correctamente.";
    } catch (error) {
        mensaje.textContent = error.message;
    } finally {
        botonGuardar.disabled = false;
    }
});

cargarPerfil();
