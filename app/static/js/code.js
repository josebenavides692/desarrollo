document.addEventListener("DOMContentLoaded", async () => {

    const bienvenida = document.getElementById("bienvenida");
    const botonLogin = document.getElementById("boton-login");
    const botonRegistro = document.getElementById("boton-registro");
    const botonSalir = document.getElementById("boton-salir");

    // Comprobar si existe una sesión
    try {
        const respuesta = await fetch("/usuarios/me", {
            credentials: "same-origin"
        });

        if (respuesta.ok) {
            const usuario = await respuesta.json();

            bienvenida.textContent = "Hola, " + usuario.nombre;

            botonLogin.hidden = true;
            botonRegistro.hidden = true;
            botonSalir.hidden = false;
        }

    } catch (error) {
        console.error("No se pudo comprobar la sesión:", error);
    }

    // Cerrar sesión
    botonSalir.addEventListener("click", async () => {

        try {
            const respuesta = await fetch("/logout", {
                method: "POST",
                credentials: "same-origin"
            });

            if (!respuesta.ok) {
                throw new Error("No se pudo cerrar la sesión.");
            }

            window.location.reload();

        } catch (error) {
            console.error(error);
            alert("Error al cerrar sesión.");
        }

    });

});
