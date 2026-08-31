document.addEventListener("DOMContentLoaded", function () {
    iniciarCitas();
});

let pendientesHTMLOriginal = null;

function iniciarCitas() {
    renderizarPendientesConfirmar();
    iniciarAgendaDelDia();
}

function renderizarPendientesConfirmar() {
    const panel = document.querySelector(".hv-pendientes");
    if (!panel) return;

    if (pendientesHTMLOriginal === null) {
        pendientesHTMLOriginal = panel.innerHTML;
    }

    let citas = [];
    try {
        citas = JSON.parse(localStorage.getItem("citas")) || [];
    } catch (e) {
        citas = [];
    }

    // Filtrar citas pendientes de aprobación
    // Si la cita no tiene estado o su estado es "Pendiente" o "Confirmada" reciente
    const citasPendientes = citas.filter(c => c.estado === "Pendiente" || (!c.estado && c.estado !== "Rechazada"));

    // Estado vacío: panel compacto de una sola línea (igual de compacto que la alerta de "cita confirmada")
    if (citasPendientes.length === 0) {
        panel.classList.add("hv-pendientes--vacio");
        panel.innerHTML = `
            <div class="hv-pendientes__compacto-icono">
                <i class="bi bi-calendar-check"></i>
            </div>
            <div class="hv-pendientes__compacto-contenido">
                <strong>Pendientes por confirmar</strong>
                <p>No hay citas pendientes por aprobar.</p>
            </div>
            <div class="hv-pendientes__compacto-acciones">
                <a href="#">Ver todas</a>
            </div>
        `;
        return;
    }

    // Hay citas pendientes: restaurar el panel completo (comportamiento normal, sin cambios)
    if (panel.classList.contains("hv-pendientes--vacio")) {
        panel.classList.remove("hv-pendientes--vacio");
        panel.innerHTML = pendientesHTMLOriginal;
    }

    const contenedor = document.getElementById("contenedorPendientesCitas");
    const contador = document.getElementById("contadorPendientesCantidad");

    if (!contenedor) return;

    if (contador) {
        contador.textContent = citasPendientes.length;
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
                <button type="button" class="hv-pendiente__boton hv-pendiente__boton--ver" onclick="verReservaAdmin('${cita.id}')">
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
        const abonoEstado = cita.abonoEstado || "pendiente";
        const badgeAbonoHtml = abonoEstado === "pagado"
            ? `<span class="badge" style="background-color:#e3f5e8;color:#1e7a3d;font-weight:700;">Abono pagado</span>`
            : `<span class="badge" style="background-color:#fdeeee;color:#c0392b;font-weight:700;">Abono pendiente</span>`;

        const comprobanteHtml = cita.abonoComprobante
            ? `<div class="mt-2"><a href="${cita.abonoComprobante}" target="_blank" rel="noopener"><img src="${cita.abonoComprobante}" alt="Comprobante de pago" style="max-width:100%;max-height:150px;border-radius:8px;border:1px solid #f9dfa0;display:block;"></a><span class="small text-muted d-block mt-1">Clic en la imagen para verla en grande.</span></div>`
            : `<div class="mt-1 small text-muted"><i class="bi bi-exclamation-circle me-1"></i>El propietario aún no ha subido el comprobante de pago.</div>`;

        reservaHtml = `
            <div class="alert alert-warning py-2 px-3 small mb-0 text-start" style="background-color: #fff9eb; border: 1px solid #f9dfa0; color: #855b08; border-radius: 8px;">
                <div class="d-flex justify-content-between align-items-center flex-wrap gap-1">
                    <span><i class="bi bi-credit-card-2-front me-1"></i><strong>Costo de reserva / anticipo:</strong> $${Number(cita.costoReserva).toLocaleString("es-CO")} COP.</span>
                    ${badgeAbonoHtml}
                </div>
                ${comprobanteHtml}
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
            refrescarAgendaYPanelSiAplica(idCita);
        });
    }
}

function rechazarCitaAdmin(idCita) {
    Swal.fire({
        icon: "warning",
        title: "¿Rechazar esta solicitud?",
        html: `
            <p style="text-align: left; color: #526765; font-size: 0.85rem; margin-bottom: 0.4rem;">La cita será rechazada y se notificará al cliente. Indica el motivo:</p>
            <textarea id="swalMotivoRechazo" class="swal2-textarea" style="margin: 0; width: 100%;" placeholder="Ej. No hay disponibilidad en ese horario, el servicio solicitado no aplica..."></textarea>
        `,
        showCancelButton: true,
        confirmButtonText: "Sí, rechazar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#ef4c4c",
        cancelButtonColor: "#6c757d",
        focusConfirm: false,
        preConfirm: () => {
            const motivo = document.getElementById("swalMotivoRechazo").value.trim();
            if (!motivo) {
                Swal.showValidationMessage("Escribe el motivo del rechazo.");
                return false;
            }
            return motivo;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            actualizarCamposCita(idCita, { estado: "Rechazada", motivoEstado: result.value });

            Swal.fire({
                icon: "info",
                title: "Cita rechazada",
                text: "La solicitud de cita ha sido rechazada.",
                confirmButtonColor: "#17a9a7"
            }).then(() => {
                renderizarPendientesConfirmar();
                refrescarAgendaYPanelSiAplica(idCita);
            });
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

/* ========================================
   AGENDA DEL DIA + PANEL DE CITA
   (usa las funciones de citas-datos.js)

   - fechaAgendaSeleccionada: que dia se esta
     mostrando en "Agenda de hoy". Si la pagina
     se abrio desde el calendario del dashboard
     (admin-citas.html?fecha=YYYY-MM-DD) arranca
     en esa fecha; si no, arranca en hoy.

   - idCitaEnPanel: si es null, el panel derecho
     muestra la proxima cita automaticamente
     (titulo "Proxima Cita"). Si el admin hace
     clic en una fila de la agenda, se guarda el
     id de esa cita aqui y el panel muestra esa
     cita puntual (titulo "Ver cita").
======================================== */

function obtenerFechaInicialDesdeURL() {
    const params = new URLSearchParams(window.location.search);
    const fechaParam = params.get("fecha");
    if (fechaParam && /^\d{4}-\d{2}-\d{2}$/.test(fechaParam)) {
        return fechaParam;
    }
    return hoyISO();
}

let fechaAgendaSeleccionada = obtenerFechaInicialDesdeURL();
let idCitaEnPanel = null;
let citaIdMostradaActualmente = null;

const ESTADO_A_CLASE = {
    "Pendiente": "pendiente",
    "Confirmada": "confirmada",
    "En curso": "en-curso",
    "Completada": "completada",
    "Reprogramada": "reprogramada",
    "Cancelada": "cancelada",
    "Rechazada": "rechazada"
};

const ICONOS_POR_SERVICIO = {
    "Consulta general": "bi-heart-pulse",
    "Vacunación": "bi-shield-plus",
    "Limpieza dental": "bi-bandaid",
    "Examen general": "bi-clipboard2-pulse",
    "Consulta dermatológica": "bi-bandaid"
};

function iconoParaServicio(nombreServicio) {
    return ICONOS_POR_SERVICIO[nombreServicio] || "bi-heart-pulse";
}

function iniciarAgendaDelDia() {
    document.getElementById("agendaBtnAnterior")?.addEventListener("click", function () {
        fechaAgendaSeleccionada = sumarDiasISO(fechaAgendaSeleccionada, -1);
        renderizarAgendaDelDia();
    });

    document.getElementById("agendaBtnSiguiente")?.addEventListener("click", function () {
        fechaAgendaSeleccionada = sumarDiasISO(fechaAgendaSeleccionada, 1);
        renderizarAgendaDelDia();
    });

    document.getElementById("agendaBtnHoy")?.addEventListener("click", function () {
        fechaAgendaSeleccionada = hoyISO();
        renderizarAgendaDelDia();
    });

    iniciarBotonesPanelCita();

    renderizarAgendaDelDia();
    renderizarPanelCita();
}

// Pinta la lista "Agenda de hoy" con las citas reales guardadas en
// localStorage para fechaAgendaSeleccionada. Cada franja de HORAS_AGENDA
// que no tenga cita se muestra como "Espacio disponible".
function renderizarAgendaDelDia() {
    const contenedor = document.getElementById("agendaListaContenedor");
    const fechaTexto = document.getElementById("agendaFechaTexto");
    if (!contenedor) return;

    if (fechaTexto) {
        fechaTexto.textContent = fechaISOaTextoLargo(fechaAgendaSeleccionada);
    }

    const citasDelDia = citasPorFecha(fechaAgendaSeleccionada);

    // Si dos citas caen en la misma franja horaria, se muestra la primera.
    const citaPorFranja = {};
    citasDelDia.forEach(cita => {
        const franja = horaAFranja(cita.hora);
        if (!citaPorFranja[franja]) {
            citaPorFranja[franja] = cita;
        }
    });

    contenedor.innerHTML = "";

    HORAS_AGENDA.forEach(hora => {
        const cita = citaPorFranja[hora];
        const fila = document.createElement("div");
        fila.className = "hv-agenda-fila";

        if (cita) {
            const claseEstado = ESTADO_A_CLASE[cita.estado] || "pendiente";
            const icono = iconoParaServicio(cita.servicioNombre);
            const avatarHtml = cita.fotoMascota
                ? `<img class="hv-agenda-cita__avatar" src="${escaparHtml(cita.fotoMascota)}" alt="${escaparHtml(cita.nombreMascota || "Mascota")}">`
                : `<div class="hv-agenda-cita__avatar hv-agenda-cita__avatar--icono"><i class="fa-solid fa-paw"></i></div>`;

            fila.innerHTML = `
                <div class="hv-agenda-hora">${hora}</div>
                <div class="hv-agenda-cita hv-agenda-cita--${claseEstado}">
                    ${avatarHtml}
                    <div class="hv-agenda-cita__info">
                        <div class="hv-agenda-cita__nombre">${escaparHtml(cita.nombreMascota || "Mascota")}</div>
                        <div class="hv-agenda-cita__dueno">${escaparHtml(cita.cliente?.nombre || "Cliente")}</div>
                    </div>
                    <div class="hv-agenda-cita__servicio">
                        <i class="bi ${icono}"></i>
                        <div>
                            <div class="hv-agenda-cita__tipo">${escaparHtml(cita.servicioNombre || "Consulta general")}</div>
                        </div>
                    </div>
                    <span class="hv-badge hv-badge--${claseEstado}">${escaparHtml(cita.estado || "Pendiente")}</span>
                    <i class="bi bi-chevron-right hv-agenda-cita__flecha"></i>
                </div>
            `;

            fila.querySelector(".hv-agenda-cita").addEventListener("click", function () {
                mostrarCitaEnPanel(cita.id);
            });
        } else {
            fila.innerHTML = `
                <div class="hv-agenda-hora">${hora}</div>
                <div class="hv-agenda-espacio">
                    <div class="hv-agenda-espacio__icono">
                        <i class="bi bi-plus"></i>
                    </div>
                    <div class="hv-agenda-espacio__texto">
                        <strong>Espacio disponible</strong>
                        <span>No hay ninguna cita agendada en esta hora</span>
                    </div>
                </div>
            `;
        }

        contenedor.appendChild(fila);
    });
}

// Muestra una cita puntual en el panel derecho (clic en una fila de la agenda).
function mostrarCitaEnPanel(idCita) {
    idCitaEnPanel = idCita;
    renderizarPanelCita();
}

// Pinta el panel derecho: la cita elegida (titulo "Ver cita") o, si no se
// eligio ninguna, la proxima cita automatica (titulo "Proxima Cita").
function renderizarPanelCita() {
    const titulo = document.getElementById("panelCitaTitulo");
    const contenido = document.getElementById("panelCitaContenido");
    const vacio = document.getElementById("panelCitaVacio");
    if (!titulo || !contenido || !vacio) return;

    let cita = null;
    let esVistaEspecifica = false;

    if (idCitaEnPanel !== null) {
        cita = obtenerCitaPorId(idCitaEnPanel);
        if (cita) {
            esVistaEspecifica = true;
        } else {
            idCitaEnPanel = null;
        }
    }

    if (!cita) {
        cita = proximaCitaGlobal();
        esVistaEspecifica = false;
    }

    citaIdMostradaActualmente = cita ? cita.id : null;
    titulo.textContent = esVistaEspecifica ? "Ver cita" : "Próxima Cita";

    if (!cita) {
        contenido.hidden = true;
        vacio.hidden = false;
        return;
    }

    contenido.hidden = false;
    vacio.hidden = true;

    const nombreMascota = cita.nombreMascota || "Mascota";
    const especieCapitalizada = cita.especie ? cita.especie.charAt(0).toUpperCase() + cita.especie.slice(1).toLowerCase() : "";
    const especieRaza = [especieCapitalizada, cita.raza].filter(Boolean).join(" • ") || "Sin datos registrados";
    const nombreCliente = cita.cliente?.nombre || "Cliente";
    const telefonoCliente = cita.cliente?.telefono || "Sin teléfono";
    const modalidadTexto = cita.ubicacion || (cita.modalidad === "domicilio" ? "Servicio a domicilio" : "En clínica");

    document.getElementById("panelCitaNombre").textContent = nombreMascota;
    document.getElementById("panelCitaId").textContent = `ID: ${cita.id}`;

    const avatarPanelEl = document.getElementById("panelCitaAvatar");
    if (avatarPanelEl) {
        if (cita.fotoMascota) {
            avatarPanelEl.classList.remove("hv-detalle__avatar--icono");
            avatarPanelEl.style.backgroundImage = `url('${cita.fotoMascota}')`;
            avatarPanelEl.style.backgroundSize = "cover";
            avatarPanelEl.style.backgroundPosition = "center";
            avatarPanelEl.innerHTML = "";
        } else {
            avatarPanelEl.classList.add("hv-detalle__avatar--icono");
            avatarPanelEl.style.backgroundImage = "";
            avatarPanelEl.innerHTML = `<i class="fa-solid fa-paw"></i>`;
        }
    }

    document.getElementById("panelCitaMascotaTexto").textContent = nombreMascota;
    document.getElementById("panelCitaMascotaDetalle").textContent = especieRaza;

    document.getElementById("panelCitaPropietarioTexto").textContent = nombreCliente;
    document.getElementById("panelCitaPropietarioDetalle").textContent = telefonoCliente;

    document.getElementById("panelCitaServicioTexto").textContent = cita.servicioNombre || "Consulta general";
    document.getElementById("panelCitaServicioDetalle").textContent = modalidadTexto;

    document.getElementById("panelCitaFecha").textContent = fechaISOaTextoLargo(cita.fecha);
    document.getElementById("panelCitaHora").textContent = cita.hora || "Hora no definida";

    const claseEstado = ESTADO_A_CLASE[cita.estado] || "pendiente";
    const estadoEl = document.getElementById("panelCitaEstado");
    estadoEl.className = `hv-detalle__estado hv-detalle__estado--${claseEstado}`;
    estadoEl.textContent = cita.estado || "Pendiente";

    const observacionesFila = document.getElementById("panelCitaObservacionesFila");
    const textoObservaciones = cita.motivo || "";
    if (textoObservaciones) {
        observacionesFila.hidden = false;
        document.getElementById("panelCitaObservaciones").textContent = textoObservaciones;
    } else {
        observacionesFila.hidden = true;
    }

    // Motivo del cambio de estado (Cancelada/Rechazada/Reprogramada).
    const ETIQUETA_MOTIVO_POR_ESTADO = {
        "Cancelada": "Motivo de cancelación",
        "Rechazada": "Motivo de rechazo",
        "Reprogramada": "Motivo de reprogramación"
    };
    const motivoEstadoFila = document.getElementById("panelCitaMotivoEstadoFila");
    if (motivoEstadoFila) {
        if (cita.motivoEstado && ETIQUETA_MOTIVO_POR_ESTADO[cita.estado]) {
            motivoEstadoFila.hidden = false;
            document.getElementById("panelCitaMotivoEstadoEtiqueta").textContent = ETIQUETA_MOTIVO_POR_ESTADO[cita.estado];
            document.getElementById("panelCitaMotivoEstado").textContent = cita.motivoEstado;
        } else {
            motivoEstadoFila.hidden = true;
        }
    }

    // Recomendacion/recordatorio enviado al finalizar la cita.
    const recordatorioFila = document.getElementById("panelCitaRecordatorioFila");
    if (recordatorioFila) {
        if (cita.estado === "Completada" && cita.recordatorio) {
            recordatorioFila.hidden = false;
            document.getElementById("panelCitaRecordatorioTexto").textContent = cita.recordatorio.texto || "";
            document.getElementById("panelCitaRecordatorioFecha").textContent = cita.recordatorio.fecha
                ? `Fecha sugerida: ${formatearFechaAdmin(cita.recordatorio.fecha)}`
                : "Sin fecha específica";
        } else {
            recordatorioFila.hidden = true;
        }
    }

    // Botones de accion: los normales (Editar/Reprogramar/Cancelar) se
    // ocultan cuando la cita ya esta Completada, y en su lugar aparece
    // "Editar recomendacion".
    const accionesNormales = document.getElementById("panelAccionesNormales");
    const accionesRecomendacion = document.getElementById("panelAccionesRecomendacion");
    if (accionesNormales && accionesRecomendacion) {
        if (cita.estado === "Completada") {
            accionesNormales.style.display = "none";
            accionesRecomendacion.hidden = false;
        } else {
            accionesNormales.style.display = "";
            accionesRecomendacion.hidden = true;
        }
    }

    actualizarBotonIniciarFinalizar(cita.estado);
}

// El boton principal del panel cambia segun el estado actual: "Aprobar
// cita" (Pendiente), "Iniciar cita" (Confirmada), "Finalizar cita" (En
// curso), o se oculta del todo en los estados que ya no tienen accion.
function actualizarBotonIniciarFinalizar(estado) {
    const boton = document.getElementById("panelBtnIniciarFinalizar");
    const texto = document.getElementById("panelBtnIniciarFinalizarTexto");
    const icono = boton?.querySelector("i");
    if (!boton || !texto) return;

    const estadosSinAccion = ["Completada", "Cancelada", "Rechazada", "Reprogramada"];

    if (estadosSinAccion.includes(estado)) {
        boton.style.display = "none";
        boton.dataset.modo = "";
        return;
    }

    boton.style.display = "";

    if (estado === "Pendiente") {
        boton.className = "hv-detalle__btn hv-detalle__btn--aprobar";
        texto.textContent = "Aprobar cita";
        if (icono) icono.className = "bi bi-check-circle";
        boton.dataset.modo = "aprobar";
    } else if (estado === "En curso") {
        boton.className = "hv-detalle__btn hv-detalle__btn--finalizar";
        texto.textContent = "Finalizar cita";
        if (icono) icono.className = "bi bi-check-circle";
        boton.dataset.modo = "finalizar";
    } else {
        boton.className = "hv-detalle__btn hv-detalle__btn--iniciar";
        texto.textContent = "Iniciar cita";
        if (icono) icono.className = "bi bi-play-circle";
        boton.dataset.modo = "iniciar";
    }
}

// Wiring de los botones del panel (una sola vez: los botones no se
// vuelven a crear, solo se actualiza su texto/estilo en cada render).
function iniciarBotonesPanelCita() {
    document.getElementById("panelBtnIniciarFinalizar")?.addEventListener("click", function () {
        if (citaIdMostradaActualmente === null) return;
        const cita = obtenerCitaPorId(citaIdMostradaActualmente);
        if (!cita) return;

        const modo = this.dataset.modo;

        // Pendiente: reutiliza el mismo modal de "Ver reserva" (con el
        // estado del abono y el comprobante) en vez de un simple confirm,
        // para que el doctor revise todo antes de aprobar.
        if (modo === "aprobar") {
            verReservaAdmin(citaIdMostradaActualmente);
            return;
        }

        if (modo === "iniciar") {
            Swal.fire({
                icon: "question",
                title: "¿Iniciar esta cita?",
                text: `La cita de ${cita.nombreMascota || "la mascota"} pasará a estado "En curso".`,
                showCancelButton: true,
                confirmButtonText: "Sí, iniciar",
                cancelButtonText: "Volver",
                confirmButtonColor: "#17a9a7",
                cancelButtonColor: "#6c757d"
            }).then((resultado) => {
                if (!resultado.isConfirmed) return;
                actualizarEstadoCita(citaIdMostradaActualmente, "En curso");
                renderizarAgendaDelDia();
                renderizarPanelCita();
                renderizarPendientesConfirmar();
            });
            return;
        }

        if (modo === "finalizar") {
            Swal.fire({
                icon: "question",
                title: "¿Finalizar esta cita?",
                text: `La cita de ${cita.nombreMascota || "la mascota"} pasará a estado "Completada".`,
                showCancelButton: true,
                confirmButtonText: "Sí, finalizar",
                cancelButtonText: "Volver",
                confirmButtonColor: "#17a9a7",
                cancelButtonColor: "#6c757d"
            }).then((resultado) => {
                if (!resultado.isConfirmed) return;

                const idCitaFinalizada = citaIdMostradaActualmente;
                actualizarEstadoCita(idCitaFinalizada, "Completada");
                renderizarAgendaDelDia();
                renderizarPanelCita();
                renderizarPendientesConfirmar();
                preguntarEnviarRecordatorio(idCitaFinalizada);
            });
        }
    });

    document.getElementById("panelBtnReprogramar")?.addEventListener("click", function () {
        if (citaIdMostradaActualmente === null) return;
        pedirMotivoYCambiarEstado(citaIdMostradaActualmente, "Reprogramada", {
            titulo: "¿Reprogramar esta cita?",
            texto: "El cliente será notificado para acordar una nueva fecha y hora. Indica el motivo:",
            placeholder: "Ej. El propietario solicitó cambiar el horario, el veterinario no está disponible...",
            confirmButtonText: "Sí, reprogramar",
            confirmButtonColor: "#17a9a7"
        });
    });

    document.getElementById("panelBtnCancelar")?.addEventListener("click", function () {
        if (citaIdMostradaActualmente === null) return;
        pedirMotivoYCambiarEstado(citaIdMostradaActualmente, "Cancelada", {
            titulo: "¿Cancelar esta cita?",
            texto: "Esta acción no se puede deshacer. Indica el motivo:",
            placeholder: "Ej. El propietario canceló, la clínica no puede atender en ese horario...",
            confirmButtonText: "Sí, cancelar",
            confirmButtonColor: "#e53935"
        });
    });

    document.getElementById("panelBtnEditar")?.addEventListener("click", function () {
        Swal.fire({
            icon: "info",
            title: "Próximamente",
            text: "La edición de los datos de la cita estará disponible pronto.",
            confirmButtonColor: "#17a9a7"
        });
    });

    document.getElementById("panelBtnEditarRecomendacion")?.addEventListener("click", function () {
        if (citaIdMostradaActualmente === null) return;
        abrirFormularioRecordatorio(citaIdMostradaActualmente);
    });
}

// Diálogo compartido para Reprogramar/Cancelar: pide un motivo obligatorio
// y, si se confirma, cambia el estado y guarda el motivo en la misma cita.
function pedirMotivoYCambiarEstado(idCita, nuevoEstado, opciones) {
    Swal.fire({
        icon: "warning",
        title: opciones.titulo,
        html: `
            <p style="text-align: left; color: #526765; font-size: 0.85rem; margin-bottom: 0.4rem;">${opciones.texto}</p>
            <textarea id="swalMotivoEstado" class="swal2-textarea" style="margin: 0; width: 100%;" placeholder="${opciones.placeholder}"></textarea>
        `,
        showCancelButton: true,
        confirmButtonText: opciones.confirmButtonText,
        cancelButtonText: "Volver",
        confirmButtonColor: opciones.confirmButtonColor,
        cancelButtonColor: "#6c757d",
        focusConfirm: false,
        preConfirm: () => {
            const motivo = document.getElementById("swalMotivoEstado").value.trim();
            if (!motivo) {
                Swal.showValidationMessage("Escribe el motivo.");
                return false;
            }
            return motivo;
        }
    }).then((resultado) => {
        if (!resultado.isConfirmed) return;
        actualizarCamposCita(idCita, { estado: nuevoEstado, motivoEstado: resultado.value });
        renderizarAgendaDelDia();
        renderizarPanelCita();
        renderizarPendientesConfirmar();
    });
}

// Al finalizar una cita, se le pregunta al doctor si quiere dejarle un
// recordatorio al propietario (cuidados, proxima cita, proxima vacuna...).
function preguntarEnviarRecordatorio(idCita) {
    const cita = obtenerCitaPorId(idCita);
    if (!cita) return;

    Swal.fire({
        icon: "question",
        title: "¿Enviar un recordatorio al propietario?",
        text: `Puedes sugerir cuidados, la próxima cita o la próxima vacuna para ${cita.nombreMascota || "la mascota"}. Le aparecerá como recordatorio en su cuenta.`,
        showCancelButton: true,
        confirmButtonText: "Sí, crear recordatorio",
        cancelButtonText: "No, gracias",
        confirmButtonColor: "#17a9a7",
        cancelButtonColor: "#6c757d"
    }).then((resultado) => {
        if (resultado.isConfirmed) {
            abrirFormularioRecordatorio(idCita);
        }
    });
}

// Formulario para crear o editar el recordatorio de una cita Completada.
// La fecha es opcional (recordatorio "sin fecha").
function abrirFormularioRecordatorio(idCita) {
    const cita = obtenerCitaPorId(idCita);
    if (!cita) return;

    const recordatorioActual = cita.recordatorio || null;

    Swal.fire({
        title: recordatorioActual ? "Editar recordatorio" : "Nuevo recordatorio",
        html: `
            <div style="text-align: left; display: flex; flex-direction: column; gap: 0.6rem;">
                <div>
                    <label for="swalRecordatorioTexto" style="font-size: 0.8rem; font-weight: 700; color: #223e3c; display: block; margin-bottom: 0.25rem;">Recomendación / recordatorio</label>
                    <textarea id="swalRecordatorioTexto" class="swal2-textarea" style="margin: 0; width: 100%;" placeholder="Ej. Aplicar la próxima vacuna antirrábica, controlar el peso en 15 días...">${recordatorioActual ? escaparHtml(recordatorioActual.texto) : ""}</textarea>
                </div>
                <div>
                    <label for="swalRecordatorioFecha" style="font-size: 0.8rem; font-weight: 700; color: #223e3c; display: block; margin-bottom: 0.25rem;">Fecha sugerida (opcional)</label>
                    <input type="date" id="swalRecordatorioFecha" class="swal2-input" style="margin: 0; width: 100%;" value="${recordatorioActual?.fecha || ""}">
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: recordatorioActual ? "Guardar cambios" : "Crear recordatorio",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#17a9a7",
        cancelButtonColor: "#6c757d",
        focusConfirm: false,
        preConfirm: () => {
            const texto = document.getElementById("swalRecordatorioTexto").value.trim();
            const fecha = document.getElementById("swalRecordatorioFecha").value || null;
            if (!texto) {
                Swal.showValidationMessage("Escribe el contenido del recordatorio.");
                return false;
            }
            return { texto, fecha };
        }
    }).then((resultado) => {
        if (!resultado.isConfirmed) return;

        actualizarCamposCita(idCita, {
            recordatorio: {
                texto: resultado.value.texto,
                fecha: resultado.value.fecha,
                fechaCreacion: recordatorioActual?.fechaCreacion || new Date().toISOString()
            }
        });

        Swal.fire({
            icon: "success",
            title: recordatorioActual ? "Recordatorio actualizado" : "Recordatorio creado",
            confirmButtonColor: "#17a9a7"
        }).then(() => {
            renderizarPanelCita();
        });
    });
}

// Se llama despues de aprobar/rechazar una cita desde "Pendientes por
// confirmar", para que la agenda y el panel derecho queden al dia.
function refrescarAgendaYPanelSiAplica() {
    renderizarAgendaDelDia();
    renderizarPanelCita();
}
