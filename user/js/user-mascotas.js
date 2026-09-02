document.addEventListener("DOMContentLoaded", function () {
    iniciarPaginaMascotas();
});

let mascotaSeleccionadaId = null;
let textoBusqueda = "";

function iniciarPaginaMascotas() {
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

function calcularEdadMascota(fechaISO) {
    if (!fechaISO) return "";
    const partes = String(fechaISO).split("-").map(Number);
    if (partes.length !== 3 || partes.some(numero => !Number.isFinite(numero))) return "";

    const [anio, mes, dia] = partes;
    const nacimiento = new Date(anio, mes - 1, dia);
    const hoy = new Date();
    if (Number.isNaN(nacimiento.getTime()) || nacimiento > hoy) return "";

    let anios = hoy.getFullYear() - nacimiento.getFullYear();
    let meses = hoy.getMonth() - nacimiento.getMonth();
    if (hoy.getDate() < nacimiento.getDate()) meses--;
    if (meses < 0) {
        anios--;
        meses += 12;
    }

    if (anios > 0) return `${anios} año${anios === 1 ? "" : "s"}`;
    if (meses > 0) return `${meses} mes${meses === 1 ? "" : "es"}`;

    const dias = Math.max(0, Math.floor((hoy - nacimiento) / 86400000));
    return `${dias} día${dias === 1 ? "" : "s"}`;
}

// ========================================
// Columna izquierda: lista de mascotas
// ========================================

function renderizarListaMascotas() {
    const contenedor = document.getElementById("mascotasListaPerfil");
    const contador = document.getElementById("mascotasContadorLista");
    if (!contenedor) return;

    const todas = obtenerMascotasCombinadas();

    const filtradas = todas.filter(m =>
        !textoBusqueda || (m.nombre || "").toLowerCase().includes(textoBusqueda)
    );

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
                    <p>Ninguna mascota coincide con la búsqueda.</p>
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
        ? `<img class="mascota-lista-card__avatar" src="${escaparHtmlMascotas(resolverRutaRecursoHuellaVet(mascota.foto))}" alt="${escaparHtmlMascotas(mascota.nombre)}">`
        : `<div class="mascota-lista-card__avatar mascota-lista-card__avatar--icono mascota-lista-card__avatar--${especieInfo.clase}"><i class="fa-solid ${especieInfo.icono}"></i></div>`;

    const edadCalculada = calcularEdadMascota(mascota.fechaNacimiento) || mascota.edad || "";
    const detalles = [edadCalculada, mascota.peso].filter(Boolean).join(" · ") || "Sin datos adicionales";

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
        ? `<img class="mascota-detalle-avatar" src="${escaparHtmlMascotas(resolverRutaRecursoHuellaVet(mascota.foto))}" alt="${escaparHtmlMascotas(mascota.nombre)}">`
        : `<div class="mascota-detalle-avatar mascota-detalle-avatar--icono mascota-detalle-avatar--${especieInfo.clase}"><i class="fa-solid ${especieInfo.icono}"></i></div>`;

    let estadoBadgeHtml = "";
    if (mascota.vacunasAlDia === true) {
        estadoBadgeHtml = `<span class="mascota-detalle-estado-badge mascota-detalle-estado-badge--ok"><i class="bi bi-check-circle-fill"></i> Vacunas al día</span>`;
    } else if (mascota.vacunasAlDia === false) {
        estadoBadgeHtml = `<span class="mascota-detalle-estado-badge mascota-detalle-estado-badge--aviso"><i class="bi bi-exclamation-circle-fill"></i> Cita próxima</span>`;
    }

    const noEspecificado = "No especificado";
    const campoEdad = calcularEdadMascota(mascota.fechaNacimiento) || mascota.edad || noEspecificado;
    const campoPeso = mascota.peso || noEspecificado;
    const campoSexo = mascota.sexo || noEspecificado;
    const campoColor = mascota.color || noEspecificado;
    const campoNacimiento = mascota.fechaNacimiento ? formatearFechaMascota(mascota.fechaNacimiento) : noEspecificado;
    const campoEsterilizacion = mascota.esterilizada === true ? "Sí" : mascota.esterilizada === false ? "No" : noEspecificado;
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
                    <div class="mascota-detalle-menu-wrap">
                        <button type="button" class="mascota-detalle-menu" id="btnMenuMascota" aria-label="Más opciones" aria-expanded="false" aria-controls="menuOpcionesMascota"><i class="bi bi-three-dots-vertical"></i></button>
                        <div class="mascota-detalle-menu-opciones" id="menuOpcionesMascota" hidden>
                            <button type="button" id="btnEditarPerfilMascota"><i class="bi bi-pencil"></i> Editar perfil</button>
                            <button type="button" class="mascota-detalle-menu-opciones__eliminar" id="btnEliminarPerfilMascota"><i class="bi bi-trash"></i> Eliminar perfil</button>
                        </div>
                    </div>
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
                <button type="button" id="btnVerHistorialMascota"><i class="bi bi-journal-text"></i> Ver historial</button>
                <a href="#" class="mascota-detalle-acciones__agendar" data-abrir-agendar-cita data-mascota-id="${escaparHtmlMascotas(mascota.id || "")}"><i class="bi bi-calendar-plus"></i> Agendar cita</a>
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

const CLASE_ESTADO_CITA_MASCOTA = {
    "Pendiente": "pendiente",
    "Confirmada": "confirmada",
    "En curso": "en-curso",
    "Completada": "completada",
    "Reprogramada": "reprogramada",
    "Cancelada": "cancelada",
    "Rechazada": "rechazada"
};

function abrirDetalleCitaMascota(mascota) {
    const cita = obtenerProximaCitaPorMascotaId(mascota.id);
    const modalElemento = document.getElementById("modalDetalleCitaMascota");
    const contenido = document.getElementById("modalDetalleCitaMascotaContenido");
    if (!cita || !modalElemento || !contenido || typeof bootstrap === "undefined") return;

    const especieInfo = infoPorEspecie(cita.especie || mascota.especie);
    const foto = cita.fotoMascota || mascota.foto || "";
    const avatar = foto
        ? `<img class="mascota-cita-modal__avatar" src="${escaparHtmlMascotas(resolverRutaRecursoHuellaVet(foto))}" alt="${escaparHtmlMascotas(cita.nombreMascota || mascota.nombre)}">`
        : `<div class="mascota-cita-modal__avatar mascota-cita-modal__avatar--icono mascota-cita-modal__avatar--${especieInfo.clase}"><i class="fa-solid ${especieInfo.icono}"></i></div>`;
    const nombreMascota = cita.nombreMascota || mascota.nombre || "Mascota";
    const especieRaza = [especieInfo.texto, cita.raza || mascota.raza].filter(Boolean).join(" • ") || "Sin datos registrados";
    const modalidad = cita.ubicacion || (cita.modalidad === "domicilio" ? "Servicio a domicilio" : "En clínica");
    const estado = cita.estado || "Pendiente";
    const claseEstado = CLASE_ESTADO_CITA_MASCOTA[estado] || "pendiente";
    const observaciones = cita.motivo || "Sin observaciones registradas.";

    contenido.innerHTML = `
        <div class="mascota-cita-modal__perfil">
            ${avatar}
            <h3>${escaparHtmlMascotas(nombreMascota)}</h3>
            <span>ID: ${escaparHtmlMascotas(cita.id || "Sin asignar")}</span>
        </div>

        <div class="mascota-cita-modal__datos">
            ${crearFilaDetalleCitaMascota("bi-heart", "Mascota", nombreMascota, especieRaza)}
            ${crearFilaDetalleCitaMascota("bi-person-badge", "Veterinario", cita.veterinario || "Por asignar")}
            ${crearFilaDetalleCitaMascota("bi-shield-plus", "Servicio", cita.servicioNombre || "Consulta general", modalidad)}
            ${crearFilaDetalleCitaMascota("bi-calendar3", "Fecha", fechaISOaTextoLargo(cita.fecha))}
            ${crearFilaDetalleCitaMascota("bi-clock", "Hora", cita.hora || "Hora no definida")}
            <div class="mascota-cita-modal__fila">
                <i class="bi bi-check-circle"></i>
                <span class="mascota-cita-modal__etiqueta">Estado</span>
                <span class="mascota-cita-modal__estado mascota-cita-modal__estado--${claseEstado}">${escaparHtmlMascotas(estado)}</span>
            </div>
            ${crearFilaDetalleCitaMascota("bi-chat-left-text", "Observaciones", observaciones)}
        </div>

        <div class="mascota-cita-modal__acciones">
            <button type="button" class="mascota-cita-modal__boton mascota-cita-modal__boton--editar" id="btnEditarCitaDesdeMascota">
                <i class="bi bi-pencil"></i> Editar
            </button>
            <button type="button" class="mascota-cita-modal__boton mascota-cita-modal__boton--reprogramar" id="btnReprogramarCitaDesdeMascota">
                <i class="bi bi-calendar"></i> Reprogramar
            </button>
            <button type="button" class="mascota-cita-modal__boton mascota-cita-modal__boton--cancelar" id="btnCancelarCitaDesdeMascota">
                <i class="bi bi-x-circle"></i> Cancelar
            </button>
        </div>
    `;

    const modal = bootstrap.Modal.getOrCreateInstance(modalElemento);
    iniciarAccionesModalCitaMascota(cita, mascota, modal);
    modal.show();
}

function crearFilaDetalleCitaMascota(icono, etiqueta, valor, detalle = "") {
    return `
        <div class="mascota-cita-modal__fila">
            <i class="bi ${icono}"></i>
            <span class="mascota-cita-modal__etiqueta">${escaparHtmlMascotas(etiqueta)}</span>
            <span class="mascota-cita-modal__valor">
                ${escaparHtmlMascotas(valor)}
                ${detalle ? `<small>${escaparHtmlMascotas(detalle)}</small>` : ""}
            </span>
        </div>
    `;
}

function iniciarAccionesModalCitaMascota(cita, mascota, modal) {
    document.getElementById("btnEditarCitaDesdeMascota")?.addEventListener("click", function () {
        modal.hide();
        if (typeof Swal !== "undefined") {
            Swal.fire({
                icon: "info",
                title: "Editar cita",
                text: "La edición de los datos de la cita estará disponible pronto.",
                confirmButtonColor: "#17a9a7"
            });
        }
    });

    document.getElementById("btnReprogramarCitaDesdeMascota")?.addEventListener("click", function () {
        modal.hide();
        solicitarCambioCitaDesdeMascota(cita, mascota, "Reprogramada", {
            titulo: "¿Solicitar reprogramación?",
            texto: "La clínica revisará tu solicitud para acordar una nueva fecha y hora.",
            placeholder: "Indica el motivo de la reprogramación...",
            confirmar: "Sí, solicitar",
            color: "#17a9a7"
        });
    });

    document.getElementById("btnCancelarCitaDesdeMascota")?.addEventListener("click", function () {
        modal.hide();
        solicitarCambioCitaDesdeMascota(cita, mascota, "Cancelada", {
            titulo: "¿Cancelar esta cita?",
            texto: "Esta acción no se puede deshacer.",
            placeholder: "Indica el motivo de la cancelación...",
            confirmar: "Sí, cancelar",
            color: "#e53935"
        });
    });
}

function solicitarCambioCitaDesdeMascota(cita, mascota, nuevoEstado, opciones) {
    if (typeof Swal === "undefined") return;

    Swal.fire({
        icon: "warning",
        title: opciones.titulo,
        html: `
            <p class="text-start small text-muted">${escaparHtmlMascotas(opciones.texto)}</p>
            <textarea id="motivoCambioCitaMascota" class="swal2-textarea m-0 w-100" placeholder="${escaparHtmlMascotas(opciones.placeholder)}"></textarea>
        `,
        showCancelButton: true,
        confirmButtonText: opciones.confirmar,
        cancelButtonText: "Volver",
        confirmButtonColor: opciones.color,
        cancelButtonColor: "#6c757d",
        focusConfirm: false,
        preConfirm: () => {
            const motivo = document.getElementById("motivoCambioCitaMascota")?.value.trim() || "";
            if (!motivo) {
                Swal.showValidationMessage("Escribe el motivo.");
                return false;
            }
            return motivo;
        }
    }).then(resultado => {
        if (!resultado.isConfirmed) return;
        actualizarCamposCita(cita.id, { estado: nuevoEstado, motivoEstado: resultado.value });
        renderizarDetalleMascota();
        Swal.fire({
            icon: "success",
            title: nuevoEstado === "Cancelada" ? "Cita cancelada" : "Solicitud enviada",
            confirmButtonColor: "#17a9a7"
        });
    });
}

// Recomendaciones reales que el veterinario dejo al finalizar una cita
// (cita.recordatorio, ver admin/js/admin-citas.js -> abrirFormularioRecordatorio),
// para esta mascota.
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
    const items = reales;

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
    const menuOpciones = document.getElementById("menuOpcionesMascota");
    const btnVerCita = document.getElementById("btnVerDetalleCitaMascota");

    const avisoProximamente = (titulo) => {
        if (typeof Swal !== "undefined") {
            Swal.fire({ icon: "info", title: titulo, text: "Esta función estará disponible pronto.", confirmButtonColor: "#17a9a7" });
        } else {
            alert(titulo + ": disponible pronto.");
        }
    };

    if (btnEditar) btnEditar.addEventListener("click", () => {
        window.location.href = `agregar-mascota.html?mascotaId=${encodeURIComponent(mascota.id || "")}`;
    });
    if (btnHistorial) btnHistorial.addEventListener("click", () => avisoProximamente("Ver historial"));
    if (btnCambiarFoto) btnCambiarFoto.addEventListener("click", () => avisoProximamente("Cambiar foto"));
    if (btnMenu && menuOpciones) {
        btnMenu.addEventListener("click", function (evento) {
            evento.stopPropagation();
            const abrir = menuOpciones.hidden;
            menuOpciones.hidden = !abrir;
            btnMenu.setAttribute("aria-expanded", String(abrir));

            if (abrir) {
                document.addEventListener("click", function cerrarMenu() {
                    menuOpciones.hidden = true;
                    btnMenu.setAttribute("aria-expanded", "false");
                }, { once: true });
            }
        });
    }
    if (btnVerCita) btnVerCita.addEventListener("click", () => abrirDetalleCitaMascota(mascota));

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
