/* ========================================
   MIS CITAS (usuario)
   - Panel "Proxima Cita": usa las funciones de
     js/shared/citas-storage.js para
     mostrar la cita mas cercana y permitir que
     el propietario reprograme/cancele (con
     motivo obligatorio) y suba el comprobante
     del abono, ademas de ver la recomendacion
     que el veterinario dejo al finalizar la cita.
   - Alerta superior: refleja el estado de la
     cita mas recientemente actualizada (de
     cualquier estado), no solo "confirmada".
   - Listado de citas: mismo lenguaje visual que
     la Agenda de hoy de admin-citas.html (franja
     de color + avatar con foto real o icono de
     la especie), con pestañas Próximas/
     Pendientes/Historial.

   Mismos ids/clases que el panel de admin
   (admin/js/admin-citas.js), con el prefijo
   "userPanel" en vez de "panel".
======================================== */

// Id de la cita mostrada actualmente en el panel (para que los botones
// sepan sobre cual cita actuar). Se recalcula en cada render.
let citaIdMostradaActualmenteUsuario = null;

// Si el usuario hizo clic en una fila del listado, aqui se guarda el id
// de esa cita y el panel "Proxima Cita" pasa a mostrar esa cita puntual
// (titulo "Ver cita"), igual que mostrarCitaEnPanel() en admin-citas.js.
// null = el panel muestra automaticamente la proxima cita (proximaCitaGlobal).
let idCitaEnPanelUsuario = null;

// Pestaña activa del listado de citas ("proximas" | "pendientes" | "historial").
let filtroCitasActivo = "proximas";
let filtroMascotaCitasActivo = "";
let filtroMascotaCitasNombre = "";

function obtenerCitasDelUsuarioActivo() {
    const usuarioActivo = obtenerUsuarioRegistrado();
    return usuarioActivo ? obtenerCitasPorUsuarioId(usuarioActivo.id) : [];
}

const ESTADO_A_CLASE_USUARIO = {
    "Pendiente": "pendiente",
    "Confirmada": "confirmada",
    "En curso": "en-curso",
    "Completada": "completada",
    "Reprogramada": "reprogramada",
    "Cancelada": "cancelada",
    "Rechazada": "rechazada"
};

const ICONOS_POR_SERVICIO_USUARIO = {
    "Consulta general": "bi-heart-pulse",
    "Vacunación": "bi-shield-plus",
    "Limpieza dental": "bi-bandaid",
    "Examen general": "bi-clipboard2-pulse",
    "Consulta dermatológica": "bi-bandaid"
};

document.addEventListener("userComponentsLoaded", function () {
    const botonCerrarAlerta = document.getElementById("cerrarAlertaCita");
    const alerta = document.getElementById("alertaCitaConfirmada");
    if (botonCerrarAlerta && alerta) {
        botonCerrarAlerta.addEventListener("click", function () {
            // .hidden (no style.display) para que un renderizado posterior
            // (renderizarAlertaCitaUsuario) pueda volver a mostrarla si hay
            // una novedad nueva.
            alerta.hidden = true;
        });
    }

    const botonVerTodasAlertas = document.getElementById("btnVerTodasAlertasUsuario");
    if (botonVerTodasAlertas) {
        botonVerTodasAlertas.addEventListener("click", mostrarModalTodasLasAlertasUsuario);
    }

    iniciarFiltrosCitasUsuario();
    iniciarBotonesPanelCitaUsuario();
    refrescarVistaCitasUsuario();
});

// Vuelve a pintar el panel, la alerta y el listado juntos -- se llama al
// cargar la pagina y despues de cualquier accion que cambie una cita
// (aprobar/cancelar/reprogramar/subir comprobante), para que las tres
// zonas de la pagina queden siempre coherentes entre si.
function refrescarVistaCitasUsuario() {
    renderizarPanelCitaUsuario();
    renderizarAlertaCitaUsuario();
    renderizarListaCitasUsuario();
}

// ========================================
// Especie: icono + color (mismo criterio que user-dashboard.js /
// user-mascotas.js, duplicado a proposito -- cada pagina autocontenida).
// ========================================

function infoPorEspecieCitaUsuario(especieCruda) {
    const clave = String(especieCruda || "").trim().toLowerCase();
    const mapa = {
        perro: { icono: "fa-dog", clase: "perro", texto: "Perro" },
        gato: { icono: "fa-cat", clase: "gato", texto: "Gato" },
        ave: { icono: "fa-dove", clase: "ave", texto: "Ave" }
    };
    if (mapa[clave]) return mapa[clave];
    return { icono: "fa-paw", clase: "otro", texto: capitalizarPrimeraCitaUsuario(especieCruda) };
}

function capitalizarPrimeraCitaUsuario(texto) {
    const limpio = String(texto || "").trim();
    if (!limpio) return "";
    return limpio.charAt(0).toUpperCase() + limpio.slice(1).toLowerCase();
}

function iconoParaServicioUsuario(nombreServicio) {
    return ICONOS_POR_SERVICIO_USUARIO[nombreServicio] || "bi-heart-pulse";
}

function escaparHtmlCitasUsuario(valor) {
    const div = document.createElement("div");
    div.textContent = String(valor ?? "");
    return div.innerHTML;
}

// ========================================
// Panel "Proxima Cita"
// ========================================

function renderizarPanelCitaUsuario() {
    const titulo = document.getElementById("userPanelCitaTitulo");
    const contenido = document.getElementById("userPanelCitaContenido");
    const vacio = document.getElementById("userPanelCitaVacio");
    if (!contenido || !vacio) return;

    let cita = null;
    let esVistaEspecifica = false;

    if (idCitaEnPanelUsuario !== null) {
        cita = obtenerCitaPorId(idCitaEnPanelUsuario);
        if (cita && String(cita.usuarioId) === String(obtenerUsuarioRegistrado()?.id)) {
            esVistaEspecifica = true;
        } else {
            idCitaEnPanelUsuario = null;
        }
    }

    if (!cita) {
        const usuarioActivo = obtenerUsuarioRegistrado();
        cita = usuarioActivo ? proximaCitaGlobal(usuarioActivo.id) : null;
        esVistaEspecifica = false;
    }

    citaIdMostradaActualmenteUsuario = cita ? cita.id : null;
    if (titulo) titulo.textContent = esVistaEspecifica ? "Ver cita" : "Próxima Cita";

    if (!cita) {
        contenido.hidden = true;
        vacio.hidden = false;
        return;
    }

    contenido.hidden = false;
    vacio.hidden = true;

    const nombreMascota = cita.nombreMascota || "Mascota";
    const especie = infoPorEspecieCitaUsuario(cita.especie);
    const especieRaza = [especie.texto, cita.raza].filter(Boolean).join(" • ") || "Sin datos registrados";
    const modalidadTexto = cita.ubicacion || (cita.modalidad === "domicilio" ? "Servicio a domicilio" : "En clínica");

    document.getElementById("userPanelCitaNombre").textContent = nombreMascota;
    document.getElementById("userPanelCitaId").textContent = `ID: ${cita.id}`;

    // Avatar: foto real de la mascota si existe; si no, icono + color
    // segun la especie (mismo patron que el listado de abajo).
    const avatarPanelEl = document.getElementById("userPanelCitaAvatar");
    if (avatarPanelEl) {
        avatarPanelEl.classList.remove("hv-detalle__avatar--perro", "hv-detalle__avatar--gato", "hv-detalle__avatar--ave", "hv-detalle__avatar--otro");
        if (cita.fotoMascota) {
            avatarPanelEl.classList.remove("hv-detalle__avatar--icono");
            avatarPanelEl.style.backgroundImage = `url('${resolverRutaRecursoHuellaVet(cita.fotoMascota)}')`;
            avatarPanelEl.style.backgroundSize = "cover";
            avatarPanelEl.style.backgroundPosition = "center";
            avatarPanelEl.innerHTML = "";
        } else {
            avatarPanelEl.classList.add("hv-detalle__avatar--icono", `hv-detalle__avatar--${especie.clase}`);
            avatarPanelEl.style.backgroundImage = "";
            avatarPanelEl.innerHTML = `<i class="fa-solid ${especie.icono}"></i>`;
        }
    }

    document.getElementById("userPanelCitaMascotaTexto").textContent = nombreMascota;
    document.getElementById("userPanelCitaMascotaDetalle").textContent = especieRaza;

    document.getElementById("userPanelCitaVeterinarioTexto").textContent = cita.veterinario || "Por asignar";

    document.getElementById("userPanelCitaServicioTexto").textContent = cita.servicioNombre || "Consulta general";
    document.getElementById("userPanelCitaServicioDetalle").textContent = modalidadTexto;

    document.getElementById("userPanelCitaFecha").textContent = fechaISOaTextoLargo(cita.fecha);
    document.getElementById("userPanelCitaHora").textContent = cita.hora || "Hora no definida";

    const claseEstado = ESTADO_A_CLASE_USUARIO[cita.estado] || "pendiente";
    const estadoEl = document.getElementById("userPanelCitaEstado");
    estadoEl.className = `hv-detalle__estado hv-detalle__estado--${claseEstado}`;
    estadoEl.textContent = cita.estado || "Pendiente";

    const observacionesFila = document.getElementById("userPanelCitaObservacionesFila");
    const textoObservaciones = cita.motivo || "";
    if (textoObservaciones) {
        observacionesFila.hidden = false;
        document.getElementById("userPanelCitaObservaciones").textContent = textoObservaciones;
    } else {
        observacionesFila.hidden = true;
    }

    // Motivo del cambio de estado (Cancelada/Rechazada/Reprogramada).
    const ETIQUETA_MOTIVO_POR_ESTADO_USUARIO = {
        "Cancelada": "Motivo de cancelación",
        "Rechazada": "Motivo de rechazo",
        "Reprogramada": "Motivo de reprogramación"
    };
    const motivoEstadoFila = document.getElementById("userPanelCitaMotivoEstadoFila");
    if (motivoEstadoFila) {
        if (cita.motivoEstado && ETIQUETA_MOTIVO_POR_ESTADO_USUARIO[cita.estado]) {
            motivoEstadoFila.hidden = false;
            document.getElementById("userPanelCitaMotivoEstadoEtiqueta").textContent = ETIQUETA_MOTIVO_POR_ESTADO_USUARIO[cita.estado];
            document.getElementById("userPanelCitaMotivoEstado").textContent = cita.motivoEstado;
        } else {
            motivoEstadoFila.hidden = true;
        }
    }

    // Recomendacion que el veterinario dejo al finalizar la cita.
    const recordatorioFila = document.getElementById("userPanelCitaRecordatorioFila");
    if (recordatorioFila) {
        if (cita.estado === "Completada" && cita.recordatorio) {
            recordatorioFila.hidden = false;
            document.getElementById("userPanelCitaRecordatorioTexto").textContent = cita.recordatorio.texto || "";
            document.getElementById("userPanelCitaRecordatorioFecha").textContent = cita.recordatorio.fecha
                ? `Fecha sugerida: ${formatearFechaCortaUsuario(cita.recordatorio.fecha)}`
                : "Sin fecha específica";
        } else {
            recordatorioFila.hidden = true;
        }
    }

    renderizarAbonoUsuario(cita);

    // Reprogramar/Cancelar solo tienen sentido si la cita todavia se
    // puede accionar. Si el usuario esta viendo (clic en una fila) una
    // cita ya Completada/Cancelada/Rechazada, se ocultan y se muestra un
    // mensaje en su lugar.
    const accionesNormales = document.getElementById("userPanelAccionesNormales");
    const accionesMensaje = document.getElementById("userPanelAccionesMensaje");
    const ESTADOS_TERMINALES_PANEL = ["Completada", "Cancelada", "Rechazada"];
    const MENSAJE_POR_ESTADO_TERMINAL = {
        "Completada": "Esta cita ya fue completada.",
        "Cancelada": "Esta cita fue cancelada.",
        "Rechazada": "Esta solicitud de cita fue rechazada."
    };
    if (accionesNormales && accionesMensaje) {
        if (ESTADOS_TERMINALES_PANEL.includes(cita.estado)) {
            accionesNormales.hidden = true;
            accionesMensaje.hidden = false;
            accionesMensaje.textContent = MENSAJE_POR_ESTADO_TERMINAL[cita.estado] || "";
        } else {
            accionesNormales.hidden = false;
            accionesMensaje.hidden = true;
        }
    }
}

// Muestra una cita puntual en el panel "Proxima Cita" (clic en una fila
// del listado de abajo) -- mismo patron que mostrarCitaEnPanel() en
// admin-citas.js.
function mostrarCitaEnPanelUsuario(idCita) {
    idCitaEnPanelUsuario = idCita;
    renderizarPanelCitaUsuario();
}

// Bloque de abono / costo de reserva: solo aparece si el servicio lo
// requiere. Muestra el estado (pendiente/pagado) y el comprobante que
// el propietario haya subido, y deja marcar el pago con una imagen.
function renderizarAbonoUsuario(cita) {
    const bloqueAbono = document.getElementById("userPanelAbono");
    if (!bloqueAbono) return;

    if (!cita.tieneCostoReserva || !(cita.costoReserva > 0)) {
        bloqueAbono.hidden = true;
        return;
    }

    bloqueAbono.hidden = false;

    const abonoEstado = cita.abonoEstado || "pendiente";
    document.getElementById("userPanelAbonoMonto").textContent = `$${Number(cita.costoReserva).toLocaleString("es-CO")} COP`;

    const badge = document.getElementById("userPanelAbonoBadge");
    if (abonoEstado === "pagado") {
        badge.textContent = "Pagado";
        badge.className = "hv-abono__badge hv-abono__badge--pagado";
    } else {
        badge.textContent = "Pendiente";
        badge.className = "hv-abono__badge hv-abono__badge--pendiente";
    }

    const comprobanteEl = document.getElementById("userPanelAbonoComprobante");
    if (comprobanteEl) {
        comprobanteEl.innerHTML = cita.abonoComprobante
            ? `<a href="${cita.abonoComprobante}" target="_blank" rel="noopener"><img class="hv-abono__comprobante-img" src="${cita.abonoComprobante}" alt="Comprobante de pago"></a>`
            : "";
    }

    const textoBoton = document.getElementById("userBtnSubirComprobanteTexto");
    if (textoBoton) {
        textoBoton.textContent = abonoEstado === "pagado"
            ? "Actualizar comprobante"
            : "Marcar como pagado y subir comprobante";
    }
}

function iniciarBotonesPanelCitaUsuario() {
    document.getElementById("userPanelBtnEditar")?.addEventListener("click", function () {
        Swal.fire({
            icon: "info",
            title: "Próximamente",
            text: "La edición de los datos de la cita estará disponible pronto.",
            confirmButtonColor: "#17a9a7"
        });
    });

    document.getElementById("userPanelBtnReprogramar")?.addEventListener("click", function () {
        if (citaIdMostradaActualmenteUsuario === null) return;
        pedirMotivoYCambiarEstadoUsuario(citaIdMostradaActualmenteUsuario, "Reprogramada", {
            titulo: "¿Solicitar reprogramación?",
            texto: "La clínica revisará tu solicitud para acordar una nueva fecha y hora. Indica el motivo:",
            placeholder: "Ej. Tengo un imprevisto ese día, necesito otro horario...",
            confirmButtonText: "Sí, solicitar",
            confirmButtonColor: "#17a9a7"
        });
    });

    document.getElementById("userPanelBtnCancelar")?.addEventListener("click", function () {
        if (citaIdMostradaActualmenteUsuario === null) return;
        pedirMotivoYCambiarEstadoUsuario(citaIdMostradaActualmenteUsuario, "Cancelada", {
            titulo: "¿Cancelar esta cita?",
            texto: "Esta acción no se puede deshacer. Indica el motivo:",
            placeholder: "Ej. Ya no puedo asistir, encontré otra clínica...",
            confirmButtonText: "Sí, cancelar",
            confirmButtonColor: "#e53935"
        });
    });

    document.getElementById("userBtnSubirComprobante")?.addEventListener("click", function () {
        if (citaIdMostradaActualmenteUsuario === null) return;
        abrirFormularioComprobanteUsuario(citaIdMostradaActualmenteUsuario);
    });
}

// Dialogo compartido para Reprogramar/Cancelar: pide un motivo
// obligatorio y, si se confirma, cambia el estado y guarda el motivo.
function pedirMotivoYCambiarEstadoUsuario(idCita, nuevoEstado, opciones) {
    Swal.fire({
        icon: "warning",
        title: opciones.titulo,
        html: `
            <p style="text-align: left; color: #526765; font-size: 0.85rem; margin-bottom: 0.4rem;">${opciones.texto}</p>
            <textarea id="swalMotivoEstadoUsuario" class="swal2-textarea" style="margin: 0; width: 100%;" placeholder="${opciones.placeholder}"></textarea>
        `,
        showCancelButton: true,
        confirmButtonText: opciones.confirmButtonText,
        cancelButtonText: "Volver",
        confirmButtonColor: opciones.confirmButtonColor,
        cancelButtonColor: "#6c757d",
        focusConfirm: false,
        preConfirm: () => {
            const motivo = document.getElementById("swalMotivoEstadoUsuario").value.trim();
            if (!motivo) {
                Swal.showValidationMessage("Escribe el motivo.");
                return false;
            }
            return motivo;
        }
    }).then((resultado) => {
        if (!resultado.isConfirmed) return;
        actualizarCamposCita(idCita, { estado: nuevoEstado, motivoEstado: resultado.value });
        refrescarVistaCitasUsuario();
    });
}

// Formulario para marcar el abono como pagado y subir el comprobante
// (imagen). Convierte el archivo a base64, igual que agregar-servicio.js.
function abrirFormularioComprobanteUsuario(idCita) {
    Swal.fire({
        title: "Subir comprobante de pago",
        text: "Selecciona una imagen o captura de pantalla del comprobante de tu abono.",
        input: "file",
        inputAttributes: {
            accept: "image/*",
            "aria-label": "Comprobante de pago"
        },
        showCancelButton: true,
        confirmButtonText: "Guardar comprobante",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#17a9a7",
        cancelButtonColor: "#6c757d",
        inputValidator: (archivo) => {
            if (!archivo) return "Debes seleccionar una imagen del comprobante.";
        }
    }).then((resultado) => {
        if (!resultado.isConfirmed || !resultado.value) return;

        convertirImagenABase64Usuario(resultado.value).then((imagenBase64) => {
            actualizarCamposCita(idCita, {
                abonoEstado: "pagado",
                abonoComprobante: imagenBase64,
                abonoFechaPago: new Date().toISOString()
            });

            Swal.fire({
                icon: "success",
                title: "Comprobante enviado",
                text: "La clínica revisará tu pago antes de aprobar la cita.",
                confirmButtonColor: "#17a9a7"
            }).then(() => {
                refrescarVistaCitasUsuario();
            });
        });
    });
}

function convertirImagenABase64Usuario(archivo) {
    return new Promise(function (resolve, reject) {
        const lector = new FileReader();

        lector.onload = function () {
            resolve(lector.result);
        };

        lector.onerror = function () {
            reject("");
        };

        lector.readAsDataURL(archivo);
    });
}

// "2026-08-30" -> "30 de agosto" (formato corto, para la fecha sugerida
// del recordatorio del veterinario).
function formatearFechaCortaUsuario(fechaISO) {
    if (!fechaISO) return "Fecha no definida";
    try {
        const [anio, mes, dia] = fechaISO.split("-").map(Number);
        const fecha = new Date(anio, mes - 1, dia);
        return new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long" }).format(fecha);
    } catch (e) {
        return fechaISO;
    }
}

// "2026-08-30" -> "30 ago" (aun mas corto, para las filas del listado).
function formatearFechaMuyCortaUsuario(fechaISO) {
    if (!fechaISO) return "";
    try {
        const [anio, mes, dia] = fechaISO.split("-").map(Number);
        const fecha = new Date(anio, mes - 1, dia);
        return new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short" }).format(fecha);
    } catch (e) {
        return fechaISO;
    }
}

// Convierte una fecha/hora ISO (cita.actualizadoEn/fechaCreacion) a algo
// como "31 ago, 8:15 a. m." para el pie de la alerta.
function formatearFechaHoraCortaUsuario(fechaHoraISO) {
    try {
        const fecha = new Date(fechaHoraISO);
        if (isNaN(fecha.getTime())) return "";
        return new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(fecha);
    } catch (e) {
        return "";
    }
}

// ========================================
// Alerta superior: refleja el estado de la cita mas recientemente
// actualizada (de cualquier estado -- confirmada, pendiente,
// reprogramada, cancelada, rechazada o completada). Si no hay ninguna
// cita, se oculta por completo (el resto de la columna sube).
// ========================================

const ALERTA_POR_ESTADO_USUARIO = {
    "Pendiente": {
        clase: "pendiente", icono: "bi-hourglass-split", titulo: "Cita pendiente de aprobación",
        texto: nombre => `Tu cita para ${nombre} está pendiente de aprobación por la clínica.`
    },
    "Confirmada": {
        clase: "", icono: "bi-check-lg", titulo: "¡Cita confirmada!",
        texto: nombre => `Tu cita para ${nombre} fue confirmada por la clínica.`
    },
    "En curso": {
        clase: "en-curso", icono: "bi-play-fill", titulo: "Tu cita está en curso",
        texto: nombre => `La cita de ${nombre} se está atendiendo en este momento.`
    },
    "Completada": {
        clase: "completada", icono: "bi-check2-circle", titulo: "Cita completada",
        texto: nombre => `La cita de ${nombre} fue completada. Revisa la recomendación del veterinario en Mis Mascotas.`
    },
    "Reprogramada": {
        clase: "reprogramada", icono: "bi-arrow-repeat", titulo: "Cita reprogramada",
        texto: nombre => `Tu cita para ${nombre} fue reprogramada.`
    },
    "Cancelada": {
        clase: "cancelada", icono: "bi-x-circle", titulo: "Cita cancelada",
        texto: nombre => `Tu cita para ${nombre} fue cancelada.`
    },
    "Rechazada": {
        clase: "rechazada", icono: "bi-x-circle", titulo: "Solicitud rechazada",
        texto: nombre => `Tu solicitud de cita para ${nombre} fue rechazada.`
    }
};

// La ULTIMA CITA CREADA por el usuario (fechaCreacion mas reciente), de
// CUALQUIER estado -- a diferencia de proximaCitaGlobal(), aqui si cuentan
// las canceladas/rechazadas/completadas: la alerta sigue esa cita puntual
// a lo largo de todo su ciclo de vida (pendiente -> lo que haya decidido
// la clinica: aprobada, reprogramada, cancelada, rechazada...), por eso
// se ordena por fechaCreacion y no por actualizadoEn -- si se ordenara
// por actualizadoEn, la alerta "saltaria" a cualquier otra cita mas
// antigua que la clinica haya tocado despues, en vez de seguir contando
// que paso con la que el usuario acaba de agendar.
function citaMasRecienteParaAlerta() {
    const citas = obtenerCitasDelUsuarioActivo();
    if (citas.length === 0) return null;

    return citas.slice().sort((a, b) => {
        const marcaA = new Date(a.fechaCreacion || 0).getTime();
        const marcaB = new Date(b.fechaCreacion || 0).getTime();
        return marcaB - marcaA;
    })[0];
}

function renderizarAlertaCitaUsuario() {
    const alerta = document.getElementById("alertaCitaConfirmada");
    if (!alerta) return;

    const cita = citaMasRecienteParaAlerta();
    if (!cita) {
        alerta.hidden = true;
        return;
    }

    const config = ALERTA_POR_ESTADO_USUARIO[cita.estado] || ALERTA_POR_ESTADO_USUARIO["Pendiente"];

    alerta.hidden = false;
    alerta.className = config.clase ? `hv-alerta hv-alerta--${config.clase}` : "hv-alerta";

    const iconoEl = document.querySelector("#alertaCitaIcono i");
    if (iconoEl) iconoEl.className = `bi ${config.icono}`;

    document.getElementById("alertaCitaTitulo").textContent = config.titulo;
    document.getElementById("alertaCitaTexto").textContent = config.texto(cita.nombreMascota || "tu mascota");

    const marcaTiempo = cita.actualizadoEn || cita.fechaCreacion;
    document.getElementById("alertaCitaFecha").textContent = marcaTiempo ? formatearFechaHoraCortaUsuario(marcaTiempo) : "";
}

// Color solido para el icono de cada fila del modal "Ver todas las
// alertas" -- mismos tonos que .hv-badge--*/.hv-detalle__estado--* de
// esta pagina (y de admin-citas.css), solo que en version solida en vez
// de texto-sobre-fondo-claro, porque aqui el icono va sobre un circulo.
const COLOR_ICONO_POR_CLASE_USUARIO = {
    pendiente: "#a1710f",
    confirmada: "#00796b",
    "en-curso": "#e65100",
    completada: "#558b2f",
    reprogramada: "#c62828",
    cancelada: "#5f6b69",
    rechazada: "#5f6b69"
};

// Modal con el estado actual de TODAS las citas del usuario (no solo la
// mas reciente que muestra la alerta de arriba), ordenadas por su ultima
// novedad. Se abre con el boton "Ver todas las alertas" de la alerta.
function mostrarModalTodasLasAlertasUsuario() {
    const citas = obtenerCitasDelUsuarioActivo().slice().sort((a, b) => {
        const marcaA = new Date(a.actualizadoEn || a.fechaCreacion || 0).getTime();
        const marcaB = new Date(b.actualizadoEn || b.fechaCreacion || 0).getTime();
        return marcaB - marcaA;
    });

    if (citas.length === 0) {
        Swal.fire({
            title: "Alertas de tus citas",
            html: `<p style="color:#718285;font-size:0.85rem;margin:0;">Todavía no tienes citas.</p>`,
            confirmButtonText: "Cerrar",
            confirmButtonColor: "#17a9a7"
        });
        return;
    }

    const filasHtml = citas.map(cita => {
        const config = ALERTA_POR_ESTADO_USUARIO[cita.estado] || ALERTA_POR_ESTADO_USUARIO["Pendiente"];
        const claseEstado = ESTADO_A_CLASE_USUARIO[cita.estado] || "pendiente";
        const colorIcono = COLOR_ICONO_POR_CLASE_USUARIO[claseEstado] || "#5f6b69";
        const marcaTiempo = cita.actualizadoEn || cita.fechaCreacion;
        const fechaCorta = marcaTiempo ? formatearFechaHoraCortaUsuario(marcaTiempo) : "";

        return `
            <div style="display:flex;align-items:center;gap:0.65rem;padding:0.55rem 0.1rem;border-bottom:1px solid #eef1f0;text-align:left;">
                <div style="width:32px;height:32px;flex-shrink:0;border-radius:50%;display:flex;align-items:center;justify-content:center;background-color:${colorIcono};">
                    <i class="bi ${config.icono}" style="color:#fff;font-size:0.85rem;"></i>
                </div>
                <div style="flex:1;min-width:0;">
                    <strong style="display:block;font-size:0.82rem;color:#223e3c;">${escaparHtmlCitasUsuario(cita.nombreMascota || "Mascota")}</strong>
                    <span style="font-size:0.72rem;color:#72817f;">${escaparHtmlCitasUsuario(fechaCorta)}</span>
                </div>
                <span class="hv-badge hv-badge--${claseEstado}" style="flex-shrink:0;">${escaparHtmlCitasUsuario(cita.estado || "Pendiente")}</span>
            </div>
        `;
    }).join("");

    Swal.fire({
        title: `<div style="font-size:1.05rem;font-weight:700;color:#223e3c;">Alertas de tus citas</div>`,
        html: `<div style="max-height:360px;overflow-y:auto;">${filasHtml}</div>`,
        width: 420,
        confirmButtonText: "Cerrar",
        confirmButtonColor: "#17a9a7"
    });
}

// ========================================
// Listado de citas (pestañas Próximas/Pendientes/Historial)
// ========================================

function iniciarFiltrosCitasUsuario() {
    document.querySelectorAll(".hv-filtro-boton[data-filtro]").forEach(boton => {
        boton.addEventListener("click", function () {
            document.querySelectorAll(".hv-filtro-boton[data-filtro]").forEach(b => b.classList.remove("hv-filtro-boton--activo"));
            this.classList.add("hv-filtro-boton--activo");
            filtroCitasActivo = this.dataset.filtro;
            renderizarListaCitasUsuario();
        });
    });

    const selectorMascota = document.getElementById("filtroMascotaCitasUsuario");
    if (!selectorMascota) return;

    const usuarioActivo = obtenerUsuarioRegistrado();
    const mascotas = usuarioActivo
        ? obtenerMascotasPorUsuarioId(usuarioActivo.id)
            .sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || ""), "es"))
        : [];

    selectorMascota.innerHTML = `<option value="">Todas mis mascotas</option>` +
        mascotas.map(mascota => `
            <option value="${escaparHtmlCitasUsuario(mascota.id || "")}" data-nombre="${escaparHtmlCitasUsuario(mascota.nombre || "")}">
                ${escaparHtmlCitasUsuario(mascota.nombre || "Mascota")}
            </option>`).join("");

    selectorMascota.addEventListener("change", function () {
        filtroMascotaCitasActivo = this.value;
        filtroMascotaCitasNombre = this.selectedOptions[0]?.dataset.nombre || "";
        renderizarListaCitasUsuario();
    });
}

function momentoDeCitaUsuario(cita) {
    const [anio, mes, dia] = (cita.fecha || hoyISO()).split("-").map(Number);
    const [hora, minuto] = normalizarHoraA24(cita.hora).split(":").map(Number);
    return new Date(anio, mes - 1, dia, hora, minuto);
}

function citasFiltradasUsuario() {
    const ahora = new Date();
    const citas = obtenerCitasDelUsuarioActivo();
    const ESTADOS_TERMINALES = ["Completada", "Cancelada", "Rechazada"];

    let resultado;

    if (filtroCitasActivo === "pendientes") {
        resultado = citas
            .filter(c => c.estado === "Pendiente")
            .sort((a, b) => momentoDeCitaUsuario(a) - momentoDeCitaUsuario(b));
    } else if (filtroCitasActivo === "historial") {
        resultado = citas
            .filter(c => ESTADOS_TERMINALES.includes(c.estado) || momentoDeCitaUsuario(c) < ahora)
            .sort((a, b) => momentoDeCitaUsuario(b) - momentoDeCitaUsuario(a));
    } else {
        // "proximas" (pestaña por defecto)
        resultado = citas
            .filter(c => !ESTADOS_TERMINALES.includes(c.estado) && momentoDeCitaUsuario(c) >= ahora)
            .sort((a, b) => momentoDeCitaUsuario(a) - momentoDeCitaUsuario(b));
    }

    if (!filtroMascotaCitasActivo) return resultado;

    return resultado.filter(cita =>
        String(cita.mascotaId || "") === String(filtroMascotaCitasActivo) ||
        (!cita.mascotaId && String(cita.nombreMascota || "").trim().toLowerCase() === filtroMascotaCitasNombre.trim().toLowerCase())
    );
}

const MENSAJE_VACIO_LISTA_CITAS_USUARIO = {
    proximas: { titulo: "No tienes citas próximas", texto: "Agenda una cita para verla aquí." },
    pendientes: { titulo: "No tienes citas pendientes", texto: "Aquí verás las citas que esperan aprobación de la clínica." },
    historial: { titulo: "Aún no hay historial", texto: "Las citas completadas, canceladas o rechazadas aparecerán aquí." }
};

function renderizarListaCitasUsuario() {
    const contenedor = document.getElementById("listaCitasUsuario");
    if (!contenedor) return;

    const citas = citasFiltradasUsuario();

    if (citas.length === 0) {
        const mensaje = MENSAJE_VACIO_LISTA_CITAS_USUARIO[filtroCitasActivo] || MENSAJE_VACIO_LISTA_CITAS_USUARIO.proximas;
        contenedor.innerHTML = `
            <div class="hv-pendientes--vacio">
                <div class="hv-pendientes__compacto-icono"><i class="bi bi-calendar-x"></i></div>
                <div class="hv-pendientes__compacto-contenido">
                    <strong>${escaparHtmlCitasUsuario(mensaje.titulo)}</strong>
                    <p>${escaparHtmlCitasUsuario(mensaje.texto)}</p>
                </div>
            </div>
        `;
        return;
    }

    contenedor.innerHTML = citas.map(cita => filaCitaUsuarioHtml(cita)).join("");

    contenedor.querySelectorAll("[data-cita-id]").forEach(fila => {
        fila.addEventListener("click", function () {
            // Igual que en admin-citas: clic en una fila cambia la cita
            // que se ve en el panel "Proxima Cita" de la derecha, en vez
            // de abrir un modal aparte.
            mostrarCitaEnPanelUsuario(this.dataset.citaId);
        });
    });
}

function filaCitaUsuarioHtml(cita) {
    const claseEstado = ESTADO_A_CLASE_USUARIO[cita.estado] || "pendiente";
    const especie = infoPorEspecieCitaUsuario(cita.especie);
    const nombreMascota = cita.nombreMascota || "Mascota";

    const avatarHtml = cita.fotoMascota
        ? `<img class="hv-agenda-cita__avatar" src="${escaparHtmlCitasUsuario(resolverRutaRecursoHuellaVet(cita.fotoMascota))}" alt="${escaparHtmlCitasUsuario(nombreMascota)}">`
        : `<div class="hv-agenda-cita__avatar hv-agenda-cita__avatar--icono hv-agenda-cita__avatar--${especie.clase}"><i class="fa-solid ${especie.icono}"></i></div>`;

    const especieRaza = [especie.texto, cita.raza].filter(Boolean).join(" · ") || "Sin datos";
    const icono = iconoParaServicioUsuario(cita.servicioNombre);

    return `
        <div class="hv-agenda-cita hv-agenda-cita--${claseEstado}" data-cita-id="${escaparHtmlCitasUsuario(cita.id)}">
            ${avatarHtml}
            <div class="hv-agenda-cita__info">
                <div class="hv-agenda-cita__nombre">${escaparHtmlCitasUsuario(nombreMascota)}</div>
                <div class="hv-agenda-cita__dueno">${escaparHtmlCitasUsuario(especieRaza)}</div>
            </div>
            <div class="hv-agenda-cita__servicio">
                <i class="bi ${icono}"></i>
                <div>
                    <div class="hv-agenda-cita__tipo">${escaparHtmlCitasUsuario(cita.servicioNombre || "Consulta general")}</div>
                    <div class="hv-agenda-cita__detalle">${escaparHtmlCitasUsuario(formatearFechaMuyCortaUsuario(cita.fecha))} · ${escaparHtmlCitasUsuario(cita.hora || "")}</div>
                </div>
            </div>
            <span class="hv-badge hv-badge--${claseEstado}">${escaparHtmlCitasUsuario(cita.estado || "Pendiente")}</span>
            <i class="bi bi-chevron-right hv-agenda-cita__flecha"></i>
        </div>
    `;
}
