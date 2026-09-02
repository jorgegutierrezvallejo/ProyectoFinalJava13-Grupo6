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

/* Corrige los nombres y las rutas de foto de la primera versión del paquete
 * demo sin obligar a eliminar y volver a cargar los datos. */
(function actualizarDatosDemoV2() {
    const claveMigracion = "migracion_datos_demo_v2";
    if (HuellaVetStorage.leer(claveMigracion, false)) return;

    const usuarios = obtenerUsuarios().map(usuario =>
        String(usuario.id) === "demo-user-jorger"
            ? { ...usuario, nombreCompleto: "Jorge Gutiérrez" }
            : usuario
    );
    guardarUsuarios(usuarios);

    const mascotas = obtenerMascotas().map(mascota => {
        let actualizada = { ...mascota };
        if (String(actualizada.id) === "demo-pet-london-jr") {
            actualizada = { ...actualizada, nombre: "Río", foto: "/img/demo/Rio.JPG" };
        }
        if (String(actualizada.id) === "demo-pet-rio") {
            actualizada = { ...actualizada, nombre: "Bruno", foto: "" };
        }
        if (String(actualizada.id).startsWith("demo-pet-") && /^img\/demo\//.test(String(actualizada.foto || ""))) {
            actualizada.foto = `/${actualizada.foto}`;
        }
        return actualizada;
    });
    guardarMascotas(mascotas);

    const mascotasPorId = new Map(mascotas.map(mascota => [String(mascota.id), mascota]));
    const citas = obtenerTodasLasCitas().map(cita => {
        if (!String(cita.id).startsWith("demo-cita-")) return cita;
        const mascota = mascotasPorId.get(String(cita.mascotaId));
        return mascota
            ? { ...cita, nombreMascota: mascota.nombre, fotoMascota: mascota.foto || "" }
            : cita;
    });
    guardarTodasLasCitas(citas);

    HuellaVetStorage.guardar(claveMigracion, true);
})();
