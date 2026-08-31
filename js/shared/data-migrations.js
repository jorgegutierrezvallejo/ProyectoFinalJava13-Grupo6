/*
 * Migraciones temporales de datos locales.
 * Mantienen la compatibilidad con datos creados antes de separar dominios.
 * Este es el unico lugar autorizado para conocer dos repositorios a la vez.
 */
(function migrarMascotasCreadasDesdeCitas() {
    const claveMigracion = "migracion_mascotas_desde_citas_v1";
    if (HuellaVetStorage.leer(claveMigracion, false)) return;

    obtenerTodasLasCitas().forEach(cita => {
        const nombre = String(cita.nombreMascota || "").trim();
        if (!nombre) return;

        registrarMascotaSiNoExiste({
            nombre,
            especie: cita.especie || "otro",
            raza: cita.raza || "",
            fechaNacimiento: cita.fechaNacimiento === "No especificada" ? "" : (cita.fechaNacimiento || ""),
            peso: cita.peso === "No especificado" ? "" : (cita.peso || ""),
            foto: ""
        });
    });

    HuellaVetStorage.guardar(claveMigracion, true);
})();
