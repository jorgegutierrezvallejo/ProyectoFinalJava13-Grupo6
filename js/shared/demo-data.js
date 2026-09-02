/* Carga manual de datos demostrativos desde Configuración > Datos. */
const DATOS_DEMO_STORAGE_KEY = "huellavetDatosDemo";
const CONTRASENA_USUARIOS_DEMO = "HV123";

function obtenerEstadoDatosDemo() {
    return HuellaVetStorage.leer(DATOS_DEMO_STORAGE_KEY, null);
}

function hayDatosDemoHuellaVet() {
    return ["usuarios", "mascotas", "servicios", "tiposServicio", "citas"].some(clave =>
        listaStorageDemo(clave).some(item => /^demo-(?:user|pet|servicio|tipo|cita)-/.test(String(item.id || "")))
    );
}

function cargarDatosDemoHuellaVet() {
    const fechaCarga = new Date();
    const fechaCargaISO = fechaLocalISO(fechaCarga);
    const creadoEn = fechaCarga.toISOString();

    const usuariosDemo = crearUsuariosDemo(creadoEn);
    const usuariosActuales = HuellaVetStorage.leer("usuarios", []);
    const idsUsuarioPorSlug = {};
    const usuariosDemoResueltos = usuariosDemo.map(usuarioDemo => {
        const existente = usuariosActuales.find(usuario =>
            String(usuario.email || "").toLowerCase() === usuarioDemo.email.toLowerCase()
        );
        const slug = usuarioDemo.id.replace("demo-user-", "");
        idsUsuarioPorSlug[slug] = existente?.id || usuarioDemo.id;
        return { ...usuarioDemo, id: idsUsuarioPorSlug[slug] };
    });
    const mascotasDemo = crearMascotasDemo(creadoEn, idsUsuarioPorSlug);
    const tiposDemo = crearTiposServicioDemo();
    const serviciosDemo = crearServiciosDemo();
    const citasDemo = crearCitasDemo({ usuariosDemo: usuariosDemoResueltos, mascotasDemo, serviciosDemo, fechaCargaISO, creadoEn });

    const correosDemo = new Set(usuariosDemoResueltos.map(usuario => usuario.email.toLowerCase()));
    HuellaVetStorage.guardar("usuarios", [
        ...usuariosActuales.filter(usuario => !correosDemo.has(String(usuario.email || "").toLowerCase())),
        ...usuariosDemoResueltos
    ]);

    // Elimina únicamente las antiguas semillas genéricas de Luna y Max.
    const mascotasActuales = HuellaVetStorage.leer("mascotas", []).filter(mascota => {
        const lunaAnterior = mascota.nombre === "Luna" && mascota.raza === "Siamés" && String(mascota.peso) === "4.2 kg";
        const maxAnterior = mascota.nombre === "Max" && mascota.raza === "Criollo" && String(mascota.peso) === "18 kg";
        return !lunaAnterior && !maxAnterior;
    });

    HuellaVetStorage.guardar("mascotas", combinarDatosDemo(mascotasActuales, mascotasDemo));
    HuellaVetStorage.guardar("tiposServicio", combinarDatosDemo(HuellaVetStorage.leer("tiposServicio", []), tiposDemo));
    HuellaVetStorage.guardar("servicios", combinarDatosDemo(HuellaVetStorage.leer("servicios", []), serviciosDemo));
    HuellaVetStorage.guardar("citas", combinarDatosDemo(HuellaVetStorage.leer("citas", []), citasDemo));

    const estado = {
        cargadoEn: creadoEn,
        fechaBaseCitas: fechaCargaISO,
        usuarios: usuariosDemo.length,
        mascotas: mascotasDemo.length,
        servicios: serviciosDemo.length,
        citas: citasDemo.length,
        contrasenaComun: CONTRASENA_USUARIOS_DEMO
    };
    HuellaVetStorage.guardar(DATOS_DEMO_STORAGE_KEY, estado);
    return estado;
}

function eliminarDatosDemoHuellaVet() {
    const correosDemo = new Set(
        crearUsuariosDemo("").map(usuario => usuario.email.toLowerCase())
    );
    const usuariosActuales = listaStorageDemo("usuarios");
    const usuariosConservados = usuariosActuales.filter(usuario =>
        !String(usuario.id || "").startsWith("demo-user-") &&
        !correosDemo.has(String(usuario.email || "").toLowerCase())
    );
    const idsUsuariosEliminados = new Set(
        usuariosActuales
            .filter(usuario => !usuariosConservados.includes(usuario))
            .map(usuario => String(usuario.id))
    );

    const resultado = {
        usuarios: guardarSinDatosDemo("usuarios", item =>
            String(item.id || "").startsWith("demo-user-") ||
            correosDemo.has(String(item.email || "").toLowerCase())
        ),
        mascotas: guardarSinDatosDemo("mascotas", item => String(item.id || "").startsWith("demo-pet-")),
        servicios: guardarSinDatosDemo("servicios", item => String(item.id || "").startsWith("demo-servicio-")),
        categorias: guardarSinDatosDemo("tiposServicio", item => String(item.id || "").startsWith("demo-tipo-")),
        citas: guardarSinDatosDemo("citas", item => String(item.id || "").startsWith("demo-cita-"))
    };

    const sesionActual = HuellaVetStorage.leer("sesionUsuarioId", null);
    if (sesionActual && idsUsuariosEliminados.has(String(sesionActual))) {
        localStorage.removeItem("sesionUsuarioId");
    }
    localStorage.removeItem(DATOS_DEMO_STORAGE_KEY);
    return resultado;
}

function listaStorageDemo(clave) {
    const lista = HuellaVetStorage.leer(clave, []);
    return Array.isArray(lista) ? lista : [];
}

function guardarSinDatosDemo(clave, esDemo) {
    const actuales = listaStorageDemo(clave);
    const conservados = actuales.filter(item => !esDemo(item));
    HuellaVetStorage.guardar(clave, conservados);
    return actuales.length - conservados.length;
}

function combinarDatosDemo(actuales, demos) {
    const idsDemo = new Set(demos.map(item => String(item.id)));
    return [...actuales.filter(item => !idsDemo.has(String(item.id))), ...demos];
}

function crearUsuariosDemo(creadoEn) {
    const base = [
        ["lizeth", "Lizeth Londoño", "linalizethlondonomarin@gmail.com", "3004102201", "Bogotá", "1992-05-18"],
        ["sneyder", "Sneyder Rodriguez", "sneyder2912@gmail.com", "3101111111", "Bogotá", "1994-12-29"],
        ["jorger", "Jorge Gutiérrez", "jegv08@gmail.com", "3101111111", "Bogotá", "1990-08-08"],
        ["tatiana", "Tatiana Pérez", "tatiana.perez@demo.huellavet.com", "3154201801", "Bogotá", "1996-06-21"],
        ["camila", "Camila Torres", "camila.torres@demo.huellavet.com", "3005203101", "Bogotá", "1993-02-11"],
        ["andres", "Andrés Ramírez", "andres.ramirez@demo.huellavet.com", "3016204102", "Manizales", "1988-09-07"],
        ["laura", "Laura Gómez", "laura.gomez@demo.huellavet.com", "3027305203", "Pereira", "1997-04-23"],
        ["felipe", "Felipe Mendoza", "felipe.mendoza@demo.huellavet.com", "3108406304", "Bogotá", "1985-11-15"],
        ["valentina", "Valentina Rojas", "valentina.rojas@demo.huellavet.com", "3119507405", "Bogotá", "1995-08-14"]
    ];
    return base.map(([slug, nombreCompleto, email, telefono, ciudad, fechaNacimiento]) => ({
        id: `demo-user-${slug}`,
        nombreCompleto,
        email,
        contrasena: CONTRASENA_USUARIOS_DEMO,
        indicativoPais: "+57",
        telefono,
        ciudad,
        fechaNacimiento,
        creadoEn
    }));
}

function crearMascotasDemo(creadoEn, idsUsuarioPorSlug = {}) {
    const base = [
        ["dante", "lizeth", "Dante", "perro", "Husky Siberiano", "2020-01-27", "macho", "28", "Gris y blanco", "Dante.jpeg"],
        ["sasha", "lizeth", "Sasha", "perro", "Mestiza con Labrador", "2014-04-01", "hembra", "8", "Negro", "Sasha.jpeg"],
        ["blue", "lizeth", "Blue", "ave", "Periquito", "2023-01-04", "macho", "0.04", "Azul y blanco", "Blue.jpeg"],
        ["luna", "sneyder", "Luna", "perro", "Schnauzer", "2010-11-11", "hembra", "7.5", "Sal y pimienta", "Luna.jpeg"],
        ["max", "jorger", "Max", "perro", "Criollo", "2015-02-28", "macho", "21.5", "Blanco", "Max.PNG"],
        ["london", "jorger", "London", "perro", "Pomerania", "2022-10-14", "hembra", "4.3", "Dorado", "London.jpg"],
        ["london-jr", "jorger", "Río", "perro", "Pomerania", "2022-10-14", "macho", "3", "Dorado", "Rio.JPG"],
        ["apolo", "tatiana", "Apolo", "gato", "Europeo de pelo corto", "2021-07-09", "macho", "5.2", "Naranja", "Apolo.jpeg"],
        ["milo", "camila", "Milo", "gato", "Criollo", "2022-03-16", "macho", "4.8", "Atigrado", ""],
        ["nala", "andres", "Nala", "perro", "Labrador Retriever", "2019-09-22", "hembra", "26", "Negro", ""],
        ["coco", "laura", "Coco", "otro", "Conejo Mini Lop", "2024-01-12", "macho", "1.9", "Blanco y café", ""],
        ["kiara", "felipe", "Kiara", "gato", "Siamés", "2020-05-30", "hembra", "4.1", "Crema", ""],
        ["rio", "valentina", "Bruno", "perro", "Golden Retriever", "2021-04-20", "macho", "29", "Dorado", ""]
    ];
    return base.map(([slug, propietario, nombre, especie, raza, fechaNacimiento, sexo, peso, color, foto]) => ({
        id: `demo-pet-${slug}`,
        usuarioId: idsUsuarioPorSlug[propietario] || `demo-user-${propietario}`,
        nombre,
        especie,
        raza,
        fechaNacimiento,
        sexo,
        peso,
        fechaUltimaConsulta: "",
        color,
        vacunas: especie === "ave" || especie === "otro" ? [] : ["Rabia", especie === "gato" ? "Triple felina" : "Polivalente"],
        alergias: [],
        observaciones: "Paciente incluido en los datos demostrativos de HuellaVet.",
        foto: foto ? `/img/demo/${foto}` : "",
        creadaEn: creadoEn
    }));
}

function crearTiposServicioDemo() {
    return [
        { id: "demo-tipo-consulta", nombre: "Consulta veterinaria" },
        { id: "demo-tipo-diagnostico", nombre: "Diagnóstico especializado" },
        { id: "demo-tipo-preventiva", nombre: "Medicina preventiva" },
        { id: "demo-tipo-bienestar", nombre: "Bienestar y cuidado" }
    ];
}

function crearServiciosDemo() {
    const base = [
        ["consulta-general", "Consulta General", "consulta", "Evaluación clínica completa para conocer el estado general de salud de tu mascota.", 65000, 45, "clinica", false, 0, "bi bi-clipboard2-pulse"],
        ["consulta-domicilio", "Consulta a Domicilio", "consulta", "Atención veterinaria profesional en casa para reducir el estrés del traslado.", 95000, 60, "domicilio", true, 30000, "bi bi-house-heart"],
        ["optometria-canina", "Optometría Canina", "diagnostico", "Valoración especializada de ojos y visión para detectar alteraciones oportunamente.", 120000, 60, "clinica", true, 40000, "bi bi-eye"],
        ["examen-sangre", "Examen de Sangre", "diagnostico", "Toma y análisis de muestra para apoyar diagnósticos y controles preventivos.", 90000, 30, "domicilio", false, 0, "bi bi-droplet"],
        ["vacunacion", "Vacunación", "preventiva", "Aplicación de vacunas según especie, edad y esquema preventivo de cada paciente.", 75000, 30, "clinica", false, 0, "bi bi-shield-plus"],
        ["desparasitacion", "Desparasitación", "preventiva", "Plan de control interno y externo adaptado al peso y estilo de vida de tu mascota.", 55000, 30, "domicilio", true, 20000, "bi bi-capsule"],
        ["control-nutricional", "Control Nutricional", "bienestar", "Evaluación de peso y plan alimentario personalizado para cada etapa de vida.", 80000, 45, "clinica", true, 25000, "bi bi-heart-pulse"],
        ["higiene-dental", "Higiene Dental", "bienestar", "Revisión oral preventiva y orientación para mantener dientes y encías saludables.", 70000, 40, "clinica", false, 0, "bi bi-emoji-smile"]
    ];
    return base.map(([slug, nombre, tipo, descripcion, precio, duracion, modalidad, tieneCostoReserva, costoReserva, icono], indice) => ({
        id: `demo-servicio-${slug}`,
        nombre,
        tipoServicioId: `demo-tipo-${tipo}`,
        descripcion,
        precio,
        duracion,
        modalidad,
        esClinica: modalidad === "clinica",
        esDomicilio: modalidad === "domicilio",
        esVirtual: false,
        direccionClinica: modalidad === "clinica" ? "HuellaVet — Sede Centro" : "",
        icono,
        imagen: `img/demo/servicio-${slug}.png`,
        tieneCostoReserva,
        costoReserva,
        mostrarEnHome: indice < 3,
        destacado: indice === 0,
        ordenInicio: indice < 3 ? indice + 1 : null
    }));
}

function crearCitasDemo({ usuariosDemo, mascotasDemo, serviciosDemo, fechaCargaISO, creadoEn }) {
    const horas = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];
    return mascotasDemo.map((mascota, indice) => {
        const usuario = usuariosDemo.find(item => item.id === mascota.usuarioId);
        const servicio = serviciosDemo[indice % serviciosDemo.length];
        const diasDespues = Math.floor(indice / horas.length) + 1;
        return {
            id: `demo-cita-${mascota.id.replace("demo-pet-", "")}`,
            usuarioId: usuario.id,
            mascotaId: mascota.id,
            fecha: sumarDiasDemo(fechaCargaISO, diasDespues),
            hora: horas[indice % horas.length],
            nombreMascota: mascota.nombre,
            especie: mascota.especie,
            raza: mascota.raza,
            edad: "",
            peso: mascota.peso,
            fotoMascota: mascota.foto || "",
            motivo: `Cita demostrativa de ${servicio.nombre.toLowerCase()}.`,
            servicioId: servicio.id,
            servicioNombre: servicio.nombre,
            modalidad: servicio.modalidad,
            ubicacion: servicio.modalidad === "domicilio" ? "Domicilio del cliente" : "HuellaVet — Sede Centro",
            veterinario: "",
            estado: indice % 3 === 0 ? "Confirmada" : "Pendiente",
            tieneCostoReserva: servicio.tieneCostoReserva,
            costoReserva: servicio.costoReserva,
            cliente: {
                nombre: usuario.nombreCompleto,
                telefono: usuario.telefono,
                email: usuario.email,
                direccion: servicio.modalidad === "domicilio" ? "Dirección demo, Bogotá" : "",
                canalRecordatorio: indice % 2 === 0 ? "email" : "whatsapp"
            },
            fechaCreacion: creadoEn
        };
    });
}

function fechaLocalISO(fecha) {
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
}

function sumarDiasDemo(fechaISO, dias) {
    const [anio, mes, dia] = fechaISO.split("-").map(Number);
    const fecha = new Date(anio, mes - 1, dia);
    fecha.setDate(fecha.getDate() + dias);
    return fechaLocalISO(fecha);
}
