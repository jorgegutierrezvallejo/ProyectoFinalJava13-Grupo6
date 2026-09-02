document.addEventListener("DOMContentLoaded", function () {
    iniciarPaginaMascotas();
});

// ========================================
// Datos base (semilla) + fusion con citas
// ========================================

const FOTO_LUNA = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop&q=70";
const FOTO_MAX = "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&h=400&fit=crop&q=70";

// Semilla inicial de "Mis mascotas": solo se escribe en localStorage.mascotas
// la primera vez (si el usuario edita/elimina despues, eso se respeta en
// las siguientes cargas en vez de reescribirse siempre).
const MASCOTAS_SEMILLA = [
    {
        id: "PET-000245",
        nombre: "Luna",
        especie: "gato",
        raza: "Siamés",
        edad: "3 años",
        peso: "4.2 kg",
        sexo: "Hembra",
        color: "Crema con puntos marrón oscuro",
        fechaNacimiento: "2023-06-15",
        esterilizada: true,
        microchip: "985141004321098",
        alergias: "Ninguna conocida",
        observaciones: "Muy juguetona y cariñosa. Se estresa con ruidos fuertes.",
        foto: FOTO_LUNA,
        vacunasAlDia: true
    },
    {
        id: "PET-000246",
        nombre: "Max",
        especie: "perro",
        raza: "Criollo",
        edad: "5 años",
        peso: "18 kg",
        sexo: "Macho",
        color: "Café con blanco",
        fechaNacimiento: "2021-03-02",
        esterilizada: false,
        microchip: "985141004322045",
        alergias: "Ninguna conocida",
        observaciones: "Muy activo, disfruta pasear largas distancias.",
        foto: FOTO_MAX,
        vacunasAlDia: false
    }
];

// Recordatorios de referencia (los mismos 3 que se muestran en el Resumen,
// hoy no hay un origen de datos dinamico para recordatorios todavia).
const RECORDATORIOS_REFERENCIA = [
    { titulo: "Vacuna antirrábica", mascota: "luna", fecha: "Vence: 28 ago", badge: "Por vencer", claseBadge: "lila", icono: "bi-calendar-check" },
    { titulo: "Control de peso", mascota: "max", fecha: "5 sept", badge: "Programado", claseBadge: "verde", icono: "bi-heart-pulse" },
    { titulo: "Desparasitación", mascota: "luna", fecha: "12 sept", badge: "Pendiente", claseBadge: "naranja", icono: "bi-capsule" }
];

let mascotaSeleccionadaId = null;
let filtroActivo = "todas";
let textoBusqueda = "";

function iniciarPaginaMascotas() {
    asegurarSemillaMascotas();

    const filtros = document.getElementById("mascotasFiltros");
    if (filtros) {
        filtros.querySelectorAll(".mascotas-filtro-chip").forEach(chip => {
            chip.addEventListener("click", function () {
                filtros.querySelectorAll(".mascotas-filtro-chip").forEach(c => c.classList.remove("mascotas-filtro-chip--activo"));
                chip.classList.add("mascotas-filtro-chip--activo");
                filtroActivo = chip.dataset.filtro;
                renderizarListaMascotas();
            });
        });
    }

    const buscador = document.getElementById("buscadorMascotas");
    if (buscador) {
        buscador.addEventListener("input", function () {
            textoBusqueda = buscador.value.trim().toLowerCase();
            renderizarListaMascotas();
        });
    }

    const btnAgregar = document.getElementById("btnAgregarMascota");
    if (btnAgregar) {
        btnAgregar.addEventListener("click", function () {
            window.location.href = "agregar-mascota.html";
        });
    }

    renderizarListaMascotas();
}

// Si localStorage.mascotas no existe todavia, la crea con la semilla.
// Si ya existe (el usuario ya interactuo con la pagina antes), no la toca.
function asegurarSemillaMascotas() {
    const usuarioActivo = obtenerUsuarioRegistrado();
    if (!usuarioActivo || obtenerMascotasPorUsuarioId(usuarioActivo.id).length > 0) return;

    MASCOTAS_SEMILLA.forEach(mascota => {
        guardarMascota({
            ...mascota,
            id: crypto.randomUUID(),
            usuarioId: usuarioActivo.id
        });
    });
}

function obtenerMascotasGuardadas() {
    const usuarioActivo = obtenerUsuarioRegistrado();
    return usuarioActivo ? obtenerMascotasPorUsuarioId(usuarioActivo.id) : [];
}

// La pagina consume unicamente el repositorio de Mascotas. La sincronizacion
// desde otros flujos ocurre al guardar esos flujos, no dentro de esta vista.
function obtenerMascotasCombinadas() {
    return obtenerMascotasGuardadas();
}

// ========================================
// Especie: icono + color + capitalizacion
// (mismo criterio usado en el Resumen de usuario)
// ========================================

function infoPorEspecie(especieCruda) {
    const clave = String(especieCruda || "").trim().toLowerCase();
    const mapa = {
        perro: { icono: "fa-dog", clase: "perro", texto: "Perro" },
        gato: { icono: "fa-cat", clase: "gato", texto: "Gato" },
        ave: { icono: "fa-dove", clase: "ave", texto: "Ave" }
    };
    if (mapa[clave]) return mapa[clave];
    return { icono: "fa-paw", clase: "otro", texto: capitalizarPrimera(especieCruda) || "Mascota" };
}

function capitalizarPrimera(texto) {
    const limpio = String(texto || "").trim();
    if (!limpio) return "";
    return limpio.charAt(0).toUpperCase() + limpio.slice(1).toLowerCase();
}

function escaparHtmlMascotas(valor) {
    const div = document.createElement("div");
    div.textContent = String(valor ?? "");
    return div.innerHTML;
}

function formatearFechaMascota(fechaISO) {
    if (!fechaISO) return "";
    try {
        const [anio, mes, dia] = fechaISO.split("-").map(Number);
        const fecha = new Date(anio, mes - 1, dia);
        return new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long", year: "numeric" }).format(fecha);
    } catch (e) {
        return fechaISO;
    }
}

// ========================================
// Columna izquierda: lista de mascotas
// ========================================

function renderizarListaMascotas() {
    const contenedor = document.getElementById("mascotasListaPerfil");
    const contador = document.getElementById("mascotasContadorLista");
    if (!contenedor) return;

    const todas = obtenerMascotasCombinadas();

    const filtradas = todas.filter(m => {
        const especie = infoPorEspecie(m.especie).clase;
        const pasaFiltro = filtroActivo === "todas" || especie === filtroActivo;
        const pasaBusqueda = !textoBusqueda || (m.nombre || "").toLowerCase().includes(textoBusqueda);
        return pasaFiltro && pasaBusqueda;
    });

    if (contador) {
        contador.textContent = `Mostrando ${filtradas.length} de ${todas.length} mascota${todas.length === 1 ? "" : "s"}`;
    }

    contenedor.innerHTML = "";

    if (todas.length === 0) {
        contenedor.innerHTML = `
            <div class="mascotas-vacio">
                <div class="mascotas-vacio__icono"><i class="bi bi-heart"></i></div>
                <div class="mascotas-vacio__contenido">
                    <strong>Todavía no tienes mascotas registradas</strong>
                    <p>Agrega una mascota o agenda una cita para verla aquí.</p>
                </div>
            </div>
        `;
        return;
    }

    if (filtradas.length === 0) {
        contenedor.innerHTML = `
            <div class="mascotas-vacio">
                <div class="mascotas-vacio__icono"><i class="bi bi-search"></i></div>
                <div class="mascotas-vacio__contenido">
                    <strong>Sin resultados</strong>
                    <p>Ninguna mascota coincide con el filtro o la búsqueda.</p>
                </div>
            </div>
        `;
        return;
    }

    // Si no hay ninguna seleccionada todavia (o la seleccionada ya no esta
    // en el listado filtrado), selecciona la primera visible.
    if (!mascotaSeleccionadaId || !filtradas.some(m => claveMascota(m) === mascotaSeleccionadaId)) {
        mascotaSeleccionadaId = claveMascota(filtradas[0]);
    }

    filtradas.forEach(mascota => {
        contenedor.appendChild(crearTarjetaListaMascota(mascota));
    });

    renderizarDetalleMascota();
}

function claveMascota(mascota) {
    return mascota.id || `nombre:${(mascota.nombre || "").toLowerCase()}`;
}

function crearTarjetaListaMascota(mascota) {
    const especieInfo = infoPorEspecie(mascota.especie);
    const activa = claveMascota(mascota) === mascotaSeleccionadaId;

    const avatarHtml = mascota.foto
        ? `<img class="mascota-lista-card__avatar" src="${escaparHtmlMascotas(mascota.foto)}" alt="${escaparHtmlMascotas(mascota.nombre)}">`
        : `<div class="mascota-lista-card__avatar mascota-lista-card__avatar--icono mascota-lista-card__avatar--${especieInfo.clase}"><i class="fa-solid ${especieInfo.icono}"></i></div>`;

    const detalles = [mascota.edad, mascota.peso].filter(Boolean).join(" · ") || "Sin datos adicionales";

    let estadoHtml = `<span class="mascota-lista-card__estado mascota-lista-card__estado--info"><i class="bi bi-dot"></i> Registrada mediante una cita</span>`;
    if (mascota.vacunasAlDia === true) {
        estadoHtml = `<span class="mascota-lista-card__estado mascota-lista-card__estado--ok"><i class="bi bi-check-circle-fill"></i> Vacunas al día</span>`;
    } else if (mascota.vacunasAlDia === false) {
        estadoHtml = `<span class="mascota-lista-card__estado mascota-lista-card__estado--aviso"><i class="bi bi-exclamation-circle-fill"></i> Cita próxima</span>`;
    }

    const card = document.createElement("button");
    card.type = "button";
    card.className = `mascota-lista-card${activa ? " mascota-lista-card--activa" : ""}`;
    card.dataset.clave = claveMascota(mascota);
    card.innerHTML = `
        <div class="mascota-lista-card__fila">
            ${avatarHtml}
            <div class="mascota-lista-card__info">
                <div class="mascota-lista-card__nombre-fila">
                    <span class="mascota-lista-card__nombre">${escaparHtmlMascotas(mascota.nombre)}</span>
                    <span class="badge-mascota-raza badge-mascota-raza--${especieInfo.clase === "gato" ? "azul" : especieInfo.clase === "perro" ? "dorado" : especieInfo.clase === "ave" ? "verde" : "gris"}">${escaparHtmlMascotas(especieInfo.texto)}${mascota.raza ? ` · ${escaparHtmlMascotas(mascota.raza)}` : ""}</span>
                </div>
                <span class="mascota-lista-card__detalles">${escaparHtmlMascotas(detalles)}</span>
                ${estadoHtml}
            </div>
            <i class="bi bi-chevron-right mascota-lista-card__flecha"></i>
        </div>
    `;

    card.addEventListener("click", function () {
        mascotaSeleccionadaId = claveMascota(mascota);
        document.querySelectorAll(".mascota-lista-card").forEach(c => c.classList.remove("mascota-lista-card--activa"));
        card.classList.add("mascota-lista-card--activa");
        renderizarDetalleMascota();
    });

    return card;
}

// ========================================
// Columna derecha: detalle de la mascota
// ========================================

function renderizarDetalleMascota() {
    const columna = document.getElementById("mascotasColumnaDetalle");
    if (!columna) return;

    const todas = obtenerMascotasCombinadas();
    const mascota = todas.find(m => claveMascota(m) === mascotaSeleccionadaId);

    if (!mascota) {
        columna.innerHTML = `
            <div class="mascotas-vacio">
                <div class="mascotas-vacio__icono"><i class="bi bi-heart"></i></div>
                <div class="mascotas-vacio__contenido">
                    <strong>Selecciona una mascota</strong>
                    <p>Elige una mascota de la lista para ver su perfil completo.</p>
                </div>
            </div>
        `;
        return;
    }

    const especieInfo = infoPorEspecie(mascota.especie);

    const avatarHtml = mascota.foto
        ? `<img class="mascota-detalle-avatar" src="${escaparHtmlMascotas(mascota.foto)}" alt="${escaparHtmlMascotas(mascota.nombre)}">`
        : `<div class="mascota-detalle-avatar mascota-detalle-avatar--icono mascota-detalle-avatar--${especieInfo.clase}"><i class="fa-solid ${especieInfo.icono}"></i></div>`;

    let estadoBadgeHtml = "";
    if (mascota.vacunasAlDia === true) {
        estadoBadgeHtml = `<span class="mascota-detalle-estado-badge mascota-detalle-estado-badge--ok"><i class="bi bi-check-circle-fill"></i> Vacunas al día</span>`;
    } else if (mascota.vacunasAlDia === false) {
        estadoBadgeHtml = `<span class="mascota-detalle-estado-badge mascota-detalle-estado-badge--aviso"><i class="bi bi-exclamation-circle-fill"></i> Cita próxima</span>`;
    }

    const noEspecificado = "No especificado";
    const campoEdad = mascota.edad || noEspecificado;
    const campoPeso = mascota.peso || noEspecificado;
    const campoSexo = mascota.sexo || noEspecificado;
    const campoColor = mascota.color || noEspecificado;
    const campoNacimiento = mascota.fechaNacimiento ? formatearFechaMascota(mascota.fechaNacimiento) : noEspecificado;
    const campoEsterilizacion = mascota.esterilizada === true ? "Sí" : mascota.esterilizada === false ? "No" : noEspecificado;
    const campoMicrochip = mascota.microchip || noEspecificado;
    const campoAlergias = mascota.alergias || noEspecificado;

    const idTexto = mascota.id ? `ID: ${escaparHtmlMascotas(mascota.id)}` : "Registrada mediante una cita";

    columna.innerHTML = `
        <div class="mascota-detalle-card">
            <div class="mascota-detalle-header">
                <div class="mascota-detalle-avatar-wrap">
                    ${avatarHtml}
                    <button type="button" class="mascota-detalle-avatar-editar" id="btnCambiarFotoMascota" aria-label="Cambiar foto"><i class="bi bi-camera-fill"></i></button>
                </div>
                <div class="mascota-detalle-titulo">
                    <div class="mascota-detalle-nombre-fila">
                        <h2>${escaparHtmlMascotas(mascota.nombre)}</h2>
                        <span class="badge-mascota-raza badge-mascota-raza--${especieInfo.clase === "gato" ? "azul" : especieInfo.clase === "perro" ? "dorado" : especieInfo.clase === "ave" ? "verde" : "gris"}">${escaparHtmlMascotas(especieInfo.texto)}${mascota.raza ? ` · ${escaparHtmlMascotas(mascota.raza)}` : ""}</span>
                    </div>
                    <span class="mascota-detalle-id">${idTexto}</span>
                </div>
                <div class="mascota-detalle-header-derecha">
                    ${estadoBadgeHtml}
                    <button type="button" class="mascota-detalle-menu" id="btnMenuMascota" aria-label="Más opciones"><i class="bi bi-three-dots-vertical"></i></button>
                </div>
            </div>

            <div class="mascota-detalle-grid">
                <div class="mascota-detalle-campo"><i class="fa-solid ${especieInfo.icono}"></i><div class="mascota-detalle-campo-texto"><span>Especie</span><strong>${escaparHtmlMascotas(especieInfo.texto)}</strong></div></div>
                <div class="mascota-detalle-campo"><i class="bi bi-palette"></i><div class="mascota-detalle-campo-texto"><span>Color</span><strong>${escaparHtmlMascotas(campoColor)}</strong></div></div>

                <div class="mascota-detalle-campo"><i class="bi bi-tag"></i><div class="mascota-detalle-campo-texto"><span>Raza</span><strong>${escaparHtmlMascotas(mascota.raza || noEspecificado)}</strong></div></div>
                <div class="mascota-detalle-campo"><i class="bi bi-calendar-heart"></i><div class="mascota-detalle-campo-texto"><span>Fecha de nacimiento</span><strong>${escaparHtmlMascotas(campoNacimiento)}</strong></div></div>

                <div class="mascota-detalle-campo"><i class="bi bi-hourglass-split"></i><div class="mascota-detalle-campo-texto"><span>Edad</span><strong>${escaparHtmlMascotas(campoEdad)}</strong></div></div>
                <div class="mascota-detalle-campo"><i class="bi bi-scissors"></i><div class="mascota-detalle-campo-texto"><span>Esterilización</span><strong>${escaparHtmlMascotas(campoEsterilizacion)}</strong></div></div>

                <div class="mascota-detalle-campo"><i class="bi bi-speedometer2"></i><div class="mascota-detalle-campo-texto"><span>Peso</span><strong>${escaparHtmlMascotas(campoPeso)}</strong></div></div>
                <div class="mascota-detalle-campo"><i class="bi bi-upc-scan"></i><div class="mascota-detalle-campo-texto"><span>Microchip</span><strong>${escaparHtmlMascotas(campoMicrochip)}</strong></div></div>

                <div class="mascota-detalle-campo"><i class="bi bi-gender-ambiguous"></i><div class="mascota-detalle-campo-texto"><span>Sexo</span><strong>${escaparHtmlMascotas(campoSexo)}</strong></div></div>
                <div class="mascota-detalle-campo"><i class="bi bi-exclamation-triangle"></i><div class="mascota-detalle-campo-texto"><span>Alergias</span><strong>${escaparHtmlMascotas(campoAlergias)}</strong></div></div>
            </div>

            <div class="mascota-detalle-observaciones">
                <span>Observaciones</span>
                <p>${escaparHtmlMascotas(mascota.observaciones || "Sin observaciones registradas.")}</p>
            </div>

            <div class="mascota-detalle-subcards">
                ${crearSubcardProximaCita(mascota)}
                ${crearSubcardRecordatorios(mascota)}
            </div>

            <div class="mascota-detalle-acciones">
                <button type="button" id="btnEditarPerfilMascota"><i class="bi bi-pencil"></i> Editar perfil</button>
                <button type="button" id="btnVerHistorialMascota"><i class="bi bi-journal-text"></i> Ver historial</button>
                <a href="../../agendar.html" class="mascota-detalle-acciones__agendar"><i class="bi bi-calendar-plus"></i> Agendar cita</a>
                <button type="button" class="mascota-detalle-acciones__eliminar" id="btnEliminarPerfilMascota"><i class="bi bi-trash"></i> Eliminar perfil</button>
            </div>
        </div>
    `;

    iniciarBotonesDetalleMascota(mascota);
}

function crearSubcardProximaCita(mascota) {
    const cita = obtenerProximaCitaPorMascotaId(mascota.id);

    if (!cita) {
        return `
            <div class="mascota-detalle-subcard">
                <div class="mascota-detalle-subcard__header"><i class="bi bi-calendar-event"></i><strong>Próxima cita</strong></div>
                <p class="mascota-cita-mini--vacio">Sin citas próximas para ${escaparHtmlMascotas(mascota.nombre)}.</p>
            </div>
        `;
    }

    return `
        <div class="mascota-detalle-subcard">
            <div class="mascota-detalle-subcard__header"><i class="bi bi-calendar-event"></i><strong>Próxima cita</strong></div>
            <div class="mascota-cita-mini">
                <div class="mascota-cita-mini__servicio">${escaparHtmlMascotas(cita.servicioNombre || "Consulta general")} <span class="mascota-cita-mini__badge">${escaparHtmlMascotas(cita.estado || "Pendiente")}</span></div>
                <span class="mascota-cita-mini__detalle">${escaparHtmlMascotas(cita.fecha || "")} · ${escaparHtmlMascotas(cita.hora || "")}</span>
            </div>
            <button type="button" class="mascota-cita-mini__boton" id="btnVerDetalleCitaMascota">Ver detalle</button>
        </div>
    `;
}

// Recomendaciones reales que el veterinario dejo al finalizar una cita
// (cita.recordatorio, ver admin/js/admin-citas.js -> abrirFormularioRecordatorio),
// para esta mascota. Se combinan con RECORDATORIOS_REFERENCIA y se muestran
// primero, porque son las que sí vienen de una cita real y no de la semilla.
function recordatoriosRealesDeMascota(mascota) {
    return obtenerCitasConRecordatorioPorMascotaId(mascota.id)
        .map(cita => ({
            titulo: cita.recordatorio.texto,
            fecha: cita.recordatorio.fecha ? `Sugerida: ${formatearFechaMascota(cita.recordatorio.fecha)}` : `De tu visita del ${formatearFechaMascota(cita.fecha)}`,
            badge: "Del veterinario",
            claseBadge: "verde",
            icono: "bi-clipboard2-pulse",
            esReal: true
        }));
}

function crearSubcardRecordatorios(mascota) {
    const reales = recordatoriosRealesDeMascota(mascota);
    const referencia = RECORDATORIOS_REFERENCIA.filter(r => r.mascota === (mascota.nombre || "").trim().toLowerCase());
    const items = reales.concat(referencia);

    if (items.length === 0) {
        return `
            <div class="mascota-detalle-subcard">
                <div class="mascota-detalle-subcard__header"><i class="bi bi-bell"></i><strong>Recordatorios</strong></div>
                <p class="mascota-detalle-recordatorios--vacio">Sin recordatorios pendientes.</p>
            </div>
        `;
    }

    const filas = items.map(r => `
        <div class="mascota-recordatorio-item">
            <div class="mascota-recordatorio-item__texto">
                <span class="mascota-recordatorio-item__titulo">${escaparHtmlMascotas(r.titulo)}</span>
                <span class="mascota-recordatorio-item__fecha">${escaparHtmlMascotas(r.fecha)}</span>
            </div>
            <span class="mascota-recordatorio-item__badge mascota-recordatorio-item__badge--${r.claseBadge}">${escaparHtmlMascotas(r.badge)}</span>
        </div>
    `).join("");

    return `
        <div class="mascota-detalle-subcard">
            <div class="mascota-detalle-subcard__header"><i class="bi bi-bell"></i><strong>Recordatorios</strong><a href="#">Ver todos</a></div>
            ${filas}
        </div>
    `;
}

function iniciarBotonesDetalleMascota(mascota) {
    const btnEditar = document.getElementById("btnEditarPerfilMascota");
    const btnHistorial = document.getElementById("btnVerHistorialMascota");
    const btnEliminar = document.getElementById("btnEliminarPerfilMascota");
    const btnCambiarFoto = document.getElementById("btnCambiarFotoMascota");
    const btnMenu = document.getElementById("btnMenuMascota");
    const btnVerCita = document.getElementById("btnVerDetalleCitaMascota");

    const avisoProximamente = (titulo) => {
        if (typeof Swal !== "undefined") {
            Swal.fire({ icon: "info", title: titulo, text: "Esta función estará disponible pronto.", confirmButtonColor: "#17a9a7" });
        } else {
            alert(titulo + ": disponible pronto.");
        }
    };

    if (btnEditar) btnEditar.addEventListener("click", () => avisoProximamente("Editar perfil"));
    if (btnHistorial) btnHistorial.addEventListener("click", () => avisoProximamente("Ver historial"));
    if (btnCambiarFoto) btnCambiarFoto.addEventListener("click", () => avisoProximamente("Cambiar foto"));
    if (btnMenu) btnMenu.addEventListener("click", () => avisoProximamente("Más opciones"));
    if (btnVerCita) btnVerCita.addEventListener("click", () => { window.location.href = "user-citas.html"; });

    if (btnEliminar) {
        btnEliminar.addEventListener("click", function () {
            if (typeof Swal === "undefined") return;
            Swal.fire({
                icon: "warning",
                title: `¿Eliminar el perfil de ${mascota.nombre}?`,
                text: "Esta acción no se puede deshacer.",
                showCancelButton: true,
                confirmButtonText: "Sí, eliminar",
                cancelButtonText: "Cancelar",
                confirmButtonColor: "#e53e3e",
                cancelButtonColor: "#6c757d"
            }).then(resultado => {
                if (!resultado.isConfirmed) return;

                if (mascota.id) {
                    eliminarMascota(mascota.id);
                }

                mascotaSeleccionadaId = null;
                renderizarListaMascotas();

                Swal.fire({
                    icon: "success",
                    title: "Perfil eliminado",
                    confirmButtonColor: "#17a9a7"
                });
            });
        });
    }
}
