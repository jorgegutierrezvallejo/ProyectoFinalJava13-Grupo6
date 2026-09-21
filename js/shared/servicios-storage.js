/*
 * Repositorio unico de servicios veterinarios.
 *
 * La base de datos (API Spring Boot -> Supabase) es la UNICA fuente de verdad.
 * No se persiste nada en localStorage: la lista vive en memoria mientras la
 * pagina esta abierta y se vuelve a pedir al servidor en cada carga
 * (asegurarServiciosCargados). Toda escritura se hace primero contra la API;
 * si el servidor falla, el error se propaga y la memoria no cambia.
 *
 * Contrato Spring Boot:
 *   GET    /api/servicios            (publico)
 *   POST   /api/servicios            (VETERINARIO / ADMINISTRADOR)
 *   PUT    /api/servicios/{id}       (VETERINARIO / ADMINISTRADOR)
 *   PUT    /api/servicios/inicio     body { ids: [..] }  (VETERINARIO / ADMINISTRADOR)
 *   DELETE /api/servicios/{id}       (VETERINARIO / ADMINISTRADOR)
 */
const MAX_SERVICIOS_INICIO = 3;

let serviciosEnMemoria = [];

function tieneSesionBackendActiva() {
    return typeof getTokenActual === "function" && Boolean(getTokenActual());
}

function normalizarServicioDesdeBackend(servicio = {}) {
    const modalidad = servicio.modalidad || (
        servicio.esDomicilio ? "domicilio" : (servicio.esVirtual ? "virtual" : "clinica")
    );

    return {
        id: servicio.id ?? Date.now(),
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

/* ============================================================
 * CARGA DESDE LA BASE DE DATOS
 * ============================================================ */

let ultimaCargaServiciosFallo = false;

async function obtenerServiciosDesdeBackend() {
    // GET /api/servicios es publico (permitAll en el backend): los servicios
    // deben verse aunque nadie haya iniciado sesion (home, footer, agendar).
    try {
        const respuesta = await apiBackend("/servicios");
        const servicios = Array.isArray(respuesta) ? respuesta : [];
        establecerServiciosEnMemoria(servicios.map(normalizarServicioDesdeBackend));
        ultimaCargaServiciosFallo = false;
    } catch (error) {
        ultimaCargaServiciosFallo = true;
        console.warn("No se pudieron cargar los servicios desde el backend:", error);
    }
    return obtenerServicios();
}

/*
 * Primera carga de la pagina: si varios scripts (inicio, footer, agendar, etc.)
 * piden los servicios a la vez comparten una sola peticion al backend.
 * Si la carga falla, la siguiente llamada vuelve a intentarlo.
 */
let promesaServiciosCargados = null;
function asegurarServiciosCargados() {
    if (!promesaServiciosCargados) {
        promesaServiciosCargados = obtenerServiciosDesdeBackend().then(servicios => {
            if (ultimaCargaServiciosFallo) promesaServiciosCargados = null;
            return servicios;
        });
    }
    return promesaServiciosCargados;
}

/* ============================================================
 * LECTURA SINCRONA (sobre la copia en memoria de esta pagina)
 * ============================================================ */

function obtenerServicios() {
    return [...serviciosEnMemoria];
}

function obtenerServicioPorId(idServicio) {
    return serviciosEnMemoria.find(servicio => String(servicio.id) === String(idServicio)) || null;
}

/*
 * Reemplaza la copia en memoria (NO escribe en ningun almacenamiento del
 * navegador). Se conserva tambien con el nombre historico guardarServicios
 * porque veterinario-servicio.js lo invoca despues de que la API confirma.
 */
function establecerServiciosEnMemoria(servicios) {
    const lista = Array.isArray(servicios) ? servicios : [];
    serviciosEnMemoria = normalizarServiciosInicio(lista);
    return true;
}

function guardarServicios(servicios) {
    return establecerServiciosEnMemoria(servicios);
}

/* ============================================================
 * ESCRITURA (siempre contra la base de datos)
 * ============================================================ */

/** Elimina el servicio en la BD; solo si el servidor confirma se quita de memoria. */
async function eliminarServicioGuardado(idServicio) {
    if (!tieneSesionBackendActiva()) {
        throw new Error("Debes iniciar sesión para eliminar un servicio.");
    }

    await apiBackend(`/servicios/${encodeURIComponent(idServicio)}`, { method: "DELETE" });
    establecerServiciosEnMemoria(
        serviciosEnMemoria.filter(servicio => String(servicio.id) !== String(idServicio))
    );
    return obtenerServicios();
}

/**
 * Guarda en la BD cuales servicios se muestran en el inicio (maximo 3).
 * El primer id queda como destacado. Usa PUT /api/servicios/inicio.
 */
async function guardarServiciosParaInicio(idsServicios) {
    if (!tieneSesionBackendActiva()) {
        throw new Error("Debes iniciar sesión para elegir los servicios del inicio.");
    }

    const ids = [...new Set((Array.isArray(idsServicios) ? idsServicios : []).map(String))]
        .slice(0, MAX_SERVICIOS_INICIO)
        .map(Number);

    const respuesta = await apiBackend("/servicios/inicio", {
        method: "PUT",
        body: { ids }
    });

    const servicios = Array.isArray(respuesta) ? respuesta : [];
    establecerServiciosEnMemoria(servicios.map(normalizarServicioDesdeBackend));
    return obtenerServiciosParaInicio();
}

/* ============================================================
 * SELECCION DE SERVICIOS DEL INICIO (logica de presentacion)
 * ============================================================ */

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
