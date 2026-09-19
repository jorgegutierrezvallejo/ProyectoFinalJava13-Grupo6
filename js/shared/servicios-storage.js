/* Repositorio unico de servicios veterinarios.
 *
 * La base de datos (API Spring Boot) es la UNICA fuente de verdad.
 * GET /api/servicios es publico, asi que cualquier visitante puede
 * sincronizar sin iniciar sesion. La lista vive solo en memoria mientras la
 * pagina esta abierta; nada se guarda en localStorage. Crear, editar o borrar
 * exige que el servidor confirme antes de tocar la copia en memoria.
 */
const MAX_SERVICIOS_INICIO = 3;

let serviciosEnMemoria = [];

function normalizarServicioDesdeBackend(servicio = {}) {
    const modalidad = servicio.modalidad || (
        servicio.esDomicilio ? "domicilio" : (servicio.esVirtual ? "virtual" : "clinica")
    );

    return {
        id: servicio.id,
        tipoServicioId: servicio.tipoServicioId ?? servicio.tipoServicio?.id ?? "",
        nombre: servicio.nombre || "",
        descripcion: servicio.descripcion || "",
        precio: Number(servicio.precio ?? 0),
        duracion: Number(servicio.duracion ?? 30),
        modalidad,
        esDomicilio: Boolean(servicio.esDomicilio || modalidad === "domicilio"),
        esVirtual: Boolean(servicio.esVirtual || modalidad === "virtual"),
        esClinica: Boolean(servicio.esClinica || modalidad === "clinica"),
        direccionClinica: servicio.direccionClinica || "",
        icono: servicio.icono || "bi bi-heart-pulse",
        imagen: servicio.imagen || "",
        tieneCostoReserva: Boolean(servicio.tieneCostoReserva),
        costoReserva: Number(servicio.costoReserva ?? 0),
        mostrarEnHome: Boolean(servicio.mostrarEnHome),
        destacado: Boolean(servicio.destacado),
        ordenInicio: servicio.ordenInicio ?? null
    };
}

/* Refresca la copia en memoria con lo que hay en la BD. Lanza el error si el servidor falla. */
async function sincronizarServiciosDesdeBackend() {
    return obtenerServiciosDesdeBackend();
}

/*
 * Primera carga de la pagina: reutiliza la misma peticion si varios scripts
 * (footer, inicio, servicios...) la piden a la vez. Si falla, permite reintentar.
 */
let promesaServiciosCargados = null;
function asegurarServiciosCargados() {
    if (!promesaServiciosCargados) {
        promesaServiciosCargados = sincronizarServiciosDesdeBackend().catch(error => {
            promesaServiciosCargados = null;
            throw error;
        });
    }
    return promesaServiciosCargados;
}

// Endpoint publico: no requiere sesion.
async function obtenerServiciosDesdeBackend() {
    const respuesta = await apiBackend("/servicios");
    const servicios = Array.isArray(respuesta) ? respuesta : [];
    serviciosEnMemoria = normalizarServiciosInicio(servicios.map(normalizarServicioDesdeBackend));
    return obtenerServicios();
}

function obtenerServicios() {
    return [...serviciosEnMemoria];
}

function obtenerServicioPorId(idServicio) {
    return serviciosEnMemoria.find(servicio => String(servicio.id) === String(idServicio)) || null;
}

function crearPayloadServicioBackend(servicio = {}) {
    const modalidad = servicio.modalidad || (
        servicio.esDomicilio ? "domicilio" : (servicio.esVirtual ? "virtual" : "clinica")
    );

    return {
        tipoServicioId: Number(servicio.tipoServicioId),
        nombre: String(servicio.nombre || "").trim(),
        descripcion: servicio.descripcion || "",
        precio: Number(servicio.precio ?? 0),
        duracion: Number(servicio.duracion ?? 30),
        modalidad,
        esDomicilio: Boolean(servicio.esDomicilio || modalidad === "domicilio"),
        esVirtual: Boolean(servicio.esVirtual || modalidad === "virtual"),
        esClinica: Boolean(servicio.esClinica || modalidad === "clinica"),
        direccionClinica: servicio.direccionClinica || "",
        tieneCostoReserva: Boolean(servicio.tieneCostoReserva),
        costoReserva: Number(servicio.costoReserva || 0),
        icono: servicio.icono || "bi bi-heart-pulse",
        imagen: servicio.imagen || ""
    };
}

function reemplazarServicioEnMemoria(servicio) {
    const index = serviciosEnMemoria.findIndex(item => String(item.id) === String(servicio.id));
    if (index === -1) {
        serviciosEnMemoria.push(servicio);
    } else {
        serviciosEnMemoria[index] = servicio;
    }
    return servicio;
}

/* POST /api/servicios — devuelve el servicio con el id definitivo de la BD. */
async function crearServicio(servicio) {
    if (!tieneSesionBackendActiva()) {
        throw new Error("Debes iniciar sesión para crear un servicio.");
    }

    const creado = await apiBackend("/servicios", {
        method: "POST",
        body: crearPayloadServicioBackend(servicio)
    });
    return reemplazarServicioEnMemoria(normalizarServicioDesdeBackend(creado));
}

/* PUT /api/servicios/{id} */
async function actualizarServicio(idServicio, servicio) {
    if (!tieneSesionBackendActiva()) {
        throw new Error("Debes iniciar sesión para editar un servicio.");
    }

    const actualizado = await apiBackend(`/servicios/${encodeURIComponent(idServicio)}`, {
        method: "PUT",
        body: crearPayloadServicioBackend(servicio)
    });
    return reemplazarServicioEnMemoria(normalizarServicioDesdeBackend(actualizado));
}

/* DELETE /api/servicios/{id} — solo se quita de memoria si el servidor confirma. */
async function eliminarServicioGuardado(idServicio) {
    if (!tieneSesionBackendActiva()) {
        throw new Error("Debes iniciar sesión para eliminar un servicio.");
    }

    await apiBackend(`/servicios/${encodeURIComponent(idServicio)}`, { method: "DELETE" });
    serviciosEnMemoria = serviciosEnMemoria.filter(servicio => String(servicio.id) !== String(idServicio));
    return obtenerServicios();
}

/*
 * PUT /api/servicios/inicio — guarda en la BD cuales servicios se publican en
 * el inicio (maximo 3, en orden; el primero es el destacado).
 */
async function guardarServiciosParaInicio(idsServicios) {
    if (!tieneSesionBackendActiva()) {
        throw new Error("Debes iniciar sesión para publicar servicios en el inicio.");
    }

    const ids = [...new Set((Array.isArray(idsServicios) ? idsServicios : []).map(String))]
        .slice(0, MAX_SERVICIOS_INICIO)
        .map(Number);

    const respuesta = await apiBackend("/servicios/inicio", {
        method: "PUT",
        body: { ids }
    });
    const servicios = Array.isArray(respuesta) ? respuesta : [];
    serviciosEnMemoria = normalizarServiciosInicio(servicios.map(normalizarServicioDesdeBackend));
    return obtenerServiciosParaInicio();
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
