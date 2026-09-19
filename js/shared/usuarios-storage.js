/*
 * Usuarios: la base de datos (API) es la unica fuente de verdad.
 * Aqui solo viven las llamadas de autenticacion y la sesion (token +
 * usuario actual), que si deben conservarse en el navegador.
 */

/*
 * getTokenActual/apiBackend son alias de compatibilidad hacia la capa
 * única definida en js/config.js (obtenerToken/apiFetch). Se mantienen
 * estos nombres porque decenas de archivos del proyecto ya los usan;
 * así no hay que tocar cada uno, pero solo hay UNA implementación real
 * del fetch/URL/token, la de config.js.
 */
function getTokenActual() {
    return typeof obtenerToken === "function" ? obtenerToken() : null;
}

/* True si hay un JWT guardado, es decir, una sesion autenticada contra el backend. */
function tieneSesionBackendActiva() {
    return typeof getTokenActual === "function" && Boolean(getTokenActual());
}

async function apiBackend(path, opciones = {}) {
    return apiFetch(`/api${path}`, opciones);
}

async function iniciarSesionBackend(email, contrasena) {
    const respuesta = await apiBackend("/auth/login", {
        method: "POST",
        body: {
            email,
            contrasena
        }
    });

    if (respuesta?.token) {
        const usuario = respuesta.datos || {};
        guardarSesionUsuario({ ...usuario, token: respuesta.token, rol: respuesta.rol });
    }

    return respuesta;
}

async function iniciarSesionAdminBackend(correo, contrasena) {
    return apiBackend("/admin/login", {
        method: "POST",
        body: { correo, contrasena }
    });
}

async function iniciarSesionVeterinarioBackend(correo, contrasena) {
    return apiBackend("/veterinario/login", {
        method: "POST",
        body: { correo, contrasena }
    });
}

async function registrarUsuarioBackend(datosUsuario) {
    const payload = {
        nombreCompleto: datosUsuario.nombreCompleto || "",
        email: String(datosUsuario.email || "").trim(),
        contrasena: datosUsuario.contrasena || "",
        telefono: datosUsuario.telefono || "",
        indicativoPais: datosUsuario.indicativoPais || "+57",
        ciudad: datosUsuario.ciudad || "",
        fechaNacimiento: datosUsuario.fechaNacimiento || null
    };

    return apiBackend("/auth/registro", {
        method: "POST",
        body: payload
    });
}

function guardarSesionUsuario(datosSesion) {
    const datos = (datosSesion && typeof datosSesion === "object") ? datosSesion : { id: datosSesion };
    // Delega en la sesión única de config.js (mismas claves de
    // localStorage que ya usaba el proyecto: huellavetToken /
    // huellavetUsuario / sesionUsuarioId).
    return typeof guardarSesion === "function" ? guardarSesion(datos) : datos;
}

function cerrarSesionUsuario() {
    if (typeof cerrarSesionApi === "function") {
        cerrarSesionApi();
    }
}

function obtenerUsuarioRegistrado() {
    const usuarioPersistido = typeof obtenerUsuarioActual === "function" ? obtenerUsuarioActual() : null;
    if (usuarioPersistido && typeof usuarioPersistido === "object") {
        return usuarioPersistido;
    }
    return null;
}
