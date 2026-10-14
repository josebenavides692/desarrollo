
const formularioRegistro = document.getElementById("registro-form");
const mensajeRegistro = document.getElementById("mensaje-registro");

formularioRegistro.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const correo = document.getElementById("correo").value.trim();
    const clave = document.getElementById("clave").value;
    const clave2 = document.getElementById("clave2").value;
    const terminos = document.getElementById("terminos").checked;

    if (clave !== clave2) {
        mensajeRegistro.textContent = "Las contraseñas no coinciden.";
        return;
    }

    if (!terminos) {
        mensajeRegistro.textContent = "Debes aceptar los términos.";
        return;
    }

    mensajeRegistro.textContent = "Creando cuenta...";

    try {
        const respuesta = await fetch("/usuarios", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ nombre, correo, clave })
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                resultado.detail || "No se pudo crear la cuenta."
            );
        }

        mensajeRegistro.textContent =
            "Cuenta creada. Ahora puedes iniciar sesión.";

        formularioRegistro.reset();
    } catch (error) {
        mensajeRegistro.textContent =
            error.message || "No se pudo conectar con el servidor.";
    }
});
