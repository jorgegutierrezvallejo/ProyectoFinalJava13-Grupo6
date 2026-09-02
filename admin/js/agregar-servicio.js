document.addEventListener("DOMContentLoaded", function () {
    iniciarServicios();
    iniciarVistaPreviaImagen();
    iniciarTipoServicio();
});

function iniciarServicios() {
    const formulario = document.getElementById("formServicio");
    const checkCostoReserva = document.getElementById("tieneCostoReserva");
    const contenedorCostoReserva = document.getElementById("contenedorCostoReserva");
    const inputCostoReserva = document.getElementById("costoReserva");

    if (!formulario) {
        return;
    }

    // Detectar si estamos en modo modificar/editar
    const urlParams = new URLSearchParams(window.location.search);
    const servicioId = urlParams.get("id");
    let servicioExistente = null;
    let servicios = obtenerServicios();

    if (servicioId) {
        servicioExistente = servicios.find(s => String(s.id) === String(servicioId));
        if (servicioExistente) {
            // Actualizar interfaz para modo edición
            const formTitulo = document.getElementById("formTitulo");
            const breadcrumbItemActivo = document.getElementById("breadcrumbItemActivo");
            const btnSubmitTexto = document.getElementById("btnSubmitTexto");

            if (formTitulo) formTitulo.textContent = "Modificar servicio";
            if (breadcrumbItemActivo) breadcrumbItemActivo.textContent = "Modificar servicio";
            if (btnSubmitTexto) btnSubmitTexto.textContent = "Actualizar servicio";

            // Precargar datos en los inputs
            const inputNombre = document.getElementById("nombre");
            const inputDescripcion = document.getElementById("descripcion");
            const inputPrecio = document.getElementById("precio");
            const selectDuracion = document.getElementById("duracion");
            const inputImagenPreview = document.getElementById("imagenPreview");

            if (inputNombre) inputNombre.value = servicioExistente.nombre || "";
            if (inputDescripcion) inputDescripcion.value = servicioExistente.descripcion || "";
            if (inputPrecio) inputPrecio.value = servicioExistente.precio || "";
            if (selectDuracion) selectDuracion.value = servicioExistente.duracion || "";
            if (servicioExistente.tipoServicioId) window.tipoServicioIdPrecargado = servicioExistente.tipoServicioId;

            // Modalidad
            const modalidadGuardada = servicioExistente.modalidad || (servicioExistente.esDomicilio ? "domicilio" : (servicioExistente.esVirtual ? "virtual" : "clinica"));
            const radioModalidad = document.querySelector(`input[name="modalidadAtencion"][value="${modalidadGuardada}"]`);
            if (radioModalidad) radioModalidad.checked = true;

            const contenedorDirClinica = document.getElementById("contenedorDireccionClinica");
            const inputDirClinica = document.getElementById("direccionClinica");
            if (contenedorDirClinica && inputDirClinica) {
                if (modalidadGuardada === "clinica") {
                    contenedorDirClinica.classList.remove("d-none");
                    inputDirClinica.value = servicioExistente.direccionClinica || "HuellaVet — Sede Centro";
                } else {
                    contenedorDirClinica.classList.add("d-none");
                }
            }

            // Costo de reserva
            if (servicioExistente.tieneCostoReserva && checkCostoReserva && contenedorCostoReserva && inputCostoReserva) {
                checkCostoReserva.checked = true;
                contenedorCostoReserva.classList.remove("d-none");
                inputCostoReserva.setAttribute("required", "required");
                inputCostoReserva.value = servicioExistente.costoReserva || "";
            }

            // Icono
            if (servicioExistente.icono) {
                const radioIcono = document.querySelector(`input[name="icono"][value="${servicioExistente.icono}"]`);
                if (radioIcono) radioIcono.checked = true;
            }

            // Imagen
            if (servicioExistente.imagen && inputImagenPreview) {
                inputImagenPreview.innerHTML = `<img src="${servicioExistente.imagen}" alt="${servicioExistente.nombre}">`;
            }
        }
    }

    // Toggle para modalidad en clínica vs domicilio vs virtual
    const radiosModalidad = document.querySelectorAll('input[name="modalidadAtencion"]');
    const contenedorDirClinica = document.getElementById("contenedorDireccionClinica");
    radiosModalidad.forEach(radio => {
        radio.addEventListener("change", function () {
            if (contenedorDirClinica) {
                if (this.value === "clinica") {
                    contenedorDirClinica.classList.remove("d-none");
                } else {
                    contenedorDirClinica.classList.add("d-none");
                }
            }
        });
    });

    if (checkCostoReserva && contenedorCostoReserva) {
        checkCostoReserva.addEventListener("change", function () {
            if (this.checked) {
                contenedorCostoReserva.classList.remove("d-none");
                inputCostoReserva.setAttribute("required", "required");
                inputCostoReserva.focus();
            } else {
                contenedorCostoReserva.classList.add("d-none");
                inputCostoReserva.removeAttribute("required");
                inputCostoReserva.value = "";
            }
        });
    }

    formulario.addEventListener("submit", async function (evento) {
        evento.preventDefault();

        const nombre = document.getElementById("nombre").value.trim();
        const descripcion = document.getElementById("descripcion").value.trim();
        const precio = document.getElementById("precio").value.trim();
        const duracion = document.getElementById("duracion").value;
        const iconoSeleccionado = document.querySelector('input[name="icono"]:checked');
        const inputImagen = document.getElementById("imagen");
        const tieneReserva = checkCostoReserva ? checkCostoReserva.checked : false;
        const costoReservaVal = inputCostoReserva ? inputCostoReserva.value.trim() : "";

        const icono = iconoSeleccionado ? iconoSeleccionado.value : (servicioExistente?.icono || "");
        const archivoImagen = inputImagen.files[0];

        let errores = [];

        if (nombre === "") {
            errores.push("El nombre del servicio es obligatorio.");
        }

        if (descripcion.length < 10) {
            errores.push("La descripción es muy corta, mínimo 10 caracteres.");
        }

        const precioNum = parseFloat(precio);
        if (precio === "" || isNaN(precioNum) || precioNum <= 0) {
            errores.push("Debes ingresar un precio válido mayor a 0.");
        }

        if (duracion === "") {
            errores.push("Debes seleccionar la duración del servicio.");
        }

        if (icono === "") {
            errores.push("Debes seleccionar un icono para el servicio.");
        }

        const selectTipoServicio = document.getElementById("tipoServicio");
        const tipoServicioId = selectTipoServicio ? selectTipoServicio.value : "";
        if (tipoServicioId === "") {
            errores.push("Debes seleccionar (o crear) un tipo de servicio.");
        }

        if (tieneReserva) {
            const reservaNum = parseFloat(costoReservaVal);
            if (costoReservaVal === "" || isNaN(reservaNum) || reservaNum <= 0) {
                errores.push("Indica un valor válido para el costo de la reserva.");
            } else if (!isNaN(precioNum) && reservaNum > precioNum) {
                errores.push("El costo de la reserva no puede ser mayor que el precio total del servicio.");
            }
        }

        if (errores.length > 0) {
            Swal.fire({
                icon: "warning",
                title: "Por favor corrige lo siguiente:",
                html: `<ul style="text-align: left; margin-bottom: 0;">${errores.map(e => `<li>${e}</li>`).join("")}</ul>`,
                confirmButtonText: "Entendido",
                confirmButtonColor: "#17a9a7"
            });
            return;
        }

        const modalidadSeleccionada = document.querySelector('input[name="modalidadAtencion"]:checked')?.value || "clinica";
        const direccionClinicaVal = document.getElementById("direccionClinica")?.value.trim() || "HuellaVet — Sede Centro";
        const imagenBase64 = archivoImagen ? await convertirImagenABase64(archivoImagen) : (servicioExistente?.imagen || "");

        servicios = obtenerServicios();

        if (servicioExistente) {
            // Actualizar servicio existente
            const index = servicios.findIndex(s => String(s.id) === String(servicioExistente.id));
            const servicioActualizado = {
                id: servicioExistente.id,
                nombre: nombre,
                tipoServicioId: tipoServicioId,
                descripcion: descripcion,
                precio: parseFloat(precio),
                duracion: parseInt(duracion),
                modalidad: modalidadSeleccionada,
                esDomicilio: modalidadSeleccionada === "domicilio",
                esVirtual: modalidadSeleccionada === "virtual",
                esClinica: modalidadSeleccionada === "clinica",
                direccionClinica: modalidadSeleccionada === "clinica" ? direccionClinicaVal : "",
                icono: icono,
                imagen: imagenBase64,
                tieneCostoReserva: tieneReserva,
                costoReserva: tieneReserva ? parseFloat(costoReservaVal) : 0
            };

            if (index !== -1) {
                servicios[index] = servicioActualizado;
            } else {
                servicios.push(servicioActualizado);
            }

            guardarServicios(servicios);

            Swal.fire({
                icon: "success",
                title: "¡Servicio actualizado exitosamente!",
                text: tieneReserva ? `El servicio tiene un costo de reserva de $${servicioActualizado.costoReserva.toLocaleString("es-CO")}.` : "",
                confirmButtonText: "Aceptar",
                confirmButtonColor: "#17a9a7"
            }).then(function () {
                window.location.href = "./admin-servicios.html";
            });

        } else {
            // Crear nuevo servicio
            const nuevoServicio = {
                id: Date.now(),
                nombre: nombre,
                tipoServicioId: tipoServicioId,
                descripcion: descripcion,
                precio: parseFloat(precio),
                duracion: parseInt(duracion),
                modalidad: modalidadSeleccionada,
                esDomicilio: modalidadSeleccionada === "domicilio",
                esVirtual: modalidadSeleccionada === "virtual",
                esClinica: modalidadSeleccionada === "clinica",
                direccionClinica: modalidadSeleccionada === "clinica" ? direccionClinicaVal : "",
                icono: icono,
                imagen: imagenBase64,
                tieneCostoReserva: tieneReserva,
                costoReserva: tieneReserva ? parseFloat(costoReservaVal) : 0
            };

            servicios.push(nuevoServicio);
            guardarServicios(servicios);

            Swal.fire({
                icon: "success",
                title: "¡Servicio creado y guardado exitosamente!",
                text: tieneReserva ? `El servicio tiene un costo de reserva de $${nuevoServicio.costoReserva.toLocaleString("es-CO")}.` : "",
                confirmButtonText: "Aceptar",
                confirmButtonColor: "#17a9a7"
            }).then(function () {
                window.location.href = "./admin-servicios.html";
            });
        }
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
// Select "creatable" de Tipo de servicio: se llena con los tipos ya
// creados (ver js/shared/tipos-servicio-storage.js) y permite
// crear uno nuevo desde el boton "+ Nuevo" cuando la lista esta vacia
// o cuando se necesita agregar otro.
function iniciarTipoServicio() {
    const selectTipo = document.getElementById("tipoServicio");
    const btnCrear = document.getElementById("btnCrearTipoServicio");
    const ayudaTexto = document.getElementById("ayudaTipoServicio");

    if (!selectTipo || typeof obtenerTiposServicio !== "function") {
        return;
    }

    function renderizarOpciones(idSeleccionado) {
        const tipos = obtenerTiposServicio();

        if (tipos.length === 0) {
            selectTipo.innerHTML = `<option value="" disabled selected>Aún no hay tipos — crea el primero con "+ Nuevo"</option>`;
            if (ayudaTexto) {
                ayudaTexto.textContent = "Todavía no has creado ningún tipo de servicio. Usa el botón \"+ Nuevo\" para crear el primero.";
            }
            return;
        }

        if (ayudaTexto) {
            ayudaTexto.textContent = "Sirve para agrupar y filtrar tus servicios (ej. Laboratorio, Prevención, Estética).";
        }

        selectTipo.innerHTML = `<option value="" disabled ${idSeleccionado ? "" : "selected"}>Selecciona un tipo</option>` +
            tipos.map(tipo => `<option value="${tipo.id}" ${String(tipo.id) === String(idSeleccionado) ? "selected" : ""}>${escaparHtmlTipoServicio(tipo.nombre)}</option>`).join("");
    }

    renderizarOpciones(window.tipoServicioIdPrecargado || "");

    if (btnCrear) {
        btnCrear.addEventListener("click", function () {
            Swal.fire({
                title: "Nuevo tipo de servicio",
                input: "text",
                inputPlaceholder: "Ej. Laboratorio, Prevención, Estética...",
                showCancelButton: true,
                confirmButtonText: "Crear",
                cancelButtonText: "Cancelar",
                confirmButtonColor: "#17a9a7",
                inputValidator: function (valor) {
                    if (!valor || !valor.trim()) {
                        return "Escribe un nombre para el tipo de servicio.";
                    }
                }
            }).then(function (resultado) {
                if (!resultado.isConfirmed) return;

                const tipoCreado = crearTipoServicio(resultado.value);
                if (!tipoCreado) return;

                renderizarOpciones(tipoCreado.id);
            });
        });
    }
}

function escaparHtmlTipoServicio(valor) {
    const div = document.createElement("div");
    div.textContent = valor == null ? "" : String(valor);
    return div.innerHTML;
}
