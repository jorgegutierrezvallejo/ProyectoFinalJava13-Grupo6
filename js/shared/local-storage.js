/*
 * Acceso seguro y centralizado a localStorage.
 * Los repositorios de cada dominio son los unicos que deben conocer
 * las claves usadas para persistir datos.
 */
window.HuellaVetStorage = {
    leer(clave, valorPorDefecto = []) {
        try {
            const valor = localStorage.getItem(clave);
            return valor === null ? valorPorDefecto : JSON.parse(valor);
        } catch (error) {
            console.error(`No fue posible leer localStorage.${clave}:`, error);
            return valorPorDefecto;
        }
    },

    guardar(clave, valor) {
        try {
            localStorage.setItem(clave, JSON.stringify(valor));
            return true;
        } catch (error) {
            console.error(`No fue posible guardar localStorage.${clave}:`, error);
            return false;
        }
    },

    existe(clave) {
        return localStorage.getItem(clave) !== null;
    }
};

/* Convierte rutas guardadas desde la raíz del proyecto para páginas que viven
 * dentro de user/html o admin/html. URLs y datos base64 se conservan intactos. */
function resolverRutaRecursoHuellaVet(ruta) {
    const valor = String(ruta || "").trim();
    if (!valor || /^(?:https?:|data:|blob:|\/)/i.test(valor)) return valor;
    const esPaginaAnidada = /\/(?:user|admin)\/html\//.test(window.location.pathname);
    return esPaginaAnidada ? `../../${valor.replace(/^\.\//, "")}` : valor;
}
