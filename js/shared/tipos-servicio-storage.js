/* Repositorio unico de tipos de servicio.
 *
 * La base de datos (API Spring Boot) es la UNICA fuente de verdad.
 * GET /api/tipos-servicio es publico. La lista vive en memoria mientras la
 * pagina esta abierta (nada en localStorage) y cada pagina debe esperar
 * sincronizarTiposServicioDesdeBackend() antes de pintar.
 */
let tiposServicioEnMemoria = [];

function obtenerTiposServicio() {
    return [...tiposServicioEnMemoria];
}

/* Refresca la copia en memoria con la BD. Lanza el error si el servidor falla. */
async function sincronizarTiposServicioDesdeBackend() {
    const respuesta = await apiBackend("/tipos-servicio");
    tiposServicioEnMemoria = Array.isArray(respuesta) ? respuesta : [];
    document.dispatchEvent(new CustomEvent("tiposServicioSincronizados"));
    return obtenerTiposServicio();
}

/* Primera carga de la pagina: una sola peticion aunque varios scripts la pidan. */
let promesaTiposServicioCargados = null;
function asegurarTiposServicioCargados() {
    if (!promesaTiposServicioCargados) {
        promesaTiposServicioCargados = sincronizarTiposServicioDesdeBackend().catch(error => {
            promesaTiposServicioCargados = null;
            throw error;
        });
    }
    return promesaTiposServicioCargados;
}

/*
 * Crea el tipo en la BD (o devuelve el existente con ese nombre).
 * El id es siempre el que genera la base de datos, nunca uno temporal.
 */
async function crearTipoServicio(nombreCrudo) {
    const nombre = String(nombreCrudo || "").trim();
    if (!nombre) return null;

    const existente = tiposServicioEnMemoria.find(
        tipo => String(tipo.nombre || "").toLowerCase() === nombre.toLowerCase()
    );
    if (existente) return existente;

    if (!tieneSesionBackendActiva()) {
        throw new Error("Debes iniciar sesión para crear una categoría.");
    }

    const creado = await apiBackend("/tipos-servicio", {
        method: "POST",
        body: { id: null, nombre }
    });
    tiposServicioEnMemoria.push(creado);
    document.dispatchEvent(new CustomEvent("tiposServicioSincronizados"));
    return creado;
}

function obtenerTipoServicioPorId(idTipo) {
    return tiposServicioEnMemoria.find(tipo => String(tipo.id) === String(idTipo)) || null;
}

function nombreTipoServicio(idTipo) {
    return obtenerTipoServicioPorId(idTipo)?.nombre || "Sin tipo";
}
