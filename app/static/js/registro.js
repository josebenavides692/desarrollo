

document.getElementById("registro-form").addEventListener("submit", function(event) {
    event.preventDefault();

    let nombre = document.getElementById("nombre").value.trim();
    let correo = document.getElementById("correo").value.trim().toLowerCase();
    let clave = document.getElementById("clave").value;
    let clave2 = document.getElementById("clave2").value;
    let terminos = document.getElementById("terminos").checked;
    let mensaje = document.getElementById("mensaje-registro");

    if (nombre === "") {
        mensaje.textContent = "Escribe tu nombre.";
        return;
    }

    if (
        clave.length < 8 ||
        !/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(clave) ||
        !/[0-9]/.test(clave)
    ) {
        mensaje.textContent = "La contraseña debe tener mínimo 8 caracteres, letras y números.";
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

    let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

    let existe = usuarios.find(function(usuario) {
        return usuario.correo === correo;
    });

    if (existe) {
        mensaje.textContent = "Este correo ya está registrado.";
        return;
    }

    let usuario = {
        nombre: nombre,
        correo: correo,
        clave: clave
    };

    usuarios.push(usuario);

    localStorage.setItem("usuarios", JSON.stringify(usuarios));

    mensaje.textContent = "¡Cuenta creada! Ahora puedes iniciar sesión.";

    document.getElementById("registro-form").reset();

    setTimeout(function() {
        window.location.href = "login.html";
    }, 1500);
});
