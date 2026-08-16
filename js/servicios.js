document.addEventListener("DOMContentLoaded", function () {
    mostrarServicios();
});

function mostrarServicios() {

    const contenedor = document.getElementById("servicios-dinamicos");

    const servicios = JSON.parse(localStorage.getItem("servicios")) || [];

    if (servicios.length === 0) {
        return;
    }

    servicios.forEach(function (servicio) {

        const tarjeta =
            `<div class="col-md-6 col-lg-4">
                <div class="card h-100 shadow-sm">

                    ${servicio.imagen ? `
                                <img 
                                    src="${servicio.imagen}" 
                                    class="card-img-top" 
                                    alt="${servicio.nombre}"
                                    style="height: 200px; object-fit: cover;"
                                >`
                : `<div 
                                    class="d-flex align-items-center justify-content-center"
                                    style="height: 200px; background-color: #dff5ef;"
                                >
                                    <i 
                                        class="${servicio.icono || "bi bi-heart-pulse"}"
                                        style="font-size: 60px; color: #bad641;"
                                    ></i>
                                </div>`}

                    <div class="card-body">

                        <h5 class="card-title">
                            ${servicio.nombre}
                        </h5>

                        <p class="card-text">
                            ${servicio.descripcion}
                        </p>

                        <p class="mb-1">
                            <strong>Precio:</strong>
                            $${Number(servicio.precio).toLocaleString("es-CO")}
                        </p>

                        <p>
                            <strong>Duración:</strong>
                            ${servicio.duracion} min
                        </p>

                    </div>

                </div>
            </div>`;
        contenedor.innerHTML += tarjeta;
    });
}