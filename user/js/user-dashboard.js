document.addEventListener("DOMContentLoaded", function () {
    iniciarDashboardUsuario();
});

document.addEventListener("userComponentsLoaded", function () {
    // Escucha si la topbar o sidebar requieren re-renderizado
});

async function iniciarDashboardUsuario() {
    cargarSaludoUsuario();

    const usuarioActivo = obtenerUsuarioRegistrado();
    if (!usuarioActivo || !usuarioActivo.id) {
        console.warn("No hay un usuario con sesión activa en el sistema.");
        return;
    }

    // 1. Citas y mascotas vienen de la base de datos (una peticion cada una,
    //    compartida con la topbar). Nada se lee de localStorage.
    const resultados = await Promise.allSettled([
        asegurarCitasCargadas(usuarioActivo.id),
        asegurarMascotasCargadas(usuarioActivo.id)
    ]);
    const fallo = resultados.find(resultado => resultado.status === "rejected");
    if (fallo) {
        console.error("Error cargando datos del dashboard:", fallo.reason);
        if (typeof Swal !== "undefined") {
            Swal.fire({
                icon: "warning",
                title: "No pudimos cargar todos tus datos",
                text: "Revisa tu conexión y recarga la página.",
                confirmButtonColor: "#17a9a7"
            });
        }
    }

    // 2. Renderizar KPIs y Próxima Cita con datos reales de la BD
    const mascotas = obtenerMascotasPorUsuarioId(usuarioActivo.id);
    cargarMetricasKPIs(mascotas, usuarioActivo.id);
    cargarProximaCita();
    cargarRecordatoriosDashboard(mascotas);
    iniciarAccionesCita();
}

// Cálculo dinámico de los 4 KPIs del Dashboard
function cargarMetricasKPIs(mascotas, usuarioId) {
    const kpiMascotas = document.getElementById("kpiMascotasValor");
    const kpiProximasCitas = document.getElementById("kpiProximasCitasValor");
    const kpiVacunas = document.getElementById("kpiVacunasValor");

    // KPI 1: Total mascotas
    if (kpiMascotas) kpiMascotas.textContent = mascotas.length;

    // KPI 2: Citas futuras programadas
    const citasFuturas = typeof obtenerCitasFuturas === "function" 
        ? obtenerCitasFuturas(usuarioId) 
        : [];
    if (kpiProximasCitas) kpiProximasCitas.textContent = citasFuturas.length;

    // KPI 3 y la lista de la derecha se calculan juntos en
    // cargarRecordatoriosDashboard(), a partir de los recordatorios reales
    // que el veterinario deja en las citas completadas (cita.recordatorio).
    // Antes este KPI contaba citas en estado "Pendiente", que es un concepto
    // distinto (confirmación de la cita, no un recordatorio de cuidado).

    // KPI 4: Mascotas con vacunas pendientes o registradas
    const mascotasConVacunas = mascotas.filter(m => Array.isArray(m.vacunas)
        ? m.vacunas.length > 0
        : String(m.vacunas || "").trim() !== "").length;
    if (kpiVacunas) kpiVacunas.textContent = mascotasConVacunas;
}

// Presentación de la ficha de la cita más cercana
function cargarProximaCita() {
    const usuarioActivo = obtenerUsuarioRegistrado();
    const citas = usuarioActivo && typeof obtenerCitasFuturas === "function" 
        ? obtenerCitasFuturas(usuarioActivo.id) 
        : [];

    const contenedor = document.getElementById("proximaCitaContenido");
    const proximaCita = citas[0] || null;

    if (!proximaCita) {
        if (contenedor) {
            contenedor.innerHTML = `
                <div class="proxima-cita-vacio">
                    <div class="proxima-cita-vacio__icono">
                        <i class="bi bi-calendar-x"></i>
                    </div>
                    <div class="proxima-cita-vacio__contenido">
                        <strong>No tienes próximas citas</strong>
                        <p>Agenda una cita para verla aquí.</p>
                    </div>
                </div>
            `;
        }
        return;
    }

    const nombreMascotaEl = document.getElementById("proximaCitaMascotaNombre");
    const descMascotaEl = document.getElementById("proximaCitaMascotaDesc");
    const estadoCitaEl = document.getElementById("proximaCitaEstado");
    const fechaCitaEl = document.getElementById("proximaCitaFecha");
    const horaCitaEl = document.getElementById("proximaCitaHora");
    const servicioCitaEl = document.getElementById("proximaCitaServicio");
    const vetCitaEl = document.getElementById("proximaCitaVet");
    const ubicacionCitaEl = document.getElementById("proximaCitaUbicacion");

    const especieInfo = infoPorEspecie(proximaCita.especie || "otro");
    const estadoTexto = capitalizarPrimera(proximaCita.estado || "Confirmada");

    if (nombreMascotaEl) nombreMascotaEl.textContent = proximaCita.nombreMascota || "Mascota";
    if (descMascotaEl) descMascotaEl.textContent = `${especieInfo.texto} · ${proximaCita.servicioNombre || "Consulta general"}`;
    if (estadoCitaEl) {
        estadoCitaEl.textContent = estadoTexto;
        estadoCitaEl.className = `badge-estado-cita badge-estado-cita--${estadoTexto.toLowerCase()}`;
    }

    const avatarEl = document.getElementById("proximaCitaAvatar");
    if (avatarEl) {
        avatarEl.className = `cita-mascota-avatar cita-mascota-avatar--${especieInfo.clase}`;
        avatarEl.innerHTML = proximaCita.fotoMascota 
            ? `<img src="${escaparHtmlUsuario(proximaCita.fotoMascota)}" alt="${escaparHtmlUsuario(proximaCita.nombreMascota)}">` 
            : `<i class="fa-solid ${especieInfo.icono}"></i>`;
    }

    if (fechaCitaEl) fechaCitaEl.textContent = formatearFechaCita(proximaCita.fecha);
    if (horaCitaEl) horaCitaEl.textContent = proximaCita.hora || "10:00 AM";
    if (servicioCitaEl) servicioCitaEl.textContent = proximaCita.servicioNombre || "Consulta general";
    // [AJUSTE CLAUDE] El backend devuelve "veterinario" como texto (nombre
    // completo), no como objeto: "proximaCita.veterinario?.nombre" nunca
    // iba a mostrar nada. Se usa tambien "veterinarioNombre" (agregado en
    // citas-storage.js) como respaldo.
    if (vetCitaEl) vetCitaEl.textContent = proximaCita.veterinario || proximaCita.veterinarioNombre || "Por asignar";
    if (ubicacionCitaEl) ubicacionCitaEl.textContent = proximaCita.ubicacion || "HuellaVet — Sede Centro";
}

// Listeners de los botones interactivos
function iniciarAccionesCita() {
    const btnVerDetalle = document.getElementById("btnVerDetalleCita");
    const btnReprogramar = document.getElementById("btnReprogramarCita");
    const btnCancelar = document.getElementById("btnCancelarCita");

    if (btnVerDetalle) {
        btnVerDetalle.onclick = function (e) {
            e.preventDefault();
            const usuarioActivo = obtenerUsuarioRegistrado();
            const cita = proximaCitaGlobal(usuarioActivo?.id);

            if (!cita || typeof Swal === "undefined") return;

            Swal.fire({
                title: `Detalle de Cita · ${cita.nombreMascota}`,
                html: `
                    <div style="text-align: left; font-size: 0.9rem; line-height: 1.6; color: #223e3c;">
                        <p class="mb-2"><strong>Mascota:</strong> ${cita.nombreMascota}</p>
                        <p class="mb-2"><strong>Servicio:</strong> ${cita.servicioNombre}</p>
                        <p class="mb-2"><strong>Fecha y Hora:</strong> ${formatearFechaCita(cita.fecha)} a las ${cita.hora}</p>
                        <p class="mb-2"><strong>Ubicación:</strong> ${cita.ubicacion}</p>
                        <p class="mb-0"><strong>Estado:</strong> <span class="badge bg-success">${capitalizarPrimera(cita.estado)}</span></p>
                    </div>
                `,
                confirmButtonText: "Cerrar",
                confirmButtonColor: "#17a9a7"
            });
        };
    }

    if (btnReprogramar) {
        btnReprogramar.onclick = function (e) {
            e.preventDefault();
            if (typeof Swal !== "undefined") {
                Swal.fire({
                    icon: "question",
                    title: "¿Deseas reprogramar tu cita?",
                    text: "Te redirigiremos al formulario de agendamiento.",
                    showCancelButton: true,
                    confirmButtonText: "Sí, reprogramar",
                    cancelButtonText: "Volver",
                    confirmButtonColor: "#17a9a7",
                    cancelButtonColor: "#6c757d"
                }).then(result => {
                    if (result.isConfirmed) {
                        window.location.href = "../../agendar.html";
                    }
                });
            }
        };
    }

    if (btnCancelar) {
        btnCancelar.onclick = function (e) {
            e.preventDefault();
            const usuarioActivo = obtenerUsuarioRegistrado();
            const cita = proximaCitaGlobal(usuarioActivo?.id);

            if (!cita) return;

            if (typeof Swal !== "undefined") {
                Swal.fire({
                    icon: "warning",
                    title: "¿Cancelar cita?",
                    text: "¿Estás seguro de que deseas cancelar tu próxima cita?",
                    showCancelButton: true,
                    confirmButtonText: "Sí, cancelar",
                    cancelButtonText: "No cancelar",
                    confirmButtonColor: "#e53e3e",
                    cancelButtonColor: "#6c757d"
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        try {
                            // Llama al PUT /api/citas/{id}/cancelar en Java
                            await actualizarEstadoCita(cita.id, "Cancelada");
                            
                            Swal.fire({
                                icon: "success",
                                title: "Cita cancelada",
                                text: "El estado se actualizó correctamente en la base de datos.",
                                confirmButtonColor: "#17a9a7"
                            }).then(() => {
                                iniciarDashboardUsuario(); // Refresca sin recargar toda la página
                            });
                        } catch (err) {
                            Swal.fire({
                                icon: "error",
                                title: "Error",
                                text: "No se pudo cancelar la cita en el servidor.",
                                confirmButtonColor: "#17a9a7"
                            });
                        }
                    }
                });
            }
        };
    }
}

function cargarSaludoUsuario() {
    if (typeof obtenerUsuarioRegistrado === "function") {
        const usuario = obtenerUsuarioRegistrado();
        if (usuario && usuario.nombreCompleto) {
            const saludoEl = document.querySelector(".user-saludo h2");
            if (saludoEl) {
                const primerNombre = usuario.nombreCompleto.split(" ")[0];
                saludoEl.textContent = `Hola, ${primerNombre} 👋`;
            }
        }
    }
}

function infoPorEspecie(especieCruda) {
    const clave = String(especieCruda || "").trim().toLowerCase();
    const mapa = {
        perro: { icono: "fa-dog", clase: "perro", texto: "Perro" },
        gato: { icono: "fa-cat", clase: "gato", texto: "Gato" },
        ave: { icono: "fa-dove", clase: "ave", texto: "Ave" }
    };
    return mapa[clave] || { icono: "fa-paw", clase: "otro", texto: capitalizarPrimera(especieCruda) || "Mascota" };
}

function capitalizarPrimera(texto) {
    const limpio = String(texto || "").trim();
    if (!limpio) return "";
    return limpio.charAt(0).toUpperCase() + limpio.slice(1).toLowerCase();
}

function escaparHtmlUsuario(valor) {
    const div = document.createElement("div");
    div.textContent = String(valor ?? "");
    return div.innerHTML;
}

// ============================================================
// SECCIÓN: RECORDATORIOS (notas reales del veterinario)
// ============================================================
// Junta, para todas las mascotas del usuario, las indicaciones que el
// veterinario dejó al completar una cita (cita.recordatorio: ver
// js/shared/citas-storage.js -> obtenerCitasConRecordatorioPorMascotaId,
// el mismo dato que ya se muestra en user-mascotas.js por cada mascota).
function cargarRecordatoriosDashboard(mascotas) {
    const contenedor = document.getElementById("listaRecordatoriosDashboard");
    const kpiRecordatorios = document.getElementById("kpiRecordatoriosValor");
    const kpiSubtexto = document.getElementById("kpiRecordatoriosSubtexto");

    if (!contenedor) return;

    if (typeof obtenerCitasConRecordatorioPorMascotaId !== "function" || !Array.isArray(mascotas)) {
        contenedor.innerHTML = plantillaRecordatoriosVacio();
        if (kpiRecordatorios) kpiRecordatorios.textContent = "0";
        return;
    }

    const items = mascotas
        .flatMap(mascota =>
            obtenerCitasConRecordatorioPorMascotaId(mascota.id).map(cita => {
                const analisis = analizarUrgenciaRecordatorio(cita.recordatorio.fecha, cita.fecha);
                return {
                    mascotaId: mascota.id,
                    mascotaNombre: mascota.nombre || "tu mascota",
                    texto: cita.recordatorio.texto,
                    fechaOrden: cita.recordatorio.fecha || cita.recordatorio.fechaCreacion || cita.fecha,
                    ...analisis
                };
            })
        )
        .sort((a, b) => new Date(a.fechaOrden) - new Date(b.fechaOrden));

    if (kpiRecordatorios) kpiRecordatorios.textContent = items.length;
    if (kpiSubtexto) {
        kpiSubtexto.innerHTML = items.length
            ? `<i class="bi bi-exclamation-circle"></i> Por revisar`
            : `<i class="bi bi-check2"></i> Al día`;
    }

    if (items.length === 0) {
        contenedor.innerHTML = plantillaRecordatoriosVacio();
        return;
    }

    // La tarjeta es un resumen: se muestran los 4 más próximos. Cada fila
    // lleva directo al detalle de esa mascota en Mis mascotas (antes eran
    // divs sin ningun destino, pese al efecto hover ya definido en el CSS).
    contenedor.innerHTML = items.slice(0, 4).map(item => `
        <a class="recordatorio-item" href="user-mascotas.html?mascotaId=${encodeURIComponent(item.mascotaId || "")}">
            <div class="recordatorio-main">
                <div class="recordatorio-icon recordatorio-icon--${item.claseIcono}">
                    <i class="bi ${item.claseIcono === "naranja" ? "bi-exclamation-circle" : "bi-clipboard2-pulse"}"></i>
                </div>
                <div class="recordatorio-info">
                    <span class="recordatorio-titulo">${escaparHtmlUsuario(item.texto)}</span>
                    <span class="recordatorio-vence">${escaparHtmlUsuario(item.mascotaNombre)} · ${escaparHtmlUsuario(item.vence)}</span>
                </div>
            </div>
            <span class="badge-recordatorio badge-recordatorio--${item.claseBadge}">${escaparHtmlUsuario(item.badgeTexto)}</span>
        </a>
    `).join("");
}

// Clasifica un recordatorio según su fecha sugerida (si tiene) para decidir
// color de icono/badge y el texto de vencimiento que se muestra.
function analizarUrgenciaRecordatorio(fechaVenceISO, fechaVisitaISO) {
    if (!fechaVenceISO) {
        return {
            claseIcono: "verde",
            claseBadge: "verde",
            badgeTexto: "Del veterinario",
            vence: `De tu visita del ${formatearFechaCita(fechaVisitaISO)}`
        };
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const [anio, mes, dia] = fechaVenceISO.split("-").map(Number);
    const fechaVence = new Date(anio, mes - 1, dia);
    const diffDias = Math.round((fechaVence - hoy) / 86400000);

    if (diffDias < 0) {
        const dias = Math.abs(diffDias);
        return {
            claseIcono: "naranja",
            claseBadge: "naranja",
            badgeTexto: "Vencido",
            vence: `Venció hace ${dias} día${dias === 1 ? "" : "s"}`
        };
    }

    if (diffDias <= 7) {
        return {
            claseIcono: "naranja",
            claseBadge: "naranja",
            badgeTexto: "Próximo",
            vence: diffDias === 0 ? "Vence hoy" : diffDias === 1 ? "Vence mañana" : `Vence en ${diffDias} días`
        };
    }

    return {
        claseIcono: "morado",
        claseBadge: "lila",
        badgeTexto: formatearFechaCita(fechaVenceISO),
        vence: `Sugerida: ${formatearFechaCita(fechaVenceISO)}`
    };
}

function plantillaRecordatoriosVacio() {
    return `
        <div class="recordatorio-item">
            <div class="recordatorio-info">
                <span class="recordatorio-titulo">Sin recordatorios pendientes</span>
                <span class="recordatorio-vence">Aquí verás las indicaciones que tu veterinario deje después de una cita.</span>
            </div>
        </div>
    `;
}

function formatearFechaCita(fechaISO) {
    if (!fechaISO) return "Sin fecha";
    try {
        const [anio, mes, dia] = fechaISO.split("-").map(Number);
        const fecha = new Date(anio, mes - 1, dia);
        const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic"];
        return `${dia} ${meses[fecha.getMonth()]} ${anio}`;
    } catch (e) {
        return fechaISO;
    }
}