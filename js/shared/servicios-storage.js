/* Repositorio unico de servicios veterinarios. */
const SERVICIOS_STORAGE_KEY = "servicios";

function obtenerServicios() {
    const servicios = HuellaVetStorage.leer(SERVICIOS_STORAGE_KEY, []);
    return Array.isArray(servicios) ? servicios : [];
}

function guardarServicios(servicios) {
    return HuellaVetStorage.guardar(SERVICIOS_STORAGE_KEY, Array.isArray(servicios) ? servicios : []);
}

function obtenerServicioPorId(idServicio) {
    return obtenerServicios().find(servicio => String(servicio.id) === String(idServicio)) || null;
}

function eliminarServicioGuardado(idServicio) {
    const servicios = obtenerServicios().filter(servicio => String(servicio.id) !== String(idServicio));
    guardarServicios(servicios);
    return servicios;
}
