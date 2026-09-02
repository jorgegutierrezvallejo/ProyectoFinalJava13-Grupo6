function mostrarDetalleServicio(servicio) {
    if (!servicio || typeof Swal === "undefined") return;

    const modalidad = servicio.modalidad || (servicio.esDomicilio ? "domicilio" : (servicio.esVirtual ? "virtual" : "clinica"));
    const modalidadInfo = {
        clinica: { titulo: "En clínica", icono: "bi-hospital", detalle: servicio.direccionClinica || "HuellaVet — Sede Centro" },
        domicilio: { titulo: "A domicilio", icono: "bi-house-door", detalle: "Coordinaremos la dirección de atención al confirmar la cita." },
        virtual: { titulo: "Consulta virtual", icono: "bi-camera-video", detalle: "Recibirás las indicaciones de conexión al confirmar la cita." }
    }[modalidad] || { titulo: "En clínica", icono: "bi-hospital", detalle: "HuellaVet — Sede Centro" };
    const precio = Number(servicio.precio || 0).toLocaleString("es-CO");
    const duracion = servicio.duracion ? `${servicio.duracion} min` : "Por definir";
    const tieneAnticipo = Boolean(servicio.tieneCostoReserva && Number(servicio.costoReserva) > 0);
    const anticipo = Number(servicio.costoReserva || 0).toLocaleString("es-CO");

    Swal.fire({
        icon: "info",
        title: escaparHtmlServicioDetalle(servicio.nombre || "Detalle del servicio"),
        showCloseButton: true,
        closeButtonAriaLabel: "Cerrar detalle del servicio",
        html: `
            <p class="text-start mb-3" style="color:#526765; line-height:1.45;">${escaparHtmlServicioDetalle(servicio.descripcion || "Servicio veterinario profesional para el bienestar de tu mascota.")}</p>
            <div class="row g-2 text-start mb-3">
                <div class="col-6"><div class="border rounded-3 p-2 h-100"><small class="d-block text-muted"><i class="bi bi-coin me-1"></i>Precio total</small><strong>$${precio} COP</strong></div></div>
                <div class="col-6"><div class="border rounded-3 p-2 h-100"><small class="d-block text-muted"><i class="bi bi-clock me-1"></i>Duración</small><strong>${duracion}</strong></div></div>
            </div>
            <div class="alert text-start py-2 px-3 mb-2" style="background:#f2fbfa; border:1px solid #cce9e5; color:#22413f;">
                <strong><i class="bi ${modalidadInfo.icono} me-1"></i>Modalidad: ${modalidadInfo.titulo}</strong><br>
                <span class="small">${escaparHtmlServicioDetalle(modalidadInfo.detalle)}</span>
            </div>
            ${tieneAnticipo
                ? `<div class="alert text-start py-2 px-3 mb-0" style="background:#f2f8e9; border:1px solid #d5e7ba; color:#355b26;">
                    <strong><i class="bi bi-tag-fill me-1"></i>Cobro de anticipo: $${anticipo} COP</strong><br>
                    <span class="small">Este valor se descuenta del precio total. Deberás enviar el comprobante de pago para que el médico veterinario apruebe tu cita.</span>
                </div>`
                : `<div class="alert text-start py-2 px-3 mb-0" style="background:#f7f8f8; border:1px solid #e1e6e5; color:#526765;">
                    <strong><i class="bi bi-check-circle me-1"></i>Sin cobro de anticipo</strong><br>
                    <span class="small">El pago se gestiona directamente durante la atención.</span>
                </div>`}
        `,
        confirmButtonText: "Agendar cita",
        confirmButtonColor: "#17a9a7"
    }).then(resultado => {
        if (!resultado.isConfirmed || !servicio.id) return;

        // Si el usuario ya está en Reserva, conserva la selección actual.
        if (/\/agendar\.html$/.test(window.location.pathname)) return;
        const destino = `agendar.html?servicioId=${encodeURIComponent(servicio.id)}`;
        if (typeof window.solicitarInicioSesionParaAgendar === "function" &&
            !window.solicitarInicioSesionParaAgendar(destino)) return;
        window.location.href = destino;
    });
}

function escaparHtmlServicioDetalle(valor) {
    const elemento = document.createElement("div");
    elemento.textContent = String(valor ?? "");
    return elemento.innerHTML;
}
