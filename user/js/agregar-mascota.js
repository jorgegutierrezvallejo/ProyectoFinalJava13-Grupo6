document.addEventListener("DOMContentLoaded", iniciarFormularioMascota);

function iniciarFormularioMascota() {
    const formulario = document.querySelector("main form");
    const inputFoto = document.getElementById("subir-foto");
    const zonaUpload = document.querySelector(".zona-upload");
    const botonGuardar = document.querySelector(".btn-guardar");
    const botonCancelar = document.querySelector(".btn-cancelar");
    const botonLimpiar = document.querySelector(".btn-limpiar");

    if (!formulario || !botonGuardar) return;

    let fotoBase64 = "";

    inputFoto?.addEventListener("change", async function () {
        const archivo = this.files?.[0];
        if (!archivo) {
            fotoBase64 = "";
            restaurarZonaFoto(zonaUpload);
            return;
        }

        if (!archivo.type.startsWith("image/")) {
            mostrarAvisoMascota("Formato no válido", "Selecciona una imagen PNG, JPG o WEBP.", "warning");
            this.value = "";
            return;
        }

        fotoBase64 = await convertirFotoMascotaABase64(archivo);
        if (zonaUpload && fotoBase64) {
            zonaUpload.style.backgroundImage = `url(${fotoBase64})`;
            zonaUpload.style.backgroundSize = "cover";
            zonaUpload.style.backgroundPosition = "center";
            zonaUpload.querySelectorAll("i, p, small").forEach(elemento => {
                elemento.style.display = "none";
            });
        }
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
        if (obtenerMascotaPorNombre(nombre, usuarioActivo.id)) {
            mostrarAvisoMascota("Mascota ya registrada", `Ya existe un perfil con el nombre ${nombre}.`, "warning");
            return;
        }

        const mascota = {
            id: crypto.randomUUID(),
            usuarioId: usuarioActivo.id,
            nombre,
            especie: document.getElementById("especie")?.value.trim().toLowerCase() || "otro",
            raza: document.getElementById("raza")?.value.trim() || "",
            fechaNacimiento: document.getElementById("fechaNacimientoMascota")?.value || "",
            sexo: document.getElementById("sexo-mascota")?.value || "",
            peso: document.getElementById("peso")?.value.trim() || "",
            fechaUltimaConsulta: document.getElementById("fecha-nacimiento")?.value || "",
            color: document.getElementById("color")?.value.trim() || "",
            vacunas: separarValoresMascota(document.getElementById("vacunas")?.value),
            alergias: separarValoresMascota(document.getElementById("alergias")?.value),
            observaciones: document.getElementById("observaciones")?.value.trim() || "",
            foto: fotoBase64,
            creadaEn: new Date().toISOString()
        };

        guardarMascota(mascota);

        if (typeof Swal !== "undefined") {
            Swal.fire({
                icon: "success",
                title: "Mascota guardada",
                text: `El perfil de ${mascota.nombre} fue creado correctamente.`,
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
        fotoBase64 = "";
        setTimeout(() => restaurarZonaFoto(zonaUpload), 0);
    });
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
