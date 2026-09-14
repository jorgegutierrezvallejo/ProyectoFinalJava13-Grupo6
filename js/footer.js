function iniciarServiciosFooter() {
    const lista = document.getElementById("footer-servicios-dinamicos");
    if (!lista || typeof obtenerServiciosParaInicio !== "function") return;

    // Reutiliza la selección y el orden de los tres servicios destacados.
    const servicios = obtenerServiciosParaInicio();
    lista.innerHTML = servicios.length
        ? servicios.map(servicio => `<li><a href="servicios.html#servicios" data-servicio-id="${String(servicio.id || "")}">${escaparTextoFooter(servicio.nombre || "Servicio")}</a></li>`).join("")
        : "<li><a href=\"servicios.html#servicios\">Ver servicios disponibles</a></li>";
}

function escaparTextoFooter(valor) {
    const elemento = document.createElement("span");
    elemento.textContent = valor;
    return elemento.innerHTML;
}
