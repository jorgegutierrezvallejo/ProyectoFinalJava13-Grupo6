/* Repositorio temporal de usuarios mientras la autenticacion usa localStorage. */
const USUARIO_REGISTRADO_STORAGE_KEY = "usuarioRegistrado";

function obtenerUsuarioRegistrado() {
    const usuario = HuellaVetStorage.leer(USUARIO_REGISTRADO_STORAGE_KEY, null);
    return usuario && typeof usuario === "object" ? usuario : null;
}

function guardarUsuarioRegistrado(usuario) {
    return HuellaVetStorage.guardar(USUARIO_REGISTRADO_STORAGE_KEY, usuario);
}
