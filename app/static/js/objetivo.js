const formulario = document.getElementById("objetivo-form");
const campos = document.getElementById("campos-objetivo");
const campoPersonalizado = document.getElementById("campo-personalizado");
const personalizado = document.getElementById("habito-personalizado");
const hito = document.getElementById("hito");
const mensaje = document.getElementById("mensaje-objetivo");
const boton = document.getElementById("guardar-objetivo");
const id = new URLSearchParams(window.location.search).get("id");
const ruta = id ? `/objetivos/${encodeURIComponent(id)}` : "/objetivos";
let fechaGuardada = null;
let privacidadGuardada = "privado";
let plazoModificado = false;

function actualizarPersonalizado() {
    campoPersonalizado.hidden = formulario.elements.habito.value !== "otro";
    personalizado.required = !campoPersonalizado.hidden;
}

function calcularFecha(plazo) {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + Number(plazo));
    return [fecha.getFullYear(), fecha.getMonth() + 1, fecha.getDate()]
        .map(numero => String(numero).padStart(2, "0")).join("-");
}

formulario.addEventListener("change", ({ target }) => {
    if (target.name === "habito") actualizarPersonalizado();
    if (target.name === "plazo") plazoModificado = true;
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

function habilitarFormulario(habilitado) {
    campos.disabled = !habilitado;
    boton.disabled = !habilitado;
}

formulario.addEventListener("submit", async evento => {
    evento.preventDefault();
    if (campos.disabled) return;

    const opcion = formulario.elements.habito.value;
    const habito = opcion === "otro" ? personalizado.value.trim() : opcion;
    const meta = hito.value.trim();
    if (!habito || !meta) {
        mensaje.textContent = !habito ? "Describe el hábito que quieres trabajar." : "Escribe tu objetivo con tus palabras.";
        (habito ? hito : personalizado).focus();
        return;
    }

    const plazo = formulario.elements.plazo.value;
    const datos = {
        habito,
        intencion: formulario.elements.intencion.value,
        hito: meta,
        fecha_limite: !id || plazoModificado ? calcularFecha(plazo) : fechaGuardada,
        privacidad: privacidadGuardada
    };

    habilitarFormulario(false);
    mensaje.textContent = "";
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
        habilitarFormulario(true);
        boton.textContent = "Guardar";
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

        hito.value = objetivo.hito;
        fechaGuardada = objetivo.fecha_limite;
        privacidadGuardada = objetivo.privacidad;
        formulario.elements.plazo.value = "";
        document.getElementById("plazo-actual").textContent = fechaGuardada
            ? `Fecha límite actual: ${fechaGuardada}. Elige un plazo para cambiarla.`
            : "Sin fecha límite. Elige un plazo para agregarla.";
        document.querySelector("h1").textContent = "Edita tu objetivo";
        habilitarFormulario(true);
    } catch (error) {
        mensaje.textContent = error.message;
    }
}

if (id) cargarObjetivo();
else habilitarFormulario(true);
