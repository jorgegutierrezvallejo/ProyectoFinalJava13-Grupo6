async function iniciarServiciosFooter() {
    const lista = document.getElementById("footer-servicios-dinamicos");
    if (!lista || typeof obtenerServiciosParaInicio !== "function") return;

    // Los servicios vienen de la base de datos; si el servidor no responde
    // se muestra el enlace generico en lugar de datos inventados.
    try {
        await asegurarServiciosCargados();
    } catch (error) {
        console.warn("No se pudieron cargar los servicios del pie de página:", error);
    }

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
