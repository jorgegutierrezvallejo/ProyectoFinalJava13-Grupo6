document.addEventListener("userComponentsLoaded", function () {
    iniciarTopbarUsuario();
});

function iniciarTopbarUsuario() {
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

    if (notificationButton) {
        notificationButton.addEventListener("click", function () {
            if (typeof Swal !== "undefined") {
                const usuario = typeof obtenerUsuarioRegistrado === "function" ? obtenerUsuarioRegistrado() : null;
                const citas = usuario && typeof obtenerCitasFuturas === "function"
                    ? obtenerCitasFuturas(usuario.id).slice(0, 3)
                    : [];
                const contenido = citas.length > 0
                    ? citas.map(cita => `
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
