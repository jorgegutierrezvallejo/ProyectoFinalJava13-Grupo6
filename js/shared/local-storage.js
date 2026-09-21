/*
 * Utilidades compartidas de recursos.
 *
 * IMPORTANTE: los datos de negocio (usuarios, mascotas, citas, servicios,
 * tipos de servicio) NO se guardan en el navegador: viven en la base de datos
 * y se leen/escriben a traves de la API. El unico uso legitimo de
 * localStorage es la sesion (token + usuario actual), definida en js/config.js.
 * El antiguo helper HuellaVetStorage se elimino para no reintroducir
 * persistencia local por accidente.
 */

/* Convierte rutas guardadas desde la raíz del proyecto para páginas que viven
 * dentro de user/html o admin/html. URLs y datos base64 se conservan intactos. */
function resolverRutaRecursoHuellaVet(ruta) {
    const valor = String(ruta || "").trim();
    if (!valor || /^(?:https?:|data:|blob:|\/)/i.test(valor)) return valor;
    const esPaginaAnidada = /\/(?:user|admin|veterinario)\/html\//.test(window.location.pathname);
    return esPaginaAnidada ? `../../${valor.replace(/^\.\//, "")}` : valor;
}