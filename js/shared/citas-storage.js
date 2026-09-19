/* Repositorio unico de citas para las areas publica, admin y usuario.
 *
 * La base de datos (API Spring Boot) es la UNICA fuente de verdad.
 * No se guarda nada en localStorage: las citas viven en memoria mientras la
 * pagina esta abierta y se vuelven a pedir al servidor en cada carga
 * (sincronizarCitasDesdeBackend). Toda modificacion se hace primero contra la
 * API; si el servidor falla, el error se propaga y la memoria no cambia.
 */
const HORAS_AGENDA = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

let citasEnMemoria = [];
// { "2026-09-20": Set("09:00", "10:00") } con las franjas ya reservadas por cualquier cliente
const horasOcupadasPorFecha = {};

function normalizarHoraApi(horaTexto) {
    if (!horaTexto) return "00:00:00";
    const texto = String(horaTexto).trim().toLowerCase();
    const match = texto.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?|am|pm)?/);

    if (!match) return "00:00:00";

    let horas = Number(match[1]);
    const minutos = String(match[2]).padStart(2, "0");
    const periodo = match[4];

    if (periodo) {
        const esPM = periodo.startsWith("p");
        if (esPM && horas < 12) horas += 12;
        if (!esPM && horas === 12) horas = 0;
    }

    return `${String(horas).padStart(2, "0")}:${minutos}:00`;
}

function normalizarHoraVisible(horaTexto) {
    if (!horaTexto) return "10:00 AM";
    const texto = String(horaTexto).trim();

    if (/[aApP]/.test(texto)) {
        return texto;
    }

    const match = texto.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!match) return texto;

    let horas = Number(match[1]);
    const minutos = match[2];
    const periodo = horas >= 12 ? "PM" : "AM";
    if (horas > 12) horas -= 12;
    if (horas === 0) horas = 12;
    return `${horas}:${minutos} ${periodo}`;
}

function normalizarCitaDesdeBackend(cita = {}) {
    return {
        ...cita,
        id: cita.id,
        usuarioId: cita.usuarioId ?? cita.usuario?.id ?? "",
        mascotaId: cita.mascotaId ?? cita.mascota?.id ?? "",
        nombreMascota: cita.nombreMascota ?? cita.mascota?.nombre ?? "Mascota",
        servicioNombre: cita.servicioNombre ?? cita.servicio?.nombre ?? "Consulta general",
        fecha: cita.fecha || hoyISO(),
        hora: normalizarHoraVisible(cita.hora),
        estado: cita.estado || "Pendiente",
        modalidad: cita.modalidad || "clinica",
        ubicacion: cita.ubicacion || "HuellaVet — Sede Centro",
        motivo: cita.motivo || "",
        costoReserva: cita.costoReserva ?? 0,
        tieneCostoReserva: Boolean(cita.tieneCostoReserva),
        fotoMascota: cita.fotoMascota || "",
        motivoEstado: cita.motivoEstado || "",
        abonoEstado: cita.abonoEstado || "pendiente",
        abonoComprobante: cita.abonoComprobante || "",
        abonoFechaPago: cita.abonoFechaPago || null,
        cliente: {
            nombre: cita.clienteNombre || "",
            telefono: cita.clienteTelefono || "",
            email: cita.clienteEmail || "",
            direccion: cita.clienteDireccion || "",
            canalRecordatorio: cita.canalRecordatorio || ""
        },
        recordatorio: cita.recordatorioTexto
            ? {
                texto: cita.recordatorioTexto,
                fecha: cita.recordatorioFecha || null,
                fechaCreacion: cita.recordatorioFechaCreacion || null
            }
            : null
    };
}

/* ============================================================
 * LECTURA DESDE LA BASE DE DATOS
 * ============================================================ */

// Los errores se propagan: quien llama decide como informarlos al usuario.
async function obtenerCitasDesdeBackend(idUsuario = null) {
    if (!tieneSesionBackendActiva()) return [];

    const ruta = idUsuario == null
        ? "/citas"
        : `/citas/usuario/${encodeURIComponent(idUsuario)}`;
    const respuesta = await apiBackend(ruta);
    return (Array.isArray(respuesta) ? respuesta : []).map(normalizarCitaDesdeBackend);
}

async function obtenerCitasDesdeBackendPorVeterinario(idVeterinario) {
    if (!tieneSesionBackendActiva()) return [];

    const respuesta = await apiBackend(`/citas/veterinario/${encodeURIComponent(idVeterinario)}`);
    return (Array.isArray(respuesta) ? respuesta : []).map(normalizarCitaDesdeBackend);
}

/*
 * Trae del backend solo las citas que corresponden al rol de quien esta
 * conectado: un VETERINARIO solo ve sus citas asignadas; ADMINISTRADOR ve todas.
 */
async function obtenerCitasVisiblesSegunRolActual() {
    const usuarioActivo = typeof obtenerUsuarioRegistrado === "function" ? obtenerUsuarioRegistrado() : null;
    const rol = String(usuarioActivo?.rol || "").toUpperCase();

    if (rol === "VETERINARIO" && usuarioActivo?.id != null) {
        return obtenerCitasDesdeBackendPorVeterinario(usuarioActivo.id);
    }
    return obtenerCitasDesdeBackend();
}

/*
 * Refresca la copia en memoria con lo que hay en la BD.
 *  - con idUsuario: las citas de ese cliente (rol USUARIO)
 *  - sin idUsuario: todas las citas de la clinica (rol VETERINARIO / ADMINISTRADOR)
 * Lanza el error si el servidor no responde.
 */
async function sincronizarCitasDesdeBackend(idUsuario = null) {
    if (!tieneSesionBackendActiva()) {
        citasEnMemoria = [];
        return [];
    }

    citasEnMemoria = await obtenerCitasDesdeBackend(idUsuario);
    return obtenerTodasLasCitas();
}

/*
 * Primera carga de la pagina: si varios scripts (topbar, pagina, etc.) piden
 * las mismas citas a la vez comparten una sola peticion. Si falla, se puede reintentar.
 */
let promesaCitasCargadas = null;
let claveCitasCargadas = null;
function asegurarCitasCargadas(idUsuario = null) {
    const clave = String(idUsuario ?? "*");
    if (!promesaCitasCargadas || claveCitasCargadas !== clave) {
        claveCitasCargadas = clave;
        promesaCitasCargadas = sincronizarCitasDesdeBackend(idUsuario).catch(error => {
            promesaCitasCargadas = null;
            claveCitasCargadas = null;
            throw error;
        });
    }
    return promesaCitasCargadas;
}

/* Pide al servidor las horas ya reservadas en una fecha (de todos los clientes). */
async function cargarHorasOcupadasEnFecha(fechaISO) {
    if (!fechaISO || !tieneSesionBackendActiva()) return new Set();

    const respuesta = await apiBackend(`/citas/ocupadas?fecha=${encodeURIComponent(fechaISO)}`);
    const franjas = new Set((Array.isArray(respuesta) ? respuesta : []).map(horaAFranja));
    horasOcupadasPorFecha[fechaISO] = franjas;
    return franjas;
}

/* ============================================================
 * ESCRITURA (siempre contra la base de datos)
 * ============================================================ */

function reemplazarCitaEnMemoria(cita) {
    const index = citasEnMemoria.findIndex(item => String(item.id) === String(cita.id));
    if (index === -1) {
        citasEnMemoria.unshift(cita);
    } else {
        citasEnMemoria[index] = cita;
    }
    return cita;
}

async function guardarCitaEnBackend(cita) {
    if (!tieneSesionBackendActiva()) {
        return null;
    }

    const cliente = cita.cliente || {};
    const payload = {
        usuarioId: String(cita.usuarioId || ""),
        mascotaId: String(cita.mascotaId || ""),
        servicioId: Number(cita.servicioId ?? 0),
        fecha: cita.fecha || hoyISO(),
        hora: normalizarHoraApi(cita.hora),
        modalidad: cita.modalidad || "clinica",
        ubicacion: cita.ubicacion || "HuellaVet — Sede Centro",
        motivo: cita.motivo || "",
        tieneCostoReserva: Boolean(cita.tieneCostoReserva),
        costoReserva: Number(cita.costoReserva || 0),
        nombreMascota: cita.nombreMascota || "Mascota",
        servicioNombre: cita.servicioNombre || "Consulta general",
        clienteNombre: cliente.nombre || "",
        clienteTelefono: cliente.telefono || "",
        clienteEmail: cliente.email || "",
        clienteDireccion: cliente.direccion || "",
        canalRecordatorio: cliente.canalRecordatorio || ""
    };

    return apiBackend("/citas", {
        method: "POST",
        body: payload
    });
}

/*
 * Crea la cita en el backend y solo si la operacion es exitosa la agrega a
 * la copia en memoria con los datos reales de la BD (id, estado, etc.).
 */
async function agregarCita(cita) {
    if (!tieneSesionBackendActiva()) {
        throw new Error("Debes iniciar sesión para agendar una cita.");
    }

    const citaCreada = await guardarCitaEnBackend(cita);
    if (!citaCreada) {
        throw new Error("No se pudo agendar la cita.");
    }

    const citaNormalizada = normalizarCitaDesdeBackend(citaCreada);
    reemplazarCitaEnMemoria(citaNormalizada);
    if (horasOcupadasPorFecha[citaNormalizada.fecha]) {
        horasOcupadasPorFecha[citaNormalizada.fecha].add(horaAFranja(citaNormalizada.hora));
    }
    return citaNormalizada;
}

/*
 * Cambia el estado de una cita contra el backend. La copia en memoria solo
 * se actualiza cuando la BD confirma el cambio.
 *
 * datosNuevos (opcional):
 *   - { motivoEstado }                       para Rechazada / Cancelada
 *   - { fecha, hora, motivoEstado }          para Reprogramada con nueva fecha
 *   - { motivoEstado }                       para Reprogramada sin fecha (cliente solicita / veterinario marca)
 */
async function actualizarEstadoCita(idCita, nuevoEstado, datosNuevos = null) {
    if (!tieneSesionBackendActiva()) {
        throw new Error("Debes iniciar sesión para modificar esta cita.");
    }

    const motivoEstado = datosNuevos?.motivoEstado || datosNuevos?.motivo || "";
    let accion;
    let body = null;

    switch (nuevoEstado) {
        case "Pendiente":
        case "Confirmada":
            accion = "aceptar";
            break;
        case "En curso":
            accion = "iniciar";
            break;
        case "Completada":
            accion = "completar";
            break;
        case "Rechazada":
            accion = "rechazar";
            body = { motivoEstado };
            break;
        case "Cancelada":
            accion = "cancelar";
            body = { motivoEstado };
            break;
        case "Reprogramada":
            if (datosNuevos?.fecha && datosNuevos?.hora) {
                accion = "reprogramar";
                body = {
                    fecha: datosNuevos.fecha,
                    hora: normalizarHoraApi(datosNuevos.hora),
                    motivoEstado
                };
            } else {
                // Sin fecha nueva: el cliente SOLICITA la reprogramacion; el
                // veterinario/administrador la MARCA (coordina la fecha despues).
                const rol = String(
                    (typeof obtenerUsuarioRegistrado === "function" ? obtenerUsuarioRegistrado() : null)?.rol || ""
                ).toUpperCase();
                accion = rol === "VETERINARIO" || rol === "ADMINISTRADOR"
                    ? "marcar-reprogramada"
                    : "solicitar-reprogramacion";
                body = { motivoEstado };
            }
            break;
        default:
            throw new Error(`Estado de cita no soportado: ${nuevoEstado}`);
    }

    const respuesta = await apiBackend(`/citas/${encodeURIComponent(idCita)}/${accion}`, {
        method: "PUT",
        ...(body ? { body } : {})
    });
    if (!respuesta) {
        throw new Error("No se pudo actualizar el estado de la cita.");
    }

    return reemplazarCitaEnMemoria(normalizarCitaDesdeBackend(respuesta));
}

/* Crea o edita el recordatorio que el veterinario deja al propietario (cita Completada). */
async function guardarRecordatorioCita(idCita, { texto, fecha = null }) {
    if (!tieneSesionBackendActiva()) {
        throw new Error("Debes iniciar sesión para guardar el recordatorio.");
    }

    const respuesta = await apiBackend(`/citas/${encodeURIComponent(idCita)}/recordatorio`, {
        method: "PUT",
        body: { recordatorioTexto: texto, recordatorioFecha: fecha || null }
    });
    return reemplazarCitaEnMemoria(normalizarCitaDesdeBackend(respuesta));
}

/* Registra el comprobante (imagen en base64) del abono de reserva. */
async function registrarAbonoCita(idCita, comprobanteBase64) {
    if (!tieneSesionBackendActiva()) {
        throw new Error("Debes iniciar sesión para registrar el pago.");
    }

    const respuesta = await apiBackend(`/citas/${encodeURIComponent(idCita)}/abono`, {
        method: "PUT",
        body: { abonoComprobante: comprobanteBase64 }
    });
    return reemplazarCitaEnMemoria(normalizarCitaDesdeBackend(respuesta));
}

/* ============================================================
 * LECTURA SINCRONA (sobre la copia en memoria de esta pagina)
 * ============================================================ */

function obtenerTodasLasCitas() {
    return [...citasEnMemoria];
}

function obtenerCitaPorId(idCita) {
    return citasEnMemoria.find(cita => String(cita.id) === String(idCita)) || null;
}

function obtenerCitasPorUsuarioId(idUsuario) {
    return citasEnMemoria.filter(cita => String(cita.usuarioId) === String(idUsuario));
}

function citasPorFecha(fechaISO) {
    return obtenerTodasLasCitas()
        .filter(cita => cita.fecha === fechaISO)
        .sort((a, b) => normalizarHoraA24(a.hora).localeCompare(normalizarHoraA24(b.hora)));
}

// estados que no bloquean la franja horaria para nuevas citas
const ESTADOS_QUE_NO_OCUPAN_FRANJA = ["Cancelada", "Rechazada"];

/*
 * Franjas ocupadas de una fecha. Si ya se pidieron al servidor
 * (cargarHorasOcupadasEnFecha) se usan esas, que incluyen a todos los
 * clientes; si no, se derivan de las citas cargadas en memoria.
 */
function horasOcupadasEnFecha(fechaISO) {
    if (horasOcupadasPorFecha[fechaISO]) {
        return new Set(horasOcupadasPorFecha[fechaISO]);
    }

    return new Set(
        citasPorFecha(fechaISO)
            .filter(cita => !ESTADOS_QUE_NO_OCUPAN_FRANJA.includes(cita.estado))
            .map(cita => horaAFranja(cita.hora))
    );
}

function horaEstaDisponible(fechaISO, horaTexto) {
    return !horasOcupadasEnFecha(fechaISO).has(horaAFranja(horaTexto));
}

function citasPorMascota(nombreMascota) {
    const nombreNormalizado = String(nombreMascota || "").trim().toLowerCase();
    if (!nombreNormalizado) return [];

    return obtenerTodasLasCitas().filter(cita =>
        String(cita.nombreMascota || "").trim().toLowerCase() === nombreNormalizado
    );
}

function citasPorMascotaId(idMascota) {
    return obtenerTodasLasCitas().filter(cita => String(cita.mascotaId) === String(idMascota));
}

function obtenerProximaCitaPorMascota(nombreMascota) {
    const estadosTerminados = ["Cancelada", "Rechazada", "Completada"];
    const ahora = new Date();
    return citasPorMascota(nombreMascota)
        .filter(cita => !estadosTerminados.includes(cita.estado))
        .filter(cita => momentoCita(cita) >= ahora)
        .sort((a, b) => momentoCita(a) - momentoCita(b))[0] || null;
}

function obtenerProximaCitaPorMascotaId(idMascota) {
    const estadosTerminados = ["Cancelada", "Rechazada", "Completada"];
    const ahora = new Date();
    return citasPorMascotaId(idMascota)
        .filter(cita => !estadosTerminados.includes(cita.estado))
        .filter(cita => momentoCita(cita) >= ahora)
        .sort((a, b) => momentoCita(a) - momentoCita(b))[0] || null;
}

function obtenerCitasConRecordatorioPorMascota(nombreMascota) {
    return citasPorMascota(nombreMascota)
        .filter(cita => cita.estado === "Completada" && cita.recordatorio?.texto)
        .sort((a, b) =>
            new Date(b.recordatorio.fechaCreacion || 0) - new Date(a.recordatorio.fechaCreacion || 0)
        );
}

function obtenerCitasConRecordatorioPorMascotaId(idMascota) {
    return citasPorMascotaId(idMascota)
        .filter(cita => cita.estado === "Completada" && cita.recordatorio?.texto)
        .sort((a, b) =>
            new Date(b.recordatorio.fechaCreacion || 0) - new Date(a.recordatorio.fechaCreacion || 0)
        );
}

function hoyISO() {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
}

function sumarDiasISO(fechaISO, dias) {
    const [anio, mes, dia] = fechaISO.split("-").map(Number);
    const fecha = new Date(anio, mes - 1, dia);
    fecha.setDate(fecha.getDate() + dias);
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
}

function fechaISOaTextoLargo(fechaISO) {
    if (!fechaISO) return "Fecha no definida";
    try {
        const [anio, mes, dia] = fechaISO.split("-").map(Number);
        const fecha = new Date(anio, mes - 1, dia);
        const texto = new Intl.DateTimeFormat("es-CO", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }).format(fecha);
        return texto.replace(/^./, letra => letra.toUpperCase());
    } catch (error) {
        return fechaISO;
    }
}

function normalizarHoraA24(horaTexto) {
    if (!horaTexto) return "00:00";
    const texto = String(horaTexto).toLowerCase().trim();
    const match = texto.match(/(\d{1,2}):(\d{2})\s*(a\.?\s*m\.?|p\.?\s*m\.?|am|pm)?/);
    if (!match) return "00:00";

    let horas = parseInt(match[1], 10);
    const minutos = match[2];
    const periodo = match[3];
    if (periodo) {
        const esPM = periodo.startsWith("p");
        if (esPM && horas < 12) horas += 12;
        if (!esPM && horas === 12) horas = 0;
    }
    return `${String(horas).padStart(2, "0")}:${minutos}`;
}

function horaAFranja(horaTexto) {
    const [hora] = normalizarHoraA24(horaTexto).split(":");
    return `${hora}:00`;
}

function momentoCita(cita) {
    const [anio, mes, dia] = String(cita.fecha || hoyISO()).split("-").map(Number);
    const [hora, minutos] = normalizarHoraA24(cita.hora).split(":").map(Number);
    return new Date(anio, mes - 1, dia, hora, minutos);
}

function obtenerCitasFuturas(idUsuario = null) {
    const estadosTerminados = ["Cancelada", "Rechazada", "Completada"];
    const ahora = new Date();
    const citas = idUsuario === null ? obtenerTodasLasCitas() : obtenerCitasPorUsuarioId(idUsuario);
    return citas
        .filter(cita => !estadosTerminados.includes(cita.estado))
        .filter(cita => momentoCita(cita) >= ahora)
        .sort((a, b) => momentoCita(a) - momentoCita(b));
}

function proximaCitaGlobal(idUsuario = null) {
    return obtenerCitasFuturas(idUsuario)[0] || null;
}
