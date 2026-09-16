document.addEventListener(
    "DOMContentLoaded",
    function () {

        iniciarMascotas();

    }
);


function iniciarMascotas() {

    /*
        Aquí agregaremos posteriormente
        la lógica de la vista de Mascotas.
    */
        cargarMascotasAdministracion();
}

    async function cargarMascotasAdministracion() {
        const contenedor = document.getElementById("adminMascotasListado");
        if (!contenedor) return;

        try {
            const mascotas = await apiBackend("/mascotas");
            renderizarMascotasAdministracion(contenedor, Array.isArray(mascotas) ? mascotas : []);
        } catch (error) {
            contenedor.innerHTML = `<p class="text-danger">No se pudieron cargar las mascotas.</p>`;
            console.error("Error cargando mascotas:", error);
        }
    }

    function renderizarMascotasAdministracion(contenedor, mascotas) {
        if (!mascotas.length) {
            contenedor.innerHTML = `<p class="text-muted">No hay mascotas registradas.</p>`;
            return;
        }

        contenedor.innerHTML = mascotas.map(mascota => `
            <article class="card mb-3 p-3">
                <div class="d-flex justify-content-between align-items-start gap-3">
                    <div>
                        <h2 class="h5 mb-1">${escaparTextoMascota(mascota.nombre || "Mascota")}</h2>
                        <p class="mb-1">${escaparTextoMascota(mascota.especie || "Sin especie")} · ${escaparTextoMascota(mascota.raza || "Sin raza")}</p>
                    </div>
                    <button type="button" class="btn btn-outline-primary btn-sm" data-editar-mascota="${mascota.id}">
                        <i class="bi bi-pencil"></i> Editar
                    </button>
                </div>
            </article>
        `).join("");

        contenedor.querySelectorAll("[data-editar-mascota]").forEach(boton => {
            boton.addEventListener("click", () => editarMascotaAdministracion(
                mascotas.find(mascota => String(mascota.id) === boton.dataset.editarMascota)
            ));
        });
    }

    async function editarMascotaAdministracion(mascota) {
        if (!mascota) return;

        const resultado = await Swal.fire({
            title: `Editar ${mascota.nombre || "mascota"}`,
            html: `
                <input id="mascotaNombre" class="swal2-input" placeholder="Nombre" value="${escaparAtributoMascota(mascota.nombre)}">
                <input id="mascotaEspecie" class="swal2-input" placeholder="Especie" value="${escaparAtributoMascota(mascota.especie)}">
                <input id="mascotaRaza" class="swal2-input" placeholder="Raza" value="${escaparAtributoMascota(mascota.raza)}">
                <input id="mascotaPeso" class="swal2-input" type="number" step="0.01" placeholder="Peso" value="${escaparAtributoMascota(mascota.peso)}">
                <textarea id="mascotaObservaciones" class="swal2-textarea" placeholder="Observaciones">${escaparTextoMascota(mascota.observaciones)}</textarea>
            `,
            showCancelButton: true,
            confirmButtonText: "Guardar cambios",
            cancelButtonText: "Cancelar",
            preConfirm: () => ({
                ...mascota,
                nombre: document.getElementById("mascotaNombre").value.trim(),
                especie: document.getElementById("mascotaEspecie").value.trim(),
                raza: document.getElementById("mascotaRaza").value.trim(),
                peso: document.getElementById("mascotaPeso").value || null,
                observaciones: document.getElementById("mascotaObservaciones").value.trim()
            })
        });

        if (!resultado.isConfirmed) return;

        try {
            await apiBackend(`/mascotas/${encodeURIComponent(mascota.id)}`, {
                method: "PUT",
                body: crearPayloadMascotaBackend(resultado.value)
            });
            await cargarMascotasAdministracion();
            Swal.fire({ icon: "success", title: "Mascota actualizada", confirmButtonColor: "#17a9a7" });
        } catch (error) {
            Swal.fire({ icon: "error", title: "No se pudo actualizar", text: error.message });
        }
    }

    function escaparTextoMascota(valor) {
        const div = document.createElement("div");
        div.textContent = String(valor ?? "");
        return div.innerHTML;
    }

    function escaparAtributoMascota(valor) {
        return escaparTextoMascota(valor).replaceAll('"', "&quot;");
    }