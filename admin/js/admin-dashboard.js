document.addEventListener("DOMContentLoaded", async function () {

    if (typeof protegerRutaAdministrador === "function" && !protegerRutaAdministrador()) {
        return;
    }

    await cargarResumen();

});


async function cargarResumen() {

    try {

        const [veterinarios, usuarios] = await Promise.all([
            apiBackend("/veterinario"),
            apiBackend("/usuarios")
        ]);

        const listaVeterinarios = Array.isArray(veterinarios) ? veterinarios : [];
        const listaUsuarios = Array.isArray(usuarios) ? usuarios : [];

        pintarNumero("statVeterinariosTotal", listaVeterinarios.length);
        pintarNumero("statVeterinariosActivos", listaVeterinarios.filter(v => v.activo !== false).length);

        pintarNumero("statUsuariosTotal", listaUsuarios.length);
        pintarNumero("statUsuariosActivos", listaUsuarios.filter(u => u.activo !== false).length);

    } catch (error) {

        console.error("Error cargando el resumen del panel:", error);

    }

}


function pintarNumero(idElemento, valor) {
    const elemento = document.getElementById(idElemento);
    if (elemento) {
        elemento.textContent = String(valor);
    }
}
