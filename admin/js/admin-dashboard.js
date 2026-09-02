document.addEventListener(
    "DOMContentLoaded",
    function () {

        mostrarFechaActual();

        iniciarSidebarDashboard();

        iniciarCalendarioDashboard();

        cargarResumenDinamicoDashboard();

    }
);


/* ========================================
   FECHA ACTUAL
======================================== */

function mostrarFechaActual() {

    const fechaElemento =
        document.getElementById(
            "currentDate"
        );


    if (!fechaElemento) {
        return;
    }


    const fechaActual =
        new Date();


    const opcionesFecha = {
        day: "numeric",
        month: "long",
        year: "numeric"
    };


    const fechaFormateada =
        fechaActual.toLocaleDateString(
            "es-CO",
            opcionesFecha
        );


    fechaElemento.textContent =
        fechaFormateada;

}

/* ========================================
   RESUMEN DINÁMICO
======================================== */

function cargarResumenDinamicoDashboard() {
    const citas = typeof obtenerTodasLasCitas === "function" ? obtenerTodasLasCitas() : [];
    const usuarios = typeof obtenerUsuarios === "function" ? obtenerUsuarios() : [];
    const servicios = typeof obtenerServicios === "function" ? obtenerServicios() : [];

    renderizarMetricasDashboard(citas, usuarios, servicios);
    renderizarProximasCitasDashboard(citas);
    renderizarServiciosDashboard(servicios);
    renderizarCitasPorServicioDashboard(citas, servicios);
}

function renderizarMetricasDashboard(citas, usuarios, servicios) {
    const hoy = hoyISO();
    const ayer = sumarDiasISO(hoy, -1);
    const citasValidas = citas.filter(cita => !["Cancelada", "Rechazada"].includes(cita.estado));
    const citasHoy = citasValidas.filter(cita => cita.fecha === hoy);
    const citasAyer = citasValidas.filter(cita => cita.fecha === ayer);

    const ahora = new Date();
    const lunes = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    lunes.setDate(lunes.getDate() - ((lunes.getDay() + 6) % 7));
    const domingo = new Date(lunes);
    domingo.setDate(domingo.getDate() + 6);
    const inicioSemana = fechaDashboardISO(lunes);
    const finSemana = fechaDashboardISO(domingo);
    const citasSemana = citasValidas.filter(cita => cita.fecha >= inicioSemana && cita.fecha <= finSemana);
    const completadasSemana = citasSemana.filter(cita => cita.estado === "Completada").length;

    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const usuariosEsteMes = usuarios.filter(usuario => {
        const fecha = new Date(usuario.creadoEn || 0);
        return !Number.isNaN(fecha.getTime()) && fecha >= inicioMes;
    }).length;

    asignarTextoDashboard("dashboardCitasHoy", citasHoy.length);
    const diferenciaAyer = citasHoy.length - citasAyer.length;
    asignarTextoDashboard("dashboardCitasHoyDetalle", diferenciaAyer === 0
        ? "Igual que ayer"
        : `${Math.abs(diferenciaAyer)} ${diferenciaAyer > 0 ? "más" : "menos"} que ayer`);
    asignarTextoDashboard("dashboardCitasSemana", citasSemana.length);
    asignarTextoDashboard("dashboardCitasSemanaDetalle", `${completadasSemana} completada${completadasSemana === 1 ? "" : "s"}`);
    asignarTextoDashboard("dashboardUsuarios", usuarios.length);
    asignarTextoDashboard("dashboardUsuariosDetalle", `${usuariosEsteMes} registrado${usuariosEsteMes === 1 ? "" : "s"} este mes`);
    asignarTextoDashboard("dashboardServiciosActivos", servicios.length);
}

function renderizarProximasCitasDashboard(citas) {
    const contenedor = document.getElementById("dashboardProximasCitas");
    if (!contenedor) return;

    const ahora = new Date();
    const estadosFinales = ["Cancelada", "Rechazada", "Completada"];
    const proximas = citas
        .filter(cita => !estadosFinales.includes(cita.estado))
        .filter(cita => momentoCita(cita) >= ahora)
        .sort((a, b) => momentoCita(a) - momentoCita(b))
        .slice(0, 4)
        .map(cita => ({ tipo: "cita", cita, momento: momentoCita(cita) }));

    const espacios = [...proximas];
    if (espacios.length < 4) {
        espacios.push(...obtenerEspaciosLibresDashboard(citas, 4 - espacios.length, ahora));
    }

    espacios.sort((a, b) => a.momento - b.momento);

    asignarTextoDashboard("dashboardProximasCitasSubtitulo", `${espacios.length} espacios próximos`);
    contenedor.innerHTML = espacios.map(espacio =>
        espacio.tipo === "cita" ? crearCitaDashboardHtml(espacio.cita) : crearEspacioLibreDashboardHtml(espacio)
    ).join("");
}

function obtenerEspaciosLibresDashboard(citas, cantidad, ahora) {
    const libres = [];
    const ocupados = new Set(citas
        .filter(cita => !["Cancelada", "Rechazada"].includes(cita.estado))
        .map(cita => `${cita.fecha}|${horaAFranja(cita.hora)}`));

    for (let desplazamiento = 0; desplazamiento < 21 && libres.length < cantidad; desplazamiento++) {
        const fecha = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
        fecha.setDate(fecha.getDate() + desplazamiento);
        if (fecha.getDay() === 0) continue;
        const fechaISO = fechaDashboardISO(fecha);

        for (const hora of HORAS_AGENDA) {
            const momento = momentoCita({ fecha: fechaISO, hora });
            if (momento < ahora || ocupados.has(`${fechaISO}|${hora}`)) continue;
            libres.push({ tipo: "libre", fecha: fechaISO, hora, momento });
            if (libres.length >= cantidad) break;
        }
    }
    return libres;
}

function crearCitaDashboardHtml(cita) {
    const tiempo = separarHoraDashboard(cita.hora);
    const estado = String(cita.estado || "Pendiente");
    const clase = estado.toLowerCase() === "confirmada" ? "confirmed" : "pending";
    return `
        <a class="appointment-item appointment-item--link" href="./admin-citas.html?fecha=${encodeURIComponent(cita.fecha || "")}">
            <div class="appointment-time"><strong>${tiempo.hora}</strong><span>${tiempo.periodo}</span></div>
            <div class="appointment-divider"></div>
            <div class="appointment-details">
                <div class="appointment-top">
                    <strong>${escaparHtmlDashboard(cita.nombreMascota || "Mascota")}</strong>
                    <span class="appointment-status appointment-status--${clase}">${escaparHtmlDashboard(estado)}</span>
                </div>
                <span>${escaparHtmlDashboard(cita.servicioNombre || "Servicio veterinario")}</span>
                <small>${escaparHtmlDashboard(cita.cliente?.nombre || "Cliente")} · ${formatearFechaCortaDashboard(cita.fecha)}</small>
            </div>
        </a>`;
}

function crearEspacioLibreDashboardHtml(espacio) {
    const tiempo = separarHoraDashboard(espacio.hora);
    return `
        <a class="appointment-item appointment-item--link appointment-item--free" href="./admin-citas.html?fecha=${encodeURIComponent(espacio.fecha)}">
            <div class="appointment-time"><strong>${tiempo.hora}</strong><span>${tiempo.periodo}</span></div>
            <div class="appointment-divider"></div>
            <div class="appointment-details">
                <div class="appointment-top"><strong>Espacio disponible</strong><span class="appointment-status appointment-status--free">Libre</span></div>
                <span>Horario disponible para reserva</span>
                <small>${formatearFechaCortaDashboard(espacio.fecha)}</small>
            </div>
        </a>`;
}

function renderizarServiciosDashboard(servicios) {
    const contenedor = document.getElementById("dashboardMisServicios");
    if (!contenedor) return;
    if (servicios.length === 0) {
        contenedor.innerHTML = `<div class="dashboard-empty"><i class="bi bi-heart-pulse"></i><span>No hay servicios creados.</span></div>`;
        return;
    }

    contenedor.innerHTML = servicios.slice(0, 4).map(servicio => `
        <a class="dashboard-service-item dashboard-service-item--link" href="./agregar-servicio.html?id=${encodeURIComponent(servicio.id)}">
            <div class="dashboard-service-icon"><i class="${escaparHtmlDashboard(servicio.icono || "bi bi-heart-pulse")}"></i></div>
            <div class="dashboard-service-info">
                <strong>${escaparHtmlDashboard(servicio.nombre || "Servicio")}</strong>
                <span>${Number(servicio.duracion) || 0} min · $${Number(servicio.precio || 0).toLocaleString("es-CO")}</span>
            </div>
            <span class="service-active">Activo</span>
        </a>`).join("");
}

function renderizarCitasPorServicioDashboard(citas, servicios) {
    const contenedor = document.getElementById("dashboardCitasPorServicio");
    if (!contenedor) return;
    if (servicios.length === 0) {
        contenedor.innerHTML = `<div class="dashboard-empty"><i class="bi bi-bar-chart"></i><span>No hay servicios para comparar.</span></div>`;
        return;
    }

    const limite = new Date();
    limite.setDate(limite.getDate() - 30);
    const citasUltimoMes = citas.filter(cita =>
        !["Cancelada", "Rechazada"].includes(cita.estado) && momentoCita(cita) >= limite && momentoCita(cita) <= new Date()
    );
    const datos = servicios.map(servicio => ({
        servicio,
        total: citasUltimoMes.filter(cita => String(cita.servicioId) === String(servicio.id) || (!cita.servicioId && cita.servicioNombre === servicio.nombre)).length
    })).sort((a, b) => b.total - a.total).slice(0, 5);
    const maximo = Math.max(...datos.map(item => item.total), 1);

    contenedor.innerHTML = datos.map(({ servicio, total }) => `
        <div class="service-chart-item">
            <div class="service-chart-info"><span>${escaparHtmlDashboard(servicio.nombre)}</span><strong>${total}</strong></div>
            <div class="service-chart-track"><div class="service-chart-progress" style="width:${Math.round((total / maximo) * 100)}%"></div></div>
        </div>`).join("");
}

function separarHoraDashboard(horaTexto) {
    const normalizada = normalizarHoraA24(horaTexto);
    let [hora, minutos] = normalizada.split(":").map(Number);
    const periodo = hora >= 12 ? "PM" : "AM";
    hora = hora % 12 || 12;
    return { hora: `${hora}:${String(minutos).padStart(2, "0")}`, periodo };
}

function formatearFechaCortaDashboard(fechaISO) {
    if (!fechaISO) return "Fecha pendiente";
    const [anio, mes, dia] = fechaISO.split("-").map(Number);
    return new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short" }).format(new Date(anio, mes - 1, dia));
}

function fechaDashboardISO(fecha) {
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
}

function asignarTextoDashboard(id, texto) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.textContent = texto;
}

function escaparHtmlDashboard(valor) {
    return String(valor || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* ========================================
   SIDEBAR

   ESCUCHA EL EVENTO QUE MANDA
   topbar.js CUANDO SE PRESIONA
   LA HAMBURGUESA.
======================================== */

function iniciarSidebarDashboard() {

    const overlay =
        document.getElementById(
            "adminSidebarOverlay"
        );


    document.addEventListener(
        "toggleAdminSidebar",
        function () {

            if (
                window.innerWidth <= 992
            ) {

                document.body.classList.toggle(
                    "sidebar-mobile-open"
                );

            } else {

                document.body.classList.toggle(
                    "sidebar-collapsed"
                );

            }

        }
    );


    if (overlay) {

        overlay.addEventListener(
            "click",
            function () {

                document.body.classList.remove(
                    "sidebar-mobile-open"
                );

            }
        );

    }


    window.addEventListener(
        "resize",
        function () {

            if (
                window.innerWidth > 992
            ) {

                document.body.classList.remove(
                    "sidebar-mobile-open"
                );

            }

        }
    );

}

/* ========================================
   CALENDARIO (widget del dashboard)

   Calendario real: se calcula con JavaScript
   (Date), no son numeros escritos a mano.

   - El dia de hoy queda resaltado en verde.
   - Los dias que tengan alguna cita guardada
     en localStorage ("citas") muestran un punto,
     usando citasPorFecha() de js/shared/citas-storage.js.
   - Al hacer clic en un dia se redirige a
     admin-citas.html?fecha=YYYY-MM-DD para ver
     la agenda de ese dia.
======================================== */

let mesCalendarioDashboard = new Date().getMonth();
let anioCalendarioDashboard = new Date().getFullYear();

function iniciarCalendarioDashboard() {
    const grid = document.getElementById("calendarioGrid");
    if (!grid) return;

    const btnAnterior = document.getElementById("calBtnMesAnterior");
    const btnSiguiente = document.getElementById("calBtnMesSiguiente");

    btnAnterior?.addEventListener("click", function () {
        mesCalendarioDashboard--;
        if (mesCalendarioDashboard < 0) {
            mesCalendarioDashboard = 11;
            anioCalendarioDashboard--;
        }
        renderizarCalendarioDashboard();
    });

    btnSiguiente?.addEventListener("click", function () {
        mesCalendarioDashboard++;
        if (mesCalendarioDashboard > 11) {
            mesCalendarioDashboard = 0;
            anioCalendarioDashboard++;
        }
        renderizarCalendarioDashboard();
    });

    renderizarCalendarioDashboard();
}

function renderizarCalendarioDashboard() {
    const grid = document.getElementById("calendarioGrid");
    const titulo = document.getElementById("calendarioMesTexto");
    if (!grid) return;

    const hoy = hoyISO();

    const primerDia = new Date(anioCalendarioDashboard, mesCalendarioDashboard, 1);
    const ultimoDia = new Date(anioCalendarioDashboard, mesCalendarioDashboard + 1, 0);
    const diasMes = ultimoDia.getDate();
    const primerDiaSemana = (primerDia.getDay() + 6) % 7; // lunes = 0
    const diasMesAnterior = new Date(anioCalendarioDashboard, mesCalendarioDashboard, 0).getDate();

    if (titulo) {
        const texto = new Intl.DateTimeFormat("es-CO", {
            month: "long",
            year: "numeric"
        }).format(primerDia);
        titulo.textContent = texto.replace(/^./, letra => letra.toUpperCase());
    }

    grid.innerHTML = "";

    // Dias del mes anterior (relleno gris, no clicables)
    for (let i = primerDiaSemana - 1; i >= 0; i--) {
        const span = document.createElement("span");
        span.className = "calendar-day calendar-day--muted";
        span.textContent = diasMesAnterior - i;
        grid.appendChild(span);
    }

    // Dias del mes actual
    for (let diaNumero = 1; diaNumero <= diasMes; diaNumero++) {
        const fechaISODelDia = `${anioCalendarioDashboard}-${String(mesCalendarioDashboard + 1).padStart(2, "0")}-${String(diaNumero).padStart(2, "0")}`;

        const span = document.createElement("span");
        let clases = "calendar-day";

        if (fechaISODelDia === hoy) {
            clases += " calendar-day--today";
        } else if (citasPorFecha(fechaISODelDia).length > 0) {
            clases += " calendar-day--appointment";
        }

        span.className = clases;
        span.textContent = diaNumero;
        span.style.cursor = "pointer";
        span.addEventListener("click", function () {
            window.location.href = `admin-citas.html?fecha=${fechaISODelDia}`;
        });

        grid.appendChild(span);
    }

    // Relleno del mes siguiente para completar la ultima fila (7 columnas)
    const celdasActuales = grid.children.length;
    const celdasRestantes = (7 - (celdasActuales % 7)) % 7;

    for (let diaNumero = 1; diaNumero <= celdasRestantes; diaNumero++) {
        const span = document.createElement("span");
        span.className = "calendar-day calendar-day--muted";
        span.textContent = diaNumero;
        grid.appendChild(span);
    }
}
