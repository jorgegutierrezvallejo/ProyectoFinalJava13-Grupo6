/* ========================================
   CITAS - DATOS COMPARTIDOS
   Fuente unica de verdad para leer y escribir
   las citas guardadas en localStorage.

   Lo usan: admin-dashboard.js (calendario) y
   admin-citas.js (agenda del dia + panel).

   Por eso este archivo se carga ANTES que
   admin-dashboard.js / admin-citas.js en el
   <head>/<body> de cada html.
======================================== */

// Horas de atencion de la clinica (franjas de la agenda).
const HORAS_AGENDA = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

function obtenerTodasLasCitas() {
    try {
        return JSON.parse(localStorage.getItem("citas")) || [];
    } catch (e) {
        return [];
    }
}

function guardarTodasLasCitas(citas) {
    localStorage.setItem("citas", JSON.stringify(citas));
}

function obtenerCitaPorId(idCita) {
    return obtenerTodasLasCitas().find(c => String(c.id) === String(idCita)) || null;
}

// Actualiza el estado de una cita (Pendiente, Confirmada, En curso,
// Completada, Reprogramada, Cancelada...) y la guarda. Devuelve la
// cita ya actualizada, o null si no existe.
function actualizarEstadoCita(idCita, nuevoEstado) {
    const citas = obtenerTodasLasCitas();
    const index = citas.findIndex(c => String(c.id) === String(idCita));
    if (index === -1) return null;

    citas[index].estado = nuevoEstado;
    citas[index].actualizadoEn = new Date().toISOString();
    guardarTodasLasCitas(citas);
    return citas[index];
}

// Todas las citas de una fecha (YYYY-MM-DD), ordenadas por hora.
function citasPorFecha(fechaISO) {
    return obtenerTodasLasCitas()
        .filter(c => c.fecha === fechaISO)
        .sort((a, b) => normalizarHoraA24(a.hora).localeCompare(normalizarHoraA24(b.hora)));
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

// "2026-08-30" -> "Domingo, 30 de agosto de 2026"
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
    } catch (e) {
        return fechaISO;
    }
}

// Convierte "10:30 a. m.", "09:00 AM", "2:00 p. m.", "14:00" etc.
// a formato 24 horas "HH:MM", para poder ordenar y comparar horas
// aunque vengan guardadas con formatos distintos.
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

// Redondea una hora a la franja en punto de HORAS_AGENDA (ignora minutos).
function horaAFranja(horaTexto) {
    const [h] = normalizarHoraA24(horaTexto).split(":");
    return `${h}:00`;
}

// La cita mas cercana en el futuro entre TODAS las citas guardadas
// (sin importar la fecha seleccionada en la agenda). Se usa para el
// panel "Proxima Cita" cuando el admin no ha hecho clic en ninguna.
function proximaCitaGlobal() {
    const ahora = new Date();

    const candidatas = obtenerTodasLasCitas()
        .filter(c => c.estado !== "Cancelada" && c.estado !== "Rechazada" && c.estado !== "Completada")
        .map(c => {
            const [anio, mes, dia] = (c.fecha || hoyISO()).split("-").map(Number);
            const [h, m] = normalizarHoraA24(c.hora).split(":").map(Number);
            return { cita: c, momento: new Date(anio, mes - 1, dia, h, m) };
        })
        .filter(item => item.momento >= ahora)
        .sort((a, b) => a.momento - b.momento);

    return candidatas.length > 0 ? candidatas[0].cita : null;
}

// Actualiza varios campos de una cita a la vez (motivo de un cambio de
// estado, recordatorio creado al finalizar, datos del abono, etc.) sin
// pisar el resto de la cita. Devuelve la cita ya actualizada, o null.
function actualizarCamposCita(idCita, camposParciales) {
    const citas = obtenerTodasLasCitas();
    const index = citas.findIndex(c => String(c.id) === String(idCita));
    if (index === -1) return null;

    citas[index] = { ...citas[index], ...camposParciales, actualizadoEn: new Date().toISOString() };
    guardarTodasLasCitas(citas);
    return citas[index];
}
