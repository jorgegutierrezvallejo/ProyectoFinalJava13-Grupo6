/* Repositorio de usuarios y sesión local del prototipo. */
const USUARIOS_STORAGE_KEY = "usuarios";
const SESION_USUARIO_STORAGE_KEY = "sesionUsuarioId";
const USUARIO_LEGACY_STORAGE_KEY = "usuarioRegistrado";
const HUELLAVET_TOKEN_KEY = "huellavetToken";
const HUELLAVET_USUARIO_KEY = "huellavetUsuario";
const API_BACKEND_BASE = "http://localhost:8080/api";

function getTokenActual() {
    return localStorage.getItem(HUELLAVET_TOKEN_KEY) || null;
}

async function apiBackend(path, opciones = {}) {
    const config = {
        method: opciones.method || "GET",
        headers: {
            "Content-Type": "application/json",
            ...(opciones.headers || {})
        },
        ...opciones
    };

    if (config.body !== undefined && config.body !== null && typeof config.body !== "string") {
        config.body = JSON.stringify(config.body);
    }

    const token = getTokenActual();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    const respuesta = await fetch(`${API_BACKEND_BASE}${path}`, config);
    const texto = await respuesta.text();
    const payload = texto ? JSON.parse(texto) : null;

    if (!respuesta.ok) {
        const mensaje = payload?.message || payload?.error || payload || `Error HTTP ${respuesta.status}`;
        throw new Error(typeof mensaje === "string" ? mensaje : JSON.stringify(mensaje));
    }

    return payload;
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

function obtenerUsuarios() {
    const usuarios = HuellaVetStorage.leer(USUARIOS_STORAGE_KEY, []);
    return Array.isArray(usuarios) ? usuarios : [];
}

function guardarUsuarios(usuarios) {
    return HuellaVetStorage.guardar(USUARIOS_STORAGE_KEY, Array.isArray(usuarios) ? usuarios : []);
}

function registrarUsuario(datosUsuario) {
    const usuarios = obtenerUsuarios();
    const email = String(datosUsuario.email || "").trim().toLowerCase();

    if (usuarios.some(usuario => String(usuario.email || "").trim().toLowerCase() === email)) {
        return null;
    }

    const usuario = {
        id: crypto.randomUUID(),
        ...datosUsuario,
        email,
        creadoEn: new Date().toISOString()
    };

    usuarios.push(usuario);
    guardarUsuarios(usuarios);
    return usuario;
}

function actualizarUsuario(idUsuario, camposParciales) {
    const usuarios = obtenerUsuarios();
    const index = usuarios.findIndex(usuario => String(usuario.id) === String(idUsuario));
    if (index === -1) return null;

    usuarios[index] = { ...usuarios[index], ...camposParciales };
    guardarUsuarios(usuarios);
    return usuarios[index];
}

function obtenerUsuarioPorId(idUsuario) {
    return obtenerUsuarios().find(usuario => String(usuario.id) === String(idUsuario)) || null;
}

function obtenerUsuarioPorCredenciales(email, contrasena) {
    const emailNormalizado = String(email || "").trim().toLowerCase();
    return obtenerUsuarios().find(usuario =>
        String(usuario.email || "").trim().toLowerCase() === emailNormalizado &&
        usuario.contrasena === contrasena
    ) || null;
}

function guardarSesionUsuario(datosSesion) {
    const datos = (datosSesion && typeof datosSesion === "object") ? datosSesion : { id: datosSesion };

    if (datos.token) {
        localStorage.setItem(HUELLAVET_TOKEN_KEY, datos.token);
    }

    if (datos.id != null) {
        localStorage.setItem(SESION_USUARIO_STORAGE_KEY, String(datos.id));
    }

    if (datos && typeof datos === "object") {
        HuellaVetStorage.guardar(HUELLAVET_USUARIO_KEY, datos);
    }

    return datos;
}

function cerrarSesionUsuario() {
    localStorage.removeItem(SESION_USUARIO_STORAGE_KEY);
    localStorage.removeItem(HUELLAVET_USUARIO_KEY);
    localStorage.removeItem(HUELLAVET_TOKEN_KEY);
}

function obtenerUsuarioRegistrado() {
    const usuarioPersistido = HuellaVetStorage.leer(HUELLAVET_USUARIO_KEY, null);
    if (usuarioPersistido && typeof usuarioPersistido === "object") {
        return usuarioPersistido;
    }

    const idUsuario = HuellaVetStorage.leer(SESION_USUARIO_STORAGE_KEY, null);
    return idUsuario ? obtenerUsuarioPorId(idUsuario) : null;
}

/* Conserva el usuario antiguo creado antes de introducir la lista. */
(function migrarUsuarioLegacy() {
    if (obtenerUsuarios().length > 0) return;

    const usuarioLegacy = HuellaVetStorage.leer(USUARIO_LEGACY_STORAGE_KEY, null);
    if (!usuarioLegacy || typeof usuarioLegacy !== "object") return;

    const usuarioMigrado = {
        id: crypto.randomUUID(),
        ...usuarioLegacy,
        creadoEn: usuarioLegacy.creadoEn || new Date().toISOString()
    };
    guardarUsuarios([usuarioMigrado]);
    guardarSesionUsuario(usuarioMigrado.id);
})();
