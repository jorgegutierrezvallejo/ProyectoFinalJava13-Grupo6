document.addEventListener("DOMContentLoaded", function () {
    iniciarServicios();
    iniciarVistaPreviaImagen();
});

function iniciarServicios() {
    const formulario = document.getElementById("formServicio");

    if (!formulario) {
        return;
    }

    formulario.addEventListener("submit", async function (evento) {
        evento.preventDefault();

        const nombre = document.getElementById("nombre").value.trim();
        const descripcion = document.getElementById("descripcion").value.trim();
        const precio = document.getElementById("precio").value.trim();
        const duracion = document.getElementById("duracion").value;
        const iconoSeleccionado = document.querySelector('input[name="icono"]:checked');
        const inputImagen = document.getElementById("imagen");

        const icono = iconoSeleccionado ? iconoSeleccionado.value : "";
        const archivoImagen = inputImagen.files[0];

        let hayError = false;
        let mensajesDeError = "Por favor corrige lo siguiente:\n\n";

        if (nombre === "") {
            mensajesDeError += "- El nombre del servicio es obligatorio.\n";
            hayError = true;
        }

        if (descripcion.length < 10) {
            mensajesDeError += "- La descripción es muy corta, mínimo 10 caracteres.\n";
            hayError = true;
        }

        if (precio === "" || precio <= 0) {
            mensajesDeError += "- Debes ingresar un precio válido mayor a 0.\n";
            hayError = true;
        }

        if (duracion === "") {
            mensajesDeError += "- Debes seleccionar la duración del servicio.\n";
            hayError = true;
        }

        if (icono === "") {
            mensajesDeError += "- Debes seleccionar un icono para el servicio.\n";
            hayError = true;
        }

        if (hayError) {
            alert(mensajesDeError);
            return;
        }

        const imagen = archivoImagen ? await convertirImagenABase64(archivoImagen) : "";

        const nuevoServicio = {
            id: Date.now(),
            nombre: nombre,
            descripcion: descripcion,
            precio: parseFloat(precio),
            duracion: parseInt(duracion),
            icono: icono,
            imagen: imagen
        };

        let servicios = JSON.parse(localStorage.getItem("servicios")) || [];

        servicios.push(nuevoServicio);

        localStorage.setItem("servicios", JSON.stringify(servicios));

        Swal.fire({
            icon: "success",
            title: "¡Servicio creado y guardado exitosamente!",
            confirmButtonText: "Aceptar",
            confirmButtonColor: "#bad641"
        }).then(function () {
            window.location.href = "./admin-servicios.html";
        });
    });
}

function iniciarVistaPreviaImagen() {
    const inputImagen = document.getElementById("imagen");
    const imagenPreview = document.getElementById("imagenPreview");

    if (!inputImagen || !imagenPreview) {
        return;
    }

    inputImagen.addEventListener("change", async function () {
        const archivoImagen = inputImagen.files[0];

        if (!archivoImagen) {
            imagenPreview.innerHTML = `
                <i class="bi bi-image"></i>
                <span>Vista previa de la imagen</span>
            `;
            return;
        }

        const imagenBase64 = await convertirImagenABase64(archivoImagen);

        imagenPreview.innerHTML = `
            <img src="${imagenBase64}" alt="Vista previa del servicio">
        `;
    });
}

function convertirImagenABase64(archivo) {
    return new Promise(function (resolve, reject) {
        const lector = new FileReader();

        lector.onload = function () {
            resolve(lector.result);
        };

        lector.onerror = function () {
            reject("");
        };

        lector.readAsDataURL(archivo);
    });
}