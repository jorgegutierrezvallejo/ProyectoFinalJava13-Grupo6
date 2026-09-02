
        // funcion global: la llama tambien el componente modal agendar-cita.js
        function iniciarAgendarCita() {
            const hoy = new Date();
            const anioActual = hoy.getFullYear();
            const mesActual = hoy.getMonth();
            const diaActual = hoy.getDate();

            const diaFmt = String(diaActual).padStart(2, "0");
            const mesFmt = String(mesActual + 1).padStart(2, "0");

            let fechaSeleccionada = `${anioActual}-${mesFmt}-${diaFmt}`;
            let horaSeleccionada = "10:00 a. m.";
            let mesCalendario = mesActual;
            let anioCalendario = anioActual;

            const datosPaso1StorageKey = "datosCita_Paso1";
            const datosPaso2StorageKey = "datosCita_Paso2";

            cargarServiciosDesdeDashboard();
            iniciarFiltroTipoServicioAgendar();
            iniciarSelectorMascotaGuardada();
            precargarDatosDeContacto();
            iniciarEnvioPaso1();
            iniciarCalendario();
            cargarHorarios();
            iniciarNavegacionMultipaso();
            iniciarRecordatorios();
            iniciarConfirmacion();

            function cargarServiciosDesdeDashboard(filtroTipoId) {
                const contenedor = document.getElementById("servicios-container");
                if (!contenedor) return;

                let servicios = obtenerServicios();

                const huboServiciosSinFiltrar = servicios.length > 0;

                if (filtroTipoId) {
                    servicios = servicios.filter(s => String(s.tipoServicioId || "") === String(filtroTipoId));
                }

                if (servicios.length === 0) {
                    const selectorWrapperVacio = document.getElementById("serviciosSelectorWrapper");
                    if (selectorWrapperVacio) selectorWrapperVacio.classList.add("d-none");
                    const carruselWrapperVacio = document.getElementById("serviciosCarruselContenedor");
                    if (carruselWrapperVacio) carruselWrapperVacio.classList.remove("d-none");

                    contenedor.innerHTML = filtroTipoId && huboServiciosSinFiltrar
                        ? `
                <div class="servicios-vacio">
                    <i class="bi bi-funnel fs-4 d-block mb-2"></i>
                    <p class="mb-0">No hay servicios de este tipo por ahora.</p>
                </div>
            `
                        : `
                <div class="servicios-vacio">
                    <i class="bi bi-info-circle fs-4 d-block mb-2"></i>
                    <p class="mb-0">No hay servicios registrados en el sistema.</p>
                </div>
            `;
                    return;
                }

                const carruselWrapper = document.getElementById("serviciosCarruselContenedor");
                const selectorWrapper = document.getElementById("serviciosSelectorWrapper");
                const selectGrande = document.getElementById("selectServicioGrande");
                const previewContainer = document.getElementById("servicioGrandePreview");
                const btnPrev = document.getElementById("btnServiciosPrev");
                const btnNext = document.getElementById("btnServiciosNext");

                // Caso: Más de 8 servicios -> Mostrar selector dropdown
                if (servicios.length > 8) {
                    if (carruselWrapper) carruselWrapper.classList.add("d-none");
                    if (selectorWrapper) selectorWrapper.classList.remove("d-none");

                    if (selectGrande) {
                        selectGrande.innerHTML = `<option value="" disabled selected>-- Selecciona un servicio (${servicios.length} disponibles) --</option>`;
                        servicios.forEach((serv, i) => {
                            const mod = serv.modalidad || (serv.esDomicilio ? "domicilio" : (serv.esVirtual ? "virtual" : "clinica"));
                            const modTexto = mod === "virtual" ? "Virtual" : (mod === "domicilio" ? "A domicilio" : "En clínica");
                            const anticipoTexto = (serv.tieneCostoReserva && serv.costoReserva > 0) ? ` · Anticipo: $${Number(serv.costoReserva).toLocaleString("es-CO")}` : "";
                            const opt = document.createElement("option");
                            opt.value = serv.id;
                            opt.textContent = `${serv.nombre} (${modTexto})${anticipoTexto}`;
                            selectGrande.appendChild(opt);
                        });

                        selectGrande.addEventListener("change", function () {
                            const servId = this.value;
                            const serv = servicios.find(s => String(s.id) === String(servId));
                            if (!serv) return;

                            const mod = serv.modalidad || (serv.esDomicilio ? "domicilio" : (serv.esVirtual ? "virtual" : "clinica"));
                            const modTexto = mod === "virtual" ? "Virtual" : (mod === "domicilio" ? "A domicilio" : "En clínica");
                            const modIcono = mod === "virtual" ? "bi bi-camera-video" : (mod === "domicilio" ? "bi bi-house-door" : "bi bi-hospital");

                            if (previewContainer) {
                                previewContainer.innerHTML = `
                                    <div class="servicio-preview-card">
                                        <div class="servicio-preview-card__info">
                                            <div class="servicio-preview-card__icono">
                                                <i class="${serv.icono || "fa-solid fa-paw"}"></i>
                                            </div>
                                            <div class="servicio-preview-card__texto">
                                                <h4>${escaparHtml(serv.nombre)}</h4>
                                                <p>${escaparHtml(serv.descripcion || "Servicio veterinario profesional")}</p>
                                            </div>
                                        </div>
                                        <div class="d-flex flex-column align-items-end gap-1">
                                            <span class="badge-modalidad"><i class="${modIcono} me-1"></i>${modTexto}</span>
                                            ${serv.tieneCostoReserva && serv.costoReserva > 0 ? `<span class="badge-anticipo"><i class="bi bi-tag-fill me-1"></i>Cobro de anticipo</span>` : ""}
                                        </div>
                                    </div>
                                `;
                            }

                            if (serv.tieneCostoReserva && serv.costoReserva > 0 && typeof Swal !== "undefined") {
                                const precioTotal = serv.precio ? Number(serv.precio).toLocaleString("es-CO") : null;
                                const precioAviso = precioTotal ? ` (Precio total del servicio: <strong>$${precioTotal} COP</strong>)` : "";

                                Swal.fire({
                                    icon: "info",
                                    title: "Servicio con cobro de anticipo",
                                    html: `El servicio <strong>${escaparHtml(serv.nombre)}</strong> requiere un valor de anticipo de <strong>$${Number(serv.costoReserva).toLocaleString("es-CO")} COP</strong> para confirmar la reserva.<br><br>
                                    <div class="alert alert-success text-start py-2 px-3 small mb-2" style="background-color: #f2f9f5; border: 1px solid #d4ebdc; color: #1e5a38; border-radius: 8px;">
                                        <i class="bi bi-info-circle-fill me-1"></i><strong>Ten en cuenta:</strong> Este valor se descuenta del valor total del servicio${precioAviso}.
                                    </div>
                                    <span style="font-size: 0.85rem; color: #526765;">Deberás enviar el comprobante de pago para que el Médico Veterinario apruebe tu cita.</span>`,
                                    confirmButtonText: "Entendido",
                                    confirmButtonColor: "#17a9a7"
                                });
                            }
                        });
                    }
                    return;
                }

                // Caso: Hasta 8 servicios -> Mostrar Carrusel de tarjetas uniformes
                if (carruselWrapper) carruselWrapper.classList.remove("d-none");
                if (selectorWrapper) selectorWrapper.classList.add("d-none");

                contenedor.innerHTML = "";

                servicios.forEach((servicio, index) => {
                    const modalidad = servicio.modalidad || (servicio.esDomicilio ? "domicilio" : (servicio.esVirtual ? "virtual" : "clinica"));
                    const esDomicilio = modalidad === "domicilio";
                    const esVirtual = modalidad === "virtual";
                    const modalidadTexto = esVirtual ? "Virtual" : (esDomicilio ? "A domicilio" : "En clínica");
                    const modalidadIcono = esVirtual ? "bi bi-camera-video" : (esDomicilio ? "bi bi-house-door" : "bi bi-hospital");

                    const card = document.createElement("div");
                    card.className = `servicio-card-option ${index === 0 ? "selected" : ""}`;
                    card.dataset.id = servicio.id ?? "";
                    card.dataset.tieneReserva = servicio.tieneCostoReserva ? "true" : "false";
                    card.dataset.costoReserva = servicio.costoReserva || 0;
                    card.dataset.nombre = servicio.nombre || "Servicio";
                    card.dataset.precio = servicio.precio || 0;
                    card.dataset.modalidad = modalidad;
                    card.dataset.esDomicilio = esDomicilio ? "true" : "false";
                    card.dataset.esVirtual = esVirtual ? "true" : "false";
                    card.dataset.direccionClinica = servicio.direccionClinica || "HuellaVet — Sede Centro";
                    card.setAttribute("role", "button");
                    card.setAttribute("tabindex", "0");
                    card.setAttribute("aria-pressed", index === 0 ? "true" : "false");

                    const badgeReservaHtml = servicio.tieneCostoReserva && servicio.costoReserva > 0
                        ? `<span class="badge-anticipo"><i class="bi bi-tag-fill me-1"></i>Cobro de anticipo</span>`
                        : "";

                    const badgeModalidadHtml = `<span class="badge-modalidad"><i class="${modalidadIcono} me-1"></i>${modalidadTexto}</span>`;

                    card.innerHTML = `
                        <div class="card-check"><i class="bi bi-check-lg"></i></div>
                        <div class="servicio-card-option__icono">
                            <i class="${servicio.icono || "fa-solid fa-paw"}"></i>
                        </div>
                        <div class="servicio-card-option__titulo">${escaparHtml(servicio.nombre || "Servicio")}</div>
                        <div class="servicio-card-option__desc">${escaparHtml(servicio.descripcion || "")}</div>
                        <div class="servicio-card-option__badges">
                            ${badgeModalidadHtml}
                            ${badgeReservaHtml}
                        </div>
                    `;

                    const seleccionarServicio = function (mostrarAlerta = true) {
                        document.querySelectorAll(".servicio-card-option").forEach(c => {
                            c.classList.remove("selected");
                            c.setAttribute("aria-pressed", "false");
                        });

                        card.classList.add("selected");
                        card.setAttribute("aria-pressed", "true");

                        if (mostrarAlerta && servicio.tieneCostoReserva && servicio.costoReserva > 0) {
                            if (typeof Swal !== "undefined") {
                                const precioTotal = servicio.precio ? Number(servicio.precio).toLocaleString("es-CO") : null;
                                const precioAviso = precioTotal ? ` (Precio total del servicio: <strong>$${precioTotal} COP</strong>)` : "";

                                Swal.fire({
                                    icon: "info",
                                    title: "Servicio con cobro de anticipo",
                                    html: `El servicio <strong>${escaparHtml(servicio.nombre)}</strong> requiere un valor de anticipo de <strong>$${Number(servicio.costoReserva).toLocaleString("es-CO")} COP</strong> para confirmar la reserva.<br><br>
                                    <div class="alert alert-success text-start py-2 px-3 small mb-2" style="background-color: #f2f9f5; border: 1px solid #d4ebdc; color: #1e5a38; border-radius: 8px;">
                                        <i class="bi bi-info-circle-fill me-1"></i><strong>Ten en cuenta:</strong> Este valor se descuenta del valor total del servicio${precioAviso}.
                                    </div>
                                    <span style="font-size: 0.85rem; color: #526765;">Deberás enviar el comprobante de pago para que el Médico Veterinario apruebe tu cita.</span>`,
                                    confirmButtonText: "Entendido",
                                    confirmButtonColor: "#17a9a7"
                                });
                            }
                        }
                    };

                    card.addEventListener("click", function () {
                        seleccionarServicio(true);
                    });

                    card.addEventListener("keydown", function (event) {
                        if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            seleccionarServicio(true);
                        }
                    });

                    contenedor.appendChild(card);
                });

                // Manejo de botones de navegación del carrusel
                if (btnPrev && btnNext) {
                    if (servicios.length <= 3) {
                        btnPrev.style.display = "none";
                        btnNext.style.display = "none";
                    } else {
                        btnPrev.style.display = "flex";
                        btnNext.style.display = "flex";

                        const actualizarEstadoBotones = () => {
                            const scrollLeft = contenedor.scrollLeft;
                            const maxScroll = contenedor.scrollWidth - contenedor.clientWidth;
                            btnPrev.disabled = scrollLeft <= 5;
                            btnNext.disabled = scrollLeft >= maxScroll - 5;
                        };

                        btnPrev.addEventListener("click", function () {
                            contenedor.scrollBy({ left: -220, behavior: "smooth" });
                        });

                        btnNext.addEventListener("click", function () {
                            contenedor.scrollBy({ left: 220, behavior: "smooth" });
                        });

                        contenedor.addEventListener("scroll", actualizarEstadoBotones);
                        setTimeout(actualizarEstadoBotones, 150);
                    }
                }
            }

            // autocompleta y bloquea los campos si elige una mascota ya guardada
            function iniciarSelectorMascotaGuardada() {
                const wrapper = document.getElementById("selectorMascotaGuardadaWrapper");
                const select = document.getElementById("selectMascotaGuardada");

                if (!wrapper || !select || typeof obtenerMascotas !== "function") {
                    return;
                }

                const usuarioActivo = typeof obtenerUsuarioRegistrado === "function"
                    ? obtenerUsuarioRegistrado()
                    : null;
                const mascotasGuardadas = usuarioActivo
                    ? obtenerMascotasPorUsuarioId(usuarioActivo.id)
                    : [];

                if (mascotasGuardadas.length === 0) {
                    wrapper.classList.add("d-none");
                    return;
                }

                wrapper.classList.remove("d-none");

                select.innerHTML = `<option value="" selected>Nueva mascota (completar datos manualmente)</option>` +
                    mascotasGuardadas.map(mascota => {
                        const especieTexto = mascota.especie
                            ? ` · ${mascota.especie.charAt(0).toUpperCase()}${mascota.especie.slice(1)}`
                            : "";
                        return `<option value="${mascota.id}">${escaparHtml(mascota.nombre || "Mascota")}${especieTexto}</option>`;
                    }).join("");

                const campoNombreMascota = document.getElementById("nombreMascota");
                const campoEspecieMascota = document.getElementById("especieMascota");
                const campoRazaMascota = document.getElementById("razaMascota");
                const campoFechaNacimientoMascota = document.getElementById("fechaNacimientoMascota");
                const campoPesoMascota = document.getElementById("pesoMascota");
                const campoUnidadPesoMascota = document.getElementById("unidadPesoMascota");

                const camposAutocompletados = [
                    campoNombreMascota,
                    campoEspecieMascota,
                    campoRazaMascota,
                    campoFechaNacimientoMascota,
                    campoPesoMascota,
                    campoUnidadPesoMascota
                ];

                select.addEventListener("change", function () {
                    const idSeleccionado = this.value;

                    if (!idSeleccionado) {
                        camposAutocompletados.forEach(campo => { if (campo) campo.disabled = false; });
                        if (campoNombreMascota) campoNombreMascota.value = "";
                        if (campoEspecieMascota) campoEspecieMascota.selectedIndex = 0;
                        if (campoRazaMascota) campoRazaMascota.value = "";
                        if (campoFechaNacimientoMascota) campoFechaNacimientoMascota.value = "";
                        if (campoPesoMascota) campoPesoMascota.value = "";
                        return;
                    }

                    const mascota = mascotasGuardadas.find(m => String(m.id) === idSeleccionado);
                    if (!mascota) return;

                    if (campoNombreMascota) campoNombreMascota.value = mascota.nombre || "";
                    if (campoEspecieMascota) campoEspecieMascota.value = mascota.especie || "";
                    if (campoRazaMascota) campoRazaMascota.value = mascota.raza || "";
                    if (campoFechaNacimientoMascota) campoFechaNacimientoMascota.value = mascota.fechaNacimiento || "";

                    // El peso se guarda como texto, ej. "20 kg" o "500 g"
                    const [valorPeso, unidadPeso] = String(mascota.peso || "").trim().split(" ");
                    if (campoPesoMascota) campoPesoMascota.value = valorPeso || "";
                    if (campoUnidadPesoMascota && unidadPeso) campoUnidadPesoMascota.value = unidadPeso;

                    camposAutocompletados.forEach(campo => { if (campo) campo.disabled = true; });
                });
            }

            // precarga datos de contacto del usuario logueado (editables)
            function precargarDatosDeContacto() {
                if (typeof obtenerUsuarioRegistrado !== "function") {
                    return;
                }

                const usuario = obtenerUsuarioRegistrado();
                if (!usuario) {
                    return;
                }

                const campoNombreCliente = document.getElementById("nombreCliente");
                const campoCodigoPais = document.getElementById("codigoPais");
                const campoTelefonoCliente = document.getElementById("telefonoCliente");
                const campoEmailCliente = document.getElementById("emailCliente");
                const campoEmailClienteConfirm = document.getElementById("emailClienteConfirm");

                if (campoNombreCliente && !campoNombreCliente.value) {
                    campoNombreCliente.value = (usuario.nombreCompleto || "").trim();
                }

                if (campoTelefonoCliente && !campoTelefonoCliente.value && usuario.telefono) {
                    campoTelefonoCliente.value = usuario.telefono;
                    if (campoCodigoPais && usuario.indicativoPais) {
                        campoCodigoPais.value = usuario.indicativoPais;
                    }
                }

                if (campoEmailCliente && !campoEmailCliente.value && usuario.email) {
                    campoEmailCliente.value = usuario.email;
                }

                if (campoEmailClienteConfirm && !campoEmailClienteConfirm.value && usuario.email) {
                    campoEmailClienteConfirm.value = usuario.email;
                }
            }

            function iniciarEnvioPaso1() {
                const btnContinuar = document.getElementById("btnContinuarPaso1");
                if (!btnContinuar) return;

                btnContinuar.addEventListener("click", function (event) {
                    event.preventDefault();

                    const selectorWrapper = document.getElementById("serviciosSelectorWrapper");
                    const selectGrande = document.getElementById("selectServicioGrande");
                    const modoSelector = selectorWrapper && !selectorWrapper.classList.contains("d-none");

                    let servicioId, servicioNombre, tieneReserva, costoReserva, esDomicilio, esVirtual, modalidad, direccionClinica;

                    if (modoSelector) {
                        const sId = selectGrande?.value;
                        if (!sId) {
                            if (typeof Swal !== "undefined") {
                                Swal.fire({
                                    icon: "warning",
                                    title: "Selecciona un servicio",
                                    text: "Por favor selecciona un tipo de servicio de la lista desplegable.",
                                    confirmButtonColor: "#17a9a7"
                                });
                            } else {
                                alert("Por favor selecciona un tipo de servicio.");
                            }
                            return;
                        }

                        const sObj = obtenerServicioPorId(sId);
                        if (!sObj) return;

                        servicioId = sObj.id;
                        servicioNombre = sObj.nombre;
                        tieneReserva = !!sObj.tieneCostoReserva;
                        costoReserva = parseFloat(sObj.costoReserva || 0);
                        modalidad = sObj.modalidad || (sObj.esDomicilio ? "domicilio" : (sObj.esVirtual ? "virtual" : "clinica"));
                        esDomicilio = modalidad === "domicilio";
                        esVirtual = modalidad === "virtual";
                        direccionClinica = sObj.direccionClinica || "HuellaVet — Sede Centro";

                    } else {
                        const tarjetaSeleccionada = document.querySelector(".servicio-card-option.selected");
                        if (!tarjetaSeleccionada) {
                            if (typeof Swal !== "undefined") {
                                Swal.fire({
                                    icon: "warning",
                                    title: "Selecciona un servicio",
                                    text: "Por favor selecciona un tipo de servicio para continuar.",
                                    confirmButtonColor: "#17a9a7"
                                });
                            } else {
                                alert("Por favor selecciona un tipo de servicio.");
                            }
                            return;
                        }

                        servicioId = tarjetaSeleccionada.dataset.id;
                        servicioNombre = tarjetaSeleccionada.querySelector(".servicio-card-option__titulo")?.textContent.trim() || "Servicio";
                        tieneReserva = tarjetaSeleccionada.dataset.tieneReserva === "true";
                        costoReserva = parseFloat(tarjetaSeleccionada.dataset.costoReserva || 0);
                        esDomicilio = tarjetaSeleccionada.dataset.esDomicilio === "true";
                        esVirtual = tarjetaSeleccionada.dataset.esVirtual === "true";
                        modalidad = tarjetaSeleccionada.dataset.modalidad || "clinica";
                        direccionClinica = tarjetaSeleccionada.dataset.direccionClinica || "HuellaVet — Sede Centro";
                    }

                    const nombreMascota = document.getElementById("nombreMascota")?.value.trim() || "";
                    const especie = document.getElementById("especieMascota")?.value || "";

                    if (!nombreMascota) {
                        if (typeof Swal !== "undefined") {
                            Swal.fire({
                                icon: "warning",
                                title: "Campo requerido",
                                text: "Por favor indica el nombre de tu mascota.",
                                confirmButtonColor: "#17a9a7"
                            }).then(() => {
                                document.getElementById("nombreMascota")?.focus();
                            });
                        } else {
                            alert("Por favor indica el nombre de tu mascota.");
                            document.getElementById("nombreMascota")?.focus();
                        }
                        return;
                    }

                    if (!especie) {
                        if (typeof Swal !== "undefined") {
                            Swal.fire({
                                icon: "warning",
                                title: "Campo requerido",
                                text: "Por favor selecciona la especie de tu mascota.",
                                confirmButtonColor: "#17a9a7"
                            }).then(() => {
                                document.getElementById("especieMascota")?.focus();
                            });
                        } else {
                            alert("Por favor selecciona la especie de tu mascota.");
                            document.getElementById("especieMascota")?.focus();
                        }
                        return;
                    }

                    const datosPaso1 = {
                        mascotaId: document.getElementById("selectMascotaGuardada")?.value || "",
                        nombreMascota,
                        especie,
                        raza: document.getElementById("razaMascota")?.value.trim() || "",
                        fechaNacimiento: document.getElementById("fechaNacimientoMascota")?.value || "No especificada",
                        peso: (() => {
                            const pVal = document.getElementById("pesoMascota")?.value.trim();
                            const pUnit = document.getElementById("unidadPesoMascota")?.value;
                            return pVal ? `${pVal} ${pUnit}` : "No especificado";
                        })(),
                        servicioId,
                        servicioNombre,
                        tieneCostoReserva: tieneReserva,
                        costoReserva,
                        esDomicilio,
                        esVirtual,
                        direccionClinica,
                        modalidad,
                        motivoConsulta: document.getElementById("motivoConsulta")?.value.trim() || ""
                    };

                    sessionStorage.setItem(datosPaso1StorageKey, JSON.stringify(datosPaso1));

                    // Control de visibilidad del campo dirección para paso 3
                    const campoDir = document.getElementById("campoDireccionContainer");
                    if (campoDir) {
                        if (esDomicilio) {
                            campoDir.classList.remove("d-none");
                        } else {
                            campoDir.classList.add("d-none");
                        }
                    }

                    cambiarPaso(1, 2);
                });
            }

            function iniciarCalendario() {
                const grid = document.getElementById("calDiasGrid");
                const titulo = document.getElementById("mesCalendarioTitulo");
                const btnAnterior = document.getElementById("btnMesAnterior");
                const btnSiguiente = document.getElementById("btnMesSiguiente");

                if (!grid) return;

                function renderizarCalendario() {
                    const primerDia = new Date(anioCalendario, mesCalendario, 1);
                    const ultimoDia = new Date(anioCalendario, mesCalendario + 1, 0);
                    const diasMes = ultimoDia.getDate();
                    const primerDiaSemana = (primerDia.getDay() + 6) % 7; // lunes = 0
                    const diasMesAnterior = new Date(anioCalendario, mesCalendario, 0).getDate();

                    if (titulo) {
                        titulo.textContent = new Intl.DateTimeFormat("es-CO", {
                            month: "long",
                            year: "numeric"
                        }).format(primerDia).replace(/^./, letra => letra.toUpperCase());
                    }

                    grid.innerHTML = "";

                    for (let i = primerDiaSemana - 1; i >= 0; i--) {
                        const dia = document.createElement("div");
                        dia.className = "cal-dia deshabilitado";
                        dia.textContent = diasMesAnterior - i;
                        grid.appendChild(dia);
                    }

                    for (let diaNumero = 1; diaNumero <= diasMes; diaNumero++) {
                        const dia = document.createElement("div");
                        const fecha = `${anioCalendario}-${String(mesCalendario + 1).padStart(2, "0")}-${String(diaNumero).padStart(2, "0")}`;

                        dia.className = `cal-dia${fecha === fechaSeleccionada ? " seleccionado" : ""}`;
                        dia.dataset.fecha = fecha;
                        dia.dataset.dia = String(diaNumero);
                        dia.textContent = diaNumero;

                        dia.addEventListener("click", function () {
                            grid.querySelectorAll(".cal-dia").forEach(d => d.classList.remove("seleccionado"));
                            this.classList.add("seleccionado");
                            fechaSeleccionada = this.dataset.fecha;
                            guardarDatosPaso2();
                        });

                        grid.appendChild(dia);
                    }

                    const celdasActuales = grid.children.length;
                    const celdasRestantes = (7 - (celdasActuales % 7)) % 7;

                    for (let diaNumero = 1; diaNumero <= celdasRestantes; diaNumero++) {
                        const dia = document.createElement("div");
                        dia.className = "cal-dia deshabilitado";
                        dia.textContent = diaNumero;
                        grid.appendChild(dia);
                    }
                }

                btnAnterior?.addEventListener("click", function () {
                    mesCalendario--;
                    if (mesCalendario < 0) {
                        mesCalendario = 11;
                        anioCalendario--;
                    }
                    renderizarCalendario();
                });

                btnSiguiente?.addEventListener("click", function () {
                    mesCalendario++;
                    if (mesCalendario > 11) {
                        mesCalendario = 0;
                        anioCalendario++;
                    }
                    renderizarCalendario();
                });

                renderizarCalendario();
            }

            function cargarHorarios() {
                const container = document.getElementById("horariosContainer");
                if (!container) return;

                const horas = [
                    "08:00 a. m.",
                    "09:00 a. m.",
                    "10:00 a. m.",
                    "11:00 a. m.",
                    "12:00 p. m.",
                    "03:00 p. m.",
                    "04:00 p. m."
                ];

                container.innerHTML = "";

                horas.forEach(hora => {
                    const item = document.createElement("div");
                    item.className = `hora-item${hora === horaSeleccionada ? " seleccionado" : ""}`;
                    item.textContent = hora;
                    item.setAttribute("role", "button");
                    item.setAttribute("tabindex", "0");
                    item.setAttribute("aria-pressed", hora === horaSeleccionada ? "true" : "false");

                    const seleccionarHora = function () {
                        container.querySelectorAll(".hora-item").forEach(h => {
                            h.classList.remove("seleccionado");
                            h.setAttribute("aria-pressed", "false");
                        });
                        item.classList.add("seleccionado");
                        item.setAttribute("aria-pressed", "true");
                        horaSeleccionada = hora;
                        guardarDatosPaso2();
                    };

                    item.addEventListener("click", seleccionarHora);
                    item.addEventListener("keydown", function (event) {
                        if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            seleccionarHora();
                        }
                    });

                    container.appendChild(item);
                });
            }

            function iniciarNavegacionMultipaso() {
                const btnContinuarPaso2 = document.getElementById("btnContinuarPaso2");
                const btnVolverPaso1 = document.getElementById("btnVolverPaso1");
                const btnVolverPaso2 = document.getElementById("btnVolverPaso2");
                const btnEditarCita = document.getElementById("btnEditarCita");

                // La validación y guardado del Paso 1 están en iniciarEnvioPaso1().
                // Aquí gestionamos únicamente los controles de navegación restantes.
                btnVolverPaso1?.addEventListener("click", function () {
                    cambiarPaso(2, 1);
                });

                btnContinuarPaso2?.addEventListener("click", function () {
                    if (!fechaSeleccionada || !horaSeleccionada) {
                        if (typeof Swal !== "undefined") {
                            Swal.fire({
                                icon: "warning",
                                title: "Fecha y hora requeridas",
                                text: "Por favor selecciona la fecha y la hora para tu cita.",
                                confirmButtonColor: "#17a9a7"
                            });
                        } else {
                            alert("Selecciona la fecha y hora.");
                        }
                        return;
                    }

                    guardarDatosPaso2();
                    actualizarResumen();
                    cambiarPaso(2, 3);
                });

                btnVolverPaso2?.addEventListener("click", function () {
                    cambiarPaso(3, 2);
                });

                btnEditarCita?.addEventListener("click", function () {
                    actualizarResumen();
                    cambiarPaso(3, 1);
                });
            }

            function iniciarRecordatorios() {
                document.querySelectorAll(".opcion-recordatorio").forEach(card => {
                    const seleccionar = function () {
                        document.querySelectorAll(".opcion-recordatorio").forEach(c => {
                            c.classList.remove("selected");
                            c.setAttribute("aria-pressed", "false");
                        });

                        card.classList.add("selected");
                        card.setAttribute("aria-pressed", "true");
                        actualizarTextoNotaCanal(card.dataset.canal);
                    };

                    card.addEventListener("click", seleccionar);
                    card.addEventListener("keydown", function (event) {
                        if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            seleccionar();
                        }
                    });
                });
            }

            function actualizarTextoNotaCanal(canal) {
                const notaCanal = document.getElementById("notaCanalRecordatorio");
                if (!notaCanal) return;
                if (canal === "email") {
                    notaCanal.textContent = "correo electrónico";
                } else {
                    notaCanal.textContent = "WhatsApp";
                }
            }

            function iniciarConfirmacion() {
                const btnConfirmarCita = document.getElementById("btnConfirmarCita");
                if (!btnConfirmarCita) return;

                btnConfirmarCita.addEventListener("click", function () {
                    const nombreCliente = document.getElementById("nombreCliente")?.value.trim() || "";
                    const codigoPais = document.getElementById("codigoPais")?.value || "+57";
                    const telefonoInput = document.getElementById("telefonoCliente")?.value.trim() || "";
                    const telefonoCliente = telefonoInput ? codigoPais + " " + telefonoInput : "";
                    const emailCliente = document.getElementById("emailCliente")?.value.trim() || "";
                    const emailClienteConfirm = document.getElementById("emailClienteConfirm")?.value.trim() || "";
                    const direccionCliente = document.getElementById("direccionCliente")?.value.trim() || "";
                    const acepta = document.getElementById("aceptaTerminos")?.checked;
                    const recordatorioSeleccionado = document.querySelector(".opcion-recordatorio.selected")?.dataset.canal || "";
                    const datosP1 = obtenerDatosPaso1();

                    if (!nombreCliente || !telefonoCliente || !emailCliente || !emailClienteConfirm) {
                        if (typeof Swal !== "undefined") {
                            Swal.fire({
                                icon: "warning",
                                title: "Datos incompletos",
                                text: "Completa todos tus datos de contacto para continuar.",
                                confirmButtonColor: "#17a9a7"
                            });
                        } else {
                            alert("Completa todos los datos de contacto para continuar.");
                        }
                        return;
                    }

                    if (datosP1.esDomicilio && !direccionCliente) {
                        if (typeof Swal !== "undefined") {
                            Swal.fire({
                                icon: "warning",
                                title: "Dirección requerida",
                                text: "El servicio seleccionado es a domicilio. Por favor indica la dirección de atención.",
                                confirmButtonColor: "#17a9a7"
                            }).then(() => {
                                document.getElementById("direccionCliente")?.focus();
                            });
                        } else {
                            alert("Por favor indica la dirección de atención a domicilio.");
                            document.getElementById("direccionCliente")?.focus();
                        }
                        return;
                    }

                    if (emailCliente !== emailClienteConfirm) {
                        if (typeof Swal !== "undefined") {
                            Swal.fire({
                                icon: "error",
                                title: "Los correos no coinciden",
                                text: "Verifica que ambos campos de correo electrónico sean idénticos.",
                                confirmButtonColor: "#17a9a7"
                            }).then(() => {
                                document.getElementById("emailClienteConfirm")?.focus();
                            });
                        } else {
                            alert("Los correos electrónicos no coinciden.");
                            document.getElementById("emailClienteConfirm")?.focus();
                        }
                        return;
                    }

                    if (!recordatorioSeleccionado) {
                        if (typeof Swal !== "undefined") {
                            Swal.fire({
                                icon: "warning",
                                title: "Canal de recordatorio",
                                text: "Selecciona cómo prefieres recibir los recordatorios de tu cita.",
                                confirmButtonColor: "#17a9a7"
                            });
                        } else {
                            alert("Selecciona cómo prefieres recibir los recordatorios.");
                        }
                        return;
                    }

                    if (!acepta) {
                        if (typeof Swal !== "undefined") {
                            Swal.fire({
                                icon: "warning",
                                title: "Términos y condiciones",
                                text: "Debes aceptar los términos y condiciones para continuar.",
                                confirmButtonColor: "#17a9a7"
                            });
                        } else {
                            alert("Debes aceptar los términos y condiciones para continuar.");
                        }
                        return;
                    }

                    const datosP2 = obtenerDatosPaso2();
                    let ubicacionCita = "HuellaVet — Sede Centro";
                    if (datosP1.modalidad === "domicilio") {
                        ubicacionCita = direccionCliente ? `Domicilio: ${direccionCliente}` : "Servicio a Domicilio";
                    } else if (datosP1.modalidad === "virtual") {
                        ubicacionCita = "Consulta Virtual (Videollamada)";
                    } else {
                        ubicacionCita = datosP1.direccionClinica || "HuellaVet — Sede Centro";
                    }

                    const usuarioActivo = obtenerUsuarioRegistrado();
                    if (!usuarioActivo) {
                        alert("Debes iniciar sesión para agendar una cita.");
                        return;
                    }

                    const mascotaExistente = datosP1.mascotaId
                        ? obtenerMascotaPorId(datosP1.mascotaId)
                        : null;
                    const mascota = mascotaExistente || registrarMascotaSiNoExiste({
                        nombre: datosP1.nombreMascota,
                        especie: datosP1.especie,
                        raza: datosP1.raza,
                        fechaNacimiento: datosP1.fechaNacimiento === "No especificada" ? "" : datosP1.fechaNacimiento,
                        peso: datosP1.peso === "No especificado" ? "" : datosP1.peso,
                        foto: "",
                        usuarioId: usuarioActivo.id
                    });

                    const nuevaCita = {
                        id: Date.now(),
                        usuarioId: usuarioActivo.id,
                        mascotaId: mascota.id,
                        fecha: datosP2.fecha || "2026-08-28",
                        hora: datosP2.hora || "10:30 AM",
                        nombreMascota: datosP1.nombreMascota || "Luna",
                        especie: datosP1.especie || "Gato",
                        raza: datosP1.raza || "Siamés",
                        edad: datosP1.edad || "",
                        peso: datosP1.peso || "",
                        motivo: datosP1.motivoConsulta || "",
                        servicioId: datosP1.servicioId,
                        servicioNombre: datosP1.servicioNombre || "Consulta general",
                        modalidad: datosP1.modalidad || "clinica",
                        ubicacion: ubicacionCita,
                        veterinario: "",
                        estado: "Pendiente",
                        tieneCostoReserva: datosP1.tieneCostoReserva,
                        costoReserva: datosP1.costoReserva,
                        cliente: {
                            nombre: nombreCliente,
                            telefono: telefonoCliente,
                            email: emailCliente,
                            direccion: direccionCliente,
                            canalRecordatorio: recordatorioSeleccionado
                        },
                        fechaCreacion: new Date().toISOString()
                    };

                    // Guardar en sessionStorage para la sesión actual
                    sessionStorage.setItem("datosCita", JSON.stringify(nuevaCita));

                    agregarCita(nuevaCita);

                    if (typeof Swal !== "undefined") {
                        const tieneReserva = datosP1.tieneCostoReserva && datosP1.costoReserva > 0;
                        const textoReserva = tieneReserva
                            ? `<br><br><div class="alert alert-info text-start small mb-0"><strong>Recordatorio:</strong> Este servicio tiene un costo de reserva de $${Number(datosP1.costoReserva).toLocaleString("es-CO")}. Recuerda enviar el comprobante a info@huellavet.com o al WhatsApp +57 300 123 4567.</div>`
                            : "";

                        Swal.fire({
                            icon: "success",
                            title: "¡Cita solicitada con éxito!",
                            html: `Tu cita para <strong>${escaparHtml(datosP1.nombreMascota)}</strong> ha sido confirmada y registrada en el sistema. Te contactaremos vía <strong>${recordatorioSeleccionado === "email" ? "correo electrónico" : "WhatsApp"}</strong>.${textoReserva}`,
                            showCancelButton: true,
                            confirmButtonColor: "#17a9a7",
                            cancelButtonColor: "#6c757d",
                            confirmButtonText: '<i class="bi bi-speedometer2 me-1"></i> Ir a mi Dashboard',
                            cancelButtonText: "Aceptar"
                        }).then(result => {
                            if (result.isConfirmed) {
                                if (typeof cerrarAgendarCitaModal === "function" && window.location.pathname.includes("/user/html/")) {
                                    cerrarAgendarCitaModal();
                                    window.location.reload();
                                } else {
                                    window.location.href = window.location.pathname.includes("/user/html/")
                                        ? "user-dashboard.html"
                                        : "./user/html/user-dashboard.html";
                                }
                            }
                        });
                    } else {
                        alert("¡Cita agendada con éxito! Te hemos enviado la información de confirmación a tu contacto.");
                    }
                });
            }

            function cambiarPaso(pasoActual, pasoSiguiente) {
                const pasoActualEl = document.getElementById(`paso-${pasoActual}`);
                const pasoSiguienteEl = document.getElementById(`paso-${pasoSiguiente}`);

                if (!pasoActualEl || !pasoSiguienteEl) return;

                pasoActualEl.classList.add("d-none");
                pasoSiguienteEl.classList.remove("d-none");

                actualizarProgreso(pasoActual, pasoSiguiente);

                if (pasoSiguiente === 3) {
                    actualizarResumen();
                }

                document.getElementById("agendarcita")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }

            function actualizarProgreso(pasoActual, pasoSiguiente) {
                const items = [1, 2, 3].map(numero => document.getElementById(`progreso-paso-${numero}`));

                items.forEach((item, index) => {
                    if (!item) return;

                    const numeroPaso = index + 1;
                    item.classList.remove("progreso-item--activo", "progreso-item--completado");

                    const numeroEl = item.querySelector(".progreso-numero");
                    if (!numeroEl) return;

                    if (numeroPaso < pasoSiguiente) {
                        item.classList.add("progreso-item--completado");
                        numeroEl.innerHTML = '<i class="bi bi-check-lg"></i>';
                    } else if (numeroPaso === pasoSiguiente) {
                        item.classList.add("progreso-item--activo");
                        numeroEl.textContent = numeroPaso;
                    } else {
                        numeroEl.textContent = numeroPaso;
                    }
                });

                // Al volver al paso 1, todos los pasos posteriores recuperan su estado inicial.
                if (pasoSiguiente === 1) {
                    items.forEach((item, index) => {
                        if (!item) return;
                        const numeroEl = item.querySelector(".progreso-numero");
                        if (numeroEl) numeroEl.textContent = index + 1;
                    });
                    items[0]?.classList.add("progreso-item--activo");
                    items[1]?.classList.remove("progreso-item--completado");
                    items[2]?.classList.remove("progreso-item--completado");
                }
            }

            function guardarDatosPaso2() {
                sessionStorage.setItem(datosPaso2StorageKey, JSON.stringify(obtenerDatosPaso2()));
            }

            function obtenerDatosPaso1() {
                try {
                    return JSON.parse(sessionStorage.getItem(datosPaso1StorageKey)) || {};
                } catch (error) {
                    return {};
                }
            }

            function obtenerDatosPaso2() {
                return {
                    fecha: fechaSeleccionada,
                    hora: horaSeleccionada
                };
            }

            function actualizarResumen() {
                const datosPaso1 = obtenerDatosPaso1();
                const nombreMascota = document.getElementById("nombreMascota")?.value.trim() || datosPaso1.nombreMascota || "Max";
                const raza = document.getElementById("razaMascota")?.value.trim() || datosPaso1.raza || "";
                const servicioCard = document.querySelector(".servicio-card-option.selected .servicio-card-option__titulo");
                const servicioNombre = servicioCard?.textContent.trim() || datosPaso1.servicioNombre || "Consulta general";

                const nombreResumen = `${nombreMascota}${raza ? ` (${raza})` : ""}`;
                const fechaResumen = formatearFecha(fechaSeleccionada);

                const resumenNombre = document.getElementById("resumenNombreMascota");
                const resumenServicio = document.getElementById("resumenServicio");
                const resumenModalidad = document.getElementById("resumenModalidad");
                const resumenFilaDireccion = document.getElementById("resumenFilaDireccion");
                const resumenDireccion = document.getElementById("resumenDireccion");
                const resumenFecha = document.getElementById("resumenFecha");
                const resumenHora = document.getElementById("resumenHora");
                const resumenCostoReserva = document.getElementById("resumenCostoReserva");

                if (resumenNombre) resumenNombre.textContent = nombreResumen;
                if (resumenServicio) resumenServicio.textContent = servicioNombre;

                const esDomicilio = datosPaso1.esDomicilio;
                if (resumenModalidad) {
                    resumenModalidad.innerHTML = esDomicilio
                        ? '<i class="bi bi-house-door me-1"></i>A domicilio'
                        : '<i class="bi bi-hospital me-1"></i>En clínica';
                }

                if (resumenFilaDireccion) {
                    if (esDomicilio) {
                        resumenFilaDireccion.classList.remove("d-none");
                        const dirVal = document.getElementById("direccionCliente")?.value.trim();
                        if (resumenDireccion) resumenDireccion.textContent = dirVal || "Dirección por definir";
                    } else {
                        resumenFilaDireccion.classList.add("d-none");
                    }
                }

                if (resumenFecha) resumenFecha.textContent = fechaResumen;
                if (resumenHora) resumenHora.textContent = horaSeleccionada || "10:00 a. m.";

                if (resumenCostoReserva) {
                    if (datosPaso1.tieneCostoReserva && datosPaso1.costoReserva > 0) {
                        resumenCostoReserva.textContent = `$ ${Number(datosPaso1.costoReserva).toLocaleString("es-CO")} COP (se descuenta del total)`;
                    } else {
                        resumenCostoReserva.textContent = "Sin costo de reserva";
                    }
                }

                const notaCostoReservaMensaje = document.getElementById("notaCostoReservaMensaje");
                if (notaCostoReservaMensaje) {
                    if (datosPaso1.tieneCostoReserva && datosPaso1.costoReserva > 0) {
                        notaCostoReservaMensaje.innerHTML = `Este servicio requiere un anticipo de <strong>$${Number(datosPaso1.costoReserva).toLocaleString("es-CO")} COP</strong> (este valor <strong>se descuenta del total del servicio</strong>). Deberás enviar el comprobante a <strong class="text-dark">info@huellavet.com</strong> o al WhatsApp <strong class="text-dark">+57 300 123 4567</strong>.`;
                    } else {
                        notaCostoReservaMensaje.textContent = "Este servicio no requiere costo de reserva anticipado.";
                    }
                }

                const canalActual = document.querySelector(".opcion-recordatorio.selected")?.dataset.canal || "whatsapp";
                actualizarTextoNotaCanal(canalActual);
            }

            function formatearFecha(fechaISO) {
                if (!fechaISO) return "Fecha no seleccionada";

                const [anio, mes, dia] = fechaISO.split("-").map(Number);
                const fecha = new Date(anio, mes - 1, dia);

                return new Intl.DateTimeFormat("es-CO", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                }).format(fecha).replace(/^./, letra => letra.toUpperCase());
            }

            function escaparHtml(valor) {
                const div = document.createElement("div");
                div.textContent = String(valor);
                return div.innerHTML;
            }

            // Llena el filtro "Todos los tipos" (junto al titulo "Tipo de
            // servicio") con los tipos que el admin ha creado, y vuelve a
            // pintar el carrusel/selector filtrado cada vez que cambia.
            function iniciarFiltroTipoServicioAgendar() {
                const filtroSelect = document.getElementById("filtroTipoServicioAgendar");
                if (!filtroSelect || typeof obtenerTiposServicio !== "function") {
                    return;
                }

                const tipos = obtenerTiposServicio();

                if (tipos.length === 0) {
                    const contenedorFiltro = filtroSelect.closest(".servicios-seccion__filtro");
                    if (contenedorFiltro) contenedorFiltro.classList.add("d-none");
                    return;
                }

                filtroSelect.innerHTML = `<option value="" selected>Todos los tipos</option>` +
                    tipos.map(tipo => `<option value="${tipo.id}">${escaparHtml(tipo.nombre)}</option>`).join("");

                filtroSelect.addEventListener("change", function () {
                    cargarServiciosDesdeDashboard(this.value);
                });
            }
        }

        // auto-inicia solo si el formulario ya esta en el dom (pagina standalone)
        document.addEventListener("DOMContentLoaded", function () {
            if (document.getElementById("agendarcita")) {
                iniciarAgendarCita();
            }
        });
