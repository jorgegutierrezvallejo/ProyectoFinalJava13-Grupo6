const ADMIN_CONFIGURACION_STORAGE_KEY = "adminConfiguracion";
const FOTO_ADMIN_POR_DEFECTO = "../../img/HuellaVet-icon.svg";
let fotoPerfilEliminada = false;

const configuracionInicial = {
    nombres: "Administrador",
    apellidos: "HuellaVet",
    indicativo: "+57",
    telefono: "300 000 0000",
    ciudad: "Medellín, Antioquia",
    fechaNacimiento: "1985-04-15",
    correo: "admin@huellavet.com",
    contrasena: "HuellaVet2026",
    foto: ""
};

document.addEventListener("DOMContentLoaded", iniciarConfiguracion);
document.addEventListener("topbarCargada", sincronizarFotoTopbar);

function iniciarConfiguracion() {
    const configuracion = obtenerConfiguracionAdmin();
    cargarConfiguracionEnFormulario(configuracion);
    iniciarPestanasConfiguracion();
    iniciarEdicionCampos();
    iniciarFotoPerfil();
    iniciarFormulariosConfiguracion();
    iniciarModalContrasena();
}

function obtenerConfiguracionAdmin() {
    const guardada = typeof HuellaVetStorage !== "undefined"
        ? HuellaVetStorage.leer(ADMIN_CONFIGURACION_STORAGE_KEY, {})
        : {};
    return { ...configuracionInicial, ...(guardada || {}) };
}

function guardarConfiguracionAdmin(configuracion) {
    if (typeof HuellaVetStorage !== "undefined") {
        HuellaVetStorage.guardar(ADMIN_CONFIGURACION_STORAGE_KEY, configuracion);
    }
}

function cargarConfiguracionEnFormulario(configuracion) {
    const campos = {
        adminNombres: configuracion.nombres,
        adminApellidos: configuracion.apellidos,
        adminIndicativo: configuracion.indicativo,
        adminTelefono: configuracion.telefono,
        adminCiudad: configuracion.ciudad,
        adminNacimiento: configuracion.fechaNacimiento,
        adminCorreo: configuracion.correo,
        adminContrasena: configuracion.contrasena
    };

    Object.entries(campos).forEach(([id, valor]) => {
        const campo = document.getElementById(id);
        if (campo) campo.value = valor || "";
    });

    if (configuracion.foto) actualizarVistaFoto(configuracion.foto);
    else actualizarVistaFoto(FOTO_ADMIN_POR_DEFECTO);

    fotoPerfilEliminada = false;
    actualizarEstadoEliminarFoto(Boolean(configuracion.foto));
    sincronizarFotoTopbar();
}

function iniciarPestanasConfiguracion() {
    document.querySelectorAll("[data-config-tab]").forEach(boton => {
        boton.addEventListener("click", () => mostrarPestana(boton.dataset.configTab));
    });
}

function mostrarPestana(nombre) {
    document.querySelectorAll("[data-config-tab]").forEach(boton => {
        const activa = boton.dataset.configTab === nombre;
        boton.classList.toggle("configuracion-menu__opcion--activa", activa);
        boton.setAttribute("aria-selected", String(activa));
    });

    document.querySelectorAll("[data-config-panel]").forEach(panel => {
        panel.hidden = panel.dataset.configPanel !== nombre;
    });
}

function iniciarEdicionCampos() {
    document.querySelectorAll("[data-edit-field]").forEach(boton => {
        boton.addEventListener("click", () => {
            const campo = document.getElementById(boton.dataset.editField);
            if (!campo) return;

            campo.disabled = false;
            campo.focus();
            if (campo.select) campo.select();

            if (campo.id === "adminTelefono") {
                const indicativo = document.getElementById("adminIndicativo");
                if (indicativo) indicativo.disabled = false;
            }
        });
    });

    document.querySelectorAll("[data-toggle-password]").forEach(boton => {
        boton.addEventListener("click", () => {
            const campo = document.getElementById(boton.dataset.togglePassword);
            if (!campo) return;
            const visible = campo.type === "text";
            campo.type = visible ? "password" : "text";
            boton.setAttribute("aria-label", visible ? "Mostrar contraseña" : "Ocultar contraseña");
            boton.querySelector("i")?.classList.toggle("bi-eye", visible);
            boton.querySelector("i")?.classList.toggle("bi-eye-slash", !visible);
        });
    });
}

function iniciarFotoPerfil() {
    const input = document.getElementById("fotoPerfil");
    input?.addEventListener("change", () => {
        const archivo = input.files?.[0];
        if (!archivo || !archivo.type.startsWith("image/")) return;

        const lector = new FileReader();
        lector.addEventListener("load", () => {
            fotoPerfilEliminada = false;
            actualizarVistaFoto(lector.result);
            actualizarEstadoEliminarFoto(true);
            sincronizarFotoTopbar(lector.result);
        });
        lector.readAsDataURL(archivo);
    });

    document.getElementById("eliminarFotoPerfil")?.addEventListener("click", () => {
        fotoPerfilEliminada = true;
        input.value = "";
        actualizarVistaFoto(FOTO_ADMIN_POR_DEFECTO);
        actualizarEstadoEliminarFoto(false);
        sincronizarFotoTopbar(FOTO_ADMIN_POR_DEFECTO);
    });
}

function actualizarVistaFoto(fuente) {
    const imagen = document.querySelector("#fotoPerfilPreview img");
    if (imagen && fuente) imagen.src = fuente;
}

function actualizarEstadoEliminarFoto(tieneFoto) {
    const boton = document.getElementById("eliminarFotoPerfil");
    if (boton) boton.hidden = !tieneFoto;
}

function sincronizarFotoTopbar(foto) {
    const imagenTopbar = document.querySelector(".topbar-profile-image");
    if (!imagenTopbar) return;

    const configuracion = obtenerConfiguracionAdmin();
    imagenTopbar.src = foto || configuracion?.foto || FOTO_ADMIN_POR_DEFECTO;
}

function iniciarFormulariosConfiguracion() {
    document.getElementById("formPerfilAdmin")?.addEventListener("submit", evento => {
        evento.preventDefault();
        const configuracion = obtenerConfiguracionAdmin();
        const foto = document.querySelector("#fotoPerfilPreview img")?.src || "";
        const datos = {
            ...configuracion,
            nombres: valorCampo("adminNombres"),
            apellidos: valorCampo("adminApellidos"),
            indicativo: valorCampo("adminIndicativo"),
            telefono: valorCampo("adminTelefono"),
            ciudad: valorCampo("adminCiudad"),
            fechaNacimiento: valorCampo("adminNacimiento"),
            foto: fotoPerfilEliminada ? "" : (foto.startsWith("data:") ? foto : configuracion.foto)
        };
        guardarConfiguracionAdmin(datos);
        sincronizarFotoTopbar(datos.foto || FOTO_ADMIN_POR_DEFECTO);
        bloquearCampos(["adminNombres", "adminApellidos", "adminIndicativo", "adminTelefono", "adminCiudad", "adminNacimiento"]);
    });

    document.querySelectorAll("[data-cancelar-form]").forEach(boton => {
        boton.addEventListener("click", () => {
            cargarConfiguracionEnFormulario(obtenerConfiguracionAdmin());
            bloquearCampos(["adminNombres", "adminApellidos", "adminIndicativo", "adminTelefono", "adminCiudad", "adminNacimiento"]);
        });
    });

    const campoCorreo = document.getElementById("adminCorreo");
    campoCorreo?.addEventListener("change", () => {
        const configuracion = obtenerConfiguracionAdmin();
        guardarConfiguracionAdmin({ ...configuracion, correo: valorCampo("adminCorreo") });
        campoCorreo.disabled = true;
    });

    document.getElementById("formCuentaAdmin")?.addEventListener("submit", evento => {
        evento.preventDefault();
    });
}

function iniciarModalContrasena() {
    const modal = document.getElementById("modalContrasena");
    const formulario = document.getElementById("formCambiarContrasena");
    const botonAbrir = document.getElementById("abrirModalContrasena");
    const mensajeError = document.getElementById("errorContrasena");
    if (!modal || !formulario || !botonAbrir) return;

    const cerrar = () => {
        modal.classList.remove("configuracion-modal--visible");
        modal.setAttribute("aria-hidden", "true");
        formulario.reset();
        if (mensajeError) mensajeError.textContent = "";
    };

    const abrir = () => {
        modal.classList.add("configuracion-modal--visible");
        modal.setAttribute("aria-hidden", "false");
        document.getElementById("contrasenaActual")?.focus();
    };

    botonAbrir.addEventListener("click", abrir);
    document.querySelectorAll("[data-open-password-modal]").forEach(boton => {
        boton.addEventListener("click", abrir);
    });

    modal.addEventListener("click", evento => {
        if (evento.target === modal) cerrar();
    });

    document.querySelectorAll("[data-cerrar-modal]").forEach(boton => {
        boton.addEventListener("click", cerrar);
    });

    document.addEventListener("keydown", evento => {
        if (evento.key === "Escape" && modal.classList.contains("configuracion-modal--visible")) cerrar();
    });

    formulario.addEventListener("submit", evento => {
        evento.preventDefault();
        const configuracion = obtenerConfiguracionAdmin();
        const actual = valorCampo("contrasenaActual");
        const nueva = valorCampo("nuevaContrasena");
        const confirmacion = valorCampo("confirmarContrasena");

        if (actual !== configuracion.contrasena) {
            if (mensajeError) mensajeError.textContent = "La contraseña actual no es correcta.";
            return;
        }
        if (nueva.length < 6) {
            if (mensajeError) mensajeError.textContent = "La nueva contraseña debe tener al menos 6 caracteres.";
            return;
        }
        if (nueva !== confirmacion) {
            if (mensajeError) mensajeError.textContent = "Las contraseñas nuevas no coinciden.";
            return;
        }

        guardarConfiguracionAdmin({ ...configuracion, contrasena: nueva });
        const campoCuenta = document.getElementById("adminContrasena");
        if (campoCuenta) {
            campoCuenta.value = nueva;
            campoCuenta.disabled = true;
            campoCuenta.type = "password";
        }
        cerrar();
    });
}

function valorCampo(id) {
    return document.getElementById(id)?.value.trim() || "";
}

function bloquearCampos(ids) {
    ids.forEach(id => {
        const campo = document.getElementById(id);
        if (campo) campo.disabled = true;
    });
}
