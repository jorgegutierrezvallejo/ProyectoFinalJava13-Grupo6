/* Repositorio de usuarios y sesión local del prototipo. */
const USUARIOS_STORAGE_KEY = "usuarios";
const SESION_USUARIO_STORAGE_KEY = "sesionUsuarioId";
const USUARIO_LEGACY_STORAGE_KEY = "usuarioRegistrado";

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

function guardarSesionUsuario(idUsuario) {
    return HuellaVetStorage.guardar(SESION_USUARIO_STORAGE_KEY, idUsuario);
}

function cerrarSesionUsuario() {
    localStorage.removeItem(SESION_USUARIO_STORAGE_KEY);
}

function obtenerUsuarioRegistrado() {
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
