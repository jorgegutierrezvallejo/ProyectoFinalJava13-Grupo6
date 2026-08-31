document.addEventListener("DOMContentLoaded", function () {
    mostrarServicios();
});

function mostrarServicios() {

    const contenedor = document.getElementById("servicios-dinamicos");

    const servicios = obtenerServicios();

    if (servicios.length === 0) {
        return;
    }

    servicios.forEach(function (servicio) {
        const tarjeta =
            `<div class="col-md-6 col-lg-4">
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
                    </div>`:`
                    <div class="d-flex align-items-center justify-content-center servicio-imagen-placeholder"
                        style="height: 200px; background-color: #dff5ef;">
                        <i class="${servicio.icono || "bi bi-heart-pulse"}" style="font-size: 60px; color: #bad641;"></i>
                    </div>`}
                    <div class="card-body">
                        <h5 class="card-title">${servicio.nombre}</h5>
                        <p class="card-text">${servicio.descripcion}</p>
                        <div class="servicio-info-detalle">
                            <i class="bi bi-coin icons-details"></i>
                            <span>${Number(servicio.precio).toLocaleString("es-CO")}</span>
                        </div>
                        <div class="servicio-info-detalle">
                            <i class="bi bi-clock icons-details"></i>
                            <span>${servicio.duracion} min</span>
                        </div>
                        <div class="servicio-etiqueta ${servicio.modalidad === "virtual" || servicio.esVirtual ? "virtual" : (servicio.esDomicilio || servicio.modalidad === "domicilio" ? "domicilio" : "clinica")}">
                            <i class="${servicio.modalidad === "virtual" || servicio.esVirtual ? "bi bi-camera-video" : (servicio.esDomicilio || servicio.modalidad === "domicilio" ? "bi bi-house-door" : "bi bi-hospital")} icons-details"></i>
                            <span>${servicio.modalidad === "virtual" || servicio.esVirtual ? "Virtual" : (servicio.esDomicilio || servicio.modalidad === "domicilio" ? "A domicilio" : "En clínica")}</span>
                        </div>
                    </div>
                    <div class="card-footer d-flex gap-5">
                        <button class="btn btn-agendar">Agendar cita</button>
                        <button class="btn btn-contactanos">Ver detalles</button>
                    </div>
                </div>
            </div>`;
        contenedor.innerHTML += tarjeta;
    });
}
