document.addEventListener(
    "DOMContentLoaded",
    function () {

        cargarTopbar();

    }
);


async function cargarTopbar() {

    const contenedorTopbar =
        document.getElementById(
            "topbar-container"
        );


    if (!contenedorTopbar) {
        return;
    }


    try {

        const respuesta =
            await fetch("./top-bar.html");


        if (!respuesta.ok) {

            throw new Error(
                "No se pudo cargar top-bar.html"
            );

        }


        const html =
            await respuesta.text();


        contenedorTopbar.innerHTML =
            html;


        iniciarTopbar();


    } catch (error) {

        console.error(
            "Error cargando Topbar:",
            error
        );

    }

}



/* ========================================
   INICIAR TOPBAR
======================================== */

function iniciarTopbar() {

    cambiarTituloPagina();

    iniciarMenuPerfil();

    iniciarBotonSidebar();

    iniciarNotificacionesAdmin();

    iniciarCerrarSesionAdmin();

    document.dispatchEvent(new CustomEvent("topbarCargada"));

}



/* ========================================
   ACTIVIDAD RECIENTE / NOTIFICACIONES
======================================== */

function iniciarNotificacionesAdmin() {
    const boton = document.getElementById("notificationButton");
    const panel = document.getElementById("notificationPanel");
    const insignia = document.getElementById("notificationBadge");
    const lista = document.getElementById("notificationList");

    if (!boton || !panel || !insignia || !lista) return;

    const citas = leerCitasTopbarAdmin()
        .sort((a, b) => fechaActividadAdmin(b) - fechaActividadAdmin(a));
    const recientes = citas.slice(0, 6);

    insignia.textContent = String(Math.min(citas.length, 99));
    insignia.hidden = citas.length === 0;
    lista.innerHTML = recientes.length
        ? recientes.map(crearActividadAdminHtml).join("")
        : `<div class="topbar-notification-empty">
                <i class="bi bi-bell-slash"></i>
                <span>No hay actividad reciente.</span>
           </div>`;

    boton.addEventListener("click", function (event) {
        event.stopPropagation();
        const abrir = panel.hidden;
        panel.hidden = !abrir;
        boton.setAttribute("aria-expanded", String(abrir));
    });

    panel.addEventListener("click", event => event.stopPropagation());
    document.addEventListener("click", () => cerrarNotificacionesAdmin(boton, panel));
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") cerrarNotificacionesAdmin(boton, panel);
    });
}

function leerCitasTopbarAdmin() {
    try {
        const citas = JSON.parse(localStorage.getItem("citas") || "[]");
        return Array.isArray(citas) ? citas : [];
    } catch (error) {
        console.warn("No fue posible leer la actividad de citas.", error);
        return [];
    }
}

function crearActividadAdminHtml(cita) {
    const estado = String(cita.estado || "Pendiente");
    const iconos = {
        Confirmada: "bi-check-circle",
        Completada: "bi-heart-pulse",
        Cancelada: "bi-x-circle",
        Rechazada: "bi-x-circle",
        Pendiente: "bi-calendar-plus"
    };
    const claseEstado = estado.toLowerCase().replace(/[^a-z]/g, "");
    const marcaTiempo = cita.actualizadoEn || cita.fechaCreacion;

    return `
        <a class="topbar-notification-item" href="./admin-citas.html?fecha=${encodeURIComponent(cita.fecha || "")}">
            <span class="topbar-notification-icon topbar-notification-icon--${claseEstado}">
                <i class="bi ${iconos[estado] || "bi-calendar-event"}"></i>
            </span>
            <span class="topbar-notification-content">
                <strong>${escaparTextoNotificacionAdmin(cita.nombreMascota || "Mascota")} · ${escaparTextoNotificacionAdmin(estado)}</strong>
                <span>${escaparTextoNotificacionAdmin(cita.servicioNombre || "Servicio veterinario")} · ${escaparTextoNotificacionAdmin(cita.fecha || "Fecha pendiente")} ${escaparTextoNotificacionAdmin(cita.hora || "")}</span>
                <small>${tiempoRelativoAdmin(marcaTiempo)}</small>
            </span>
        </a>`;
}

function cerrarNotificacionesAdmin(boton, panel) {
    panel.hidden = true;
    boton.setAttribute("aria-expanded", "false");
}

function fechaActividadAdmin(cita) {
    const fecha = new Date(cita.actualizadoEn || cita.fechaCreacion || 0);
    return Number.isNaN(fecha.getTime()) ? 0 : fecha.getTime();
}

function tiempoRelativoAdmin(valorFecha) {
    const fecha = new Date(valorFecha || 0);
    if (Number.isNaN(fecha.getTime())) return "Actividad registrada";
    const minutos = Math.max(0, Math.floor((Date.now() - fecha.getTime()) / 60000));
    if (minutos < 1) return "Ahora";
    if (minutos < 60) return `Hace ${minutos} min`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `Hace ${horas} h`;
    const dias = Math.floor(horas / 24);
    return `Hace ${dias} día${dias === 1 ? "" : "s"}`;
}

function escaparTextoNotificacionAdmin(valor) {
    return String(valor || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function iniciarCerrarSesionAdmin() {
    const botonCerrarSesion = document.getElementById("adminLogoutButton");
    if (!botonCerrarSesion) return;

    botonCerrarSesion.addEventListener("click", function () {
        if (typeof cerrarSesionUsuario === "function") {
            cerrarSesionUsuario();
        } else {
            localStorage.removeItem("sesionUsuarioId");
        }
        window.location.href = "../../index.html";
    });
}



/* ========================================
   TÍTULO DINÁMICO
======================================== */

function cambiarTituloPagina() {

    const tituloTopbar =
        document.getElementById(
            "topbarPageTitle"
        );


    if (!tituloTopbar) {
        return;
    }


    const tituloPagina =
        document.body.dataset.pageTitle;


    if (tituloPagina) {

        tituloTopbar.textContent =
            tituloPagina;

    }

}



/* ========================================
   MENÚ PERFIL
======================================== */

function iniciarMenuPerfil() {

    const botonPerfil =
        document.getElementById(
            "profileButton"
        );


    const dropdown =
        document.getElementById(
            "profileDropdown"
        );


    const flecha =
        document.getElementById(
            "profileArrow"
        );


    if (!botonPerfil || !dropdown) {
        return;
    }


    botonPerfil.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();


            dropdown.classList.toggle(
                "active"
            );


            if (flecha) {

                flecha.classList.toggle(
                    "active"
                );

            }

        }
    );


    dropdown.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();

        }
    );


    document.addEventListener(
        "click",
        function () {

            dropdown.classList.remove(
                "active"
            );


            if (flecha) {

                flecha.classList.remove(
                    "active"
                );

            }

        }
    );

}



/* ========================================
   HAMBURGUESA
======================================== */

function iniciarBotonSidebar() {

    const botonMenu =
        document.getElementById(
            "topbarMenuButton"
        );


    if (!botonMenu) {
        return;
    }


    botonMenu.addEventListener(
        "click",
        function () {

            if (
                window.innerWidth <= 768
            ) {

                document.body.classList.toggle(
                    "sidebar-mobile-open"
                );


                const estaAbierto =
                    document.body.classList.contains(
                        "sidebar-mobile-open"
                    );


                botonMenu.setAttribute(
                    "aria-expanded",
                    estaAbierto
                );


            } else {

                document.body.classList.toggle(
                    "sidebar-collapsed"
                );

            }

        }
    );

}
