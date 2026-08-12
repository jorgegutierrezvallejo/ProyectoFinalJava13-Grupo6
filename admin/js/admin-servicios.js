document.addEventListener(
    "DOMContentLoaded",
    function () {

        iniciarServicios();

    }
);


function iniciarServicios() {

    // 1. Seleccionamos el formulario usando su ID
    const formulario = document.getElementById("formServicio");

    if (formulario) {
        // 2. Escuchamos el evento 'submit' (cuando el usuario hace clic en Guardar)
        formulario.addEventListener("submit", function(evento) {
            
            // Obtenemos los valores que el usuario escribió en cada campo
            // .value nos da el texto, y .trim() quita los espacios en blanco al inicio y al final
            const nombre = document.getElementById("nombre").value.trim();
            const descripcion = document.getElementById("descripcion").value.trim();
            const precio = document.getElementById("precio").value.trim();
            const duracion = document.getElementById("duracion").value; // En un select no hace falta trim()

            // Creamos variables para guardar los mensajes de error
            let hayError = false;
            let mensajesDeError = "Por favor corrige lo siguiente:\n\n";

            // --- INICIO DE LAS VALIDACIONES ---

            // Validar Nombre: No puede estar vacío
            if (nombre === "") {
                mensajesDeError += "- El nombre del servicio es obligatorio.\n";
                hayError = true;
            }

            // Validar Descripción: Que tenga al menos 10 letras para que sea clara
            if (descripcion.length < 10) {
                mensajesDeError += "- La descripción es muy corta (mínimo 10 caracteres).\n";
                hayError = true;
            }

            // Validar Precio: No vacío y que sea mayor a 0
            if (precio === "" || precio <= 0) {
                mensajesDeError += "- Debes ingresar un precio válido (mayor a 0).\n";
                hayError = true;
            }

            // Validar Duración: Debe haber seleccionado una opción válida (no la vacía por defecto)
            if (duracion === "") {
                mensajesDeError += "- Debes seleccionar la duración del servicio.\n";
                hayError = true;
            }

            // --- FIN DE LAS VALIDACIONES ---

            // 3. ¿Qué hacemos si hay errores?
            if (hayError === true) {
                // Cancelamos el envío del formulario para que no recargue la página
                evento.preventDefault();
                
                // Mostramos una alerta en pantalla con todos los errores acumulados
                alert(mensajesDeError);
            } else {
                // Si NO hay errores, mostramos un mensajito de éxito opcional
                // Y el formulario continuará su camino hacia Spring Boot
                alert("Todo correcto. ¡Guardando el servicio!");
            }
        });
    }

}