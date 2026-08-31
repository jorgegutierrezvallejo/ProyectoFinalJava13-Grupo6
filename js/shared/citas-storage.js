/* Repositorio unico de citas para las areas publica, admin y usuario. */
const CITAS_STORAGE_KEY = "citas";
const HORAS_AGENDA = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

function obtenerTodasLasCitas() {
    const citas = HuellaVetStorage.leer(CITAS_STORAGE_KEY, []);
    return Array.isArray(citas) ? citas : [];
}

function guardarTodasLasCitas(citas) {
    return HuellaVetStorage.guardar(CITAS_STORAGE_KEY, Array.isArray(citas) ? citas : []);
}

function agregarCita(cita) {
    const citas = obtenerTodasLasCitas();
    citas.unshift(cita);
    guardarTodasLasCitas(citas);
    return cita;
}

function obtenerCitaPorId(idCita) {
    return obtenerTodasLasCitas().find(cita => String(cita.id) === String(idCita)) || null;
}

function actualizarEstadoCita(idCita, nuevoEstado) {
    return actualizarCamposCita(idCita, { estado: nuevoEstado });
}

function actualizarCamposCita(idCita, camposParciales) {
    const citas = obtenerTodasLasCitas();
    const index = citas.findIndex(cita => String(cita.id) === String(idCita));
    if (index === -1) return null;

    citas[index] = {
        ...citas[index],
        ...camposParciales,
        actualizadoEn: new Date().toISOString()
    };
    guardarTodasLasCitas(citas);
    return citas[index];
}

function citasPorFecha(fechaISO) {
    return obtenerTodasLasCitas()
        .filter(cita => cita.fecha === fechaISO)
        .sort((a, b) => normalizarHoraA24(a.hora).localeCompare(normalizarHoraA24(b.hora)));
}

function citasPorMascota(nombreMascota) {
    const nombreNormalizado = String(nombreMascota || "").trim().toLowerCase();
    if (!nombreNormalizado) return [];

    return obtenerTodasLasCitas().filter(cita =>
        String(cita.nombreMascota || "").trim().toLowerCase() === nombreNormalizado
    );
}

function obtenerProximaCitaPorMascota(nombreMascota) {
    const estadosTerminados = ["Cancelada", "Rechazada", "Completada"];
    const ahora = new Date();
    return citasPorMascota(nombreMascota)
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

function obtenerCitasFuturas() {
    const estadosTerminados = ["Cancelada", "Rechazada", "Completada"];
    const ahora = new Date();
    return obtenerTodasLasCitas()
        .filter(cita => !estadosTerminados.includes(cita.estado))
        .filter(cita => momentoCita(cita) >= ahora)
        .sort((a, b) => momentoCita(a) - momentoCita(b));
}

function proximaCitaGlobal() {
    return obtenerCitasFuturas()[0] || null;
}
