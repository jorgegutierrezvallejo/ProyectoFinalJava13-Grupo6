document.addEventListener("DOMContentLoaded", function () {

    cargarSidebar();

});


async function cargarSidebar() {

    const sidebarContainer =
        document.getElementById("sidebar-container");


    if (!sidebarContainer) {
        return;
    }


    try {

        const response =
            await fetch("./admin-sidebar.html");


        if (!response.ok) {
            throw new Error("No se pudo cargar admin-sidebar.html");
        }


        const html =
            await response.text();


        sidebarContainer.innerHTML = html;


        marcarOpcionActiva();

        iniciarOverlay();

        iniciarLinksMobile();


    } catch (error) {

        console.error(
            "Error cargando sidebar:",
            error
        );

    }

}



/* ========================================
   ACTIVE AUTOMÁTICO
======================================== */

function marcarOpcionActiva() {

    const paginaActual =
        document.body.dataset.page;


    const links =
        document.querySelectorAll(
            ".hv-sidebar__link"
        );


    links.forEach(function (link) {

        link.classList.remove(
            "hv-sidebar__link--activo"
        );


        if (
            link.dataset.page === paginaActual
        ) {

            link.classList.add(
                "hv-sidebar__link--activo"
            );

        }

    });

}



/* ========================================
   OVERLAY MOBILE
======================================== */

function iniciarOverlay() {

    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );


    if (!overlay) {
        return;
    }


    overlay.addEventListener(
        "click",
        function () {

            cerrarSidebarMobile();

        }
    );

}



/* ========================================
   CERRAR AL SELECCIONAR OPCIÓN
======================================== */

function iniciarLinksMobile() {

    const links =
        document.querySelectorAll(
            ".hv-sidebar__link"
        );


    links.forEach(function (link) {

        link.addEventListener(
            "click",
            function () {

                if (
                    window.innerWidth <= 768
                ) {

                    cerrarSidebarMobile();

                }

            }
        );

    });

}



/* ========================================
   CERRAR SIDEBAR MOBILE
======================================== */

function cerrarSidebarMobile() {

    document.body.classList.remove(
        "sidebar-mobile-open"
    );

}



/* ========================================
   CAMBIO DE TAMAÑO DE PANTALLA
======================================== */

window.addEventListener(
    "resize",
    function () {

        if (
            window.innerWidth > 768
        ) {

            document.body.classList.remove(
                "sidebar-mobile-open"
            );

        }

    }
);