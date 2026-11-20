
document.addEventListener("DOMContentLoaded", async () => {
    const nombreUsuario = document.getElementById("nombre-usuario");
    const botonesSalir = document.querySelectorAll(".cerrar-sesion");

    try {
        const respuesta = await fetch("/usuarios/me", {
            credentials: "same-origin"
        });

        if (!respuesta.ok) {
            window.location.href = "/login.html";
            return;
        }

        const usuario = await respuesta.json();

        if (nombreUsuario) {
            nombreUsuario.textContent = usuario.nombre;
        }

    } catch (error) {
        console.error("Error al comprobar la sesión:", error);
        window.location.href = "/login.html";
        return;
    }

    botonesSalir.forEach(boton => {
        boton.addEventListener("click", async (evento) => {
            evento.preventDefault();

            try {
                const respuesta = await fetch("/logout", {
                    method: "POST",
                    credentials: "same-origin"
                });

                if (!respuesta.ok) {
                    throw new Error("No se pudo cerrar la sesión.");
                }

                window.location.href = "/";

            } catch (error) {
                console.error(error);
                alert("Ocurrió un error al cerrar sesión.");
            }
        });
    });
});
