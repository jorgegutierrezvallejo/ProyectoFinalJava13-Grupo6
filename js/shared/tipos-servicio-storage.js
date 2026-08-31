/* Repositorio unico de tipos de servicio. */
const TIPOS_SERVICIO_STORAGE_KEY = "tiposServicio";

function obtenerTiposServicio() {
    const tipos = HuellaVetStorage.leer(TIPOS_SERVICIO_STORAGE_KEY, []);
    return Array.isArray(tipos) ? tipos : [];
}

function guardarTiposServicio(tipos) {
    return HuellaVetStorage.guardar(TIPOS_SERVICIO_STORAGE_KEY, Array.isArray(tipos) ? tipos : []);
}

function crearTipoServicio(nombreCrudo) {
    const nombre = String(nombreCrudo || "").trim();
    if (!nombre) return null;

    const tipos = obtenerTiposServicio();
    const existente = tipos.find(tipo => tipo.nombre.toLowerCase() === nombre.toLowerCase());
    if (existente) return existente;

    const tipo = { id: Date.now(), nombre };
    tipos.push(tipo);
    guardarTiposServicio(tipos);
    return tipo;
}

function obtenerTipoServicioPorId(idTipo) {
    return obtenerTiposServicio().find(tipo => String(tipo.id) === String(idTipo)) || null;
}

function nombreTipoServicio(idTipo) {
    return obtenerTipoServicioPorId(idTipo)?.nombre || "Sin tipo";
}
