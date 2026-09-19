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
    iniciarAccionesCita();
}

// Cálculo dinámico de los 4 KPIs del Dashboard
function cargarMetricasKPIs(mascotas, usuarioId) {
    const kpiMascotas = document.getElementById("kpiMascotasValor");
    const kpiProximasCitas = document.getElementById("kpiProximasCitasValor");
    const kpiRecordatorios = document.getElementById("kpiRecordatoriosValor");
    const kpiVacunas = document.getElementById("kpiVacunasValor");

    // KPI 1: Total mascotas
    if (kpiMascotas) kpiMascotas.textContent = mascotas.length;

    // KPI 2: Citas futuras programadas
    const citasFuturas = typeof obtenerCitasFuturas === "function" 
        ? obtenerCitasFuturas(usuarioId) 
        : [];
    if (kpiProximasCitas) kpiProximasCitas.textContent = citasFuturas.length;

    // KPI 3: Recordatorios pendientes
    let totalRecordatorios = 0;
    if (typeof obtenerTodasLasCitas === "function") {
        const citasUsuario = obtenerTodasLasCitas().filter(c => String(c.usuarioId) === String(usuarioId));
        totalRecordatorios = citasUsuario.filter(c => c.estado?.toUpperCase() === "PENDIENTE").length;
    }
    if (kpiRecordatorios) kpiRecordatorios.textContent = totalRecordatorios;

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
    if (vetCitaEl) vetCitaEl.textContent = proximaCita.veterinario?.nombre || "Por asignar";
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