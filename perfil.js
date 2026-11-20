(function () {
  let sesionActual = JSON.parse(localStorage.getItem("sesionMoken")) || {};
  let datosPerfil = JSON.parse(localStorage.getItem("perfilMoken")) || {};

  let inputNombre = document.getElementById("input-nombre");
  let inputApellidos = document.getElementById("input-apellidos");
  let inputCorreo = document.getElementById("input-correo");
  let tituloNombre = document.getElementById("perfil-nombre-titulo");
  let headerNombre = document.getElementById("nombre-usuario");

  let toggleSensibles = document.getElementById("toggle-sensibles");
  let toggleConsejos = document.getElementById("toggle-consejos");
  let toggleRecordatorio = document.getElementById("toggle-recordatorio");

  let inputHora = document.getElementById("input-hora");
  let selectFrecuencia = document.getElementById("select-frecuencia");
  let selectIdioma = document.getElementById("select-idioma");
  let selectZona = document.getElementById("select-zona");

  let btnCambiarFoto = document.getElementById("btn-cambiar-foto");
  let inputFoto = document.getElementById("input-foto");
  let avatarPerfil = document.getElementById("avatar-perfil");
  let avatarHeader = document.getElementById("avatar-header");

  let procesoHabito = document.getElementById("proceso-habito");
  let procesoDias = document.getElementById("proceso-dias");
  let procesoBarra = document.getElementById("proceso-barra");

  // Carga inicial desde la sesión o desde datos guardados
  let partesNombre = (sesionActual.nombre || "").trim().split(" ");
  inputNombre.value = datosPerfil.nombre || partesNombre[0] || "";
  inputApellidos.value = datosPerfil.apellidos || partesNombre.slice(1).join(" ") || "";
  inputCorreo.value = datosPerfil.correo || sesionActual.correo || sesionActual.email || "";

  toggleSensibles.checked = datosPerfil.ocultarSensibles || false;
  toggleConsejos.checked = datosPerfil.consejos !== undefined ? datosPerfil.consejos : true;
  toggleRecordatorio.checked = datosPerfil.recordatorio !== undefined ? datosPerfil.recordatorio : true;

  inputHora.value = datosPerfil.hora || "21:00";
  selectFrecuencia.value = datosPerfil.frecuencia || "Todos los días";
  selectIdioma.value = datosPerfil.idioma || "Español";
  selectZona.value = datosPerfil.zona || "Bogotá (UTC-5)";

  function mostrarFoto(src) {
    if (!src) return;
    avatarPerfil.innerHTML = `<img src="${src}" alt="Foto de perfil">`;
    avatarHeader.innerHTML = `<img src="${src}" alt="Foto de perfil">`;
  }
  mostrarFoto(datosPerfil.foto);

  function actualizarVista() {
    let nombreCompleto = (inputNombre.value + " " + inputApellidos.value).trim() || sesionActual.nombre || "Mi cuenta";
    tituloNombre.textContent = nombreCompleto;
    headerNombre.textContent = nombreCompleto;

    let habitoReal = datosPerfil.habito || "Sin elegir";
    let dias = datosPerfil.dias || 0;
    let porcentaje = Math.min((dias / 30) * 100, 100);

    procesoHabito.textContent = toggleSensibles.checked ? "Hábito privado" : habitoReal;
    procesoDias.textContent = `${dias} de 30 días`;
    procesoBarra.style.width = `${porcentaje}%`;
  }

  function guardarPerfil() {
    datosPerfil.nombre = inputNombre.value.trim();
    datosPerfil.apellidos = inputApellidos.value.trim();
    datosPerfil.correo = inputCorreo.value.trim();
    datosPerfil.ocultarSensibles = toggleSensibles.checked;
    datosPerfil.consejos = toggleConsejos.checked;
    datosPerfil.recordatorio = toggleRecordatorio.checked;
    datosPerfil.hora = inputHora.value;
    datosPerfil.frecuencia = selectFrecuencia.value;
    datosPerfil.idioma = selectIdioma.value;
    datosPerfil.zona = selectZona.value;

    localStorage.setItem("perfilMoken", JSON.stringify(datosPerfil));

    let nuevoNombre = (datosPerfil.nombre + " " + datosPerfil.apellidos).trim();
    if (nuevoNombre) {
      sesionActual.nombre = nuevoNombre;
      localStorage.setItem("sesionMoken", JSON.stringify(sesionActual));
    }

    actualizarVista();
  }

  [inputNombre, inputApellidos, inputCorreo, inputHora].forEach(function (campo) {
    campo.addEventListener("input", guardarPerfil);
  });

  [toggleSensibles, toggleConsejos, toggleRecordatorio, selectFrecuencia, selectIdioma, selectZona].forEach(function (campo) {
    campo.addEventListener("change", guardarPerfil);
  });

  btnCambiarFoto.addEventListener("click", function () {
    inputFoto.click();
  });

  inputFoto.addEventListener("change", function () {
    let archivo = inputFoto.files[0];
    if (!archivo) return;

    let lector = new FileReader();
    lector.onload = function (e) {
      datosPerfil.foto = e.target.result;
      mostrarFoto(datosPerfil.foto);
      try {
        localStorage.setItem("perfilMoken", JSON.stringify(datosPerfil));
      } catch (error) {
        alert("La imagen es muy pesada para guardarse localmente. Prueba con una más pequeña.");
      }
    };
    lector.readAsDataURL(archivo);
  });

  actualizarVista();
})();