/* Repositorio unico de mascotas. No contiene reglas ni consultas de citas. */
const MASCOTAS_STORAGE_KEY = "mascotas";

function obtenerMascotas() {
    const mascotas = HuellaVetStorage.leer(MASCOTAS_STORAGE_KEY, []);
    return Array.isArray(mascotas) ? mascotas : [];
}

function guardarMascotas(mascotas) {
    return HuellaVetStorage.guardar(MASCOTAS_STORAGE_KEY, Array.isArray(mascotas) ? mascotas : []);
}

function asegurarMascotasIniciales(mascotasIniciales) {
    if (!HuellaVetStorage.existe(MASCOTAS_STORAGE_KEY)) {
        guardarMascotas(mascotasIniciales);
    }
    return obtenerMascotas();
}

function obtenerMascotaPorId(idMascota) {
    return obtenerMascotas().find(mascota => String(mascota.id) === String(idMascota)) || null;
}

function obtenerMascotasPorUsuarioId(idUsuario) {
    return obtenerMascotas().filter(mascota => String(mascota.usuarioId) === String(idUsuario));
}

function obtenerMascotaPorNombre(nombreMascota, idUsuario = null) {
    const nombre = String(nombreMascota || "").trim().toLowerCase();
    return obtenerMascotas().find(mascota =>
        String(mascota.nombre || "").trim().toLowerCase() === nombre &&
        (idUsuario === null || String(mascota.usuarioId) === String(idUsuario))
    ) || null;
}

function guardarMascota(mascota) {
    const mascotas = obtenerMascotas();
    const index = mascotas.findIndex(item => String(item.id) === String(mascota.id));
    if (index === -1) mascotas.push(mascota);
    else mascotas[index] = { ...mascotas[index], ...mascota };
    guardarMascotas(mascotas);
    return mascota;
}

function registrarMascotaSiNoExiste(datosMascota) {
    const existente = obtenerMascotaPorNombre(datosMascota.nombre, datosMascota.usuarioId);
    if (existente) return existente;

    const mascota = {
        id: datosMascota.id || crypto.randomUUID(),
        ...datosMascota,
        creadaEn: datosMascota.creadaEn || new Date().toISOString()
    };
    guardarMascota(mascota);
    return mascota;
}

function eliminarMascota(idMascota) {
    const mascotas = obtenerMascotas().filter(mascota => String(mascota.id) !== String(idMascota));
    guardarMascotas(mascotas);
    return mascotas;
}
