/* Repositorio unico de tipos de servicio. */
const TIPOS_SERVICIO_STORAGE_KEY = "tiposServicio";

document.addEventListener("DOMContentLoaded", () => {
    sincronizarTiposServicioDesdeBackend();
});

function obtenerTiposServicio() {
    const tipos = HuellaVetStorage.leer(TIPOS_SERVICIO_STORAGE_KEY, []);
    return Array.isArray(tipos) ? tipos : [];
}

function guardarTiposServicio(tipos) {
    return HuellaVetStorage.guardar(TIPOS_SERVICIO_STORAGE_KEY, Array.isArray(tipos) ? tipos : []);
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

async function sincronizarTiposServicioDesdeBackend() {
    if (typeof apiBackend !== "function") return obtenerTiposServicio();

    try {
        const respuesta = await apiBackend("/tipos-servicio");
        const tipos = Array.isArray(respuesta) ? respuesta : [];
        guardarTiposServicio(tipos);
        document.dispatchEvent(new CustomEvent("tiposServicioSincronizados"));
        return tipos;
    } catch (error) {
        console.warn("No se pudieron cargar los tipos de servicio:", error);
        return obtenerTiposServicio();
    }
}

function obtenerTipoServicioPorId(idTipo) {
    return obtenerTiposServicio().find(tipo => String(tipo.id) === String(idTipo)) || null;
}

function nombreTipoServicio(idTipo) {
    return obtenerTipoServicioPorId(idTipo)?.nombre || "Sin tipo";
}
