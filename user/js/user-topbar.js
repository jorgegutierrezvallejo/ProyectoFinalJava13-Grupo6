document.addEventListener("userComponentsLoaded", function () {
    iniciarTopbarUsuario();
});

function iniciarTopbarUsuario() {
    cambiarTituloPaginaUsuario();

    const profileButton = document.getElementById("profileButton");
    const profileMenu = document.getElementById("profileMenu");
    const notificationButton = document.getElementById("notificationButton");

    if (profileButton && profileMenu) {
        profileButton.addEventListener("click", function (e) {
            e.stopPropagation();
            profileMenu.classList.toggle("show");
        });

        document.addEventListener("click", function (e) {
            if (!profileMenu.contains(e.target) && !profileButton.contains(e.target)) {
                profileMenu.classList.remove("show");
            }
        });
    }

    if (notificationButton) {
        notificationButton.addEventListener("click", function () {
            if (typeof Swal !== "undefined") {
                Swal.fire({
                    icon: "info",
                    title: "Notificaciones",
                    html: `
                        <div class="text-start small">
                            <div class="p-2 border-bottom">
                                <strong>Recordatorio de vacuna</strong>
                                <p class="text-muted mb-0">Luna tiene su vacuna antirrábica próxima a vencer (28 ago).</p>
                            </div>
                            <div class="p-2">
                                <strong>Cita confirmada</strong>
                                <p class="text-muted mb-0">Tu cita de consulta general para Luna está lista.</p>
                            </div>
                        </div>
                    `,
                    confirmButtonText: "Entendido",
                    confirmButtonColor: "#17a9a7"
                });
            }
        });
    }
}


/* ========================================
   TÍTULO DINÁMICO (mismo patrón que admin/js/topbar.js)
======================================== */

function cambiarTituloPaginaUsuario() {
    const tituloTopbar = document.getElementById("topbarPageTitle");

    if (!tituloTopbar) {
        return;
    }

    const tituloPagina = document.body.dataset.pageTitle;

    if (tituloPagina) {
        tituloTopbar.textContent = tituloPagina;
    }
}
