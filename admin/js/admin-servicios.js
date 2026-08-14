document.addEventListener("DOMContentLoaded", function () {
    mostrarServicios();
});

function mostrarServicios() {
    const contenedorServicios = document.getElementById("contenedorServicios");
    const totalServicios = document.getElementById("totalServicios");

    if (!contenedorServicios) {
        return;
    }

    const servicios = JSON.parse(localStorage.getItem("servicios")) || [];

    actualizarTotalServicios(servicios, totalServicios);

    if (servicios.length === 0) {
        contenedorServicios.innerHTML = `
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
                        <strong>${servicio.duracion} min</strong>
                    </div>
                </div>
            </div>

            <div class="servicio-acciones">
                <button type="button" class="btn btn-modificar">
                    <i class="bi bi-pencil"></i>
                    Modificar
                </button>

                <button
                    type="button"
                    class="btn btn-eliminar"
                    onclick="eliminarServicio(${servicio.id})"
                >
                    <i class="bi bi-trash"></i>
                    Eliminar
                </button>
            </div>
        `;

        contenedorServicios.appendChild(tarjetaServicio);
    });
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
            return servicio.id !== idServicio;
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