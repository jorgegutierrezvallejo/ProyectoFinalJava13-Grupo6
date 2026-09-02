document.addEventListener("DOMContentLoaded", iniciarFormularioMascota);

function iniciarFormularioMascota() {
    const formulario = document.querySelector("main form");
    const inputFoto = document.getElementById("subir-foto");
    const zonaUpload = document.querySelector(".zona-upload");
    const botonGuardar = document.querySelector(".btn-guardar");
    const botonCancelar = document.querySelector(".btn-cancelar");
    const botonLimpiar = document.querySelector(".btn-limpiar");

    if (!formulario || !botonGuardar) return;

    const idMascotaEdicion = new URLSearchParams(window.location.search).get("mascotaId");
    const usuarioActivoInicial = obtenerUsuarioRegistrado();
    const mascotaEdicion = idMascotaEdicion ? obtenerMascotaPorId(idMascotaEdicion) : null;
    const estaEditando = Boolean(
        mascotaEdicion && usuarioActivoInicial &&
        String(mascotaEdicion.usuarioId) === String(usuarioActivoInicial.id)
    );
    let fotoMascota = estaEditando ? (mascotaEdicion.foto || "") : "";

    if (idMascotaEdicion && !estaEditando) {
        mostrarAvisoMascota("Perfil no disponible", "No encontramos esta mascota en tu cuenta.", "warning");
        window.history.replaceState({}, "", "agregar-mascota.html");
    }

    if (estaEditando) {
        configurarModoEdicionMascota(mascotaEdicion, zonaUpload, botonGuardar);
    }

    inputFoto?.addEventListener("change", async function () {
        const archivo = this.files?.[0];
        if (!archivo) {
            fotoMascota = "";
            restaurarZonaFoto(zonaUpload);
            return;
        }

        if (!archivo.type.startsWith("image/")) {
            mostrarAvisoMascota("Formato no válido", "Selecciona una imagen PNG, JPG o WEBP.", "warning");
            this.value = "";
            return;
        }

        fotoMascota = await convertirFotoMascotaABase64(archivo);
        mostrarFotoMascotaEnZona(zonaUpload, fotoMascota);
    });

    botonGuardar.addEventListener("click", function () {
        if (!formulario.checkValidity()) {
            formulario.reportValidity();
            return;
        }

        const usuarioActivo = obtenerUsuarioRegistrado();
        if (!usuarioActivo) {
            mostrarAvisoMascota("Sesión requerida", "Debes iniciar sesión para registrar una mascota.", "warning");
            return;
        }

        const nombre = document.getElementById("nombre-mascota")?.value.trim() || "";
        const mascotaConMismoNombre = obtenerMascotaPorNombre(nombre, usuarioActivo.id);
        if (mascotaConMismoNombre && String(mascotaConMismoNombre.id) !== String(mascotaEdicion?.id || "")) {
            mostrarAvisoMascota("Mascota ya registrada", `Ya existe un perfil con el nombre ${nombre}.`, "warning");
            return;
        }

        const valorEsterilizacion = document.getElementById("esterilizada-mascota")?.value || "";

        const mascota = {
            ...(mascotaEdicion || {}),
            id: mascotaEdicion?.id || crypto.randomUUID(),
            usuarioId: usuarioActivo.id,
            nombre,
            especie: document.getElementById("especie")?.value.trim().toLowerCase() || "otro",
            raza: document.getElementById("raza")?.value.trim() || "",
            fechaNacimiento: document.getElementById("fechaNacimientoMascota")?.value || "",
            sexo: document.getElementById("sexo-mascota")?.value || "",
            peso: document.getElementById("peso")?.value.trim() || "",
            fechaUltimaConsulta: document.getElementById("fecha-nacimiento")?.value || "",
            color: document.getElementById("color")?.value.trim() || "",
            esterilizada: valorEsterilizacion === "" ? null : valorEsterilizacion === "true",
            vacunas: separarValoresMascota(document.getElementById("vacunas")?.value),
            alergias: separarValoresMascota(document.getElementById("alergias")?.value),
            observaciones: document.getElementById("observaciones")?.value.trim() || "",
            foto: fotoMascota,
            creadaEn: mascotaEdicion?.creadaEn || new Date().toISOString(),
            actualizadaEn: estaEditando ? new Date().toISOString() : undefined
        };

        guardarMascota(mascota);

        if (typeof Swal !== "undefined") {
            Swal.fire({
                icon: "success",
                title: estaEditando ? "Perfil actualizado" : "Mascota guardada",
                text: estaEditando
                    ? `Los datos de ${mascota.nombre} fueron actualizados correctamente.`
                    : `El perfil de ${mascota.nombre} fue creado correctamente.`,
                confirmButtonColor: "#17a9a7"
            }).then(() => {
                window.location.href = "user-mascotas.html";
            });
        } else {
            window.location.href = "user-mascotas.html";
        }
    });

    botonCancelar?.addEventListener("click", function () {
        window.location.href = "user-mascotas.html";
    });

    botonLimpiar?.addEventListener("click", function () {
        setTimeout(() => {
            if (estaEditando) {
                fotoMascota = mascotaEdicion.foto || "";
                cargarDatosMascotaEnFormulario(mascotaEdicion);
                if (fotoMascota) mostrarFotoMascotaEnZona(zonaUpload, fotoMascota);
                else restaurarZonaFoto(zonaUpload);
            } else {
                fotoMascota = "";
                restaurarZonaFoto(zonaUpload);
            }
        }, 0);
    });
}

function configurarModoEdicionMascota(mascota, zonaUpload, botonGuardar) {
    document.title = `Editar ${mascota.nombre} | HuellaVet`;
    document.body.dataset.pageTitle = "Editar Mascota";

    const titulo = document.getElementById("tituloFormularioMascota");
    if (titulo) titulo.innerHTML = `<i class="bi bi-paw-fill me-2"></i>Editar información de ${escaparTextoMascota(mascota.nombre)}`;
    if (botonGuardar) botonGuardar.innerHTML = `<i class="bi bi-floppy text-white fs-5 me-2"></i> Guardar cambios`;

    cargarDatosMascotaEnFormulario(mascota);
    if (mascota.foto) mostrarFotoMascotaEnZona(zonaUpload, mascota.foto);
}

function cargarDatosMascotaEnFormulario(mascota) {
    document.getElementById("nombre-mascota").value = mascota.nombre || "";
    document.getElementById("especie").value = mascota.especie || "";
    document.getElementById("raza").value = mascota.raza || "";
    document.getElementById("fechaNacimientoMascota").value = mascota.fechaNacimiento || "";
    document.getElementById("sexo-mascota").value = mascota.sexo || "";
    document.getElementById("peso").value = String(mascota.peso || "").replace(/\s*kg$/i, "");
    document.getElementById("fecha-nacimiento").value = mascota.fechaUltimaConsulta || "";
    document.getElementById("color").value = mascota.color || "";
    document.getElementById("esterilizada-mascota").value = mascota.esterilizada === true
        ? "true"
        : mascota.esterilizada === false ? "false" : "";
    document.getElementById("vacunas").value = normalizarListaFormularioMascota(mascota.vacunas);
    document.getElementById("alergias").value = normalizarListaFormularioMascota(mascota.alergias);
    document.getElementById("observaciones").value = mascota.observaciones || "";
}

function normalizarListaFormularioMascota(valor) {
    return Array.isArray(valor) ? valor.join(", ") : String(valor || "");
}

function mostrarFotoMascotaEnZona(zonaUpload, foto) {
    if (!zonaUpload || !foto) return;
    const rutaFoto = typeof resolverRutaRecursoHuellaVet === "function"
        ? resolverRutaRecursoHuellaVet(foto)
        : foto;
    zonaUpload.style.backgroundImage = `url("${rutaFoto}")`;
    zonaUpload.style.backgroundSize = "cover";
    zonaUpload.style.backgroundPosition = "center";
    zonaUpload.querySelectorAll("i, p, small").forEach(elemento => {
        elemento.style.display = "none";
    });
}

function escaparTextoMascota(valor) {
    const elemento = document.createElement("div");
    elemento.textContent = String(valor || "");
    return elemento.innerHTML;
}

function separarValoresMascota(valor) {
    return String(valor || "")
        .split(",")
        .map(item => item.trim())
        .filter(Boolean);
}

function convertirFotoMascotaABase64(archivo) {
    return new Promise((resolve, reject) => {
        const lector = new FileReader();
        lector.onload = () => resolve(lector.result);
        lector.onerror = reject;
        lector.readAsDataURL(archivo);
    });
}

function restaurarZonaFoto(zonaUpload) {
    if (!zonaUpload) return;
    zonaUpload.style.backgroundImage = "";
    zonaUpload.querySelectorAll("i, p, small").forEach(elemento => {
        elemento.style.display = "";
    });
}

function mostrarAvisoMascota(titulo, texto, icono) {
    if (typeof Swal !== "undefined") {
        Swal.fire({ title: titulo, text: texto, icon: icono, confirmButtonColor: "#17a9a7" });
    } else {
        alert(`${titulo}: ${texto}`);
    }
}
