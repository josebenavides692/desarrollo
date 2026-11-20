const formulario = document.getElementById("objetivo-form");
const campos = document.getElementById("campos-objetivo");
const paneles = [...formulario.querySelectorAll("[data-panel]")];
const pasos = [...document.querySelectorAll("[data-paso]")];
const campoPersonalizado = document.getElementById("campo-personalizado");
const personalizado = document.getElementById("habito-personalizado");
const hito = document.getElementById("hito");
const fechaLimite = document.getElementById("fecha-limite");
const privacidad = document.getElementById("privacidad");
const mensaje = document.getElementById("mensaje-objetivo");
const boton = document.getElementById("guardar-objetivo");
const id = new URLSearchParams(window.location.search).get("id");
const ruta = id ? `/objetivos/${encodeURIComponent(id)}` : "/objetivos";
let paso = 0;
let fechaOriginal = "";

function datosObjetivo() {
    const habito = formulario.elements.habito.value;
    return {
        habito: habito === "otro" ? personalizado.value.trim() : habito,
        intencion: formulario.elements.intencion.value,
        hito: hito.value.trim(),
        fecha_limite: fechaLimite.value || null,
        privacidad: privacidad.checked ? "privado" : "publico"
    };
}

function mostrarResumen() {
    const datos = datosObjetivo();
    const filas = [
        ["Hábito", nombreHabito(datos.habito)],
        ["Intención", datos.intencion],
        ["Meta", datos.hito],
        ["Fecha límite", datos.fecha_limite || "Sin fecha límite"],
        ["Privacidad", privacidad.checked ? "Privado" : "Preferencia pública; el contenido sigue en tu cuenta"]
    ];
    const resumen = document.getElementById("resumen");
    resumen.replaceChildren(...filas.map(([nombre, valor]) => {
        const fila = document.createElement("div");
        const titulo = document.createElement("dt");
        const detalle = document.createElement("dd");
        titulo.textContent = nombre;
        detalle.textContent = valor;
        fila.append(titulo, detalle);
        return fila;
    }));
}

function mostrarPaso(indice) {
    paso = indice;
    paneles.forEach((panel, posicion) => { panel.hidden = posicion !== paso; });
    pasos.forEach((elemento, posicion) => {
        if (posicion === paso) elemento.setAttribute("aria-current", "step");
        else elemento.removeAttribute("aria-current");
        elemento.classList.toggle("completo", posicion < paso);
    });
    mensaje.textContent = "";
    boton.textContent = paso === 2 ? "Guardar objetivo" : "Siguiente paso";
    if (paso === 2) mostrarResumen();
    paneles[paso].querySelector("h1").focus();
}

function actualizarPersonalizado() {
    campoPersonalizado.hidden = formulario.elements.habito.value !== "otro";
}

formulario.addEventListener("change", ({ target }) => {
    if (target.name === "habito") actualizarPersonalizado();
    if (target.name === "plazo") hito.value = target.value;
});

const atras = document.getElementById("atras");
atras.addEventListener("click", () => {
    if (paso === 0) window.location.assign("/general.html#mis-objetivos");
    else mostrarPaso(paso - 1);
});

async function solicitar(opciones) {
    const respuesta = await fetch(ruta, opciones);
    if (respuesta.status === 401) {
        window.location.replace("/login.html");
        throw new Error("Debes iniciar sesión.");
    }
    const resultado = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) {
        throw new Error(typeof resultado.detail === "string" ? resultado.detail : "No se pudo guardar o cargar el objetivo.");
    }
    return resultado;
}

formulario.noValidate = true;
formulario.addEventListener("submit", async evento => {
    evento.preventDefault();
    if (campos.disabled) return;
    const datos = datosObjetivo();
    if (paso === 0) {
        if (!datos.habito || !datos.intencion) {
            mensaje.textContent = !datos.habito ? "Elige o escribe un hábito." : "Elige tu intención principal.";
            return;
        }
        mostrarPaso(1);
        return;
    }
    if (paso === 1) {
        if (!datos.hito || !hito.reportValidity() || !fechaLimite.reportValidity()) {
            mensaje.textContent = "Escribe una meta y comprueba la fecha.";
            return;
        }
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        if (datos.fecha_limite && datos.fecha_limite !== fechaOriginal && new Date(`${datos.fecha_limite}T00:00:00`) < hoy) {
            mensaje.textContent = "La fecha límite no puede estar en el pasado.";
            return;
        }
        mostrarPaso(2);
        return;
    }
    campos.disabled = true;
    boton.disabled = true;
    atras.disabled = true;
    boton.textContent = "Guardando…";
    try {
        await solicitar({
            method: id ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });
        window.location.assign("/general.html#mis-objetivos");
    } catch (error) {
        mensaje.textContent = error.message;
        campos.disabled = false;
        boton.disabled = false;
        atras.disabled = false;
        boton.textContent = "Guardar objetivo";
    }
});

async function cargarObjetivo() {
    try {
        const objetivo = await solicitar();
        const habito = formulario.elements.habito;
        habito.value = objetivo.habito;
        if (!habito.value || habito.value === "otro") {
            habito.value = "otro";
            personalizado.value = objetivo.habito;
        }
        actualizarPersonalizado();

        const intencion = formulario.elements.intencion;
        intencion.value = objetivo.intencion;
        if (!intencion.value) {
            const grupo = formulario.querySelector(".intencion");
            const opcion = grupo.firstElementChild.cloneNode(true);
            const entrada = opcion.querySelector("input");
            entrada.value = objetivo.intencion;
            entrada.checked = true;
            opcion.querySelector(".caja").lastChild.textContent = objetivo.intencion;
            grupo.append(opcion);
        }
        formulario.elements.plazo.value = objetivo.hito;
        hito.value = objetivo.hito;
        fechaOriginal = objetivo.fecha_limite || "";
        fechaLimite.value = fechaOriginal;
        privacidad.checked = objetivo.privacidad !== "publico";
        paneles[0].querySelector("h1").textContent = "Edita tu objetivo";
        campos.disabled = false;
        boton.disabled = false;
    } catch (error) {
        mensaje.textContent = error.message;
    }
}

if (id) {
    cargarObjetivo();
} else {
    campos.disabled = false;
    boton.disabled = false;
}
