// Espero a que cargue todo el HTML antes de trabajar con los elementos
document.addEventListener('DOMContentLoaded', () => {

    // Elementos principales del formulario
    const formulario = document.getElementById('formulario-contacto');
    const botonEnviar = document.getElementById('boton-enviar');
    const estadoEnvio = document.getElementById('estado-envio');

    // Campos que tendrán validación personalizada
    const campoNombre = document.getElementById('nombre-propietario');
    const campoCorreo = document.getElementById('correo');
    const campoTelefono = document.getElementById('telefono');
    const campoMensaje = document.getElementById('mensaje');

    // Verifico que todos los elementos necesarios existan
    if (
        !formulario ||
        !botonEnviar ||
        !estadoEnvio ||
        !campoNombre ||
        !campoCorreo ||
        !campoTelefono ||
        !campoMensaje
    ) {
        console.error('No se encontraron todos los elementos del formulario.');
        return;
    }

    // Reviso que el nombre tenga mínimo 3 caracteres
    // y solamente contenga letras y espacios
    function validarNombre() {
        const valor = campoNombre.value.trim();

        if (valor.length < 3) {
            return false;
        }

        for (let i = 0; i < valor.length; i++) {
            const letra = valor[i].toLowerCase();

            const esLetraNormal =
                letra >= 'a' &&
                letra <= 'z';

            const esEspacio = letra === ' ';

            const esLetraAcentuada =
                'áéíóúñü'.includes(letra);

            if (
                !esLetraNormal &&
                !esEspacio &&
                !esLetraAcentuada
            ) {
                return false;
            }
        }

        return true;
    }

    // Verifico que el correo tenga una estructura básica
    function validarCorreo() {
        const valor = campoCorreo.value.trim();

        const posicionArroba = valor.indexOf('@');
        const posicionPunto = valor.lastIndexOf('.');

        const tieneArroba =
            posicionArroba > 0;

        const tienePuntoDespuesDeArroba =
            posicionPunto > posicionArroba + 1;

        const tieneAlgoDespuesDelPunto =
            posicionPunto < valor.length - 1;

        const noTieneEspacios =
            valor.indexOf(' ') === -1;

        return (
            tieneArroba &&
            tienePuntoDespuesDeArroba &&
            tieneAlgoDespuesDelPunto &&
            noTieneEspacios
        );
    }

    // Valido el teléfono
    // Permite números, +, espacios, guiones y paréntesis
    function validarTelefono() {
        const valor = campoTelefono.value.trim();

        let cantidadDigitos = 0;

        for (let i = 0; i < valor.length; i++) {
            const caracter = valor[i];

            const esDigito =
                caracter >= '0' &&
                caracter <= '9';

            const esCaracterPermitido =
                esDigito ||
                caracter === '+' ||
                caracter === ' ' ||
                caracter === '-' ||
                caracter === '(' ||
                caracter === ')';

            if (!esCaracterPermitido) {
                return false;
            }

            if (esDigito) {
                cantidadDigitos++;
            }
        }

        return cantidadDigitos >= 7;
    }

    // Valido que el mensaje tenga mínimo 10 caracteres
    function validarMensaje() {
        return campoMensaje.value.trim().length >= 10;
    }

    // Agrego o quito la clase de error
    function marcarCampo(campo, esValido) {
        const contenedor = campo.closest(
            '.formulario-contacto__campo'
        );

        if (!contenedor) {
            return;
        }

        contenedor.classList.toggle(
            'es-invalido',
            !esValido
        );
    }

    // Validaciones cuando el usuario sale del campo
    campoNombre.addEventListener('blur', () => {
        marcarCampo(
            campoNombre,
            validarNombre()
        );
    });

    campoCorreo.addEventListener('blur', () => {
        marcarCampo(
            campoCorreo,
            validarCorreo()
        );
    });

    campoTelefono.addEventListener('blur', () => {
        marcarCampo(
            campoTelefono,
            validarTelefono()
        );
    });

    campoMensaje.addEventListener('blur', () => {
        marcarCampo(
            campoMensaje,
            validarMensaje()
        );
    });

    // Quito el error mientras el usuario corrige el campo
    campoNombre.addEventListener('input', () => {
        if (validarNombre()) {
            marcarCampo(campoNombre, true);
        }
    });

    campoCorreo.addEventListener('input', () => {
        if (validarCorreo()) {
            marcarCampo(campoCorreo, true);
        }
    });

    campoTelefono.addEventListener('input', () => {
        if (validarTelefono()) {
            marcarCampo(campoTelefono, true);
        }
    });

    campoMensaje.addEventListener('input', () => {
        if (validarMensaje()) {
            marcarCampo(campoMensaje, true);
        }
    });

    // Ejecuto todas las validaciones
    function validarFormulario() {
        const nombreValido = validarNombre();
        const correoValido = validarCorreo();
        const telefonoValido = validarTelefono();
        const mensajeValido = validarMensaje();

        marcarCampo(
            campoNombre,
            nombreValido
        );

        marcarCampo(
            campoCorreo,
            correoValido
        );

        marcarCampo(
            campoTelefono,
            telefonoValido
        );

        marcarCampo(
            campoMensaje,
            mensajeValido
        );

        return (
            nombreValido &&
            correoValido &&
            telefonoValido &&
            mensajeValido
        );
    }

    // Muestro un mensaje debajo del botón
    function mostrarEstado(mensaje, tipo) {
        estadoEnvio.textContent = mensaje;

        estadoEnvio.className =
            `alert alert-${tipo} mt-3`;

        estadoEnvio.style.display = 'block';
    }

    // Quito todas las marcas rojas después de enviar
    function limpiarErrores() {
        const camposInvalidos = formulario.querySelectorAll(
            '.es-invalido'
        );

        camposInvalidos.forEach(campo => {
            campo.classList.remove('es-invalido');
        });
    }

    // Envío los datos a Formspree
    async function enviarFormulario() {
        botonEnviar.disabled = true;

        botonEnviar.innerHTML = `
            <span
                class="spinner-border spinner-border-sm me-2"
                aria-hidden="true"
            ></span>
            Enviando...
        `;

        try {
            const respuesta = await fetch(
                formulario.action,
                {
                    method: 'POST',
                    body: new FormData(formulario),
                    headers: {
                        Accept: 'application/json'
                    }
                }
            );

            const datos = await respuesta
                .json()
                .catch(() => null);

            if (respuesta.ok) {
                mostrarEstado(
                    '¡Gracias! Tu mensaje fue enviado correctamente.',
                    'success'
                );

                formulario.reset();
                limpiarErrores();

                return;
            }

            let mensajeError =
                'Ocurrió un problema al enviar el formulario. Intenta nuevamente.';

            if (
                datos &&
                Array.isArray(datos.errors) &&
                datos.errors.length > 0
            ) {
                mensajeError = datos.errors
                    .map(error => error.message)
                    .join(' ');
            }

            mostrarEstado(
                mensajeError,
                'danger'
            );

        } catch (error) {
            console.error(
                'Error al enviar el formulario:',
                error
            );

            mostrarEstado(
                'No fue posible conectar con el servidor. Revisa tu conexión.',
                'danger'
            );

        } finally {
            botonEnviar.disabled = false;

            botonEnviar.innerHTML = `
                <i class="bi bi-send me-2"></i>
                Enviar
            `;
        }
    }

    // Al enviar, primero valido todos los campos
    formulario.addEventListener('submit', evento => {
        evento.preventDefault();

        estadoEnvio.style.display = 'none';

        if (!validarFormulario()) {
            mostrarEstado(
                'Revisa los campos marcados en rojo antes de enviar.',
                'danger'
            );

            return;
        }

        enviarFormulario();
    });

});