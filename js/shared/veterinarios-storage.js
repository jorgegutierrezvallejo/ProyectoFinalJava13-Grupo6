/* Repositorio unico de veterinarios.
 *
 * La base de datos (API Spring Boot) es la UNICA fuente de verdad.
 * Se usa, por ejemplo, para poblar el desplegable de "Selecciona un
 * veterinario" en el formulario de agendar cita del dashboard de usuario.
 *
 * Contrato Spring Boot:
 *   GET /api/veterinario  (requiere sesion: USUARIO, VETERINARIO o ADMINISTRADOR)
 */

let veterinariosEnMemoria = [];

function normalizarVeterinarioDesdeBackend(veterinario = {}) {
    const nombres = veterinario.nombres || "";
    const apellidos = veterinario.apellidos || "";
    return {
        id: veterinario.id,
        nombres,
        apellidos,
        nombreCompleto: `${nombres} ${apellidos}`.trim() || "Veterinario",
        correo: veterinario.correo || "",
        foto: veterinario.foto || "",
        telefono: veterinario.telefono || "",
        ciudad: veterinario.ciudad || ""
    };
}

/* Lee del servidor la lista de veterinarios registrados. */
async function obtenerVeterinariosDesdeBackend() {
    if (typeof apiBackend !== "function" || !tieneSesionBackendActiva()) {
        return obtenerVeterinarios();
    }

    try {
        const respuesta = await apiBackend("/veterinario");
        const veterinarios = Array.isArray(respuesta) ? respuesta : [];
        veterinariosEnMemoria = veterinarios.map(normalizarVeterinarioDesdeBackend);
        return obtenerVeterinarios();
    } catch (error) {
        console.warn("No se pudieron cargar los veterinarios desde el backend:", error);
        return obtenerVeterinarios();
    }
}

/*
 * Primera carga de la pagina: si varios elementos piden la lista de
 * veterinarios a la vez comparten una sola peticion al backend.
 */
let promesaVeterinariosCargados = null;
function asegurarVeterinariosCargados() {
    if (!promesaVeterinariosCargados) {
        promesaVeterinariosCargados = obtenerVeterinariosDesdeBackend().catch(error => {
            promesaVeterinariosCargados = null;
            throw error;
        });
    }
    return promesaVeterinariosCargados;
}

function obtenerVeterinarios() {
    return [...veterinariosEnMemoria];
}

function obtenerVeterinarioPorId(idVeterinario) {
    return veterinariosEnMemoria.find(veterinario => String(veterinario.id) === String(idVeterinario)) || null;
}
