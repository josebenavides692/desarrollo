
const formularioLogin = document.getElementById("login-form");
const mensajeLogin = document.getElementById("mensaje-login");

formularioLogin.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const correo = document.getElementById("correo").value.trim();
    const clave = document.getElementById("clave").value;

    mensajeLogin.textContent = "Verificando credenciales...";

    try {
        const respuesta = await fetch("/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ correo, clave })
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                resultado.detail || "No se pudo iniciar sesión."
            );
        }

        window.location.href = "perfil.html";
    } catch (error) {
        mensajeLogin.textContent =
            error.message || "No se pudo conectar con el servidor.";
    }
});
