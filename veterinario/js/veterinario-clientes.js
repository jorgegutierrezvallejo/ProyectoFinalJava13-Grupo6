document.addEventListener(
    "DOMContentLoaded",
    function () {

        iniciarClientes();

    }
);


function iniciarClientes() {
    cargarClientesAdministracion();
}

async function cargarClientesAdministracion() {
    const contenedor = document.getElementById("adminClientesListado");
    if (!contenedor) return;
    document.querySelectorAll(".vacio").forEach(elemento => elemento.remove());
    try {
        const clientes = await apiBackend("/usuarios");
        contenedor.innerHTML = `<h1>Clientes</h1>` + (clientes.length
            ? clientes.map(cliente => `<article class="card mb-3 p-3"><strong>${escaparCliente(cliente.nombreCompleto)}</strong><span>${escaparCliente(cliente.email)}</span><small>${escaparCliente(cliente.telefono || "Sin teléfono")} · ${escaparCliente(cliente.ciudad || "Sin ciudad")}</small></article>`).join("")
            : `<p class="text-muted">No hay clientes registrados.</p>`);
    } catch (error) {
        contenedor.innerHTML = `<h1>Clientes</h1><p class="text-danger">No se pudieron cargar los clientes.</p>`;
    }
}

function escaparCliente(valor) {
    const div = document.createElement("div");
    div.textContent = String(valor ?? "");
    return div.innerHTML;
}