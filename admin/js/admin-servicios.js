document.addEventListener("DOMContentLoaded", function () {
    iniciarFiltroTipoServicio();
    iniciarGestionServiciosInicio();
    mostrarServicios();
});

function mostrarServicios() {
    const filtroSelect = document.getElementById("filtroTipoServicio");
    const filtroTipoId = filtroSelect ? filtroSelect.value : "";
    const contenedorServicios = document.getElementById("contenedorServicios");
    const totalServicios = document.getElementById("totalServicios");

    if (!contenedorServicios) {
        return;
    }

    const todosLosServicios = obtenerServicios();
    const serviciosInicio = obtenerServiciosParaInicio();
    const idsServiciosInicio = new Set(serviciosInicio.map(servicio => String(servicio.id)));
    const idDestacado = String(obtenerServicioDestacado()?.id || "");
    const servicios = filtroTipoId
        ? todosLosServicios.filter(s => String(s.tipoServicioId || "") === String(filtroTipoId))
        : todosLosServicios;

    actualizarTotalServicios(servicios, totalServicios);
    actualizarControlServiciosInicio(todosLosServicios);

    if (servicios.length === 0) {
        const esPorFiltro = filtroTipoId && todosLosServicios.length > 0;
        contenedorServicios.innerHTML = esPorFiltro
            ? `
            <div class="servicios-vacio">
                <i class="bi bi-funnel"></i>
                <h3>Sin servicios de este tipo</h3>
                <p>No tienes servicios asignados a este tipo todavía.</p>
            </div>
        `
            : `
            <div class="servicios-vacio">
                <i class="bi bi-briefcase"></i>
                <h3>No hay servicios creados</h3>
                <p>Cuando agregues un servicio desde el formulario, aparecerá en esta sección.</p>
            </div>
        `;

        return;
    }

    contenedorServicios.innerHTML = "";

    servicios.forEach(function (servicio) {
        const tarjetaServicio = document.createElement("article");

        tarjetaServicio.classList.add("servicio-card");

        tarjetaServicio.innerHTML = `
            <div class="servicio-imagen">
                ${
                    servicio.imagen
                        ? `<img src="${resolverRutaRecursoHuellaVet(servicio.imagen)}" alt="${servicio.nombre}">`
                        : `<div class="servicio-imagen-placeholder"></div>`
                }

                <div class="servicio-icono">
                    <i class="${servicio.icono || "bi bi-heart-pulse"}"></i>
                </div>
            </div>

            <div class="servicio-info">
                ${nombreTipoServicio(servicio.tipoServicioId) ? `<span class="servicio-tipo-badge">${escaparHtmlServicios(nombreTipoServicio(servicio.tipoServicioId))}</span>` : ""}
                ${idsServiciosInicio.has(String(servicio.id)) ? `<span class="servicio-inicio-badge${String(servicio.id) === idDestacado ? " servicio-inicio-badge--destacado" : ""}"><i class="bi ${String(servicio.id) === idDestacado ? "bi-star-fill" : "bi-house-heart"}"></i>${String(servicio.id) === idDestacado ? "Destacado y visible en inicio" : "Visible en inicio"}</span>` : ""}
                <h3>${servicio.nombre}</h3>
                <p>${servicio.descripcion}</p>
            </div>

            <div class="servicio-detalles">
                <div class="servicio-detalle">
                    <i class="bi bi-currency-dollar"></i>
                    <div>
                        <span>Precio</span>
                        <strong>$ ${formatearPrecio(servicio.precio)}</strong>
                    </div>
                </div>

                <div class="servicio-detalle">
                    <i class="bi bi-clock"></i>
                    <div>
                        <span>Duración</span>
                        <strong>${formatearDuracion(servicio.duracion)}</strong>
                    </div>
                </div>

                <div class="servicio-detalle">
                    <i class="${servicio.modalidad === "virtual" || servicio.esVirtual ? "bi bi-camera-video" : (servicio.esDomicilio || servicio.modalidad === "domicilio" ? "bi bi-house-door" : "bi bi-hospital")}"></i>
                    <div>
                        <span>Modalidad</span>
                        <strong>${servicio.modalidad === "virtual" || servicio.esVirtual ? "Virtual" : (servicio.esDomicilio || servicio.modalidad === "domicilio" ? "A domicilio" : "En clínica")}</strong>
                    </div>
                </div>

                <div class="servicio-detalle">
                    <i class="bi bi-credit-card-2-front"></i>
                    <div>
                        <span>Reserva</span>
                        <strong>${servicio.tieneCostoReserva && servicio.costoReserva > 0 ? `$ ${formatearPrecio(servicio.costoReserva)}` : "Sin reserva"}</strong>
                    </div>
                </div>
            </div>

            <div class="servicio-acciones">
                <button type="button" class="btn btn-modificar" onclick="modificarServicio('${servicio.id}')">
                    <i class="bi bi-pencil"></i>
                    Modificar
                </button>

                <button
                    type="button"
                    class="btn btn-eliminar"
                    onclick="eliminarServicio('${servicio.id}')"
                >
                    <i class="bi bi-trash"></i>
                    Eliminar
                </button>
            </div>
        `;

        contenedorServicios.appendChild(tarjetaServicio);
    });
}

function iniciarGestionServiciosInicio() {
    const boton = document.getElementById("gestionarServiciosInicio");
    if (!boton) return;

    boton.addEventListener("click", abrirSelectorServiciosInicio);
}

function actualizarControlServiciosInicio(servicios) {
    const boton = document.getElementById("gestionarServiciosInicio");
    const texto = document.getElementById("textoServiciosInicio");
    if (!boton || !texto) return;

    boton.disabled = servicios.length === 0;
    texto.textContent = `Elegir servicios del inicio (${obtenerServiciosParaInicio().length}/${MAX_SERVICIOS_INICIO})`;
}

function abrirSelectorServiciosInicio() {
    const servicios = obtenerServicios();
    if (servicios.length === 0 || typeof Swal === "undefined") return;

    let idsSeleccionados = obtenerServiciosParaInicio().map(servicio => String(servicio.id));
    let filtroTipoId = "";
    const seleccionAutomatica = servicios.length <= MAX_SERVICIOS_INICIO;

    const obtenerServicio = id => servicios.find(servicio => String(servicio.id) === String(id));
    const renderizarContenidoModal = () => {
        const seleccionados = idsSeleccionados.map(obtenerServicio).filter(Boolean);
        const tipos = obtenerTiposServicio();
        const areaSeleccionados = document.getElementById("listaServiciosInicioSeleccionados");
        const areaDisponibles = document.getElementById("listaServiciosInicioDisponibles");
        const contador = document.getElementById("contadorServiciosInicio");
        const filtro = document.getElementById("filtroTipoServiciosInicio");

        if (contador) contador.textContent = `${seleccionados.length} de ${MAX_SERVICIOS_INICIO} servicios seleccionados`;
        if (filtro) {
            filtro.innerHTML = `<option value="">Todos los tipos</option>` + tipos.map(tipo =>
                `<option value="${escaparHtmlServicios(tipo.id)}" ${String(tipo.id) === String(filtroTipoId) ? "selected" : ""}>${escaparHtmlServicios(tipo.nombre)}</option>`
            ).join("");
        }

        if (areaSeleccionados) {
            areaSeleccionados.innerHTML = seleccionados.map((servicio, indice) => `
                <div class="d-flex align-items-center gap-2 py-2 border-bottom text-start">
                    <input class="form-check-input m-0 selector-servicio-inicio" type="checkbox" checked ${seleccionAutomatica ? "disabled" : ""} data-id="${escaparHtmlServicios(servicio.id)}">
                    <span class="flex-grow-1">
                        <strong class="d-block">${indice === 0 ? '<i class="bi bi-star-fill text-warning me-1"></i>Destacado: ' : ""}${escaparHtmlServicios(servicio.nombre)}</strong>
                        <small class="text-muted">${escaparHtmlServicios(nombreTipoServicio(servicio.tipoServicioId))}</small>
                    </span>
                    <div class="btn-group btn-group-sm" aria-label="Cambiar orden">
                        <button type="button" class="btn btn-outline-secondary mover-servicio-inicio" data-id="${escaparHtmlServicios(servicio.id)}" data-direccion="-1" ${indice === 0 ? "disabled" : ""} aria-label="Subir ${escaparHtmlServicios(servicio.nombre)}"><i class="bi bi-arrow-up"></i></button>
                        <button type="button" class="btn btn-outline-secondary mover-servicio-inicio" data-id="${escaparHtmlServicios(servicio.id)}" data-direccion="1" ${indice === seleccionados.length - 1 ? "disabled" : ""} aria-label="Bajar ${escaparHtmlServicios(servicio.nombre)}"><i class="bi bi-arrow-down"></i></button>
                    </div>
                </div>
            `).join("");
        }

        if (areaDisponibles) {
            const disponibles = servicios.filter(servicio =>
                !idsSeleccionados.includes(String(servicio.id)) &&
                (!filtroTipoId || String(servicio.tipoServicioId) === String(filtroTipoId))
            );
            areaDisponibles.innerHTML = seleccionAutomatica
                ? `<p class="text-muted small mb-0">Todos los servicios se muestran automáticamente mientras existan tres o menos.</p>`
                : disponibles.length > 0
                    ? disponibles.map(servicio => `
                        <label class="d-flex align-items-center gap-2 py-2 border-bottom text-start">
                            <input class="form-check-input m-0 selector-servicio-disponible" type="checkbox" data-id="${escaparHtmlServicios(servicio.id)}" ${idsSeleccionados.length >= MAX_SERVICIOS_INICIO ? "disabled" : ""}>
                            <span><strong class="d-block">${escaparHtmlServicios(servicio.nombre)}</strong><small class="text-muted">${escaparHtmlServicios(nombreTipoServicio(servicio.tipoServicioId))}</small></span>
                        </label>
                    `).join("")
                    : `<p class="text-muted small mb-0">No hay servicios disponibles con este filtro.</p>`;
        }

        document.querySelectorAll(".selector-servicio-inicio").forEach(input => input.addEventListener("change", () => {
            idsSeleccionados = idsSeleccionados.filter(id => id !== String(input.dataset.id));
            renderizarContenidoModal();
        }));
        document.querySelectorAll(".selector-servicio-disponible").forEach(input => input.addEventListener("change", () => {
            if (input.checked && idsSeleccionados.length < MAX_SERVICIOS_INICIO) idsSeleccionados.push(String(input.dataset.id));
            renderizarContenidoModal();
        }));
        document.querySelectorAll(".mover-servicio-inicio").forEach(boton => boton.addEventListener("click", () => {
            const indice = idsSeleccionados.indexOf(String(boton.dataset.id));
            const destino = indice + Number(boton.dataset.direccion);
            if (indice < 0 || destino < 0 || destino >= idsSeleccionados.length) return;
            [idsSeleccionados[indice], idsSeleccionados[destino]] = [idsSeleccionados[destino], idsSeleccionados[indice]];
            renderizarContenidoModal();
        }));
        filtro?.addEventListener("change", () => {
            filtroTipoId = filtro.value;
            renderizarContenidoModal();
        });
    };

    Swal.fire({
        title: "Servicios que se muestran en Inicio",
        html: `
            <p class="text-muted small mb-3">Elige hasta ${MAX_SERVICIOS_INICIO}. El primero es el servicio destacado; usa las flechas para cambiar el orden.</p>
            <div id="contadorServiciosInicio" class="small fw-bold text-start mb-2"></div>
            <div class="text-start mb-3" id="listaServiciosInicioSeleccionados"></div>
            <label class="form-label small fw-bold text-start d-block mb-1" for="filtroTipoServiciosInicio">Filtrar servicios disponibles por tipo</label>
            <select class="form-select form-select-sm mb-2" id="filtroTipoServiciosInicio"></select>
            <div class="text-start" id="listaServiciosInicioDisponibles" style="max-height: 220px; overflow-y: auto;"></div>
        `,
        showCancelButton: true,
        confirmButtonText: "Guardar selección",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#17a9a7",
        cancelButtonColor: "#6c757d",
        didOpen: renderizarContenidoModal,
        preConfirm: () => {
            if (idsSeleccionados.length === 0) {
                Swal.showValidationMessage("Selecciona al menos un servicio para el inicio.");
                return false;
            }
            if (idsSeleccionados.length > MAX_SERVICIOS_INICIO) {
                Swal.showValidationMessage(`Puedes seleccionar máximo ${MAX_SERVICIOS_INICIO} servicios.`);
                return false;
            }
            return idsSeleccionados;
        }
    }).then(resultado => {
        if (!resultado.isConfirmed) return;

        guardarServiciosParaInicio(resultado.value);
        mostrarServicios();
        Swal.fire({
            icon: "success",
            title: "Servicios del inicio actualizados",
            text: "El primer servicio seleccionado quedó como destacado.",
            confirmButtonColor: "#17a9a7"
        });
    });
}

function modificarServicio(idServicio) {
    window.location.href = `./agregar-servicio.html?id=${idServicio}`;
}

function actualizarTotalServicios(servicios, totalServicios) {
    if (!totalServicios) {
        return;
    }

    totalServicios.textContent =
        servicios.length === 1
            ? "1 servicio en total"
            : `${servicios.length} servicios en total`;
}

function formatearPrecio(precio) {
    return Number(precio).toLocaleString("es-CO");
}

function formatearDuracion(minutos) {
    minutos = parseInt(minutos);
    if (isNaN(minutos) || minutos <= 0) return "30 min";
    if (minutos < 60) return `${minutos} min`;
    const horas = Math.floor(minutos / 60);
    const minsRestantes = minutos % 60;
    if (minsRestantes === 0) {
        return horas === 1 ? "1 hora" : `${horas} horas`;
    }
    return `${horas} h ${minsRestantes} min`;
}

function eliminarServicio(idServicio) {
    Swal.fire({
        icon: "warning",
        title: "¿Eliminar servicio?",
        text: "Esta acción eliminará el servicio de la lista.",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#ff4d5f",
        cancelButtonColor: "#6c757d"
    }).then(function (resultado) {
        if (!resultado.isConfirmed) {
            return;
        }

        eliminarServicioGuardado(idServicio);

        mostrarServicios();

        Swal.fire({
            icon: "success",
            title: "Servicio eliminado",
            text: "El servicio fue eliminado correctamente.",
            confirmButtonText: "Aceptar",
            confirmButtonColor: "#bad641"
        });
    });
}
// Llena el filtro "Todos los servicios" con los tipos de servicio
// que el admin ha creado (ver js/shared/tipos-servicio-storage.js), y vuelve a pintar
// la grilla cada vez que el admin cambia el filtro.
function iniciarFiltroTipoServicio() {
    const filtroSelect = document.getElementById("filtroTipoServicio");
    if (!filtroSelect || typeof obtenerTiposServicio !== "function") {
        return;
    }

    const tipos = obtenerTiposServicio();

    filtroSelect.innerHTML = `<option value="" selected>Todos los servicios</option>` +
        tipos.map(tipo => `<option value="${tipo.id}">${escaparHtmlServicios(tipo.nombre)}</option>`).join("");

    filtroSelect.addEventListener("change", function () {
        mostrarServicios();
    });
}

function escaparHtmlServicios(valor) {
    const div = document.createElement("div");
    div.textContent = valor == null ? "" : String(valor);
    return div.innerHTML;
}
