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

/*
 * Crea el tipo de servicio EN EL BACKEND primero (fuente de verdad).
 * Solo si la peticion tiene exito se actualiza el cache local, con el
 * id real que genera PostgreSQL. Si falla (ej. 403 por permisos, o el
 * backend no responde), se lanza el error para que quien llama pueda
 * avisar al usuario -- ya no se guarda nada de forma optimista con un
 * id inventado en el navegador (Date.now()).
 */
async function crearTipoServicio(nombreCrudo) {
    const nombre = String(nombreCrudo || "").trim();
    if (!nombre) return null;

    // Evita crear un tipo duplicado si ya existe en el cache local.
    const existente = obtenerTiposServicio()
        .find(tipo => String(tipo.nombre).toLowerCase() === nombre.toLowerCase());
    if (existente) return existente;

    if (typeof apiBackend !== "function" || typeof getTokenActual !== "function" || !getTokenActual()) {
        throw new Error("Debes iniciar sesión para crear un tipo de servicio.");
    }

    const tipoCreadoEnBackend = await apiBackend("/tipos-servicio", {
        method: "POST",
        body: { nombre }
    });

    if (!tipoCreadoEnBackend || tipoCreadoEnBackend.id == null) {
        throw new Error("El servidor no devolvió un tipo de servicio válido.");
    }

    const tipos = obtenerTiposServicio();
    tipos.push(tipoCreadoEnBackend);
    guardarTiposServicio(tipos);
    document.dispatchEvent(new CustomEvent("tiposServicioSincronizados"));

    return tipoCreadoEnBackend;
}

/*
 * Actualiza el nombre de un tipo de servicio existente.
 * PUT /api/tipos-servicio/{id}
 */
async function actualizarTipoServicio(idTipo, nombreCrudo) {
    const nombre = String(nombreCrudo || "").trim();
    if (!nombre) throw new Error("El nombre no puede estar vacío.");

    if (typeof apiBackend !== "function" || typeof getTokenActual !== "function" || !getTokenActual()) {
        throw new Error("Debes iniciar sesión para editar un tipo de servicio.");
    }

    const tipoActualizado = await apiBackend(`/tipos-servicio/${encodeURIComponent(idTipo)}`, {
        method: "PUT",
        body: { id: idTipo, nombre }
    });

    const tipos = obtenerTiposServicio();
    const indice = tipos.findIndex(item => String(item.id) === String(idTipo));
    if (indice !== -1) {
        tipos[indice] = tipoActualizado;
    } else {
        tipos.push(tipoActualizado);
    }
    guardarTiposServicio(tipos);
    document.dispatchEvent(new CustomEvent("tiposServicioSincronizados"));

    return tipoActualizado;
}

/*
 * Elimina un tipo de servicio.
 * DELETE /api/tipos-servicio/{id}
 */
async function eliminarTipoServicio(idTipo) {
    if (typeof apiBackend !== "function" || typeof getTokenActual !== "function" || !getTokenActual()) {
        throw new Error("Debes iniciar sesión para eliminar un tipo de servicio.");
    }

    await apiBackend(`/tipos-servicio/${encodeURIComponent(idTipo)}`, { method: "DELETE" });

    const tipos = obtenerTiposServicio().filter(tipo => String(tipo.id) !== String(idTipo));
    guardarTiposServicio(tipos);
    document.dispatchEvent(new CustomEvent("tiposServicioSincronizados"));

    return tipos;
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