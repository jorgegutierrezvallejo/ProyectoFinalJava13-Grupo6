const API_URL = "https://huellavet.onrender.com";
const TOKEN_STORAGE_KEY = "huellavetToken";
const USUARIO_ACTUAL_STORAGE_KEY = "huellavetUsuario";
const SESION_ID_STORAGE_KEY = "sesionUsuarioId";

async function apiFetch(ruta, opciones = {}) {
    const token = obtenerToken();

    const headers = {
        "Content-Type": "application/json",
        ...(opciones.headers || {})
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    let cuerpo = opciones.body;
    if (cuerpo !== undefined && cuerpo !== null && typeof cuerpo !== "string") {
        cuerpo = JSON.stringify(cuerpo);
    }

    const respuesta = await fetch(`${API_URL}${ruta}`, {
        ...opciones,
        headers,
        body: cuerpo
    });

    const texto = await respuesta.text();
    // El backend responde JSON en los casos exitosos, pero los errores de
    // validacion llegan como texto plano: no se debe romper el parseo.
    let datos = null;
    if (texto) {
        try {
            datos = JSON.parse(texto);
        } catch (errorParseo) {
            datos = texto;
        }
    }

    if (!respuesta.ok) {
        const mensaje = (datos && typeof datos === "object")
            ? (datos.mensaje || datos.message || datos.error)
            : datos;
        const error = new Error(
            mensaje
                ? (typeof mensaje === "string" ? mensaje : JSON.stringify(mensaje))
                : "Ocurrió un error al comunicarse con el servidor."
        );
        error.status = respuesta.status;
        throw error;
    }

    return datos;
}

function obtenerToken() {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || null;
}

function haySesionActiva() {
    return Boolean(obtenerToken());
}

function guardarSesion(datos) {
    if (!datos || typeof datos !== "object") return null;

    if (datos.token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, datos.token);
    }
    if (datos.id != null) {
        localStorage.setItem(SESION_ID_STORAGE_KEY, String(datos.id));
    }
    localStorage.setItem(USUARIO_ACTUAL_STORAGE_KEY, JSON.stringify(datos));

    return datos;
}

function obtenerUsuarioActual() {
    const crudo = localStorage.getItem(USUARIO_ACTUAL_STORAGE_KEY);
    if (!crudo) return null;
    try {
        return JSON.parse(crudo);
    } catch (error) {
        return null;
    }
}

function cerrarSesionApi() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USUARIO_ACTUAL_STORAGE_KEY);
    localStorage.removeItem(SESION_ID_STORAGE_KEY);
}