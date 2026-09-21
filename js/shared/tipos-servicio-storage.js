/*
 * Repositorio unico de tipos de servicio.
 *
 * La base de datos (API Spring Boot -> Supabase) es la UNICA fuente de verdad.
 * No se persiste nada en localStorage: la lista vive en memoria mientras la
 * pagina esta abierta.
 *
 * Contrato Spring Boot:
 *   GET  /api/tipos-servicio   (publico)
 *   POST /api/tipos-servicio   (VETERINARIO / ADMINISTRADOR)
 */
let tiposServicioEnMemoria = [];

document.addEventListener("DOMContentLoaded", () => {
    asegurarTiposServicioCargados();
});

function obtenerTiposServicio() {
    return [...tiposServicioEnMemoria];
}

/* Solo actualiza la copia en memoria (nombre historico conservado por compatibilidad). */
function guardarTiposServicio(tipos) {
    tiposServicioEnMemoria = Array.isArray(tipos) ? tipos : [];
    return true;
}

async function crearTipoServicio(nombreCrudo) {
    const nombre = String(nombreCrudo || "").trim();
    if (!nombre) return null;

    const existente = obtenerTiposServicio().find(tipo => tipo.nombre.toLowerCase() === nombre.toLowerCase());
    if (existente) return existente;

    if (typeof getTokenActual !== "function" || !getTokenActual()) {
        throw new Error("Debes iniciar sesión para crear un tipo de servicio.");
    }

    const tipoBackend = await apiBackend("/tipos-servicio", { method: "POST", body: { id: null, nombre } });
    guardarTiposServicio([...obtenerTiposServicio(), tipoBackend]);
    return tipoBackend;
}

let ultimaCargaTiposFallo = false;

async function sincronizarTiposServicioDesdeBackend() {
    if (typeof apiBackend !== "function") return obtenerTiposServicio();

    try {
        const respuesta = await apiBackend("/tipos-servicio");
        guardarTiposServicio(Array.isArray(respuesta) ? respuesta : []);
        ultimaCargaTiposFallo = false;
        document.dispatchEvent(new CustomEvent("tiposServicioSincronizados"));
    } catch (error) {
        ultimaCargaTiposFallo = true;
        console.warn("No se pudieron cargar los tipos de servicio:", error);
    }
    return obtenerTiposServicio();
}

/*
 * Primera carga de la pagina: si varios scripts piden los tipos de servicio
 * a la vez comparten una sola peticion al backend. Si falla, se reintenta
 * en la siguiente llamada.
 */
let promesaTiposServicioCargados = null;
function asegurarTiposServicioCargados() {
    if (!promesaTiposServicioCargados) {
        promesaTiposServicioCargados = sincronizarTiposServicioDesdeBackend().then(tipos => {
            if (ultimaCargaTiposFallo) promesaTiposServicioCargados = null;
            return tipos;
        });
    }
    return promesaTiposServicioCargados;
}

function obtenerTipoServicioPorId(idTipo) {
    return obtenerTiposServicio().find(tipo => String(tipo.id) === String(idTipo)) || null;
}

function nombreTipoServicio(idTipo) {
    return obtenerTipoServicioPorId(idTipo)?.nombre || "Sin tipo";
}
