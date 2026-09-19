/* Repositorio único de mascotas.
 *
 * La base de datos (API Spring Boot) es la ÚNICA fuente de verdad.
 * No se persiste nada en localStorage: la lista vive en memoria mientras
 * la página está abierta y se vuelve a pedir al servidor en cada carga
 * (sincronizarMascotasDesdeBackend). Toda escritura se hace primero contra
 * la API y, si falla, se propaga el error: nunca se guarda "por si acaso".
 *
 * Contrato Spring Boot:
 *   GET    /api/mascotas/usuario/{usuarioId}
 *   GET    /api/mascotas/{id}
 *   POST   /api/mascotas
 *   PUT    /api/mascotas/{id}
 *   DELETE /api/mascotas/{id}
 */

let mascotasEnMemoria = [];

/* ============================================================
 * LECTURA SÍNCRONA (sobre la copia en memoria de esta página)
 * ============================================================ */

function obtenerMascotas() {
    return [...mascotasEnMemoria];
}

function obtenerMascotaPorId(idMascota) {
    return mascotasEnMemoria.find(
        mascota => String(mascota.id) === String(idMascota)
    ) || null;
}

function obtenerMascotasPorUsuarioId(idUsuario) {
    return mascotasEnMemoria.filter(
        mascota => String(mascota.usuarioId) === String(idUsuario)
    );
}

function obtenerMascotaPorNombre(nombreMascota, idUsuario = null) {
    const nombre = String(nombreMascota || "").trim().toLowerCase();

    return mascotasEnMemoria.find(mascota =>
        String(mascota.nombre || "").trim().toLowerCase() === nombre &&
        (idUsuario === null || String(mascota.usuarioId) === String(idUsuario))
    ) || null;
}

function reemplazarMascotaEnMemoria(mascota) {
    const index = mascotasEnMemoria.findIndex(
        item => String(item.id) === String(mascota.id)
    );
    if (index === -1) {
        mascotasEnMemoria.push(mascota);
    } else {
        mascotasEnMemoria[index] = mascota;
    }
    return mascota;
}

/* ============================================================
 * ESCRITURA / SINCRONIZACIÓN (siempre contra la base de datos)
 * ============================================================ */

/**
 * Trae de la BD las mascotas del usuario y refresca la copia en memoria.
 * Lanza el error si el servidor no responde: quien llama decide qué mostrar.
 */
async function sincronizarMascotasDesdeBackend(idUsuario) {
    if (!tieneSesionBackendMascotas()) {
        mascotasEnMemoria = [];
        return [];
    }

    mascotasEnMemoria = await obtenerMascotasDesdeBackend(idUsuario);
    return obtenerMascotas();
}

/*
 * Primera carga de la pagina: varios scripts pueden pedirla a la vez y comparten
 * una sola peticion. Si falla, se puede reintentar.
 */
let promesaMascotasCargadas = null;
let claveMascotasCargadas = null;
function asegurarMascotasCargadas(idUsuario) {
    const clave = String(idUsuario ?? "");
    if (!promesaMascotasCargadas || claveMascotasCargadas !== clave) {
        claveMascotasCargadas = clave;
        promesaMascotasCargadas = sincronizarMascotasDesdeBackend(idUsuario).catch(error => {
            promesaMascotasCargadas = null;
            claveMascotasCargadas = null;
            throw error;
        });
    }
    return promesaMascotasCargadas;
}

/** Crea la mascota en la BD. Devuelve la mascota con su id definitivo. */
async function crearMascota(datosMascota) {
    if (!tieneSesionBackendMascotas()) {
        throw new Error("Debes iniciar sesión para registrar una mascota.");
    }

    const creada = await guardarMascotaEnBackend(datosMascota);
    if (!creada) {
        throw new Error("No se pudo registrar la mascota.");
    }
    return reemplazarMascotaEnMemoria(creada);
}

/** Actualiza la mascota en la BD y refresca la copia en memoria. */
async function actualizarMascota(idMascota, datosMascota) {
    if (!tieneSesionBackendMascotas()) {
        throw new Error("Debes iniciar sesión para editar una mascota.");
    }

    const actualizada = await actualizarMascotaEnBackend(idMascota, datosMascota);
    if (!actualizada) {
        throw new Error("No se pudo actualizar la mascota.");
    }
    return reemplazarMascotaEnMemoria(actualizada);
}

/** Elimina la mascota en la BD; solo si el servidor confirma se quita de memoria. */
async function eliminarMascota(idMascota) {
    if (!tieneSesionBackendMascotas()) {
        throw new Error("Debes iniciar sesión para eliminar una mascota.");
    }

    await eliminarMascotaEnBackend(idMascota);
    mascotasEnMemoria = mascotasEnMemoria.filter(
        mascota => String(mascota.id) !== String(idMascota)
    );
    return obtenerMascotas();
}

/**
 * Devuelve la mascota del usuario con ese nombre o la crea en la BD.
 * Se usa al agendar una cita cuando el cliente escribe una mascota nueva.
 */
async function registrarMascotaSiNoExiste(datosMascota) {
    const existente = obtenerMascotaPorNombre(datosMascota.nombre, datosMascota.usuarioId);
    if (existente) {
        return existente;
    }
    return crearMascota(datosMascota);
}

/* ============================================================
 * INTEGRACIÓN BACKEND — HTTP
 * ============================================================
 * Reutilizan apiBackend() y getTokenActual() de usuarios-storage.js.
 */

/**
 * Determina si existe un JWT asociado a una sesión
 * autenticada contra el backend.
 */
function tieneSesionBackendMascotas() {
    return (
        typeof getTokenActual === "function" &&
        Boolean(getTokenActual())
    );
}

/**
 * Convierte un valor proveniente del backend en un arreglo.
 *
 * Spring Boot almacena actualmente vacunas y alergias como String,
 * mientras que algunas partes del Front End trabajan con arreglos.
 *
 * Ejemplo:
 * "Rabia, Triple felina"
 *
 * se transforma en:
 * ["Rabia", "Triple felina"]
 */
function normalizarListaMascotaDesdeBackend(valor) {
    if (Array.isArray(valor)) {
        return valor;
    }

    return String(valor || "")
        .split(",")
        .map(item => item.trim())
        .filter(Boolean);
}

/**
 * Adapta una mascota recibida desde Spring Boot
 * al formato actualmente consumido por el Front End.
 */
function normalizarMascotaDesdeBackend(mascota = {}) {
    return {
        ...mascota,

        vacunas: normalizarListaMascotaDesdeBackend(
            mascota.vacunas
        ),

        alergias: normalizarListaMascotaDesdeBackend(
            mascota.alergias
        )
    };
}

/**
 * Convierte una mascota del Front End al contrato esperado
 * por MascotaDto en Spring Boot.
 *
 * Importante:
 * - El ID de la mascota NO se envía porque PostgreSQL lo genera.
 * - usuarioId se envía como String porque así lo recibe MascotaDto.
 * - peso debe llegar como número.
 * - fechas vacías se envían como null.
 * - vacunas y alergias se serializan temporalmente como String.
 * - "esterilizada" no se envía porque actualmente no existe
 *   en MascotaDto ni en MascotaModel.
 */
function crearPayloadMascotaBackend(mascota = {}) {
    const pesoTexto = String(mascota.peso ?? "")
        .trim()
        .replace(",", ".")
        .replace(/[^\d.-]/g, "");

    const pesoNumerico =
        pesoTexto === ""
            ? null
            : Number(pesoTexto);

    return {
        usuarioId: String(mascota.usuarioId ?? ""),

        nombre: String(mascota.nombre || "").trim(),

        especie: String(mascota.especie || "").trim(),

        raza: String(mascota.raza || "").trim(),

        sexo: String(mascota.sexo || "").trim(),

        fechaNacimiento:
            mascota.fechaNacimiento || null,

        peso:
            Number.isFinite(pesoNumerico)
                ? pesoNumerico
                : null,

        color: String(mascota.color || "").trim(),

        fechaUltimaConsulta:
            mascota.fechaUltimaConsulta || null,

        vacunas:
            Array.isArray(mascota.vacunas)
                ? mascota.vacunas.join(", ")
                : String(mascota.vacunas || "").trim(),

        alergias:
            Array.isArray(mascota.alergias)
                ? mascota.alergias.join(", ")
                : String(mascota.alergias || "").trim(),

        observaciones:
            String(mascota.observaciones || "").trim(),

        foto:
            mascota.foto || ""
    };
}

/**
 * Obtiene todas las mascotas pertenecientes
 * a un usuario específico.
 *
 * GET /api/mascotas/usuario/{usuarioId}
 */
async function obtenerMascotasDesdeBackend(usuarioId) {
    if (!tieneSesionBackendMascotas()) {
        return [];
    }

    const respuesta = await apiBackend(
        `/mascotas/usuario/${encodeURIComponent(usuarioId)}`
    );

    const mascotas =
        Array.isArray(respuesta)
            ? respuesta
            : [];

    return mascotas.map(
        normalizarMascotaDesdeBackend
    );
}

/**
 * Obtiene una mascota por su identificador.
 *
 * El identificador es Long y lo genera PostgreSQL.
 *
 * GET /api/mascotas/{id}
 */
async function obtenerMascotaDesdeBackend(idMascota) {
    if (!tieneSesionBackendMascotas()) {
        return null;
    }

    const respuesta = await apiBackend(
        `/mascotas/${encodeURIComponent(idMascota)}`
    );

    return respuesta
        ? normalizarMascotaDesdeBackend(respuesta)
        : null;
}

/**
 * Registra una nueva mascota en PostgreSQL.
 *
 * POST /api/mascotas
 *
 * El usuarioId enviado debe coincidir con el usuario
 * autenticado en el JWT.
 */
async function guardarMascotaEnBackend(mascota) {
    if (!tieneSesionBackendMascotas()) {
        return null;
    }

    const payload =
        crearPayloadMascotaBackend(mascota);

    const respuesta = await apiBackend(
        "/mascotas",
        {
            method: "POST",
            body: payload
        }
    );

    return respuesta
        ? normalizarMascotaDesdeBackend(respuesta)
        : null;
}

/**
 * Actualiza una mascota existente.
 *
 * PUT /api/mascotas/{id}
 */
async function actualizarMascotaEnBackend(
    idMascota,
    mascota
) {
    if (!tieneSesionBackendMascotas()) {
        return null;
    }

    const payload =
        crearPayloadMascotaBackend(mascota);

    const respuesta = await apiBackend(
        `/mascotas/${encodeURIComponent(idMascota)}`,
        {
            method: "PUT",
            body: payload
        }
    );

    return respuesta
        ? normalizarMascotaDesdeBackend(respuesta)
        : null;
}

/**
 * Elimina una mascota existente.
 *
 * DELETE /api/mascotas/{id}
 */
async function eliminarMascotaEnBackend(idMascota) {
    if (!tieneSesionBackendMascotas()) {
        return false;
    }

    await apiBackend(
        `/mascotas/${encodeURIComponent(idMascota)}`,
        {
            method: "DELETE"
        }
    );

    return true;
}