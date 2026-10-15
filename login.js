

document.getElementById("login-form").addEventListener("submit", function(event) {
    event.preventDefault();

    let correo = document.getElementById("correo").value.trim().toLowerCase();
    let clave = document.getElementById("clave").value;
    let mensaje = document.getElementById("mensaje-login");

    let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

    let usuarioEncontrado = usuarios.find(function(usuario) {
        return usuario.correo === correo && usuario.clave === clave;
    });

    if (usuarioEncontrado) {
        let sesion = {
            nombre: usuarioEncontrado.nombre,
            correo: usuarioEncontrado.correo
        };

        localStorage.setItem("sesionMoken", JSON.stringify(sesion));

        mensaje.textContent = "Inicio de sesión correcto. ¡Bienvenido a Moken!";

        setTimeout(function() {
            window.location.href = "principal.html";
        }, 1000);

    } else {
        mensaje.textContent = "Correo o contraseña incorrectos.";
    }
});
