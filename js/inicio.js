document.addEventListener("DOMContentLoaded", renderizarServiciosInicio);

function renderizarServiciosInicio() {
    const contenedor = document.getElementById("servicios-inicio");
    if (!contenedor) return;

    const servicios = obtenerServiciosParaInicio();
    if (servicios.length === 0) {
        contenedor.innerHTML = `<div class="inicio-servicios__vacio">Pronto encontrarás nuestros servicios veterinarios aquí.</div>`;
        return;
    }

    contenedor.innerHTML = servicios.map(crearTarjetaServicioInicio).join("");
    contenedor.querySelectorAll("[data-servicio-detalle]").forEach(boton => {
        boton.addEventListener("click", () => {
            const servicio = obtenerServicioPorId(boton.dataset.servicioDetalle);
            mostrarDetalleServicio(servicio);
        });
    });
}

function crearTarjetaServicioInicio(servicio) {
    const modalidad = servicio.modalidad || (servicio.esDomicilio ? "domicilio" : (servicio.esVirtual ? "virtual" : "clinica"));
    const modalidadInfo = {
        clinica: { texto: "En clínica", icono: "bi-hospital" },
        domicilio: { texto: "A domicilio", icono: "bi-house-heart" },
        virtual: { texto: "Consulta virtual", icono: "bi-camera-video" }
    }[modalidad] || { texto: "En clínica", icono: "bi-hospital" };
    const imagen = servicio.imagen
        ? `<img src="${escaparHtmlInicio(servicio.imagen)}" alt="${escaparHtmlInicio(servicio.nombre)}">`
        : `<div class="inicio-servicio__imagen-vacia"><i class="${escaparHtmlInicio(servicio.icono || "bi bi-heart-pulse")}"></i></div>`;

    return `
        <article class="inicio-servicio">
            <div class="inicio-servicio__imagen">
                ${imagen}
                <span class="inicio-servicio__icono"><i class="${escaparHtmlInicio(servicio.icono || "bi bi-heart-pulse")}"></i></span>
            </div>
            <div class="inicio-servicio__contenido">
                <h3>${escaparHtmlInicio(servicio.nombre || "Servicio veterinario")}</h3>
                <p>${escaparHtmlInicio(servicio.descripcion || "Conoce este servicio veterinario.")}</p>
                <div class="inicio-servicio__datos">
                    <span><i class="bi bi-coin"></i>$${Number(servicio.precio || 0).toLocaleString("es-CO")} COP</span>
                    <span><i class="bi bi-clock"></i>${servicio.duracion ? `${servicio.duracion} min` : "Por definir"}</span>
                </div>
                <div class="inicio-servicio__etiquetas">
                    <span class="inicio-servicio__etiqueta inicio-servicio__etiqueta--${modalidad}"><i class="bi ${modalidadInfo.icono}"></i>${modalidadInfo.texto}</span>
                    ${servicio.tieneCostoReserva && Number(servicio.costoReserva) > 0 ? '<span class="inicio-servicio__etiqueta inicio-servicio__etiqueta--reserva"><i class="bi bi-tag"></i>Reserva requerida</span>' : ""}
                </div>
            </div>
            <footer class="inicio-servicio__acciones">
                <a class="btn btn-agendar" href="agendar.html?servicioId=${encodeURIComponent(servicio.id || "")}" data-agendar-requiere-sesion><i class="bi bi-calendar3"></i> Agendar cita</a>
                <button class="btn inicio-servicio__detalle" type="button" data-servicio-detalle="${escaparHtmlInicio(servicio.id || "")}">Ver detalles <i class="bi bi-chevron-right"></i></button>
            </footer>
        </article>
    `;
}

function escaparHtmlInicio(valor) {
    const elemento = document.createElement("div");
    elemento.textContent = String(valor ?? "");
    return elemento.innerHTML;
}
