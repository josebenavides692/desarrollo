document.getElementById("login-form").addEventListener("submit", async function(event) {
    event.preventDefault();

    const correo = document.getElementById("correo").value.trim().toLowerCase();
    const clave = document.getElementById("clave").value;
    const mensaje = document.getElementById("mensaje-login");

    try {
        const respuesta = await fetch("/login", {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                correo,
                clave
            })
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                resultado.detail || "No se pudo iniciar sesión."
            );
        }

        mensaje.textContent = "¡Bienvenido a Moken!";

        setTimeout(() => {
            window.location.href = "/general.html";
        }, 1000);

    } catch (error) {
        mensaje.textContent = error.message;
    }
});
