/* Repositorio único de mascotas.
 * Mantiene temporalmente la persistencia local existente
 * y añade la integración con el backend Spring Boot.
 */

const MASCOTAS_STORAGE_KEY = "mascotas";

/* ============================================================
 * PERSISTENCIA LOCAL — LEGACY / RESPALDO TEMPORAL
 * ============================================================ */

function obtenerMascotas() {
    const mascotas = HuellaVetStorage.leer(MASCOTAS_STORAGE_KEY, []);
    return Array.isArray(mascotas) ? mascotas : [];
}

function guardarMascotas(mascotas) {
    return HuellaVetStorage.guardar(
        MASCOTAS_STORAGE_KEY,
        Array.isArray(mascotas) ? mascotas : []
    );
}

function asegurarMascotasIniciales(mascotasIniciales) {
    if (!HuellaVetStorage.existe(MASCOTAS_STORAGE_KEY)) {
        guardarMascotas(mascotasIniciales);
    }

    return obtenerMascotas();
}

function obtenerMascotaPorId(idMascota) {
    return obtenerMascotas().find(
        mascota => String(mascota.id) === String(idMascota)
    ) || null;
}

function obtenerMascotasPorUsuarioId(idUsuario) {
    return obtenerMascotas().filter(
        mascota => String(mascota.usuarioId) === String(idUsuario)
    );
}

function obtenerMascotaPorNombre(nombreMascota, idUsuario = null) {
    const nombre = String(nombreMascota || "")
        .trim()
        .toLowerCase();

    return obtenerMascotas().find(mascota =>
        String(mascota.nombre || "")
            .trim()
            .toLowerCase() === nombre &&
        (
            idUsuario === null ||
            String(mascota.usuarioId) === String(idUsuario)
        )
    ) || null;
}

function guardarMascota(mascota) {
    const mascotas = obtenerMascotas();

    const index = mascotas.findIndex(
        item => String(item.id) === String(mascota.id)
    );

    if (index === -1) {
        mascotas.push(mascota);
    } else {
        mascotas[index] = {
            ...mascotas[index],
            ...mascota
        };
    }

    guardarMascotas(mascotas);

    return mascota;
}

function registrarMascotaSiNoExiste(datosMascota) {
    const existente = obtenerMascotaPorNombre(
        datosMascota.nombre,
        datosMascota.usuarioId
    );

    if (existente) {
        return existente;
    }

    const mascota = {
        id: datosMascota.id || crypto.randomUUID(),
        ...datosMascota,
        creadaEn: datosMascota.creadaEn || new Date().toISOString()
    };

    guardarMascota(mascota);

    return mascota;
}

function eliminarMascota(idMascota) {
    const mascotas = obtenerMascotas().filter(
        mascota => String(mascota.id) !== String(idMascota)
    );

    guardarMascotas(mascotas);

    return mascotas;
}

/* ============================================================
 * INTEGRACIÓN BACKEND — MASCOTAS
 * ============================================================
 *
 * Contrato Spring Boot:
 *
 * GET    /api/mascotas
 * GET    /api/mascotas/{id}
 * GET    /api/mascotas/usuario/{usuarioId}
 * POST   /api/mascotas
 * PUT    /api/mascotas/{id}
 * DELETE /api/mascotas/{id}
 *
 * Estas funciones reutilizan apiBackend() y getTokenActual()
 * definidos previamente en usuarios-storage.js.
 *
 * La persistencia local se conserva temporalmente mientras
 * se valida la migración completa Front End ↔ Back End.
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