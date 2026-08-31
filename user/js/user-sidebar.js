document.addEventListener("userComponentsLoaded", function () {
    iniciarSidebarUsuario();
});

function iniciarSidebarUsuario() {
    const sidebar = document.getElementById("userSidebar");
    const overlay = document.getElementById("sidebarOverlay");
    const menuButton = document.getElementById("topbarMenuButton");

    if (!sidebar) return;

    // Resaltar página actual
    const currentPage = document.body.dataset.page || "resumen";
    const links = sidebar.querySelectorAll(".hv-sidebar__link");

    links.forEach(link => {
        if (link.dataset.page === currentPage) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });

    // Control de apertura/cierre en móviles
    if (menuButton) {
        menuButton.addEventListener("click", function () {
            if (window.innerWidth <= 991.98) {
                sidebar.classList.toggle("open");
                if (overlay) overlay.classList.toggle("show");
            } else {
                document.body.classList.toggle("sidebar-collapsed");
            }
        });
    }

    if (overlay) {
        overlay.addEventListener("click", function () {
            sidebar.classList.remove("open");
            overlay.classList.remove("show");
        });
    }
}
