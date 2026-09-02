/* Repositorio unico de servicios veterinarios. */
const SERVICIOS_STORAGE_KEY = "servicios";
const MAX_SERVICIOS_INICIO = 3;

function obtenerServicios() {
    const servicios = HuellaVetStorage.leer(SERVICIOS_STORAGE_KEY, []);
    return Array.isArray(servicios) ? servicios : [];
}

function guardarServicios(servicios) {
    const lista = Array.isArray(servicios) ? servicios : [];
    return HuellaVetStorage.guardar(SERVICIOS_STORAGE_KEY, normalizarServiciosInicio(lista));
}

function obtenerServicioPorId(idServicio) {
    return obtenerServicios().find(servicio => String(servicio.id) === String(idServicio)) || null;
}

function eliminarServicioGuardado(idServicio) {
    const servicios = obtenerServicios().filter(servicio => String(servicio.id) !== String(idServicio));
    guardarServicios(servicios);
    return servicios;
}

// Los primeros tres servicios se publican automáticamente mientras la clínica
// tenga tres o menos. Con más servicios, el administrador elige hasta tres.
function obtenerServiciosParaInicio() {
    const servicios = obtenerServicios();
    const seleccionados = servicios.length <= MAX_SERVICIOS_INICIO
        ? servicios
        : servicios.filter(servicio => servicio.mostrarEnHome);

    const visibles = (seleccionados.length > 0 ? seleccionados : servicios.slice(0, MAX_SERVICIOS_INICIO))
        .slice(0, MAX_SERVICIOS_INICIO);

    return ordenarServiciosInicio(visibles);
}

function obtenerServicioDestacado() {
    const serviciosInicio = obtenerServiciosParaInicio();
    return serviciosInicio.find(servicio => servicio.destacado) || serviciosInicio[0] || null;
}

function guardarServiciosParaInicio(idsServicios) {
    const ids = [...new Set((Array.isArray(idsServicios) ? idsServicios : []).map(String))]
        .slice(0, MAX_SERVICIOS_INICIO);

    const servicios = obtenerServicios().map(servicio => {
        const indice = ids.indexOf(String(servicio.id));
        return {
            ...servicio,
            mostrarEnHome: indice !== -1,
            destacado: indice === 0,
            ordenInicio: indice === -1 ? null : indice + 1
        };
    });

    guardarServicios(servicios);
    return obtenerServiciosParaInicio();
}

function normalizarServiciosInicio(servicios) {
    if (servicios.length <= MAX_SERVICIOS_INICIO) {
        const idsOrdenados = ordenarServiciosInicio(servicios).map(servicio => String(servicio.id));
        return servicios.map((servicio, indice) => ({
            ...servicio,
            mostrarEnHome: true,
            destacado: String(servicio.id) === idsOrdenados[0],
            ordenInicio: idsOrdenados.indexOf(String(servicio.id)) + 1
        }));
    }

    const seleccionados = ordenarServiciosInicio(servicios.filter(servicio => servicio.mostrarEnHome))
        .slice(0, MAX_SERVICIOS_INICIO);
    const idsSeleccionados = seleccionados.length > 0
        ? seleccionados.map(servicio => String(servicio.id))
        : servicios.slice(0, MAX_SERVICIOS_INICIO).map(servicio => String(servicio.id));

    return servicios.map(servicio => ({
        ...servicio,
        mostrarEnHome: idsSeleccionados.includes(String(servicio.id)),
        destacado: String(servicio.id) === idsSeleccionados[0],
        ordenInicio: idsSeleccionados.indexOf(String(servicio.id)) + 1 || null
    }));
}

function ordenarServiciosInicio(servicios) {
    return [...servicios]
        .map((servicio, indice) => ({ servicio, indice }))
        .sort((a, b) => {
            const ordenA = Number(a.servicio.ordenInicio);
            const ordenB = Number(b.servicio.ordenInicio);
            const tieneOrdenA = Number.isFinite(ordenA) && ordenA > 0;
            const tieneOrdenB = Number.isFinite(ordenB) && ordenB > 0;
            if (tieneOrdenA && tieneOrdenB) return ordenA - ordenB;
            if (tieneOrdenA) return -1;
            if (tieneOrdenB) return 1;
            return a.indice - b.indice;
        })
        .map(item => item.servicio);
}
