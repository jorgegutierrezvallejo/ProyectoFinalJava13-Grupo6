document.addEventListener("DOMContentLoaded", function () {
    mostrarServicios();
    iniciarFiltrosServicios();
});


function mostrarServicios() {

    const contenedor = document.getElementById("servicios-dinamicos");

    if (!contenedor) {
        return;
    }

    const servicios = obtenerServicios();

    if (servicios.length === 0) {
        return;
    }

    servicios.forEach(function (servicio) {

        const categoria = obtenerCategoriaServicio(servicio);

        const tarjeta =
            `<div class="col-md-6 col-lg-4 servicio-dinamico"
                  data-category="${categoria}">
                <div class="card h-100 servicio-card">
                    ${servicio.imagen ? `
                    <div class="servicio-imagen-contenedor">
                        <img 
                            src="${servicio.imagen}" 
                            class="card-img-top servicio-imagen" 
                            alt="${servicio.nombre}">
                        <div class="servicio-icono">
                            <i class="${servicio.icono || "bi bi-heart-pulse"}"></i>
                        </div>
                    </div>
                    ` : `
                    <div class="d-flex align-items-center justify-content-center servicio-imagen-placeholder"
                        style="height: 200px; background-color: #dff5ef;">
                        <i class="${servicio.icono || "bi bi-heart-pulse"}"
                           style="font-size: 60px; color: #bad641;">
                        </i>
                    </div>`
                    }
                    <div class="card-body">
                        <h5 class="card-title">
                            ${servicio.nombre}
                        </h5>
                        <p class="card-text">
                            ${servicio.descripcion}
                        </p>
                        <div class="servicio-info-detalle">
                            <i class="bi bi-coin icons-details"></i>
                            <span>
                                $${Number(servicio.precio).toLocaleString("es-CO")} COP
                            </span>
                        </div>
                        <div class="servicio-info-detalle">
                            <i class="bi bi-clock icons-details"></i>
                            <span>
                                ${servicio.duracion} min
                            </span>
                        </div>
                        <div class="servicio-etiqueta ${servicio.modalidad === "virtual" || servicio.esVirtual ? "virtual" : (servicio.esDomicilio || servicio.modalidad === "domicilio" ? "domicilio" : "clinica")}">
                            <i class="${servicio.modalidad === "virtual" || servicio.esVirtual ? "bi bi-camera-video" : (servicio.esDomicilio || servicio.modalidad === "domicilio" ? "bi bi-house-door" : "bi bi-hospital")} icons-details"></i>
                            <span>${
                                servicio.modalidad === "virtual" || servicio.esVirtual? "Virtual" : (servicio.esDomicilio || servicio.modalidad === "domicilio" ? "A domicilio": "En clínica")
                            }</span>
                        </div>
                    </div>
                    <div class="card-footer d-flex gap-5">
                        <button class="btn btn-agendar">
                            <i class="bi bi-calendar3"></i>
                            Agendar cita
                        </button>
                        <button class="btn btn-detalles">
                            Ver detalles
                        </button>
                    </div>
                </div>
            </div>`;
        contenedor.innerHTML += tarjeta;
    });
}

function iniciarFiltrosServicios() {
    const botones = document.querySelectorAll("#filtro-botones [data-filter]");
    if (!botones.length) {
        return;
    }

    botones.forEach(function (boton) {
        boton.addEventListener("click", function () {
            const filtro = this.dataset.filter;
            filtrarServicios(filtro);
            actualizarBotonFiltro(this);
        });
    });
}

function filtrarServicios(filtro) {
    const tarjetas = document.querySelectorAll(
        ".servicios-fijos [data-category], #servicios-dinamicos [data-category]"
    );
    tarjetas.forEach(function (tarjeta) {
        const categoria = tarjeta.dataset.category;
        if (filtro === "todos" || categoria === filtro) {
            tarjeta.classList.remove("d-none");
        } else {
            tarjeta.classList.add("d-none");

        }
    });
}

function actualizarBotonFiltro(botonActivo) {
    const botones = document.querySelectorAll(
        "#filtro-botones [data-filter]"
    );
    botones.forEach(function (boton) {
        boton.classList.remove("btn-success");
        boton.classList.add("btn-outline-secondary");

    });
    botonActivo.classList.remove("btn-outline-secondary");
    botonActivo.classList.add("btn-success");
}

function obtenerCategoriaServicio(servicio) {
    if (servicio.esDomicilio === true || servicio.modalidad === "domicilio") {
        return "domicilio";
    }

    let tipo = null;
    if (typeof obtenerTiposServicio === "function") {
        const tipos = obtenerTiposServicio();
        tipo = tipos.find(function (tipoServicio) {
            return String(tipoServicio.id) === String(servicio.tipoServicioId);});
    }

    if (!tipo || !tipo.nombre) {
        return "";
    }

    const nombreTipo = normalizarTexto(tipo.nombre);
    if (
        nombreTipo.includes("prevencion") ||
        nombreTipo.includes("vacun") ||
        nombreTipo.includes("desparas")
    ) {
        return "prevencion";
    }
    if (
        nombreTipo.includes("salud") ||
        nombreTipo.includes("diagnost") ||
        nombreTipo.includes("consulta") ||
        nombreTipo.includes("medicina")
    ) {
        return "salud";
    }
    if (
        nombreTipo.includes("especializ") ||
        nombreTipo.includes("cirugia") ||
        nombreTipo.includes("laboratorio") ||
        nombreTipo.includes("urgencia")
    ) {
        return "especializados";
    }

    if (
        nombreTipo.includes("bienestar") ||
        nombreTipo.includes("estetica") ||
        nombreTipo.includes("peluquer") ||
        nombreTipo.includes("bano") ||
        nombreTipo.includes("baño")
    ) {
        return "bienestar";
    }

    const categoriasValidas = [
        "prevencion",
        "salud",
        "especializados",
        "domicilio",
        "bienestar"
    ];
    if (categoriasValidas.includes(nombreTipo)) {
        return nombreTipo;
    }
    return "";
}

function normalizarTexto(texto) {

    return String(texto)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}