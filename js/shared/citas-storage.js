/* Repositorio unico de citas para las areas publica, admin y usuario. */
const CITAS_STORAGE_KEY = "citas";
const HORAS_AGENDA = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

function tieneSesionBackendActiva() {
    return typeof getTokenActual === "function" && Boolean(getTokenActual());
}

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
        id: cita.id ?? Date.now(),
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
        tieneCostoReserva: Boolean(cita.tieneCostoReserva)
    };
}

async function obtenerCitasDesdeBackend(idUsuario = null) {
    if (!tieneSesionBackendActiva()) return [];

    try {
        const ruta = idUsuario == null
            ? "/citas"
            : `/citas/usuario/${encodeURIComponent(idUsuario)}`;
        const respuesta = await apiBackend(ruta);
        const citas = Array.isArray(respuesta) ? respuesta : [];
        return citas.map(normalizarCitaDesdeBackend);
    } catch (error) {
        console.warn("No se pudieron cargar las citas desde el backend:", error);
        return [];
    }
}

async function guardarCitaEnBackend(cita) {
    if (!tieneSesionBackendActiva()) {
        return null;
    }

    const payload = {
        usuarioId: String(cita.usuarioId || ""),
        mascotaId: String(cita.mascotaId || ""),
        servicioId: Number(cita.servicioId ?? 0),
        fecha: cita.fecha || hoyISO(),
        hora: normalizarHoraApi(cita.hora),
        estado: cita.estado || "Pendiente",
        modalidad: cita.modalidad || "clinica",
        ubicacion: cita.ubicacion || "HuellaVet — Sede Centro",
        motivo: cita.motivo || "",
        tieneCostoReserva: Boolean(cita.tieneCostoReserva),
        costoReserva: Number(cita.costoReserva || 0),
        nombreMascota: cita.nombreMascota || "Mascota",
        servicioNombre: cita.servicioNombre || "Consulta general"
    };

    return apiBackend("/citas", {
        method: "POST",
        body: payload
    });
}

/*
 * Trae del backend solo las citas que corresponden al rol de quien esta
 * conectado: un VETERINARIO solo debe ver sus propias citas asignadas
 * (no las de toda la clinica), mientras que ADMINISTRADOR ve todas.
 * Este es el punto unico que usan admin-dashboard.js, admin-citas.js y
 * topbar.js para que el dashboard admin quede correctamente enlazado
 * con el rol veterinario.
 */
async function obtenerCitasVisiblesSegunRolActual() {
    const usuarioActivo = typeof obtenerUsuarioRegistrado === "function" ? obtenerUsuarioRegistrado() : null;
    const rol = String(usuarioActivo?.rol || "").toUpperCase();

    if (rol === "VETERINARIO" && usuarioActivo?.id != null) {
        return obtenerCitasDesdeBackendPorVeterinario(usuarioActivo.id);
    }
    return obtenerCitasDesdeBackend();
}

async function obtenerCitasDesdeBackendPorVeterinario(idVeterinario) {
    if (!tieneSesionBackendActiva()) return [];

    try {
        const respuesta = await apiBackend(`/citas/veterinario/${encodeURIComponent(idVeterinario)}`);
        const citas = Array.isArray(respuesta) ? respuesta : [];
        return citas.map(normalizarCitaDesdeBackend);
    } catch (error) {
        console.warn("No se pudieron cargar las citas del veterinario:", error);
        return [];
    }
}

async function sincronizarCitasDesdeBackend(idUsuario = null) {
    if (!tieneSesionBackendActiva()) {
        return obtenerTodasLasCitas();
    }

    try {
        const citasBackend = await obtenerCitasDesdeBackend(idUsuario);
        // Se guarda siempre (incluso vacio) para que el cache refleje
        // fielmente lo que hay en la base de datos, sin dejar citas
        // "fantasma" de una sesion anterior.
        guardarTodasLasCitas(citasBackend);
        return obtenerTodasLasCitas();
    } catch (error) {
        console.warn("No se pudo sincronizar citas desde el backend:", error);
        return obtenerTodasLasCitas();
    }
}

async function actualizarEstadoCitaEnBackend(idCita, nuevoEstado, datosNuevos = null) {
    if (!tieneSesionBackendActiva()) return null;

    const mapEstado = {
        Pendiente: "aceptar",
        Confirmada: "aceptar",
        "En curso": "iniciar",
        Rechazada: "rechazar",
        Cancelada: "cancelar",
        Completada: "completar",
        Reprogramada: "reprogramar"
    };

    const accion = mapEstado[nuevoEstado];
    if (!accion) return null;

    return apiBackend(`/citas/${encodeURIComponent(idCita)}/${accion}`, {
        method: "PUT"
        , ...(accion === "reprogramar" && datosNuevos ? { body: datosNuevos } : {})
    });
}

function obtenerTodasLasCitas() {
    const citas = HuellaVetStorage.leer(CITAS_STORAGE_KEY, []);
    return Array.isArray(citas) ? citas : [];
}

function guardarTodasLasCitas(citas) {
    return HuellaVetStorage.guardar(CITAS_STORAGE_KEY, Array.isArray(citas) ? citas : []);
}

function guardarCitaEnCache(cita) {
    const citas = obtenerTodasLasCitas();
    citas.unshift(cita);
    guardarTodasLasCitas(citas);

    if (tieneSesionBackendActiva()) {
        guardarCitaEnBackend(cita).catch(error => {
            console.warn("No se pudo sincronizar la cita con el backend:", error);
        });
    }

    return cita;
}

/*
 * Crea la cita en el backend (fuente de verdad) y solo si la operacion
 * es exitosa actualiza el cache local con los datos reales de la BD
 * (id definitivo, estado, etc). Si el backend falla, lanza el error
 * para que quien llama pueda informar al usuario; no se guarda nada
 * de forma optimista en localStorage.
 */
async function agregarCita(cita) {
    if (!tieneSesionBackendActiva()) {
        throw new Error("Debes iniciar sesión para agendar una cita.");
    }

    const citaCreadaEnBackend = await guardarCitaEnBackend(cita);
    const citaNormalizada = normalizarCitaDesdeBackend(citaCreadaEnBackend || cita);
    return guardarCitaEnCache(citaNormalizada);
}

function obtenerCitaPorId(idCita) {
    return obtenerTodasLasCitas().find(cita => String(cita.id) === String(idCita)) || null;
}

function obtenerCitasPorUsuarioId(idUsuario) {
    return obtenerTodasLasCitas().filter(cita => String(cita.usuarioId) === String(idUsuario));
}

/*
 * Cambia el estado de una cita SIEMPRE contra el backend primero.
 * El cache local (localStorage) solo se actualiza despues de que la BD
 * confirma el cambio, para que nunca quede desincronizado con Supabase.
 */
async function actualizarEstadoCita(idCita, nuevoEstado, datosNuevos = null) {
    if (!tieneSesionBackendActiva()) {
        throw new Error("Debes iniciar sesión para modificar esta cita.");
    }

    const citaActualizadaEnBackend = await actualizarEstadoCitaEnBackend(idCita, nuevoEstado, datosNuevos);
    if (!citaActualizadaEnBackend) {
        throw new Error("No se pudo actualizar el estado de la cita.");
    }

    const citaNormalizada = normalizarCitaDesdeBackend(citaActualizadaEnBackend);
    return actualizarCamposCita(idCita, citaNormalizada);
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

// estados que no bloquean la franja horaria para nuevas citas
const ESTADOS_QUE_NO_OCUPAN_FRANJA = ["Cancelada", "Rechazada"];

function horasOcupadasEnFecha(fechaISO) {
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
