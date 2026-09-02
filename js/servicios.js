let tipoActivoId = "todos";

document.addEventListener("DOMContentLoaded", iniciarServiciosPublicos);

function iniciarServiciosPublicos() {
    renderizarFiltrosServicios();
    renderizarServicios();
    renderizarServicioDestacado();
}

function renderizarServicioDestacado() {
    const contenedor = document.getElementById("servicio-destacado");
    if (!contenedor) return;

    const servicio = obtenerServicioDestacado();
    if (!servicio) {
        contenedor.hidden = true;
        return;
    }

    const modalidad = servicio.modalidad || (servicio.esDomicilio ? "domicilio" : (servicio.esVirtual ? "virtual" : "clinica"));
    const modalidadInfo = {
        clinica: { texto: "En clínica", icono: "bi-hospital" },
        domicilio: { texto: "A domicilio", icono: "bi-house-heart" },
        virtual: { texto: "Consulta virtual", icono: "bi-camera-video" }
    }[modalidad] || { texto: "En clínica", icono: "bi-hospital" };
    const imagen = servicio.imagen
        ? `<img src="${escaparHtml(servicio.imagen)}" alt="${escaparHtml(servicio.nombre)}">`
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
        });
    });
}

function crearTarjetaServicio(servicio) {
    const modalidad = servicio.modalidad || (servicio.esDomicilio ? "domicilio" : (servicio.esVirtual ? "virtual" : "clinica"));
    const modalidadInfo = {
        clinica: { texto: "En clínica", icono: "bi-hospital" },
        domicilio: { texto: "A domicilio", icono: "bi-house-heart" },
        virtual: { texto: "Consulta virtual", icono: "bi-camera-video" }
    }[modalidad] || { texto: "En clínica", icono: "bi-hospital" };
    const imagen = servicio.imagen
        ? `<img src="${escaparHtml(servicio.imagen)}" alt="${escaparHtml(servicio.nombre)}">`
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
