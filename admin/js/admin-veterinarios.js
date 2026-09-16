document.addEventListener("DOMContentLoaded", async function () {

    if (typeof protegerRutaAdministrador === "function" && !protegerRutaAdministrador()) {
        return;
    }

    await cargarVeterinarios();

    const formulario = document.getElementById("formNuevoVeterinario");
    if (formulario) {
        formulario.addEventListener("submit", manejarCrearVeterinario);
    }

});


async function cargarVeterinarios() {

    const contenedor = document.getElementById("listadoVeterinarios");
    if (!contenedor) return;

    try {

        const veterinarios = await apiBackend("/veterinario");
        pintarTablaVeterinarios(Array.isArray(veterinarios) ? veterinarios : []);

    } catch (error) {

        contenedor.innerHTML = `<div class="admin-panel-error">No se pudieron cargar los veterinarios: ${escaparHtmlAdmin(error.message)}</div>`;

    }

}


function pintarTablaVeterinarios(veterinarios) {

    const contenedor = document.getElementById("listadoVeterinarios");
    if (!contenedor) return;

    if (!veterinarios.length) {
        contenedor.innerHTML = `<div class="admin-panel-vacio">Todavía no hay veterinarios registrados.</div>`;
        return;
    }

    const filas = veterinarios.map(vet => {
        const activo = vet.activo !== false;
        return `
            <tr>
                <td>${escaparHtmlAdmin(vet.nombres || "")} ${escaparHtmlAdmin(vet.apellidos || "")}</td>
                <td>${escaparHtmlAdmin(vet.correo || "")}</td>
                <td>
                    <span class="admin-badge ${activo ? "admin-badge--activo" : "admin-badge--inactivo"}">
                        <i class="bi ${activo ? "bi-check-circle" : "bi-x-circle"}"></i>
                        ${activo ? "Activo" : "Inhabilitado"}
                    </span>
                </td>
                <td>
                    <button type="button"
                        class="admin-btn ${activo ? "admin-btn--inhabilitar" : "admin-btn--habilitar"}"
                        data-id="${vet.id}"
                        data-activo="${activo}"
                        onclick="alternarEstadoVeterinario(this)">
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
                        <th>Estado</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>${filas}</tbody>
            </table>
        </div>`;

}


async function alternarEstadoVeterinario(boton) {

    const id = boton.dataset.id;
    const activo = boton.dataset.activo === "true";
    const nuevoEstado = !activo;

    boton.disabled = true;

    try {

        await apiBackend(`/veterinario/${id}/estado`, {
            method: "PATCH",
            body: { activo: nuevoEstado }
        });

        await cargarVeterinarios();

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


async function manejarCrearVeterinario(evento) {

    evento.preventDefault();

    const errorContenedor = document.getElementById("formVeterinarioError");
    if (errorContenedor) {
        errorContenedor.style.display = "none";
        errorContenedor.textContent = "";
    }

    const datos = {
        nombres: document.getElementById("vetNombres").value.trim(),
        apellidos: document.getElementById("vetApellidos").value.trim(),
        correo: document.getElementById("vetCorreo").value.trim(),
        contrasena: document.getElementById("vetContrasena").value
    };

    try {

        await apiBackend("/veterinario", {
            method: "POST",
            body: datos
        });

        document.getElementById("formNuevoVeterinario").reset();

        if (typeof Swal !== "undefined") {
            Swal.fire({
                title: "Veterinario creado",
                text: "La cuenta se registró correctamente.",
                icon: "success",
                confirmButtonColor: "#007b83"
            });
        }

        await cargarVeterinarios();

    } catch (error) {

        if (errorContenedor) {
            errorContenedor.textContent = error.message;
            errorContenedor.style.display = "block";
        } else {
            alert(error.message);
        }

    }

}


function escaparHtmlAdmin(valor) {
    return String(valor || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
