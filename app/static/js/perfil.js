const perfil = document.getElementById("perfil-form");
const campos = perfil.querySelector("fieldset");
const mensaje = document.getElementById("mensaje");
const guardar = document.getElementById("guardar");
const cancelar = document.getElementById("cancelar");
const descargar = document.getElementById("descargar");
let usuario;

async function solicitarPerfil(url, opciones) {
    const respuesta = await fetch(url, opciones);
    if (!respuesta.ok) {
        if (respuesta.status === 401) window.location.replace("/login.html");
        const datos = await respuesta.json().catch(() => ({}));
        throw new Error(typeof datos.detail === "string" ? datos.detail : "No se pudo completar la solicitud.");
    }
    return respuesta.json();
}

function mostrarPerfil() {
    for (const campo of ["nombre", "correo", "telefono"]) {
        perfil.elements[campo].value = usuario[campo] ?? "";
    }
    document.getElementById("nombre-visible").textContent = usuario.nombre;
    document.getElementById("cuenta").textContent = usuario.nombre;
    document.getElementById("iniciales").textContent = usuario.nombre.trim().split(/\s+/)
        .slice(0, 2).map(palabra => Array.from(palabra)[0]).join("").toUpperCase();
}

function bloquearFormulario(bloqueado) {
    campos.disabled = bloqueado;
    guardar.disabled = bloqueado;
    cancelar.disabled = bloqueado;
}

perfil.addEventListener("submit", async evento => {
    evento.preventDefault();
    const datos = Object.fromEntries([...new FormData(perfil)].map(([campo, valor]) => [campo, valor.trim()]));
    bloquearFormulario(true);
    mensaje.textContent = "Guardando cambios…";
    try {
        await solicitarPerfil("/usuarios/me", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });
        usuario = { ...usuario, ...datos };
        mostrarPerfil();
        mensaje.textContent = "Perfil actualizado.";
    } catch (error) {
        mensaje.textContent = error.message;
    } finally {
        bloquearFormulario(false);
    }
});

cancelar.addEventListener("click", () => {
    mostrarPerfil();
    mensaje.textContent = "Cambios descartados.";
});

async function salir() {
    try {
        await solicitarPerfil("/logout", { method: "POST" });
        window.location.assign("/");
    } catch (error) {
        mensaje.textContent = error.message;
    }
}

document.getElementById("salir").addEventListener("click", salir);
document.getElementById("cerrar-sesion-perfil").addEventListener("click", salir);

descargar.addEventListener("click", async () => {
    descargar.disabled = true;
    try {
        const [{ objetivos }, { registros }] = await Promise.all([
            solicitarPerfil("/objetivos"),
            solicitarPerfil("/registros-diarios")
        ]);
        const archivo = new Blob([JSON.stringify({ perfil: usuario, objetivos, registros }, null, 2)], {
            type: "application/json"
        });
        const enlace = document.createElement("a");
        enlace.href = URL.createObjectURL(archivo);
        enlace.download = "mis-datos-moken.json";
        enlace.click();
        const url = enlace.href;
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        mensaje.textContent = "Descarga preparada.";
    } catch (error) {
        mensaje.textContent = error.message;
    } finally {
        descargar.disabled = false;
    }
});

async function cargarPerfil() {
    const habito = document.getElementById("habito-perfil");
    try {
        usuario = await solicitarPerfil("/usuarios/me");
        mostrarPerfil();
        bloquearFormulario(false);
        descargar.disabled = false;
        const { objetivos } = await solicitarPerfil("/objetivos");
        const objetivo = objetivos[0];
        habito.textContent = objetivo ? nombreHabito(objetivo.habito) : "Aún sin objetivo";
        if (objetivo) {
            document.getElementById("meta-perfil").textContent = `${objetivo.intencion} · ${objetivo.hito}`;
        }
    } catch (error) {
        habito.textContent = "No se pudo cargar el objetivo";
        mensaje.textContent = error.message;
    }
}

cargarPerfil();
