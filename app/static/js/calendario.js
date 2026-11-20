"use strict";

const porId = id => document.getElementById(id);
const formulario = porId("formulario");
const campos = porId("campos");
const dias = porId("dias");
const registros = new Map();
const estados = { calma: "En calma", energia: "Con energía", ansiedad: "Con ansiedad", desanimo: "Desanimado" };
const resultados = { cumplida: "Meta cumplida", dificil: "Día difícil" };
const formatoMes = new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric", timeZone: "UTC" });
const formatoFecha = new Intl.DateTimeFormat("es-CO", { dateStyle: "full", timeZone: "UTC" });

function fechaUTC(anio, mes, dia) {
    return new Date(Date.UTC(anio, mes, dia));
}

function hoy() {
    const local = new Date();
    return fechaUTC(local.getFullYear(), local.getMonth(), local.getDate());
}

const clave = fecha => fecha.toISOString().slice(0, 10);
let seleccion = hoy();
let mes = fechaUTC(seleccion.getUTCFullYear(), seleccion.getUTCMonth(), 1);
let cargado = false;
let guardando = false;

async function solicitar(url, opciones) {
    const respuesta = await fetch(url, opciones);
    if (respuesta.status === 401) {
        window.location.replace("/login.html");
        throw new Error("Tu sesión terminó.");
    }
    if (!respuesta.ok) {
        throw new Error("No se pudo completar la solicitud. Inténtalo de nuevo.");
    }
    return respuesta.json();
}

function dibujarResumen() {
    const actual = hoy();
    const previo = fechaUTC(actual.getUTCFullYear(), actual.getUTCMonth(), actual.getUTCDate() - 1);
    const inicioRacha = registros.has(clave(actual)) ? actual : previo;
    let racha = 0;
    for (const dia = new Date(inicioRacha); registros.get(clave(dia))?.resultado === "cumplida";) {
        racha++;
        dia.setUTCDate(dia.getUTCDate() - 1);
    }
    const prefijo = clave(mes).slice(0, 7);
    const delMes = [...registros.values()].filter(registro => registro.fecha.startsWith(prefijo));
    const limite = fechaUTC(mes.getUTCFullYear(), mes.getUTCMonth() + 1, 0);
    const disponibles = mes > actual ? 0 : new Date(Math.min(limite, actual)).getUTCDate();
    const frecuencias = new Map();
    for (const { estado } of delMes) {
        if (estado) frecuencias.set(estado, (frecuencias.get(estado) || 0) + 1);
    }
    const [estado, veces] = [...frecuencias].sort((a, b) => b[1] - a[1])[0] || [];
    porId("racha").textContent = racha === 1 ? "1 día" : `${racha} días`;
    porId("total").textContent = `${delMes.length} de ${disponibles}`;
    porId("periodo").textContent = clave(actual).startsWith(prefijo) ? "Hasta hoy" : formatoMes.format(mes);
    porId("estado-frecuente").textContent = estados[estado] || "—";
    porId("frecuencia").textContent = estado ? `En ${veces} de ${delMes.length} registros` : "Sin estados registrados";
}

function dibujarMes() {
    porId("mes").textContent = formatoMes.format(mes);
    const actual = clave(hoy());
    const elegida = clave(seleccion);
    const desfase = (mes.getUTCDay() + 6) % 7;
    const primero = fechaUTC(mes.getUTCFullYear(), mes.getUTCMonth(), 1 - desfase);
    const cuadricula = document.createDocumentFragment();
    for (let indice = 0; indice < 42; indice++) {
        const fecha = fechaUTC(primero.getUTCFullYear(), primero.getUTCMonth(), primero.getUTCDate() + indice);
        const id = clave(fecha);
        const resultado = registros.get(id)?.resultado;
        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "dia";
        boton.dataset.fecha = id;
        boton.textContent = fecha.getUTCDate();
        if (fecha.getUTCMonth() !== mes.getUTCMonth()) boton.classList.add("otro-mes");
        if (resultado) boton.classList.add(resultado);
        if (id === actual) boton.setAttribute("aria-current", "date");
        boton.setAttribute("aria-pressed", String(id === elegida));
        boton.setAttribute("aria-label", `${formatoFecha.format(fecha)}, ${resultados[resultado] || "Sin registro"}`);
        if (resultado || id === actual) {
            const marca = document.createElement("small");
            marca.textContent = [id === actual ? "Hoy" : "", resultado === "cumplida" ? "✓" : resultado ? "○" : ""].filter(Boolean).join(" ");
            marca.setAttribute("aria-hidden", "true");
            boton.append(marca);
        }
        cuadricula.append(boton);
    }
    dias.replaceChildren(cuadricula);
    if (cargado) dibujarResumen();
}

function dibujarFormulario() {
    const registro = registros.get(clave(seleccion));
    const actual = hoy();
    formulario.reset();
    formulario.elements.resultado.value = registro?.resultado || "";
    formulario.elements.estado.value = registro?.estado || "";
    formulario.elements.nota.value = registro?.nota || "";
    porId("fecha-registro").textContent = formatoFecha.format(seleccion);
    campos.disabled = !cargado || guardando || seleccion > actual;
    porId("mensaje-registro").textContent = seleccion > actual
        ? "Puedes registrar este día cuando llegue." : "";
}

function seleccionar(fecha) {
    seleccion = fecha;
    mes = fechaUTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), 1);
    dibujarMes();
    dibujarFormulario();
}

dias.addEventListener("click", evento => {
    const boton = evento.target.closest("[data-fecha]");
    if (!boton) return;
    seleccionar(new Date(`${boton.dataset.fecha}T00:00:00Z`));
    dias.querySelector('[aria-pressed="true"]').focus();
});

function moverMes(pasos) {
    seleccionar(fechaUTC(mes.getUTCFullYear(), mes.getUTCMonth() + pasos, 1));
}

porId("anterior").addEventListener("click", () => moverMes(-1));
porId("siguiente").addEventListener("click", () => moverMes(1));
porId("hoy").addEventListener("click", () => seleccionar(hoy()));
porId("registrar").addEventListener("click", () => {
    seleccionar(hoy());
    formulario.elements.resultado[0].focus();
    formulario.scrollIntoView({ block: "nearest" });
});

formulario.addEventListener("submit", async evento => {
    evento.preventDefault();
    if (campos.disabled) return;
    const fecha = clave(seleccion);
    const datos = new FormData(formulario);
    guardando = true;
    campos.disabled = true;
    const mensaje = porId("mensaje-registro");
    mensaje.textContent = "Guardando…";
    try {
        const registro = await solicitar(`/registros-diarios/${fecha}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                resultado: datos.get("resultado"),
                estado: datos.get("estado") || null,
                nota: datos.get("nota")
            })
        });
        registros.set(fecha, registro);
        dibujarMes();
        if (clave(seleccion) === fecha) mensaje.textContent = "Registro guardado.";
    } catch (error) {
        mensaje.textContent = error.message;
    } finally {
        guardando = false;
        campos.disabled = seleccion > hoy();
    }
});

function mostrarError(error) {
    const aviso = porId("mensaje-pagina");
    aviso.textContent = error.message;
    aviso.hidden = false;
}

porId("salir").addEventListener("click", async () => {
    try {
        await solicitar("/logout", { method: "POST" });
        window.location.assign("/");
    } catch (error) {
        mostrarError(error);
    }
});

async function cargar() {
    try {
        const perfil = await solicitar("/usuarios/me");
        porId("cuenta").textContent = perfil.nombre;
        const datos = await solicitar("/registros-diarios");
        for (const registro of datos.registros) registros.set(registro.fecha, registro);
        cargado = true;
        dibujarMes();
        dibujarFormulario();
        const { objetivos } = await solicitar("/objetivos");
        const objetivo = objetivos[0];
        porId("meta").textContent = objetivo?.hito || "Por definir";
        if (objetivo) {
            porId("objetivo").textContent = objetivo.habito;
            porId("objetivo").title = objetivo.intencion;
            porId("plazo").textContent = objetivo.fecha_limite ? `Hasta ${objetivo.fecha_limite}` : objetivo.habito;
        }
    } catch (error) {
        mostrarError(error);
    }
}

seleccionar(seleccion);
cargar();
