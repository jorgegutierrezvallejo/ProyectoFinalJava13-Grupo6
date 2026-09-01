/*
 * Migraciones temporales de datos locales.
 * Mantienen la compatibilidad con datos creados antes de separar dominios.
 * Este es el unico lugar autorizado para conocer dos repositorios a la vez.
 */
(function migrarMascotasCreadasDesdeCitas() {
    const claveMigracion = "migracion_mascotas_desde_citas_v1";
    if (HuellaVetStorage.leer(claveMigracion, false)) return;

    const usuarioActivo = obtenerUsuarioRegistrado();
    if (!usuarioActivo) return;

    // Primero asignamos los perfiles de mascota antiguos al usuario activo.
    // Así las citas pueden recuperar la mascota ya existente por nombre.
    const mascotasMigradas = obtenerMascotas().map(mascota =>
        mascota.usuarioId ? mascota : { ...mascota, usuarioId: usuarioActivo.id }
    );
    guardarMascotas(mascotasMigradas);

    const citasMigradas = obtenerTodasLasCitas();
    citasMigradas.forEach(cita => {
        if (!cita.usuarioId) cita.usuarioId = usuarioActivo.id;
        if (String(cita.usuarioId) !== String(usuarioActivo.id)) return;

        const nombre = String(cita.nombreMascota || "").trim();
        if (!nombre) return;

        const mascota = cita.mascotaId ? obtenerMascotaPorId(cita.mascotaId) : registrarMascotaSiNoExiste({
            nombre,
            especie: cita.especie || "otro",
            raza: cita.raza || "",
            fechaNacimiento: cita.fechaNacimiento === "No especificada" ? "" : (cita.fechaNacimiento || ""),
            peso: cita.peso === "No especificado" ? "" : (cita.peso || ""),
            foto: "",
            usuarioId: usuarioActivo.id
        });

        if (mascota && !cita.mascotaId) cita.mascotaId = mascota.id;
    });

    guardarTodasLasCitas(citasMigradas);

    HuellaVetStorage.guardar(claveMigracion, true);
})();
