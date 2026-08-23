document.addEventListener("DOMContentLoaded", function () {
    let fechaSeleccionada = "2025-05-16";
    let horaSeleccionada = "10:00 a. m.";
    let mesCalendario = 4; // Mayo (0 = enero)
    let anioCalendario = 2025;

    const serviciosStorageKey = "servicios";
    const datosPaso1StorageKey = "datosCita_Paso1";
    const datosPaso2StorageKey = "datosCita_Paso2";

    cargarServiciosDesdeDashboard();
    iniciarEnvioPaso1();
    iniciarCalendario();
    cargarHorarios();
    iniciarNavegacionMultipaso();
    iniciarRecordatorios();
    iniciarConfirmacion();

    function cargarServiciosDesdeDashboard() {
        const contenedor = document.getElementById("servicios-container");
        if (!contenedor) return;

        let servicios = [];

        try {
            servicios = JSON.parse(localStorage.getItem(serviciosStorageKey)) || [];
        } catch (error) {
            console.error("No fue posible leer los servicios del Dashboard:", error);
        }

        if (!Array.isArray(servicios) || servicios.length === 0) {
            contenedor.innerHTML = `
                <div class="servicios-vacio">
                    <i class="bi bi-info-circle fs-4 d-block mb-2"></i>
                    <p class="mb-0">No hay servicios registrados en el sistema.</p>
                </div>
            `;
            return;
        }

        contenedor.innerHTML = "";

        servicios.forEach((servicio, index) => {
            const card = document.createElement("div");
            card.className = `servicio-card-option ${index === 0 ? "selected" : ""}`;
            card.dataset.id = servicio.id ?? "";
            card.setAttribute("role", "button");
            card.setAttribute("tabindex", "0");
            card.setAttribute("aria-pressed", index === 0 ? "true" : "false");

            card.innerHTML = `
                <div class="card-check"><i class="bi bi-check-lg"></i></div>
                <div class="servicio-card-option__icono">
                    <i class="${servicio.icono || "bi bi-paw-fill"}"></i>
                </div>
                <div class="servicio-card-option__titulo">${escaparHtml(servicio.nombre || "Servicio")}</div>
                <div class="servicio-card-option__desc">${escaparHtml(servicio.descripcion || "")}</div>
            `;

            const seleccionarServicio = function () {
                document.querySelectorAll(".servicio-card-option").forEach(c => {
                    c.classList.remove("selected");
                    c.setAttribute("aria-pressed", "false");
                });

                card.classList.add("selected");
                card.setAttribute("aria-pressed", "true");
            };

            card.addEventListener("click", seleccionarServicio);
            card.addEventListener("keydown", function (event) {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    seleccionarServicio();
                }
            });

            contenedor.appendChild(card);
        });
    }

    function iniciarEnvioPaso1() {
        const btnContinuar = document.getElementById("btnContinuarPaso1");
        if (!btnContinuar) return;

        btnContinuar.addEventListener("click", function (event) {
            event.preventDefault();

            const tarjetaSeleccionada = document.querySelector(".servicio-card-option.selected");
            if (!tarjetaSeleccionada) {
                alert("Por favor selecciona un tipo de servicio.");
                return;
            }

            const nombreMascota = document.getElementById("nombreMascota")?.value.trim() || "";
            const especie = document.getElementById("especieMascota")?.value || "";

            if (!nombreMascota) {
                alert("Por favor indica el nombre de tu mascota.");
                document.getElementById("nombreMascota")?.focus();
                return;
            }

            if (!especie) {
                alert("Por favor selecciona la especie de tu mascota.");
                document.getElementById("especieMascota")?.focus();
                return;
            }

            const datosPaso1 = {
                nombreMascota,
                especie,
                raza: document.getElementById("razaMascota")?.value.trim() || "",
                edad: document.getElementById("edadMascota")?.value.trim() || "",
                peso: document.getElementById("pesoMascota")?.value.trim() || "",
                servicioId: tarjetaSeleccionada.dataset.id,
                servicioNombre: tarjetaSeleccionada.querySelector(".servicio-card-option__titulo")?.textContent.trim() || "",
                motivoConsulta: document.getElementById("motivoConsulta")?.value.trim() || ""
            };

            sessionStorage.setItem(datosPaso1StorageKey, JSON.stringify(datosPaso1));
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
                alert("Selecciona la fecha y hora.");
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

    function iniciarConfirmacion() {
        const btnConfirmarCita = document.getElementById("btnConfirmarCita");
        if (!btnConfirmarCita) return;

        btnConfirmarCita.addEventListener("click", function () {
            const nombreCliente = document.getElementById("nombreCliente")?.value.trim() || "";
            const telefonoCliente = document.getElementById("telefonoCliente")?.value.trim() || "";
            const emailCliente = document.getElementById("emailCliente")?.value.trim() || "";
            const emailClienteConfirm = document.getElementById("emailClienteConfirm")?.value.trim() || "";
            const acepta = document.getElementById("aceptaTerminos")?.checked;
            const recordatorioSeleccionado = document.querySelector(".opcion-recordatorio.selected")?.dataset.canal || "";

            if (!nombreCliente || !telefonoCliente || !emailCliente || !emailClienteConfirm) {
                alert("Completa todos los datos de contacto para continuar.");
                return;
            }

            if (emailCliente !== emailClienteConfirm) {
                alert("Los correos electrónicos no coinciden.");
                document.getElementById("emailClienteConfirm")?.focus();
                return;
            }

            if (!recordatorioSeleccionado) {
                alert("Selecciona cómo prefieres recibir los recordatorios.");
                return;
            }

            if (!acepta) {
                alert("Debes aceptar los términos y condiciones para continuar.");
                return;
            }

            const datosCita = {
                paso1: obtenerDatosPaso1(),
                paso2: obtenerDatosPaso2(),
                contacto: {
                    nombre: nombreCliente,
                    telefono: telefonoCliente,
                    email: emailCliente,
                    canalRecordatorio: recordatorioSeleccionado
                }
            };

            sessionStorage.setItem("datosCita", JSON.stringify(datosCita));

            if (typeof Swal !== "undefined") {
                Swal.fire({
                    icon: "success",
                    title: "¡Cita agendada con éxito!",
                    text: "Te hemos enviado la información de confirmación a tu contacto.",
                    confirmButtonColor: "#17a9a7"
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
        const resumenFecha = document.getElementById("resumenFecha");
        const resumenHora = document.getElementById("resumenHora");

        if (resumenNombre) resumenNombre.textContent = nombreResumen;
        if (resumenServicio) resumenServicio.textContent = servicioNombre;
        if (resumenFecha) resumenFecha.textContent = fechaResumen;
        if (resumenHora) resumenHora.textContent = horaSeleccionada || "10:00 a. m.";
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
});
