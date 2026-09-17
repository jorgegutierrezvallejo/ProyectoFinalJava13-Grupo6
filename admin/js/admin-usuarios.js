document.addEventListener("DOMContentLoaded", async function () {

    if (typeof protegerRutaAdministrador === "function" && !protegerRutaAdministrador()) {
        return;
    }

    await cargarUsuarios();

});


async function cargarUsuarios() {

    const contenedor = document.getElementById("listadoUsuarios");
    if (!contenedor) return;

    try {

        const usuarios = await apiBackend("/usuarios");
        pintarTablaUsuarios(Array.isArray(usuarios) ? usuarios : []);

    } catch (error) {

        contenedor.innerHTML = `<div class="admin-panel-error">No se pudieron cargar los clientes: ${escaparHtmlAdminUsuarios(error.message)}</div>`;

    }

}


function pintarTablaUsuarios(usuarios) {

    const contenedor = document.getElementById("listadoUsuarios");
    if (!contenedor) return;

    if (!usuarios.length) {
        contenedor.innerHTML = `<div class="admin-panel-vacio">Todavía no hay clientes registrados.</div>`;
        return;
    }

    const filas = usuarios.map(usuario => {
        const activo = usuario.activo !== false;
        return `
            <tr>
                <td>${escaparHtmlAdminUsuarios(usuario.nombreCompleto || "")}</td>
                <td>${escaparHtmlAdminUsuarios(usuario.email || "")}</td>
                <td>${escaparHtmlAdminUsuarios(usuario.ciudad || "-")}</td>
                <td>
                    <span class="admin-badge ${activo ? "admin-badge--activo" : "admin-badge--inactivo"}">
                        <i class="bi ${activo ? "bi-check-circle" : "bi-x-circle"}"></i>
                        ${activo ? "Activo" : "Inhabilitado"}
                    </span>
                </td>
                <td>
                    <button type="button"
                        class="admin-btn ${activo ? "admin-btn--inhabilitar" : "admin-btn--habilitar"}"
                        data-id="${usuario.id}"
                        data-activo="${activo}"
                        onclick="alternarEstadoUsuario(this)">
                        ${activo ? "Inhabilitar" : "Habilitar"}
                    </button>
                </td>
            </tr>`;
    }).join("");

    contenedor.innerHTML = `
        <div class="admin-tabla-wrapper">
            <table class="admin-tabla">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Correo</th>
                        <th>Ciudad</th>
                        <th>Estado</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>${filas}</tbody>
            </table>
        </div>`;

}


async function alternarEstadoUsuario(boton) {

    const id = boton.dataset.id;
    const activo = boton.dataset.activo === "true";
    const nuevoEstado = !activo;

    boton.disabled = true;

    try {

        await apiBackend(`/usuarios/${id}/estado`, {
            method: "PATCH",
            body: { activo: nuevoEstado }
        });

        await cargarUsuarios();

    } catch (error) {

        if (typeof Swal !== "undefined") {
            Swal.fire({ title: "No se pudo actualizar", text: error.message, icon: "error" });
        } else {
            alert(error.message);
        }

    } finally {

        boton.disabled = false;

    }

}


function escaparHtmlAdminUsuarios(valor) {
    return String(valor || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
