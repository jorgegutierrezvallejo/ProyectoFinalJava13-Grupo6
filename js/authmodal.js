function iniciarAuthModal() {





    let botonLogin = document.getElementById("btn-login");
    let modal = document.getElementById("auth-modal");
    let botonCerrar = document.getElementById("btn-close-modal");

    // Modal Admin
    let botonAdminLogin = document.getElementById("btn-login-admin");
    let modalAdmin = document.getElementById("modal-auth-admin");
    let botonCerrarAdmin = document.getElementById("btn-cerrar-modal-admin");
    let formAdmin = document.getElementById("formulario-login-admin");

    if (botonLogin && modal && botonCerrar) {
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
    }

    if (botonAdminLogin && modalAdmin && botonCerrarAdmin) {
        botonAdminLogin.addEventListener("click", function (evento) {
            evento.preventDefault();
            modalAdmin.classList.add("active");
            modalAdmin.setAttribute("aria-hidden", "false");
        });

        botonCerrarAdmin.addEventListener("click", function () {
            cerrarAuthModal(modalAdmin);
        });

        modalAdmin.addEventListener("click", function (evento) {
            if (evento.target === modalAdmin) {
                cerrarAuthModal(modalAdmin);
            }
        });
    }

    if (formAdmin) {
        formAdmin.addEventListener("submit", function (e) {
            e.preventDefault();
            let adminUser = document.getElementById("usuario-admin").value.trim();
            let adminPass = document.getElementById("contrasena-admin").value;
            let errorMsg = document.getElementById("mensaje-error-admin");
            
            // Logica simple: redirige al dashboard si escribe algo (o poner credenciales por defecto)
            if (adminUser === "admin" && adminPass === "admin123") {
                // Redirigir al dashboard admin (asumiendo que se llama admin-dashboard.html)
                // Dependiendo de dónde estemos, la ruta puede variar, usaremos la ruta absoluta relativa al origen
                window.location.href = window.location.pathname.includes('/admin/') ? "html/admin-dashboard.html" : "admin/html/admin-dashboard.html";
            } else {
                errorMsg.textContent = "Usuario o contraseña incorrectos (Usa: admin / admin123)";
                errorMsg.style.display = "block";
            }
        });
    }

    // ========================================
    // VALIDACIONES DEL FORMULARIO DE REGISTRO
    // ========================================

    let formularioRegistro = document.querySelector(".hv-form-register");
    let formularioLoginUsuario = document.getElementById("formulario-login-usuario");
    let campoNombre = document.getElementById("firstname");
    let campoApellido = document.getElementById("last-name");
    let campoCorreo = document.getElementById("email");
    let campoTelefono = document.getElementById("telephone");
    let indicativoPais = document.getElementById("country-code");
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

    // Valido que sea un celular colombiano de 10 digitos e inicie con 3
    function validarTelefono() {
        let valor = campoTelefono.value.trim();

        // Si el campo esta vacio, lo dejo pasar porque no es obligatorio
        if (valor.length === 0) {
            return true;
        }

        if (valor.length !== 10 || valor[0] !== '3') {
            return false;
        }

        for (let i = 0; i < valor.length; i++) {
            let caracter = valor[i];
            let esDigito = caracter >= '0' && caracter <= '9';

            if (!esDigito) {
                return false;
            }
        }

        return true;
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
        // Bloqueo letras y limito el celular a 10 digitos
        campoTelefono.addEventListener('input', function () {
            let valorLimpio = '';

            for (let i = 0; i < campoTelefono.value.length; i++) {
                let caracter = campoTelefono.value[i];
                let esDigito = caracter >= '0' && caracter <= '9';

                if (esDigito && valorLimpio.length < 10) {
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

    if (formularioLoginUsuario) {
        formularioLoginUsuario.addEventListener('submit', function (evento) {
            evento.preventDefault();
            
            let correoIngresado = document.getElementById('login-correo').value.trim();
            let contrasenaIngresada = document.getElementById('login-contrasena').value;
            let mensajeErrorLogin = document.getElementById('mensaje-error-login');
            
            if (mensajeErrorLogin) {
                mensajeErrorLogin.style.display = 'none';
                mensajeErrorLogin.textContent = '';
            }
            
            let jsonUsuario = localStorage.getItem('usuarioRegistrado');
            
            if (!jsonUsuario) {
                if (mensajeErrorLogin) {
                    mensajeErrorLogin.textContent = 'No hay ningún usuario registrado. Por favor, regístrate primero.';
                    mensajeErrorLogin.style.display = 'block';
                }
                return;
            }
            
            try {
                let usuarioRegistrado = JSON.parse(jsonUsuario);
                
                if (correoIngresado === usuarioRegistrado.email && contrasenaIngresada === usuarioRegistrado.contrasena) {
                    window.location.href = './user/html/user-dashboard.html';
                } else {
                    if (mensajeErrorLogin) {
                        mensajeErrorLogin.textContent = 'Correo o contraseña incorrectos.';
                        mensajeErrorLogin.style.display = 'block';
                    }
                }
            } catch(e) {
                if (mensajeErrorLogin) {
                    mensajeErrorLogin.textContent = 'Error al leer los datos de registro.';
                    mensajeErrorLogin.style.display = 'block';
                }
            }
        });
    }

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

        // Crear objeto JSON con los datos del usuario
        let datosUsuario = {
            nombreCompleto: (campoNombre?.value || "") + " " + (campoApellido?.value || ""),
            telefono: campoTelefono?.value || "",
            indicativoPais: indicativoPais?.value || "+57",
            email: campoCorreo?.value || "",
            contrasena: campoContrasena?.value || ""
        };

        // Convertir a string JSON y guardar en LocalStorage
        let jsonUsuario = JSON.stringify(datosUsuario);
        localStorage.setItem('usuarioRegistrado', jsonUsuario);
        console.log("Usuario registrado en localStorage:", jsonUsuario);

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
