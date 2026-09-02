<<<<<<< HEAD
document.addEventListener("DOMContentLoaded", function () {
    mostrarServicios();
    iniciarFiltrosServicios();
});


function mostrarServicios() {
=======
let tipoActivoId = "todos";

document.addEventListener("DOMContentLoaded", iniciarServiciosPublicos);
>>>>>>> 7f9a51034ae962676211399dbbcb09db55fbeddc

function iniciarServiciosPublicos() {
    renderizarFiltrosServicios();
    renderizarServicios();
    renderizarServicioDestacado();
}

<<<<<<< HEAD
    if (!contenedor) {
        return;
    }

    const servicios = obtenerServicios();
=======
function renderizarServicioDestacado() {
    const contenedor = document.getElementById("servicio-destacado");
    if (!contenedor) return;
>>>>>>> 7f9a51034ae962676211399dbbcb09db55fbeddc

    const servicio = obtenerServicioDestacado();
    if (!servicio) {
        contenedor.hidden = true;
        return;
    }

<<<<<<< HEAD
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
=======
    const modalidad = servicio.modalidad || (servicio.esDomicilio ? "domicilio" : (servicio.esVirtual ? "virtual" : "clinica"));
    const modalidadInfo = {
        clinica: { texto: "En clínica", icono: "bi-hospital" },
        domicilio: { texto: "A domicilio", icono: "bi-house-heart" },
        virtual: { texto: "Consulta virtual", icono: "bi-camera-video" }
    }[modalidad] || { texto: "En clínica", icono: "bi-hospital" };
    const imagen = servicio.imagen
        ? `<img src="${escaparHtml(resolverRutaRecursoHuellaVet(servicio.imagen))}" alt="${escaparHtml(servicio.nombre)}">`
        : `<div class="servicio-destacado__imagen-vacia"><i class="${escaparHtml(servicio.icono || "bi bi-heart-pulse")}"></i></div>`;

    contenedor.hidden = false;
    contenedor.innerHTML = `
        <div class="row servicio-destacado-card">
            <div class="col">
                <div class="servicio-destacado__imagen">${imagen}</div>
            </div>
            <div class="col-sm-4">
                <span><i class="bi bi-star-fill"></i>Servicio destacado</span>
                <h2 class="section-title">${escaparHtml(servicio.nombre || "Servicio veterinario")}</h2>
                <p>${escaparHtml(servicio.descripcion || "Conoce este servicio veterinario.")}</p>
                <div class="servicio-info-detalle">
                    <i class="bi bi-coin icons-details"></i>
                    <p>Precio</p>
                    <span>$${formatearPrecio(servicio.precio)} COP</span>
>>>>>>> 7f9a51034ae962676211399dbbcb09db55fbeddc
                </div>
                <div class="servicio-info-detalle">
                    <i class="bi bi-clock icons-details"></i>
                    <p>Duración</p>
                    <span>${formatearDuracion(servicio.duracion)}</span>
                </div>
                <div class="servicio-etiqueta">
                    <i class="bi ${modalidadInfo.icono} icons-details"></i>
                    <p>Modalidad</p>
                    <span>${modalidadInfo.texto}</span>
                </div>
                <a href="agendar.html?servicioId=${encodeURIComponent(servicio.id || "")}" class="btn btn-agendar" data-agendar-requiere-sesion>
                    <i class="bi bi-calendar3"></i><span>Agendar cita</span>
                </a>
            </div>
        </div>
    `;
}

function renderizarFiltrosServicios() {
    const contenedor = document.getElementById("filtro-botones");
    if (!contenedor) return;

    const tipos = obtenerTiposServicio();
    const filtros = [{ id: "todos", nombre: "Todos", icono: "bi-grid" }, ...tipos.map(tipo => ({
        ...tipo,
        icono: "bi-grid-3x3-gap"
    }))];

    contenedor.innerHTML = filtros.map(tipo => `
        <button class="servicios-filtro${String(tipo.id) === String(tipoActivoId) ? " servicios-filtro--activo" : ""}"
            type="button" data-tipo-id="${escaparHtml(tipo.id)}">
            <i class="bi ${tipo.icono}"></i>${escaparHtml(tipo.nombre)}
        </button>
    `).join("");

    contenedor.querySelectorAll("[data-tipo-id]").forEach(boton => {
        boton.addEventListener("click", () => {
            tipoActivoId = boton.dataset.tipoId;
            renderizarFiltrosServicios();
            renderizarServicios();
        });
    });
}

<<<<<<< HEAD
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
=======
function renderizarServicios() {
    const contenedor = document.getElementById("servicios-dinamicos");
    if (!contenedor) return;

    const servicios = obtenerServicios().filter(servicio =>
        tipoActivoId === "todos" || String(servicio.tipoServicioId) === String(tipoActivoId)
    );

    if (servicios.length === 0) {
        contenedor.innerHTML = `
            <div class="servicios-publicos__vacio">
                <i class="bi bi-heart-pulse"></i>
                <strong>No hay servicios disponibles${tipoActivoId === "todos" ? "" : " para este tipo"}.</strong>
                <span>Los servicios creados desde Administración aparecerán aquí.</span>
            </div>
        `;
        return;
    }

    contenedor.innerHTML = servicios.map(crearTarjetaServicio).join("");
    contenedor.querySelectorAll("[data-servicio-detalle]").forEach(boton => {
        boton.addEventListener("click", () => {
            mostrarDetalleServicio(obtenerServicioPorId(boton.dataset.servicioDetalle));
>>>>>>> 7f9a51034ae962676211399dbbcb09db55fbeddc
        });
    });
}

<<<<<<< HEAD
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
=======
function crearTarjetaServicio(servicio) {
    const modalidad = servicio.modalidad || (servicio.esDomicilio ? "domicilio" : (servicio.esVirtual ? "virtual" : "clinica"));
    const modalidadInfo = {
        clinica: { texto: "En clínica", icono: "bi-hospital" },
        domicilio: { texto: "A domicilio", icono: "bi-house-heart" },
        virtual: { texto: "Consulta virtual", icono: "bi-camera-video" }
    }[modalidad] || { texto: "En clínica", icono: "bi-hospital" };
    const imagen = servicio.imagen
        ? `<img src="${escaparHtml(resolverRutaRecursoHuellaVet(servicio.imagen))}" alt="${escaparHtml(servicio.nombre)}">`
        : `<div class="servicio-publico__imagen-vacia"><i class="${escaparHtml(servicio.icono || "bi bi-heart-pulse")}"></i></div>`;
    const reserva = servicio.tieneCostoReserva && Number(servicio.costoReserva) > 0
        ? `<span class="servicio-publico__etiqueta servicio-publico__etiqueta--reserva"><i class="bi bi-tag"></i> Reserva requerida</span>`
        : "";

    return `
        <article class="servicio-publico">
            <div class="servicio-publico__imagen">
                ${imagen}
                <span class="servicio-publico__icono"><i class="${escaparHtml(servicio.icono || "bi bi-heart-pulse")}"></i></span>
            </div>
            <div class="servicio-publico__contenido">
                <h3>${escaparHtml(servicio.nombre || "Servicio veterinario")}</h3>
                <p>${escaparHtml(servicio.descripcion || "Conoce este servicio veterinario.")}</p>
                <div class="servicio-publico__datos">
                    <span><i class="bi bi-coin"></i>$${formatearPrecio(servicio.precio)} COP</span>
                    <span><i class="bi bi-clock"></i>${formatearDuracion(servicio.duracion)}</span>
                </div>
                <div class="servicio-publico__etiquetas">
                    <span class="servicio-publico__etiqueta servicio-publico__etiqueta--${modalidad}"><i class="bi ${modalidadInfo.icono}"></i>${modalidadInfo.texto}</span>
                    ${reserva}
                </div>
            </div>
            <footer class="servicio-publico__acciones">
                <a href="agendar.html?servicioId=${encodeURIComponent(servicio.id || "")}" class="btn btn-agendar" data-agendar-requiere-sesion><i class="bi bi-calendar3"></i>Agendar cita</a>
                <button type="button" class="btn btn-detalles" data-servicio-detalle="${escaparHtml(servicio.id || "")}">Ver detalles <i class="bi bi-chevron-right"></i></button>
            </footer>
        </article>
    `;
}

function formatearPrecio(precio) {
    return Number(precio || 0).toLocaleString("es-CO");
}

function formatearDuracion(duracion) {
    return duracion ? `${duracion} min` : "Duración por definir";
}

function escaparHtml(valor) {
    const elemento = document.createElement("div");
    elemento.textContent = String(valor ?? "");
    return elemento.innerHTML;
}
>>>>>>> 7f9a51034ae962676211399dbbcb09db55fbeddc
