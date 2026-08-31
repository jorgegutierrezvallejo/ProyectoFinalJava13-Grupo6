document.addEventListener("DOMContentLoaded", function () {
    iniciarDashboardUsuario();
});

document.addEventListener("userComponentsLoaded", function () {
    // Si hay lógica que dependa del topbar/sidebar ya cargados
});

function iniciarDashboardUsuario() {
    cargarProximaCita();
    cargarMisMascotas();
    iniciarAccionesCita();
}

// Especie cruda (valor del <select>, ej. "perro") -> { icono FA, clase de color, texto capitalizado }
function infoPorEspecie(especieCruda) {
    const clave = String(especieCruda || "").trim().toLowerCase();
    const mapa = {
        perro: { icono: "fa-dog", clase: "perro", texto: "Perro" },
        gato: { icono: "fa-cat", clase: "gato", texto: "Gato" },
        ave: { icono: "fa-dove", clase: "ave", texto: "Ave" }
    };
    if (mapa[clave]) return mapa[clave];
    // "otro" o especie no reconocida: icono de huella genérico, pero con texto capitalizado igual
    return { icono: "fa-paw", clase: "otro", texto: capitalizarPrimera(especieCruda) || "Mascota" };
}

function capitalizarPrimera(texto) {
    const limpio = String(texto || "").trim();
    if (!limpio) return "";
    return limpio.charAt(0).toUpperCase() + limpio.slice(1).toLowerCase();
}

function cargarProximaCita() {
    let citas = [];
    try {
        citas = JSON.parse(localStorage.getItem("citas")) || [];
    } catch (e) {
        citas = [];
    }

    const contenedor = document.getElementById("proximaCitaContenido");
    const kpiProximasCitasEl = document.getElementById("kpiProximasCitasValor");

    const proximaCita = citas.length > 0 ? citas[0] : null;

    if (kpiProximasCitasEl) {
        kpiProximasCitasEl.textContent = citas.length;
    }

    if (!proximaCita) {
        // No hay citas guardadas: mostrar estado vacío en vez de la ficha de la maqueta
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

    // Actualizar nombre y subtítulo
    const nombreMascotaEl = document.getElementById("proximaCitaMascotaNombre");
    const descMascotaEl = document.getElementById("proximaCitaMascotaDesc");
    const estadoCitaEl = document.getElementById("proximaCitaEstado");
    const fechaCitaEl = document.getElementById("proximaCitaFecha");
    const horaCitaEl = document.getElementById("proximaCitaHora");
    const servicioCitaEl = document.getElementById("proximaCitaServicio");
    const vetCitaEl = document.getElementById("proximaCitaVet");
    const ubicacionCitaEl = document.getElementById("proximaCitaUbicacion");

    const especieInfo = infoPorEspecie(proximaCita.especie);

    if (nombreMascotaEl) nombreMascotaEl.textContent = proximaCita.nombreMascota || "Luna";
    if (descMascotaEl) descMascotaEl.textContent = `${especieInfo.texto}${proximaCita.raza ? ` · ${proximaCita.raza}` : ""} · ${proximaCita.servicioNombre || "Consulta general"}`;
    if (estadoCitaEl) estadoCitaEl.textContent = proximaCita.estado || "Confirmada";

    const avatarEl = document.getElementById("proximaCitaAvatar");
    if (avatarEl) {
        avatarEl.classList.remove("cita-mascota-avatar--perro", "cita-mascota-avatar--gato", "cita-mascota-avatar--ave", "cita-mascota-avatar--otro");
        avatarEl.classList.add(`cita-mascota-avatar--${especieInfo.clase}`);
        avatarEl.innerHTML = `<i class="fa-solid ${especieInfo.icono}"></i>`;
    }

    if (fechaCitaEl) fechaCitaEl.textContent = formatearFechaCita(proximaCita.fecha) || "28 ago 2026";
    if (horaCitaEl) horaCitaEl.textContent = proximaCita.hora || "10:30 AM";
    if (servicioCitaEl) servicioCitaEl.textContent = proximaCita.servicioNombre || "Consulta general";
    if (vetCitaEl) vetCitaEl.textContent = "—";
    if (ubicacionCitaEl) ubicacionCitaEl.textContent = proximaCita.ubicacion || "HuellaVet — Sede Centro";
}

// Colores de "badge" de raza que acompañan a cada avatar de especie.
const CLASE_BADGE_POR_ESPECIE = {
    perro: "dorado",
    gato: "azul",
    ave: "verde",
    otro: "gris"
};

// Agrega a "Mis mascotas" las mascotas que se hayan registrado a traves del
// formulario de "Agendar cita" (localStorage.citas), ademas de las que ya
// esten en la tarjeta (las de la maqueta). No duplica: si el nombre de la
// mascota ya aparece en la lista (sin importar mayus/minus), no se repite.
function cargarMisMascotas() {
    let citas = [];
    try {
        citas = JSON.parse(localStorage.getItem("citas")) || [];
    } catch (e) {
        citas = [];
    }

    const lista = document.getElementById("mascotasLista");
    if (!lista || citas.length === 0) return;

    const nombresExistentes = new Set(
        Array.from(lista.querySelectorAll(".mascota-item-nombre")).map(el => el.textContent.trim().toLowerCase())
    );

    // Una fila por mascota distinta (por nombre). citas[0] es la mas reciente
    // (agendar.js guarda con unshift), asi que la primera que encontremos
    // para cada nombre ya es la version mas actual de sus datos.
    const mascotasNuevas = [];
    const nombresVistos = new Set();

    citas.forEach(cita => {
        const nombre = (cita.nombreMascota || "").trim();
        if (!nombre) return;
        const clave = nombre.toLowerCase();
        if (nombresExistentes.has(clave) || nombresVistos.has(clave)) return;
        nombresVistos.add(clave);
        mascotasNuevas.push(cita);
    });

    if (mascotasNuevas.length === 0) return;

    mascotasNuevas.forEach(cita => {
        lista.appendChild(crearTarjetaMascota(cita));
    });

    const contadorEl = document.getElementById("mascotasContadorTexto");
    if (contadorEl) {
        const total = lista.querySelectorAll(".mascota-item-card").length;
        contadorEl.textContent = `${total} mascota${total === 1 ? "" : "s"} registrada${total === 1 ? "" : "s"}`;
    }
}

function crearTarjetaMascota(cita) {
    const especieInfo = infoPorEspecie(cita.especie);
    const claseBadge = CLASE_BADGE_POR_ESPECIE[especieInfo.clase] || "gris";
    const raza = (cita.raza || "").trim();

    const pesoValido = cita.peso && cita.peso !== "No especificado" ? cita.peso : "";
    const nacimientoValido = cita.fechaNacimiento && cita.fechaNacimiento !== "No especificada"
        ? `Nac. ${formatearFechaCita(cita.fechaNacimiento)}`
        : "";
    const detalles = [pesoValido, nacimientoValido].filter(Boolean).join(" · ") || "Sin datos adicionales registrados";

    const card = document.createElement("div");
    card.className = "mascota-item-card";
    card.innerHTML = `
        <div class="mascota-item-main">
            <div class="mascota-item-avatar mascota-item-avatar--${especieInfo.clase}">
                <i class="fa-solid ${especieInfo.icono}"></i>
            </div>
            <div class="mascota-item-info">
                <div class="mascota-item-header">
                    <span class="mascota-item-nombre">${escaparHtmlUsuario(cita.nombreMascota || "Mascota")}</span>
                    <span class="badge-mascota-raza badge-mascota-raza--${claseBadge}">${escaparHtmlUsuario(especieInfo.texto)}${raza ? ` · ${escaparHtmlUsuario(raza)}` : ""}</span>
                </div>
                <span class="mascota-item-detalles">${escaparHtmlUsuario(detalles)}</span>
                <span class="mascota-item-estado mascota-item-estado--info">
                    <i class="bi bi-dot"></i> Registrada mediante una cita
                </span>
            </div>
        </div>

        <div class="mascota-item-botones">
            <a href="#" class="btn-mascota-accion">
                <i class="bi bi-journal-text"></i>
                <span>Ver historial</span>
            </a>
            <a href="../../agendar.html" class="btn-mascota-accion">
                <i class="bi bi-calendar-plus"></i>
                <span>Agendar cita</span>
            </a>
        </div>
    `;
    return card;
}

function escaparHtmlUsuario(valor) {
    const div = document.createElement("div");
    div.textContent = String(valor ?? "");
    return div.innerHTML;
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
