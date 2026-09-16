document.addEventListener("DOMContentLoaded", function () {

    cargarTopbar();

});


async function cargarTopbar() {

    const contenedorTopbar =
        document.getElementById("topbar-container");

    if (!contenedorTopbar) {
        return;
    }

    try {

        const respuesta =
            await fetch("./top-bar.html");

        if (!respuesta.ok) {
            throw new Error("No se pudo cargar top-bar.html");
        }

        const html =
            await respuesta.text();

        contenedorTopbar.innerHTML = html;

        iniciarTopbar();

    } catch (error) {

        console.error("Error cargando Topbar:", error);

    }

}


function iniciarTopbar() {

    cambiarTituloPagina();

    mostrarDatosAdmin();

    iniciarMenuPerfil();

    iniciarBotonSidebar();

    iniciarCerrarSesionAdmin();

    document.dispatchEvent(new CustomEvent("topbarCargada"));

}


function mostrarDatosAdmin() {
    const usuario = typeof obtenerUsuarioRegistrado === "function"
        ? obtenerUsuarioRegistrado()
        : (typeof obtenerUsuarioActual === "function" ? obtenerUsuarioActual() : null);

    const nombreEl = document.getElementById("topbarNombreAdmin");
    const correoEl = document.getElementById("topbarCorreoAdmin");

    if (nombreEl) {
        nombreEl.textContent = usuario?.nombreCompleto || "Administrador";
    }
    if (correoEl) {
        correoEl.textContent = usuario?.correo || usuario?.email || "";
    }
}


function iniciarCerrarSesionAdmin() {
    const botonCerrarSesion = document.getElementById("adminLogoutButton");
    if (!botonCerrarSesion) return;

    botonCerrarSesion.addEventListener("click", function () {
        if (typeof cerrarSesionUsuario === "function") {
            cerrarSesionUsuario();
        } else if (typeof cerrarSesionApi === "function") {
            cerrarSesionApi();
        }
        window.location.href = "../../index.html";
    });
}


function cambiarTituloPagina() {

    const tituloTopbar =
        document.getElementById("topbarPageTitle");

    if (!tituloTopbar) {
        return;
    }

    const tituloPagina =
        document.body.dataset.pageTitle;

    if (tituloPagina) {
        tituloTopbar.textContent = tituloPagina;
    }

}


function iniciarMenuPerfil() {

    const botonPerfil =
        document.getElementById("profileButton");

    const dropdown =
        document.getElementById("profileDropdown");

    if (!botonPerfil || !dropdown) {
        return;
    }

    botonPerfil.addEventListener("click", function (event) {
        event.stopPropagation();
        const abierto = dropdown.classList.toggle("active");
        botonPerfil.setAttribute("aria-expanded", String(abierto));
    });

    dropdown.addEventListener("click", event => event.stopPropagation());

    document.addEventListener("click", function () {
        dropdown.classList.remove("active");
    });

}


function iniciarBotonSidebar() {

    const boton =
        document.getElementById("topbarMenuButton");

    if (!boton) {
        return;
    }

    boton.addEventListener("click", function () {
        if (window.innerWidth <= 768) {
            document.body.classList.toggle("sidebar-mobile-open");
        } else {
            document.body.classList.toggle("sidebar-collapsed");
        }
    });

}
