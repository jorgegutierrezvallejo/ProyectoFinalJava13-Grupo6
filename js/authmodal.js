function iniciarAuthModal() {
    const botonLogin = document.getElementById("btn-login");
    const modal = document.getElementById("auth-modal");
    const botonCerrar = document.getElementById("btn-close-modal");

    if (!botonLogin || !modal || !botonCerrar) {
        return;
    }

    botonLogin.addEventListener("click", function (evento) {
        evento.preventDefault();

        modal.classList.add("active");
        modal.setAttribute("aria-hidden", "false");
    });

    botonCerrar.addEventListener("click", function () {
        cerrarAuthModal(modal);
    });

    modal.addEventListener("click", function (evento) {
        if (evento.target === modal) {
            cerrarAuthModal(modal);
        }
    });

    // ========================================
    // VALIDACIONES DEL FORMULARIO DE REGISTRO
    // ========================================

    let formularioRegistro = document.querySelector(".hv-form-register");
    let campoNombre = document.getElementById("firstname");
    let campoApellido = document.getElementById("last-name");
    let campoCorreo = document.getElementById("email");
    let campoTelefono = document.getElementById("telephone");
    let campoContrasena = document.getElementById("pass");
    let campoConfirmar = document.getElementById("confirmpass");
    let campoFecha = document.getElementById("date");
    let mensajeRegistro = document.getElementById("mensaje-registro");

    // Si no existe el formulario de registro, no agrego validaciones
    if (!formularioRegistro) {
        return;
    }

    // Reviso que el nombre tenga minimo 3 caracteres
    // y solamente contenga letras y espacios
    function validarNombre(campo) {
        let valor = campo.value.trim();

        if (valor.length < 3) {
            return false;
        }

        for (let i = 0; i < valor.length; i++) {
            let letra = valor[i].toLowerCase();

            let esLetraNormal =
                letra >= 'a' &&
                letra <= 'z';

            let esEspacio = letra === ' ';

            let esLetraAcentuada =
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

    // Verifico que el correo tenga una estructura basica
    // Busco que tenga @ y un punto despues del @
    function validarCorreo() {
        let valor = campoCorreo.value.trim();

        let posicionArroba = valor.indexOf('@');
        let posicionPunto = valor.lastIndexOf('.');

        let tieneArroba =
            posicionArroba > 0;

        let tienePuntoDespuesDeArroba =
            posicionPunto > posicionArroba + 1;

        let tieneAlgoDespuesDelPunto =
            posicionPunto < valor.length - 1;

        let noTieneEspacios =
            valor.indexOf(' ') === -1;

        return (
            tieneArroba &&
            tienePuntoDespuesDeArroba &&
            tieneAlgoDespuesDelPunto &&
            noTieneEspacios
        );
    }

    // Valido el telefono
    // Permite numeros, +, espacios, guiones y parentesis
    function validarTelefono() {
        let valor = campoTelefono.value.trim();

        // Si el campo esta vacio, lo dejo pasar porque no es obligatorio
        if (valor.length === 0) {
            return true;
        }

        let cantidadDigitos = 0;

        for (let i = 0; i < valor.length; i++) {
            let caracter = valor[i];

            let esDigito =
                caracter >= '0' &&
                caracter <= '9';

            let esCaracterPermitido =
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

    // Valido que la contrasena tenga minimo 6 caracteres
    function validarContrasena() {
        return campoContrasena.value.length >= 6;
    }

    // Verifico que las dos contrasenas sean iguales
    function validarConfirmarContrasena() {
        return (
            campoConfirmar.value.length > 0 &&
            campoConfirmar.value === campoContrasena.value
        );
    }

    // Agrego o quito la clase de error en un campo
    function marcarCampo(campo, esValido) {
        let contenedor = campo.closest('.campo-formulario');

        if (!contenedor) {
            return;
        }

        if (esValido) {
            contenedor.classList.remove('campo-error');
        } else {
            contenedor.classList.add('campo-error');
        }
    }

    // Muestro un mensaje general debajo del formulario
    function mostrarMensaje(texto, tipo) {
        if (!mensajeRegistro) {
            return;
        }

        mensajeRegistro.textContent = texto;

        // Quito clases anteriores
        mensajeRegistro.className = 'mensaje-formulario';

        // Agrego la clase del tipo (error o exito)
        mensajeRegistro.classList.add(tipo);
    }

    // Quito el mensaje general
    function ocultarMensaje() {
        if (!mensajeRegistro) {
            return;
        }

        mensajeRegistro.textContent = '';
        mensajeRegistro.className = 'mensaje-formulario';
    }

    // Quito todas las marcas rojas del formulario
    function limpiarErrores() {
        let camposConError = formularioRegistro.querySelectorAll(
            '.campo-error'
        );

        camposConError.forEach(function (campo) {
            campo.classList.remove('campo-error');
        });
    }

    // ========================================
    // VALIDACIONES EN TIEMPO REAL (blur e input)
    // ========================================

    // Cuando el usuario sale del campo, valido
    if (campoNombre) {
        campoNombre.addEventListener('blur', function () {
            marcarCampo(campoNombre, validarNombre(campoNombre));
        });

        // Si corrige mientras escribe, quito el error
        campoNombre.addEventListener('input', function () {
            if (validarNombre(campoNombre)) {
                marcarCampo(campoNombre, true);
            }
        });
    }

    if (campoApellido) {
        campoApellido.addEventListener('blur', function () {
            marcarCampo(campoApellido, validarNombre(campoApellido));
        });

        campoApellido.addEventListener('input', function () {
            if (validarNombre(campoApellido)) {
                marcarCampo(campoApellido, true);
            }
        });
    }

    if (campoCorreo) {
        campoCorreo.addEventListener('blur', function () {
            marcarCampo(campoCorreo, validarCorreo());
        });

        campoCorreo.addEventListener('input', function () {
            if (validarCorreo()) {
                marcarCampo(campoCorreo, true);
            }
        });
    }

    if (campoTelefono) {
        // Bloqueo letras: solo dejo numeros y caracteres permitidos
        campoTelefono.addEventListener('input', function () {
            let valorLimpio = '';

            for (let i = 0; i < campoTelefono.value.length; i++) {
                let caracter = campoTelefono.value[i];

                let esPermitido =
                    (caracter >= '0' && caracter <= '9') ||
                    caracter === '+' ||
                    caracter === ' ' ||
                    caracter === '-' ||
                    caracter === '(' ||
                    caracter === ')';

                if (esPermitido) {
                    valorLimpio = valorLimpio + caracter;
                }
            }

            // Solo actualizo si cambio algo (para no mover el cursor)
            if (campoTelefono.value !== valorLimpio) {
                campoTelefono.value = valorLimpio;
            }

            if (validarTelefono()) {
                marcarCampo(campoTelefono, true);
            }
        });

        campoTelefono.addEventListener('blur', function () {
            marcarCampo(campoTelefono, validarTelefono());
        });
    }

    // Limito la fecha de nacimiento para que no se pueda elegir una fecha futura
    if (campoFecha) {
        let hoy = new Date();
        let anio = hoy.getFullYear();
        let mes = hoy.getMonth() + 1;
        let dia = hoy.getDate();

        // Agrego un 0 si el mes o dia tienen un solo digito
        if (mes < 10) {
            mes = '0' + mes;
        }
        if (dia < 10) {
            dia = '0' + dia;
        }

        // Formato YYYY-MM-DD que necesita el input date
        let fechaMaxima = anio + '-' + mes + '-' + dia;
        campoFecha.setAttribute('max', fechaMaxima);
    }

    if (campoContrasena) {
        campoContrasena.addEventListener('blur', function () {
            marcarCampo(campoContrasena, validarContrasena());
        });

        campoContrasena.addEventListener('input', function () {
            if (validarContrasena()) {
                marcarCampo(campoContrasena, true);
            }

            // Si ya escribio en confirmar, reviso de nuevo
            if (campoConfirmar.value.length > 0) {
                marcarCampo(campoConfirmar, validarConfirmarContrasena());
            }
        });
    }

    if (campoConfirmar) {
        campoConfirmar.addEventListener('blur', function () {
            marcarCampo(campoConfirmar, validarConfirmarContrasena());
        });

        campoConfirmar.addEventListener('input', function () {
            if (validarConfirmarContrasena()) {
                marcarCampo(campoConfirmar, true);
            }
        });
    }

    // ========================================
    // VALIDACION AL ENVIAR EL FORMULARIO
    // ========================================

    formularioRegistro.addEventListener('submit', function (evento) {
        evento.preventDefault();

        ocultarMensaje();

        // Ejecuto todas las validaciones
        let nombreValido = campoNombre ? validarNombre(campoNombre) : true;
        let apellidoValido = campoApellido ? validarNombre(campoApellido) : true;
        let correoValido = campoCorreo ? validarCorreo() : true;
        let telefonoValido = campoTelefono ? validarTelefono() : true;
        let contrasenaValida = campoContrasena ? validarContrasena() : true;
        let confirmacionValida = campoConfirmar ? validarConfirmarContrasena() : true;

        // Marco cada campo con su resultado
        if (campoNombre) {
            marcarCampo(campoNombre, nombreValido);
        }
        if (campoApellido) {
            marcarCampo(campoApellido, apellidoValido);
        }
        if (campoCorreo) {
            marcarCampo(campoCorreo, correoValido);
        }
        if (campoTelefono) {
            marcarCampo(campoTelefono, telefonoValido);
        }
        if (campoContrasena) {
            marcarCampo(campoContrasena, contrasenaValida);
        }
        if (campoConfirmar) {
            marcarCampo(campoConfirmar, confirmacionValida);
        }

        // Si hay algun error, muestro mensaje y no envio
        let todoValido =
            nombreValido &&
            apellidoValido &&
            correoValido &&
            telefonoValido &&
            contrasenaValida &&
            confirmacionValida;

        if (!todoValido) {
            mostrarMensaje(
                'Revisa los campos marcados en rojo antes de continuar.',
                'error'
            );

            return;
        }

        // Si todo esta bien, muestro mensaje de exito
        mostrarMensaje(
            '¡Registro exitoso!',
            'exito'
        );

        // Limpio el formulario y los errores
        formularioRegistro.reset();
        limpiarErrores();
    });
}

function cerrarAuthModal(modal) {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
}

document.addEventListener(
    "componentesCargados",
    iniciarAuthModal
);
