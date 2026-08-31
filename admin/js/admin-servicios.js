document.addEventListener("DOMContentLoaded", function () {
    iniciarFiltroTipoServicio();
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

    const todosLosServicios = JSON.parse(localStorage.getItem("servicios")) || [];
    const servicios = filtroTipoId
        ? todosLosServicios.filter(s => String(s.tipoServicioId || "") === String(filtroTipoId))
        : todosLosServicios;

    actualizarTotalServicios(servicios, totalServicios);

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
                        ? `<img src="${servicio.imagen}" alt="${servicio.nombre}">`
                        : `<div class="servicio-imagen-placeholder"></div>`
                }

                <div class="servicio-icono">
                    <i class="${servicio.icono || "bi bi-heart-pulse"}"></i>
                </div>
            </div>

            <div class="servicio-info">
                ${nombreTipoServicio(servicio.tipoServicioId) ? `<span class="servicio-tipo-badge">${escaparHtmlServicios(nombreTipoServicio(servicio.tipoServicioId))}</span>` : ""}
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

        let servicios = JSON.parse(localStorage.getItem("servicios")) || [];

        servicios = servicios.filter(function (servicio) {
            return String(servicio.id) !== String(idServicio);
        });

        localStorage.setItem("servicios", JSON.stringify(servicios));

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
// que el admin ha creado (ver tipos-servicio.js), y vuelve a pintar
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
