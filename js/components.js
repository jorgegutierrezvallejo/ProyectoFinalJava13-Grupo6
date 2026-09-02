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

function cargarEstiloUnaVez(rutaArchivo) {
    if (document.querySelector(`link[href="${rutaArchivo}"]`)) return;
    const enlace = document.createElement("link");
    enlace.rel = "stylesheet";
    enlace.href = rutaArchivo;
    document.head.appendChild(enlace);
}

function marcarPaginaActiva() {
    const paginaActual = document.body.dataset.page;

    const enlaceActual = document.querySelector(
        `[data-page="${paginaActual}"]`
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

    const footer = document.getElementById("footer-container");
    if (footer) {
        const llamadoAccion = document.createElement("div");
        llamadoAccion.id = "cta-servicios-container";
        footer.before(llamadoAccion);
        await cargarComponente("cta-servicios-container", "components/cta-servicios.html");
        cargarEstiloUnaVez("css/cta-servicios.css");

        const preguntas = document.createElement("div");
        preguntas.id = "faq-container";
        llamadoAccion.after(preguntas);
        await cargarComponente("faq-container", "components/faqs.html");
        cargarEstiloUnaVez("css/faqs.css");
    }

    if (typeof iniciarServiciosFooter === "function") {
        iniciarServiciosFooter();
    }

    marcarPaginaActiva();

    document.dispatchEvent(
        new CustomEvent("componentesCargados")
    );
}

document.addEventListener(
    "DOMContentLoaded",
    iniciarComponentes
);
