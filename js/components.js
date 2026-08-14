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
