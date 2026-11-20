
document.getElementById("registro-form").addEventListener("submit", async (event) => {

    event.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const correo = document.getElementById("correo").value.trim().toLowerCase();
    const clave = document.getElementById("clave").value;
    const clave2 = document.getElementById("clave2").value;
    const terminos = document.getElementById("terminos").checked;
    const mensaje = document.getElementById("mensaje-registro");

    if (nombre.length < 2) {
        mensaje.textContent = "El nombre debe tener al menos 2 caracteres.";
        return;
    }

    if (
        clave.length < 8 ||
        !/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(clave) ||
        !/[0-9]/.test(clave)
    ) {
        mensaje.textContent =
            "La contraseña debe tener mínimo 8 caracteres, letras y números.";
        return;
    }

    if (clave !== clave2) {
        mensaje.textContent = "Las contraseñas no coinciden.";
        return;
    }

    if (!terminos) {
        mensaje.textContent = "Debes aceptar los términos y condiciones.";
        return;
    }

    try {
        const respuesta = await fetch("/usuarios", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nombre,
                correo,
                clave
            })
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                resultado.detail || "Error al registrar usuario."
            );
        }

        mensaje.textContent = "¡Cuenta creada correctamente!";

        document.getElementById("registro-form").reset();

        setTimeout(() => {
            window.location.href = "/login.html";
        }, 1500);

    } catch (error) {
        mensaje.textContent = error.message;
    }
});
