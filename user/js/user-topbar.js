document.addEventListener("userComponentsLoaded", function () {
    iniciarTopbarUsuario();
});

async function iniciarTopbarUsuario() {
    cambiarTituloPaginaUsuario();
    cargarDatosUsuarioTopbar();

    const profileButton = document.getElementById("profileButton");
    const profileMenu = document.getElementById("profileMenu");
    const notificationButton = document.getElementById("notificationButton");

    if (profileButton && profileMenu) {
        profileButton.addEventListener("click", function (e) {
            e.stopPropagation();
            profileMenu.classList.toggle("show");
        });

        document.addEventListener("click", function (e) {
            if (!profileMenu.contains(e.target) && !profileButton.contains(e.target)) {
                profileMenu.classList.remove("show");
            }
        });
    }

    // Numero real en la campana: se calcula al cargar la topbar, no solo
    // al hacer clic, para que el usuario vea el conteo correcto de una vez.
    await actualizarBadgeNotificaciones();

    if (notificationButton) {
        notificationButton.addEventListener("click", async function () {
            if (typeof Swal !== "undefined") {
                const citas = await obtenerCitasFuturasParaNotificaciones();
                const contenido = citas.length > 0
                    ? citas.slice(0, 3).map(cita => `
                        <div class="p-2 border-bottom">
                            <strong>${escaparTextoTopbar(cita.servicioNombre || "Cita veterinaria")}</strong>
                            <p class="text-muted mb-0">${escaparTextoTopbar(cita.nombreMascota || "Tu mascota")} · ${escaparTextoTopbar(cita.fecha || "Fecha pendiente")} · ${escaparTextoTopbar(cita.hora || "Hora pendiente")}</p>
                        </div>
                    `).join("")
                    : `<div class="p-2"><strong>Sin notificaciones pendientes</strong><p class="text-muted mb-0">Tus próximas citas aparecerán aquí.</p></div>`;
                Swal.fire({
                    icon: "info",
                    title: "Notificaciones",
                    html: `<div class="text-start small">${contenido}</div>`,
                    confirmButtonText: "Entendido",
                    confirmButtonColor: "#17a9a7"
                });
            }
        });
    }

    const botonCerrarSesion = document.getElementById("userLogoutButton");
    botonCerrarSesion?.addEventListener("click", function (evento) {
        evento.preventDefault();
        cerrarSesionUsuario();
        window.location.href = "../../index.html";
    });
}

// Fuente unica de datos para la campana: las citas futuras del usuario
// (misma peticion/cache que ya usan el dashboard y "Mis citas").
async function obtenerCitasFuturasParaNotificaciones() {
    const usuario = typeof obtenerUsuarioRegistrado === "function" ? obtenerUsuarioRegistrado() : null;
    if (!usuario) return [];

    if (typeof asegurarCitasCargadas === "function") {
        try {
            await asegurarCitasCargadas(usuario.id);
        } catch (error) {
            console.warn("No se pudieron cargar las citas para las notificaciones:", error);
            return [];
        }
    }

    return typeof obtenerCitasFuturas === "function" ? obtenerCitasFuturas(usuario.id) : [];
}

// Actualiza el numero de la campana con el total real de citas futuras.
// Se oculta el badge (en vez de mostrar "0") cuando no hay nada pendiente.
async function actualizarBadgeNotificaciones() {
    const badge = document.getElementById("notificationBadge");
    if (!badge) return;

    const citas = await obtenerCitasFuturasParaNotificaciones();
    if (citas.length > 0) {
        badge.textContent = citas.length > 9 ? "9+" : String(citas.length);
        badge.hidden = false;
    } else {
        badge.hidden = true;
    }
}

function escaparTextoTopbar(valor) {
    return String(valor || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* ========================================
   TÍTULO DINÁMICO (mismo patrón que admin/js/topbar.js)
======================================== */

function cambiarTituloPaginaUsuario() {
    const tituloTopbar = document.getElementById("topbarPageTitle");

    if (!tituloTopbar) {
        return;
    }

    const tituloPagina = document.body.dataset.pageTitle;

    if (tituloPagina) {
        tituloTopbar.textContent = tituloPagina;
    }
}

function cargarDatosUsuarioTopbar() {
    if (typeof obtenerUsuarioRegistrado === "function") {
        const usuario = obtenerUsuarioRegistrado();
        if (usuario) {
            const nombreEl = document.querySelector(".topbar-profile-name");
            const emailEl = document.querySelector(".topbar-profile-role");
            const headerNombreEl = document.querySelector(".topbar-profile-header strong");
            const headerEmailEl = document.querySelector(".topbar-profile-header small");

            if (nombreEl) nombreEl.textContent = usuario.nombreCompleto || "Usuario";
            if (emailEl) emailEl.textContent = usuario.email || "correo@ejemplo.com";
            if (headerNombreEl) headerNombreEl.textContent = usuario.nombreCompleto || "Usuario";
            if (headerEmailEl) headerEmailEl.textContent = usuario.email || "correo@ejemplo.com";
        }
    }
}
