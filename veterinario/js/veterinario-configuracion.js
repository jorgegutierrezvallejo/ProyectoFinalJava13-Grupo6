const FOTO_VETERINARIO_POR_DEFECTO = new URL("../../img/HuellaVet-icon.svg", window.location.href).href;
const CAMPOS_EDITABLES_PERFIL = ["adminIndicativo", "adminTelefono", "adminCiudad"];

let perfilVeterinario = null;

document.addEventListener("DOMContentLoaded", iniciarConfiguracion);

async function iniciarConfiguracion() {
    iniciarPestanasConfiguracion();
    iniciarEdicionCampos();
    iniciarFormularioPerfil();
    iniciarModalContrasena();
    await cargarPerfilDesdeBackend();
}

async function cargarPerfilDesdeBackend() {
    try {
        perfilVeterinario = await apiBackend("/veterinario/me");
        mostrarPerfilEnFormulario(perfilVeterinario);
        actualizarSesionConPerfil(perfilVeterinario);
    } catch (error) {
        console.error("No se pudo cargar el perfil del veterinario:", error);
        mostrarErrorConfiguracion("No se pudo cargar tu perfil", error);
    }
}

function actualizarSesionConPerfil(perfil) {
    if (typeof obtenerUsuarioActual !== "function" || typeof guardarSesion !== "function") return;
    const sesion = obtenerUsuarioActual();
    if (sesion) guardarSesion({ ...sesion, ...perfil });
}

function mostrarPerfilEnFormulario(perfil) {
    const campos = {
        adminNombres: perfil.nombres,
        adminApellidos: perfil.apellidos,
        adminIndicativo: perfil.indicativoPais || "+57",
        adminTelefono: perfil.telefono,
        adminCiudad: perfil.ciudad,
        adminCorreo: perfil.correo
    };

    Object.entries(campos).forEach(([id, valor]) => {
        const campo = document.getElementById(id);
        if (campo) campo.value = valor || "";
    });

    const imagen = document.querySelector("#fotoPerfilPreview img");
    if (imagen) {
        imagen.onerror = function () {
            imagen.onerror = null;
            imagen.src = FOTO_VETERINARIO_POR_DEFECTO;
        };
        imagen.src = perfil.foto || FOTO_VETERINARIO_POR_DEFECTO;
    }
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

function iniciarFormularioPerfil() {
    document.getElementById("formPerfilAdmin")?.addEventListener("submit", async evento => {
        evento.preventDefault();

        const telefono = valorCampo("adminTelefono");
        const ciudad = valorCampo("adminCiudad");
        const indicativoPais = valorCampo("adminIndicativo");

        if (!/^[0-9 ]{7,15}$/.test(telefono)) {
            mostrarAdvertenciaConfiguracion("Ingresa un teléfono válido, solo números (7 a 15 dígitos).");
            return;
        }
        if (ciudad === "") {
            mostrarAdvertenciaConfiguracion("La ciudad es obligatoria.");
            return;
        }

        try {
            perfilVeterinario = await apiBackend("/veterinario/me", {
                method: "PUT",
                body: { telefono, indicativoPais, ciudad }
            });
            mostrarPerfilEnFormulario(perfilVeterinario);
            actualizarSesionConPerfil(perfilVeterinario);
            bloquearCampos(CAMPOS_EDITABLES_PERFIL);
            Swal.fire({
                icon: "success",
                title: "Perfil actualizado",
                confirmButtonText: "Aceptar",
                confirmButtonColor: "#008e98"
            });
        } catch (error) {
            console.error("No se pudo guardar el perfil:", error);
            mostrarErrorConfiguracion("No se pudo guardar el perfil", error);
        }
    });

    document.querySelectorAll("[data-cancelar-form]").forEach(boton => {
        boton.addEventListener("click", () => {
            if (perfilVeterinario) mostrarPerfilEnFormulario(perfilVeterinario);
            bloquearCampos(CAMPOS_EDITABLES_PERFIL);
        });
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

    formulario.addEventListener("submit", async evento => {
        evento.preventDefault();
        const actual = document.getElementById("contrasenaActual").value;
        const nueva = document.getElementById("nuevaContrasena").value;
        const confirmacion = document.getElementById("confirmarContrasena").value;

        if (actual === "") {
            if (mensajeError) mensajeError.textContent = "Ingresa tu contraseña actual.";
            return;
        }
        if (nueva.length < 8 || nueva.length > 20) {
            if (mensajeError) mensajeError.textContent = "La nueva contraseña debe tener entre 8 y 20 caracteres.";
            return;
        }
        if (nueva !== confirmacion) {
            if (mensajeError) mensajeError.textContent = "Las contraseñas nuevas no coinciden.";
            return;
        }

        try {
            await apiBackend("/veterinario/me/contrasena", {
                method: "PUT",
                body: { contrasenaActual: actual, contrasenaNueva: nueva }
            });
            cerrar();
            Swal.fire({
                icon: "success",
                title: "Contraseña actualizada",
                confirmButtonText: "Aceptar",
                confirmButtonColor: "#008e98"
            });
        } catch (error) {
            if (mensajeError) mensajeError.textContent = error?.message || "No se pudo actualizar la contraseña.";
        }
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

function mostrarAdvertenciaConfiguracion(texto) {
    Swal.fire({
        icon: "warning",
        title: "Revisa los datos",
        text: texto,
        confirmButtonText: "Entendido",
        confirmButtonColor: "#008e98"
    });
}

function mostrarErrorConfiguracion(titulo, error) {
    Swal.fire({
        icon: "error",
        title: titulo,
        text: error?.message || "Ocurrió un error al comunicarse con el servidor.",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#008e98"
    });
}
