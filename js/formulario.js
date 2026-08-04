// espero a que cargue todo el html antes de trabajar con los elementos
document.addEventListener('DOMContentLoaded', () => {

    // guardo en variables los elementos del formulario que voy a usar
    const formulario = document.getElementById('formulario-contacto');
    const botonEnviar = document.getElementById('boton-enviar');
    const estadoEnvio = document.getElementById('estado-envio');

    const campoNombre = document.getElementById('nombre-propietario');
    const campoCorreo = document.getElementById('correo');
    const campoTelefono = document.getElementById('telefono');
    const campoMensaje = document.getElementById('mensaje');
    // reviso que el nombre tenga al menos 3 caracteres y que solo tenga letras y espacios
    function validarNombre() {
        const valor = campoNombre.value.trim();

        if (valor.length < 3) {
            return false;
        }

        // recorro letra por letra, que no haya numeros ni otros caracteres
        for (let i = 0; i < valor.length; i++) {
            const letra = valor[i].toLowerCase();
            const esLetra = letra >= 'a' && letra <= 'z';
            const esEspacio = letra === ' ';
            const esLetraAcentuada = 'áéíóúñü'.includes(letra);

            if (!esLetra && !esEspacio && !esLetraAcentuada) {
                return false;
            }
        }

        return true;
    }
// verifico que el correo tenga una estructura basica con @ y un punto
    function validarCorreo() {
        const valor = campoCorreo.value.trim();

        const posicionArroba = valor.indexOf('@');
        const posicionPunto = valor.lastIndexOf('.');

        const tieneArroba = posicionArroba > 0;
        const tienePuntoDespuesDeArroba = posicionPunto > posicionArroba + 1;
        const tieneAlgoDespuesDelPunto = posicionPunto < valor.length - 1;
        const noTieneEspacios = valor.indexOf(' ') === -1;

        return tieneArroba && tienePuntoDespuesDeArroba && tieneAlgoDespuesDelPunto && noTieneEspacios;
    }

// valido el teléfono qu tenga  digitos, permite +, espacio, guion y paréntesis
    function validarTelefono() {
        const valor = campoTelefono.value.trim();
        let cantidadDigitos = 0;

        for (let i = 0; i < valor.length; i++) {
            const caracter = valor[i];
            const esDigito = caracter >= '0' && caracter <= '9';
            const esCaracterPermitido = esDigito || caracter === '+' || caracter === ' ' || caracter === '-' || caracter === '(' || caracter === ')';

            if (!esCaracterPermitido) {
                return false;
            }

            if (esDigito) {
                cantidadDigitos++;
            }
        }

        return cantidadDigitos >= 7;
    }

    // valida el mensaje: al menos 10 caracteres
    function validarMensaje() {
        return campoMensaje.value.trim().length >= 10;
    }

    // agrego o quito la clase que pinta el borde rojo cuando un campo es invalido
    function marcarCampo(input, esValido) {
        input.closest('.formulario-contacto__campo').classList.toggle('es-invalido', !esValido);
    }

    // cuando el usuario sale de un campo lo valido de inmediato para darle retroalimentacion
    campoNombre.addEventListener('blur', () => marcarCampo(campoNombre, validarNombre()));
    campoCorreo.addEventListener('blur', () => marcarCampo(campoCorreo, validarCorreo()));
    campoTelefono.addEventListener('blur', () => marcarCampo(campoTelefono, validarTelefono()));
    campoMensaje.addEventListener('blur', () => marcarCampo(campoMensaje, validarMensaje()));

    // ejecuto todas las validaciones y solo devuelve true si todo esta correcto
    function validarFormulario() {
        const nombreValido = validarNombre();
        const correoValido = validarCorreo();
        const telefonoValido = validarTelefono();
        const mensajeValido = validarMensaje();

        marcarCampo(campoNombre, nombreValido);
        marcarCampo(campoCorreo, correoValido);
        marcarCampo(campoTelefono, telefonoValido);
        marcarCampo(campoMensaje, mensajeValido);

        return nombreValido && correoValido && telefonoValido && mensajeValido;
    }

    // muestro un mensaje debajo del boton indicando si salio bien o hubo un error
    function mostrarEstado(mensaje, tipo) {
        estadoEnvio.textContent = mensaje;
        estadoEnvio.className = 'alert alert-' + tipo;
        estadoEnvio.style.display = 'block';
    }

    // manda los datos a formspree ya validados
    function enviarFormulario() {
        botonEnviar.disabled = true;
        botonEnviar.textContent = 'enviando...';

        fetch(formulario.action, {
            method: 'POST',
            body: new FormData(formulario),
            headers: { 'Accept': 'application/json' }
        })
            .then(respuesta => {
                if (respuesta.ok) {
                    mostrarEstado('¡gracias! tu mensaje fue enviado correctamente.', 'success');
                    formulario.reset();
                } else {
                    mostrarEstado('ocurrió un problema al enviar el formulario. intenta de nuevo.', 'danger');
                }
            })
            .catch(() => mostrarEstado('no fue posible conectar con el servidor. revisa tu conexión.', 'danger'))
            .finally(() => {
                botonEnviar.disabled = false;
                botonEnviar.textContent = 'enviar';
            });
    }

// al enviar, primero valida y solo si todo pasa manda el formulario
    formulario.addEventListener('submit', evento => {
        evento.preventDefault();

        if (!validarFormulario()) {
            mostrarEstado('revisa los campos marcados en rojo antes de enviar.', 'danger');
            return;
        }

        enviarFormulario();
    });

});

