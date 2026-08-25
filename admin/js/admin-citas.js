document.addEventListener("DOMContentLoaded", function () {
    iniciarCitas();
});

function iniciarCitas() {
    renderizarPendientesConfirmar();
}

function renderizarPendientesConfirmar() {
    const contenedor = document.getElementById("contenedorPendientesCitas");
    const contador = document.getElementById("contadorPendientesCantidad");

    if (!contenedor) return;

    let citas = [];
    try {
        citas = JSON.parse(localStorage.getItem("citas")) || [];
    } catch (e) {
        citas = [];
    }

    // Filtrar citas pendientes de aprobación
    // Si la cita no tiene estado o su estado es "Pendiente" o "Confirmada" reciente
    const citasPendientes = citas.filter(c => c.estado === "Pendiente" || (!c.estado && c.estado !== "Rechazada"));

    if (contador) {
        contador.textContent = citasPendientes.length;
    }

    if (citasPendientes.length === 0) {
        contenedor.innerHTML = `
            <div class="hv-pendientes-vacio">
                <i class="bi bi-calendar-check"></i>
                <p>No hay citas pendientes por aprobar.</p>
            </div>
        `;
        return;
    }

    contenedor.innerHTML = "";

    citasPendientes.forEach(cita => {
        const item = document.createElement("article");
        item.className = "hv-pendiente";
        item.dataset.id = cita.id;

        const fechaFmt = formatearFechaAdmin(cita.fecha);
        const modalIdIcon = cita.modalidad === "domicilio" ? "bi-house-door" : (cita.modalidad === "virtual" ? "bi-camera-video" : "bi-hospital");

        item.innerHTML = `
            <div class="hv-pendiente__mascota">
                <div class="hv-avatar-mascota">
                    <i class="fa-solid fa-paw"></i>
                </div>
                <div class="hv-pendiente__mascota-texto">
                    <strong>${escaparHtml(cita.nombreMascota || "Mascota")}</strong>
                    <span>${escaparHtml(cita.cliente?.nombre || "Cliente")}</span>
                </div>
            </div>

            <div class="hv-pendiente__servicio">
                <strong>${escaparHtml(cita.servicioNombre || "Consulta general")}</strong>
                <span><i class="bi ${modalIdIcon} me-1 text-muted"></i>${fechaFmt} • ${cita.hora || "10:00 a. m."}</span>
            </div>

            <div class="hv-pendiente__acciones">
                <button type="button" class="hv-pendiente__boton hv-pendiente__boton--ver" onclick="verReservaAdmin(${cita.id})">
                    <i class="bi bi-eye"></i> Ver reserva
                </button>
                <i class="bi bi-chevron-right"></i>
            </div>
        `;

        contenedor.appendChild(item);
    });
}

function verReservaAdmin(idCita) {
    let citas = [];
    try {
        citas = JSON.parse(localStorage.getItem("citas")) || [];
    } catch (e) {
        citas = [];
    }

    const cita = citas.find(c => String(c.id) === String(idCita));
    if (!cita) {
        Swal.fire({
            icon: "error",
            title: "Cita no encontrada",
            text: "No se pudo cargar la información de esta reserva.",
            confirmButtonColor: "#17a9a7"
        });
        return;
    }

    const fechaFmt = formatearFechaAdmin(cita.fecha);
    const canalContacto = cita.cliente?.canalRecordatorio === "email" ? "Correo electrónico" : "WhatsApp";
    
    let reservaHtml = "";
    if (cita.tieneCostoReserva && cita.costoReserva > 0) {
        reservaHtml = `
            <div class="alert alert-warning py-2 px-3 small mb-0 text-start" style="background-color: #fff9eb; border: 1px solid #f9dfa0; color: #855b08; border-radius: 8px;">
                <i class="bi bi-credit-card-2-front me-1"></i><strong>Costo de reserva / anticipo:</strong> $${Number(cita.costoReserva).toLocaleString("es-CO")} COP.<br>
                <span class="small text-muted">Verificar comprobante enviado por el cliente a través de ${canalContacto}.</span>
            </div>
        `;
    }

    Swal.fire({
        title: `<div style="font-size: 1.15rem; font-weight: 700; color: #223e3c;"><i class="fa-solid fa-paw me-2 text-success"></i>Solicitud de Reserva: ${escaparHtml(cita.nombreMascota)}</div>`,
        html: `
            <div style="text-align: left; font-size: 0.85rem; line-height: 1.6; color: #334d4a; display: flex; flex-direction: column; gap: 0.65rem;">
                
                <!-- Mascota -->
                <div class="p-2 rounded" style="background: #f7faf9; border: 1px solid #e1ece9;">
                    <strong class="d-block text-dark mb-1"><i class="bi bi-heart me-1" style="color: #007981;"></i> Datos de la Mascota:</strong>
                    <div><strong>Nombre:</strong> ${escaparHtml(cita.nombreMascota)} | <strong>Especie:</strong> ${escaparHtml(cita.especie || "No especificada")}</div>
                    <div><strong>Raza:</strong> ${escaparHtml(cita.raza || "No especificada")} ${cita.edad ? `| <strong>Edad:</strong> ${escaparHtml(cita.edad)}` : ""} ${cita.peso ? `| <strong>Peso:</strong> ${escaparHtml(cita.peso)}` : ""}</div>
                    ${cita.motivo ? `<div class="mt-1"><strong>Motivo:</strong> <em>${escaparHtml(cita.motivo)}</em></div>` : ""}
                </div>

                <!-- Propietario -->
                <div class="p-2 rounded" style="background: #f7faf9; border: 1px solid #e1ece9;">
                    <strong class="d-block text-dark mb-1"><i class="bi bi-person me-1" style="color: #007981;"></i> Datos del Propietario:</strong>
                    <div><strong>Nombre:</strong> ${escaparHtml(cita.cliente?.nombre || "Cliente")}</div>
                    <div><strong>Teléfono:</strong> ${escaparHtml(cita.cliente?.telefono || "N/A")} | <strong>Correo:</strong> ${escaparHtml(cita.cliente?.email || "N/A")}</div>
                    <div><strong>Canal preferido:</strong> <span class="badge bg-light text-dark border">${canalContacto}</span></div>
                </div>

                <!-- Cita y Ubicación -->
                <div class="p-2 rounded" style="background: #f7faf9; border: 1px solid #e1ece9;">
                    <strong class="d-block text-dark mb-1"><i class="bi bi-calendar-check me-1" style="color: #007981;"></i> Detalles del Servicio:</strong>
                    <div><strong>Servicio:</strong> ${escaparHtml(cita.servicioNombre || "Consulta general")}</div>
                    <div><strong>Fecha y Hora:</strong> ${fechaFmt} a las <strong>${cita.hora || "10:00 a. m."}</strong></div>
                    <div><strong>Modalidad / Ubicación:</strong> <span class="fw-bold" style="color: #007981;">${escaparHtml(cita.ubicacion || "En clínica")}</span></div>
                </div>

                ${reservaHtml}
            </div>
        `,
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: '<i class="bi bi-check-circle me-1"></i> Aprobar cita',
        denyButtonText: '<i class="bi bi-x-circle me-1"></i> Rechazar cita',
        cancelButtonText: 'Cerrar',
        confirmButtonColor: '#2a934b',
        denyButtonColor: '#ef4c4c',
        cancelButtonColor: '#6c757d',
        focusConfirm: false
    }).then((result) => {
        if (result.isConfirmed) {
            aprobarCitaAdmin(idCita);
        } else if (result.isDenied) {
            rechazarCitaAdmin(idCita);
        }
    });
}

function aprobarCitaAdmin(idCita) {
    let citas = JSON.parse(localStorage.getItem("citas")) || [];
    const index = citas.findIndex(c => String(c.id) === String(idCita));

    if (index !== -1) {
        citas[index].estado = "Confirmada";
        localStorage.setItem("citas", JSON.stringify(citas));

        Swal.fire({
            icon: "success",
            title: "¡Cita aprobada!",
            text: `La cita de ${citas[index].nombreMascota} ha sido aprobada y confirmada exitosamente.`,
            confirmButtonColor: "#17a9a7"
        }).then(() => {
            renderizarPendientesConfirmar();
        });
    }
}

function rechazarCitaAdmin(idCita) {
    Swal.fire({
        icon: "warning",
        title: "¿Rechazar esta solicitud?",
        text: "La cita será rechazada y se notificará al cliente.",
        showCancelButton: true,
        confirmButtonText: "Sí, rechazar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#ef4c4c",
        cancelButtonColor: "#6c757d"
    }).then((result) => {
        if (result.isConfirmed) {
            let citas = JSON.parse(localStorage.getItem("citas")) || [];
            const index = citas.findIndex(c => String(c.id) === String(idCita));

            if (index !== -1) {
                citas[index].estado = "Rechazada";
                localStorage.setItem("citas", JSON.stringify(citas));

                Swal.fire({
                    icon: "info",
                    title: "Cita rechazada",
                    text: "La solicitud de cita ha sido rechazada.",
                    confirmButtonColor: "#17a9a7"
                }).then(() => {
                    renderizarPendientesConfirmar();
                });
            }
        }
    });
}

function formatearFechaAdmin(fechaISO) {
    if (!fechaISO) return "Fecha no definida";
    try {
        const [anio, mes, dia] = fechaISO.split("-").map(Number);
        const fecha = new Date(anio, mes - 1, dia);
        const opciones = { day: "numeric", month: "long" };
        return new Intl.DateTimeFormat("es-CO", opciones).format(fecha);
    } catch (e) {
        return fechaISO;
    }
}

function escaparHtml(valor) {
    const div = document.createElement("div");
    div.textContent = String(valor);
    return div.innerHTML;
}