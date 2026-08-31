/* ========================================
   TIPOS DE SERVICIO - Datos compartidos
   Categorias que el admin crea para agrupar
   y filtrar los servicios (ej. Laboratorio,
   Prevencion, Estetica...).

   Se usa en: agregar-servicio.js (crear/editar
   servicio), admin-servicios.js (listar/filtrar
   por tipo), y agendar.js (filtro publico al
   agendar cita).

   Por eso este archivo se carga ANTES que esos
   scripts en el <head>/<body> de cada html.
======================================== */

function obtenerTiposServicio() {
    try {
        return JSON.parse(localStorage.getItem("tiposServicio")) || [];
    } catch (e) {
        return [];
    }
}

function guardarTiposServicio(tipos) {
    localStorage.setItem("tiposServicio", JSON.stringify(tipos));
}

// Crea un tipo de servicio nuevo, o devuelve el existente si ya
// hay uno con el mismo nombre (sin importar mayusculas/espacios).
function crearTipoServicio(nombreCrudo) {
    const nombre = (nombreCrudo || "").trim();
    if (!nombre) return null;

    const tipos = obtenerTiposServicio();
    const existente = tipos.find(t => t.nombre.toLowerCase() === nombre.toLowerCase());
    if (existente) return existente;

    const nuevoTipo = { id: `tipo-${Date.now()}`, nombre: nombre };
    tipos.push(nuevoTipo);
    guardarTiposServicio(tipos);
    return nuevoTipo;
}

function obtenerTipoServicioPorId(idTipo) {
    if (!idTipo) return null;
    return obtenerTiposServicio().find(t => String(t.id) === String(idTipo)) || null;
}

function nombreTipoServicio(idTipo) {
    const tipo = obtenerTipoServicioPorId(idTipo);
    return tipo ? tipo.nombre : "";
}
