// Lee la sesión que guardó el login
let sesion = JSON.parse(localStorage.getItem("sesionMoken"));

if (!sesion) {
    // Si nadie inició sesión, lo mandamos al login
    window.location.href = "login.html";
} else {
    // Muestra el nombre en lugar de "Mi cuenta"
    document.getElementById("nombre-usuario").textContent = sesion.nombre;
}

// Cerrar sesión: borra la sesión (el enlace se encarga de llevar a la otra página)
let botones = document.querySelectorAll(".cerrar-sesion");

for (let i = 0; i < botones.length; i++) {
    botones[i].addEventListener("click", function() {
        localStorage.removeItem("sesionMoken");
    });
}