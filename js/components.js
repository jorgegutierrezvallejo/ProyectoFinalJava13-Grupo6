async function cargarComponente(idContenedor, rutaArchivo) {
    const contenedor = document.getElementById(idContenedor);

    if (!contenedor) {
        return;
    }

    try {
        const respuesta = await fetch(rutaArchivo);

        if (!respuesta.ok) {
            throw new Error(`No se pudo cargar: ${rutaArchivo}`);
        }

        const contenido = await respuesta.text();

        contenedor.innerHTML = contenido;
    } catch (error) {
        console.error(error);
    }
}

function marcarPaginaActiva() {
    const paginaActual = document.body.dataset.page;

    const enlaceActual = document.querySelector(
        `[data-nav="${paginaActual}"]`
    );

    if (enlaceActual) {
        enlaceActual.classList.add("active");
    }
}

function configurarModal() {

    const botonLogin = document.getElementById("btn-login");
    const modal = document.getElementById("auth-modal");
    const botonCerrar = document.getElementById("btn-close-modal");

    if (!botonLogin || !modal || !botonCerrar) {
        return;
    }

    botonLogin.addEventListener("click", (evento) => {
        evento.preventDefault();

        modal.classList.add("active");
    });

    botonCerrar.addEventListener("click", () => {
        modal.classList.remove("active");
    });
}

async function iniciarComponentes() {
    await cargarComponente(
        "header-container",
        "components/header.html"
    );

    await cargarComponente(
        "authmodal-container",
        "components/authmodal.html"
    );

    await cargarComponente(
        "footer-container",
        "components/footer.html"
    );

    marcarPaginaActiva();

    document.dispatchEvent(
        new CustomEvent("componentesCargados")
    );
}

document.addEventListener(
    "DOMContentLoaded",
    iniciarComponentes
);
