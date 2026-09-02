document.addEventListener("DOMContentLoaded", function () {
    iniciarPerfilUsuario();
});

const INDICATIVOS_PAIS_PERFIL = [
    { valor: "+57", texto: "CO +57" },
    { valor: "+54", texto: "AR +54" },
    { valor: "+56", texto: "CL +56" },
    { valor: "+593", texto: "EC +593" },
    { valor: "+34", texto: "ES +34" },
    { valor: "+52", texto: "MX +52" },
    { valor: "+51", texto: "PE +51" },
    { valor: "+1", texto: "US +1" }
];

function iniciarPerfilUsuario() {
    cargarDatosDePerfil();

    const btnEditar = document.getElementById("btnEditarPerfil");
    btnEditar?.addEventListener("click", activarModoEdicion);
}

function cargarDatosDePerfil() {
    if (typeof obtenerUsuarioRegistrado !== "function") return;

    const usuario = obtenerUsuarioRegistrado();
    if (!usuario) return;

    const nombreCompleto = document.getElementById("perfil-nombre-completo");
    const email = document.getElementById("perfil-email");
    const nombreInfo = document.getElementById("info-nombre");
    const emailInfo = document.getElementById("info-email");
    const telefonoInfo = document.getElementById("info-telefono");
    const ciudadInfo = document.getElementById("info-ciudad");
    const fechaNacimientoInfo = document.getElementById("info-fecha-nacimiento");

    if (nombreCompleto) nombreCompleto.textContent = usuario.nombreCompleto || "Usuario";
    if (email) email.textContent = usuario.email || "correo@ejemplo.com";

    if (nombreInfo) nombreInfo.textContent = usuario.nombreCompleto || "No especificado";
    if (emailInfo) emailInfo.textContent = usuario.email || "No especificado";

    // Si el teléfono tiene indicativo, lo mostramos bonito
    let telText = "No especificado";
    if (usuario.telefono) {
        telText = (usuario.indicativoPais ? usuario.indicativoPais + " " : "") + usuario.telefono;
    }
    if (telefonoInfo) telefonoInfo.textContent = telText;

    if (ciudadInfo) ciudadInfo.textContent = usuario.ciudad || "No especificada"; // Si lo guardaron en registro

    // La fecha se guarda en formato YYYY-MM-DD (input date), la mostramos como DD/MM/YYYY
    let fechaTexto = "No especificada";
    if (usuario.fechaNacimiento) {
        const [anio, mes, dia] = usuario.fechaNacimiento.split("-");
        if (anio && mes && dia) {
            fechaTexto = `${dia}/${mes}/${anio}`;
        }
    }
    if (fechaNacimientoInfo) fechaNacimientoInfo.textContent = fechaTexto;
}

// ========================================
// MODO EDICION
// ========================================

function activarModoEdicion() {
    const usuario = obtenerUsuarioRegistrado();
    if (!usuario) return;

    renderizarFormularioEdicion(usuario);
    renderizarAccionesEdicion();
}

function renderizarFormularioEdicion(usuario) {
    const grid = document.getElementById("perfilGrid");
    if (!grid) return;

    const opcionesIndicativo = INDICATIVOS_PAIS_PERFIL.map(indicativo =>
        `<option value="${indicativo.valor}" ${indicativo.valor === usuario.indicativoPais ? "selected" : ""}>${indicativo.texto}</option>`
    ).join("");

    grid.innerHTML = `
        <div class="perfil-item campo-perfil-editar" data-campo="nombreCompleto">
            <label for="editarNombreCompleto">Nombre completo</label>
            <input type="text" class="form-control" id="editarNombreCompleto" value="${escaparHtmlPerfil(usuario.nombreCompleto || "")}">
        </div>
        <div class="perfil-item campo-perfil-editar" data-campo="email">
            <label for="editarEmail">Correo electrónico</label>
            <input type="email" class="form-control" id="editarEmail" value="${escaparHtmlPerfil(usuario.email || "")}">
        </div>
        <div class="perfil-item campo-perfil-editar" data-campo="telefono">
            <label for="editarTelefono">Teléfono</label>
            <div class="perfil-telefono-grupo">
                <select class="form-select" id="editarIndicativoPais">${opcionesIndicativo}</select>
                <input type="tel" class="form-control" id="editarTelefono" maxlength="10" inputmode="numeric" value="${escaparHtmlPerfil(usuario.telefono || "")}">
            </div>
        </div>
        <div class="perfil-item campo-perfil-editar" data-campo="ciudad">
            <label for="editarCiudad">Ubicación / Ciudad</label>
            <input type="text" class="form-control" id="editarCiudad" placeholder="Ej. Bogotá" value="${escaparHtmlPerfil(usuario.ciudad || "")}">
        </div>
        <div class="perfil-item campo-perfil-editar" data-campo="fechaNacimiento">
            <label for="editarFechaNacimiento">Fecha de nacimiento</label>
            <input type="date" class="form-control" id="editarFechaNacimiento" max="${new Date().toISOString().split("T")[0]}" value="${usuario.fechaNacimiento || ""}">
        </div>
    `;
}

function renderizarAccionesEdicion() {
    const acciones = document.getElementById("perfilAcciones");
    if (!acciones) return;

    acciones.innerHTML = `
        <button type="button" class="btn-perfil" id="btnCancelarEdicionPerfil">Cancelar</button>
        <button type="button" class="btn-perfil btn-perfil--primario" id="btnGuardarPerfil">
            <i class="bi bi-check-lg me-1"></i> Guardar cambios
        </button>
    `;

    document.getElementById("btnCancelarEdicionPerfil")?.addEventListener("click", cancelarEdicionPerfil);
    document.getElementById("btnGuardarPerfil")?.addEventListener("click", guardarEdicionPerfil);
}

function cancelarEdicionPerfil() {
    cargarDatosDePerfil();
    restaurarGridDeSoloLectura();
    restaurarAccionesDeSoloLectura();
}

function restaurarGridDeSoloLectura() {
    const grid = document.getElementById("perfilGrid");
    if (!grid) return;

    grid.innerHTML = `
        <div class="perfil-item">
            <label>Nombre completo</label>
            <div class="perfil-valor" id="info-nombre"></div>
        </div>
        <div class="perfil-item">
            <label>Correo electrónico</label>
            <div class="perfil-valor" id="info-email"></div>
        </div>
        <div class="perfil-item">
            <label>Teléfono</label>
            <div class="perfil-valor" id="info-telefono"></div>
        </div>
        <div class="perfil-item">
            <label>Ubicación / Ciudad</label>
            <div class="perfil-valor" id="info-ciudad"></div>
        </div>
        <div class="perfil-item">
            <label>Fecha de nacimiento</label>
            <div class="perfil-valor" id="info-fecha-nacimiento"></div>
        </div>
    `;
}

function restaurarAccionesDeSoloLectura() {
    const acciones = document.getElementById("perfilAcciones");
    if (!acciones) return;

    acciones.innerHTML = `
        <button type="button" class="btn-perfil btn-perfil--primario" id="btnEditarPerfil">
            <i class="bi bi-pencil-square me-1"></i> Editar perfil
        </button>
    `;

    document.getElementById("btnEditarPerfil")?.addEventListener("click", activarModoEdicion);
}

function guardarEdicionPerfil() {
    limpiarErroresPerfil();

    const nombreCompleto = document.getElementById("editarNombreCompleto")?.value.trim() || "";
    const email = document.getElementById("editarEmail")?.value.trim() || "";
    const indicativoPais = document.getElementById("editarIndicativoPais")?.value || "+57";
    const telefono = document.getElementById("editarTelefono")?.value.trim() || "";
    const ciudad = document.getElementById("editarCiudad")?.value.trim() || "";
    const fechaNacimiento = document.getElementById("editarFechaNacimiento")?.value || "";

    let hayErrores = false;

    if (nombreCompleto.length < 3) {
        marcarCampoConError("nombreCompleto");
        hayErrores = true;
    }

    if (!validarCorreoPerfil(email)) {
        marcarCampoConError("email");
        hayErrores = true;
    }

    if (telefono && !/^\d{7,10}$/.test(telefono)) {
        marcarCampoConError("telefono");
        hayErrores = true;
    }

    if (hayErrores) {
        if (typeof Swal !== "undefined") {
            Swal.fire({
                icon: "warning",
                title: "Revisa los datos",
                text: "Hay campos con datos inválidos. Corrígelos antes de guardar.",
                confirmButtonColor: "#17a9a7"
            });
        }
        return;
    }

    const usuario = obtenerUsuarioRegistrado();
    actualizarUsuario(usuario.id, {
        nombreCompleto,
        email,
        indicativoPais,
        telefono,
        ciudad,
        fechaNacimiento
    });

    restaurarGridDeSoloLectura();
    restaurarAccionesDeSoloLectura();
    cargarDatosDePerfil();

    // El topbar tambien muestra nombre/correo, lo refrescamos sin recargar la pagina
    if (typeof cargarDatosUsuarioTopbar === "function") {
        cargarDatosUsuarioTopbar();
    }

    if (typeof Swal !== "undefined") {
        Swal.fire({
            icon: "success",
            title: "Perfil actualizado",
            text: "Tus datos se guardaron correctamente.",
            confirmButtonColor: "#17a9a7"
        });
    }
}

function marcarCampoConError(nombreCampo) {
    document.querySelector(`.campo-perfil-editar[data-campo="${nombreCampo}"]`)?.classList.add("campo-error");
}

function limpiarErroresPerfil() {
    document.querySelectorAll(".campo-perfil-editar.campo-error").forEach(campo => {
        campo.classList.remove("campo-error");
    });
}

function validarCorreoPerfil(valor) {
    const posicionArroba = valor.indexOf("@");
    const posicionPunto = valor.lastIndexOf(".");
    return (
        posicionArroba > 0 &&
        posicionPunto > posicionArroba + 1 &&
        posicionPunto < valor.length - 1 &&
        valor.indexOf(" ") === -1
    );
}

// se usa tambien dentro de atributos value="", por eso escapamos comillas
function escaparHtmlPerfil(valor) {
    const div = document.createElement("div");
    div.textContent = String(valor);
    return div.innerHTML.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
