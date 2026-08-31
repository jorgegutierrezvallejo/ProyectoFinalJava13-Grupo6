document.addEventListener(
    "DOMContentLoaded",
    function () {

        mostrarFechaActual();

        iniciarSidebarDashboard();

        iniciarCalendarioDashboard();

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
     usando citasPorFecha() de citas-datos.js.
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
