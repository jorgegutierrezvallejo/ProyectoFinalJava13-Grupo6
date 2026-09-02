// Cargador del componente "agendar cita": puede mostrarse como página o modal.
// Usa #agendar-cita-container y sus atributos data-agendar-*.
(function () {

    function cargarCssUnaVez(href) {
        if (!href || document.querySelector(`link[href="${href}"]`)) {
            return;
        }
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        document.head.appendChild(link);
    }

    function cargarScriptUnaVez(src, callback) {
        if (!src) {
            callback();
            return;
        }
        const existente = document.querySelector(`script[src="${src}"]`);
        if (existente) {
            // ya estaba en la pagina
            callback();
            return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.onload = callback;
        script.onerror = function () {
            console.error("No se pudo cargar el script del formulario de agendar cita:", src);
        };
        document.body.appendChild(script);
    }

    function configurarAperturaYCierre(modo) {
        const overlay = document.getElementById("agendarCitaOverlay");
        const btnCerrar = document.getElementById("agendarCitaCerrar");

        if (!overlay) {
            return;
        }

        if (modo === "pagina") {
            overlay.classList.add("hv-agendar-overlay--pagina");
            overlay.setAttribute("aria-hidden", "false");

            window.abrirAgendarCitaModal = function () {
                document.getElementById("agendarcita")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            };

            document.addEventListener("click", function (evento) {
                const disparador = evento.target.closest("[data-abrir-agendar-cita]");
                if (!disparador) return;
                evento.preventDefault();
                window.abrirAgendarCitaModal();
            });
            return;
        }

        window.abrirAgendarCitaModal = function () {
            overlay.classList.add("active");
            overlay.setAttribute("aria-hidden", "false");
            document.body.style.overflow = "hidden";
        };

        window.cerrarAgendarCitaModal = function () {
            overlay.classList.remove("active");
            overlay.setAttribute("aria-hidden", "true");
            document.body.style.overflow = "";
        };

        // delegacion: el boton puede inyectarse despues (topbar/header async)
        document.addEventListener("click", function (evento) {
            const disparador = evento.target.closest("[data-abrir-agendar-cita]");
            if (!disparador) {
                return;
            }
            evento.preventDefault();
            window.abrirAgendarCitaModal();
        });

        btnCerrar?.addEventListener("click", window.cerrarAgendarCitaModal);

        overlay.addEventListener("click", function (evento) {
            if (evento.target === overlay) {
                window.cerrarAgendarCitaModal();
            }
        });

        document.addEventListener("keydown", function (evento) {
            if (evento.key === "Escape" && overlay.classList.contains("active")) {
                window.cerrarAgendarCitaModal();
            }
        });
    }

    async function iniciarComponenteAgendarCita() {
        const contenedor = document.getElementById("agendar-cita-container");
        if (!contenedor) {
            return;
        }

        const rutaHtml = contenedor.dataset.agendarHtml;
        const rutaCssModal = contenedor.dataset.agendarCssModal;
        const rutaCssFormulario = contenedor.dataset.agendarCssFormulario;
        const rutaJsFormulario = contenedor.dataset.agendarJs;
        const modo = contenedor.dataset.agendarModo || "modal";

        cargarCssUnaVez(rutaCssModal);
        cargarCssUnaVez(rutaCssFormulario);

        try {
            const respuesta = await fetch(rutaHtml);
            if (!respuesta.ok) {
                throw new Error(`No se pudo cargar: ${rutaHtml}`);
            }

            contenedor.innerHTML = await respuesta.text();

            cargarScriptUnaVez(rutaJsFormulario, function () {
                if (typeof iniciarAgendarCita === "function") {
                    iniciarAgendarCita();
                }
                configurarAperturaYCierre(modo);
            });
        } catch (error) {
            console.error("No se pudo cargar el componente Agendar cita:", error);
        }
    }

    document.addEventListener("DOMContentLoaded", iniciarComponenteAgendarCita);
})();
