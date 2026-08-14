function iniciarAuthModal() {
    const botonLogin = document.getElementById("btn-login");
    const modal = document.getElementById("auth-modal");
    const botonCerrar = document.getElementById("btn-close-modal");

    if (!botonLogin || !modal || !botonCerrar) {
        return;
    }

    botonLogin.addEventListener("click", function (evento) {
        evento.preventDefault();

        modal.classList.add("active");
        modal.setAttribute("aria-hidden", "false");
    });

    botonCerrar.addEventListener("click", function () {
        cerrarAuthModal(modal);
    });

    modal.addEventListener("click", function (evento) {
        if (evento.target === modal) {
            cerrarAuthModal(modal);
        }
    });
}

function cerrarAuthModal(modal) {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
}

document.addEventListener(
    "componentesCargados",
    iniciarAuthModal
);
