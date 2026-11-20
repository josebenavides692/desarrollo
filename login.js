const loginForm = document.getElementById("login-form");

if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const correo = document.getElementById("correo").value.trim().toLowerCase();
        const clave = document.getElementById("clave").value;
        const mensaje = document.getElementById("mensaje-login");

        if (!correo || !clave) {
            mensaje.textContent = "Por favor, completa todos los campos.";
            return;
        }

        let usuarios = [];
        try {
            const datosGuardados = JSON.parse(localStorage.getItem("usuarios"));
            if (Array.isArray(datosGuardados)) {
                usuarios = datosGuardados;
            }
        } catch (error) {
            console.error("Error al leer usuarios de localStorage:", error);
        }

        const usuarioEncontrado = usuarios.find(function (usuario) {
            return usuario.correo && usuario.correo.trim().toLowerCase() === correo && usuario.clave === clave;
        });

        if (usuarioEncontrado) {
            const sesion = {
                nombre: usuarioEncontrado.nombre,
                correo: usuarioEncontrado.correo
            };

            localStorage.setItem("sesionMoken", JSON.stringify(sesion));
            mensaje.textContent = "Inicio de sesión correcto. ¡Bienvenido a Moken!";

            setTimeout(function () {
                window.location.href = "general.html";
            }, 1000);
        } else {
            mensaje.textContent = "Correo o contraseña incorrectos.";
        }
    });
}