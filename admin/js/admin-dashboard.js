document.addEventListener(
    "DOMContentLoaded",
    function () {

        mostrarFechaActual();

        iniciarSidebarDashboard();

    }
);


/* ========================================
   FECHA ACTUAL
======================================== */

function mostrarFechaActual() {

    const fechaElemento =
        document.getElementById(
            "currentDate"
        );


    if (!fechaElemento) {
        return;
    }


    const fechaActual =
        new Date();


    const opcionesFecha = {
        day: "numeric",
        month: "long",
        year: "numeric"
    };


    const fechaFormateada =
        fechaActual.toLocaleDateString(
            "es-CO",
            opcionesFecha
        );


    fechaElemento.textContent =
        fechaFormateada;

}


/* ========================================
   SIDEBAR

   ESCUCHA EL EVENTO QUE MANDA
   topbar.js CUANDO SE PRESIONA
   LA HAMBURGUESA.
======================================== */

function iniciarSidebarDashboard() {

    const overlay =
        document.getElementById(
            "adminSidebarOverlay"
        );


    document.addEventListener(
        "toggleAdminSidebar",
        function () {

            if (
                window.innerWidth <= 992
            ) {

                document.body.classList.toggle(
                    "sidebar-mobile-open"
                );

            } else {

                document.body.classList.toggle(
                    "sidebar-collapsed"
                );

            }

        }
    );


    if (overlay) {

        overlay.addEventListener(
            "click",
            function () {

                document.body.classList.remove(
                    "sidebar-mobile-open"
                );

            }
        );

    }


    window.addEventListener(
        "resize",
        function () {

            if (
                window.innerWidth > 992
            ) {

                document.body.classList.remove(
                    "sidebar-mobile-open"
                );

            }

        }
    );

}