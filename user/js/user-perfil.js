document.addEventListener("DOMContentLoaded", function () {
    iniciarPerfilUsuario();
});

function iniciarPerfilUsuario() {
    cargarDatosDePerfil();
}

function cargarDatosDePerfil() {
    if (typeof obtenerUsuarioRegistrado === "function") {
        const usuario = obtenerUsuarioRegistrado();
        
        if (usuario) {
            const nombreCompleto = document.getElementById("perfil-nombre-completo");
            const email = document.getElementById("perfil-email");
            const nombreInfo = document.getElementById("info-nombre");
            const emailInfo = document.getElementById("info-email");
            const telefonoInfo = document.getElementById("info-telefono");
            const ciudadInfo = document.getElementById("info-ciudad");
            const fechaNacimientoInfo = document.getElementById("info-fecha-nacimiento");

            if (nombreCompleto) nombreCompleto.textContent = usuario.nombreCompleto || "Usuario";
            if (email) email.textContent = usuario.email || "correo@ejemplo.com";
            
            if (nombreInfo) nombreInfo.textContent = usuario.nombreCompleto || "No especificado";
            if (emailInfo) emailInfo.textContent = usuario.email || "No especificado";
            
            // Si el teléfono tiene indicativo, lo mostramos bonito
            let telText = "No especificado";
            if (usuario.telefono) {
                telText = (usuario.indicativoPais ? usuario.indicativoPais + " " : "") + usuario.telefono;
            }
            if (telefonoInfo) telefonoInfo.textContent = telText;
            
            if (ciudadInfo) ciudadInfo.textContent = usuario.ciudad || "No especificada"; // Si lo guardaron en registro

            // La fecha se guarda en formato YYYY-MM-DD (input date), la mostramos como DD/MM/YYYY
            let fechaTexto = "No especificada";
            if (usuario.fechaNacimiento) {
                const [anio, mes, dia] = usuario.fechaNacimiento.split("-");
                if (anio && mes && dia) {
                    fechaTexto = `${dia}/${mes}/${anio}`;
                }
            }
            if (fechaNacimientoInfo) fechaNacimientoInfo.textContent = fechaTexto;
        }
    }
}
