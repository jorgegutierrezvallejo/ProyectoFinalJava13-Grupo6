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