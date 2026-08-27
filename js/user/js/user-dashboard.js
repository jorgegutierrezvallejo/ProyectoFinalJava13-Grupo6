document.addEventListener("DOMContentLoaded", function () {
    iniciarDashboardUsuario();
});

document.addEventListener("userComponentsLoaded", function () {
    // Si hay lógica que dependa del topbar/sidebar ya cargados
});

function iniciarDashboardUsuario() {
    cargarProximaCita();
    iniciarAccionesCita();
}

function cargarProximaCita() {
    let citas = [];
    try {
        citas = JSON.parse(localStorage.getItem("citas")) || [];
    } catch (e) {
        citas = [];
    }

    const proximaCita = citas.length > 0 ? citas[0] : null;

    if (!proximaCita) {
        // Dejar datos estáticos iniciales de la maqueta
        return;
    }

    // Actualizar nombre y subtítulo
    const nombreMascotaEl = document.getElementById("proximaCitaMascotaNombre");
    const descMascotaEl = document.getElementById("proximaCitaMascotaDesc");
    const estadoCitaEl = document.getElementById("proximaCitaEstado");
    const fechaCitaEl = document.getElementById("proximaCitaFecha");
    const horaCitaEl = document.getElementById("proximaCitaHora");
    const servicioCitaEl = document.getElementById("proximaCitaServicio");
    const vetCitaEl = document.getElementById("proximaCitaVet");
    const ubicacionCitaEl = document.getElementById("proximaCitaUbicacion");
    const kpiProximasCitasEl = document.getElementById("kpiProximasCitasValor");

    if (nombreMascotaEl) nombreMascotaEl.textContent = proximaCita.nombreMascota || "Luna";
    if (descMascotaEl) descMascotaEl.textContent = `${proximaCita.especie || "Mascota"}${proximaCita.raza ? ` · ${proximaCita.raza}` : ""} · ${proximaCita.servicioNombre || "Consulta general"}`;
    if (estadoCitaEl) estadoCitaEl.textContent = proximaCita.estado || "Confirmada";

    if (fechaCitaEl) fechaCitaEl.textContent = formatearFechaCita(proximaCita.fecha) || "28 ago 2026";
    if (horaCitaEl) horaCitaEl.textContent = proximaCita.hora || "10:30 AM";
    if (servicioCitaEl) servicioCitaEl.textContent = proximaCita.servicioNombre || "Consulta general";
    if (vetCitaEl) vetCitaEl.textContent = "—";
    if (ubicacionCitaEl) ubicacionCitaEl.textContent = proximaCita.ubicacion || "HuellaVet — Sede Centro";

    if (kpiProximasCitasEl) {
        kpiProximasCitasEl.textContent = citas.length;
    }
}

function formatearFechaCita(fechaISO) {
    if (!fechaISO) return "28 ago 2026";
    try {
        const [anio, mes, dia] = fechaISO.split("-").map(Number);
        const fecha = new Date(anio, mes - 1, dia);
        const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic"];
        return `${dia} ${meses[fecha.getMonth()]} ${anio}`;
    } catch (e) {
        return fechaISO;
    }
}

function iniciarAccionesCita() {
    const btnVerDetalle = document.getElementById("btnVerDetalleCita");
    const btnReprogramar = document.getElementById("btnReprogramarCita");
    const btnCancelar = document.getElementById("btnCancelarCita");

    if (btnVerDetalle) {
        btnVerDetalle.addEventListener("click", function (e) {
            e.preventDefault();
            const citas = JSON.parse(localStorage.getItem("citas")) || [];
            const cita = citas.length > 0 ? citas[0] : null;

            if (typeof Swal !== "undefined") {
                const nombre = cita?.nombreMascota || "Luna";
                const serv = cita?.servicioNombre || "Consulta general";
                const fecha = cita?.fecha ? formatearFechaCita(cita.fecha) : "28 ago 2026";
                const hora = cita?.hora || "10:30 AM";
                const ubi = cita?.ubicacion || "HuellaVet — Sede Centro";

                Swal.fire({
                    title: `Detalle de la Cita · ${nombre}`,
                    html: `
                        <div style="text-align: left; font-size: 0.9rem; line-height: 1.6; color: #223e3c;">
                            <p class="mb-2"><strong>Mascota:</strong> ${nombre} (${cita?.especie || "Gato"})</p>
                            <p class="mb-2"><strong>Servicio:</strong> ${serv}</p>
                            <p class="mb-2"><strong>Fecha y Hora:</strong> ${fecha} a las ${hora}</p>
                            <p class="mb-2"><strong>Veterinario a cargo:</strong> —</p>
                            <p class="mb-2"><strong>Ubicación:</strong> ${ubi}</p>
                            <p class="mb-0"><strong>Estado:</strong> <span class="badge bg-success">Confirmada</span></p>
                        </div>
                    `,
                    confirmButtonText: "Cerrar",
                    confirmButtonColor: "#17a9a7"
                });
            }
        });
    }

    if (btnReprogramar) {
        btnReprogramar.addEventListener("click", function (e) {
            e.preventDefault();
            if (typeof Swal !== "undefined") {
                Swal.fire({
                    icon: "question",
                    title: "¿Deseas reprogramar tu cita?",
                    text: "Te redirigiremos al formulario de agendamiento para seleccionar una nueva fecha y hora.",
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
        });
    }

    if (btnCancelar) {
        btnCancelar.addEventListener("click", function (e) {
            e.preventDefault();
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
                }).then(result => {
                    if (result.isConfirmed) {
                        let citas = JSON.parse(localStorage.getItem("citas")) || [];
                        if (citas.length > 0) {
                            citas.shift(); // Remover la primera cita
                            localStorage.setItem("citas", JSON.stringify(citas));
                        }
                        Swal.fire({
                            icon: "success",
                            title: "Cita cancelada",
                            text: "Tu cita ha sido cancelada exitosamente.",
                            confirmButtonColor: "#17a9a7"
                        }).then(() => {
                            location.reload();
                        });
                    }
                });
            }
        });
    }
}
