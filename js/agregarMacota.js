
let listaDeMascota = [];

const nombreMascotaqs = document.querySelector('#nombre-mascota');
const inputEspecie = document.querySelector('#especie');
const inputRaza = document.querySelector('#raza');
const inputEdad = document.querySelector('#edad');
const selectUnidadEdad = document.querySelector('#unidad-edad');
const inputSexo = document.querySelector('#sexo-mascota');
const inputPeso = document.querySelector('#peso');
const inputFecha = document.querySelector('#fecha-nacimiento');
const inputColor = document.querySelector('#color');
const inputVacunas = document.querySelector('#vacunas');
const inputAlergias = document.querySelector('#alergias');
const inputObservaciones = document.querySelector('#observaciones');



const botonguardarqs = document.querySelector('.btn-guardar');



botonguardarqs.addEventListener ('click', function(){

    const formulario = document.querySelector('form');

    if (!formulario.checkValidity()) {
        formulario.reportValidity(); 
        return; 
    }

    const nombreMascotaAV = nombreMascotaqs.value;
    const especieV = inputEspecie.value;
    const razaV = inputRaza.value;
    const edadNumeroV = inputEdad.value;
    const edadUnidadV = selectUnidadEdad.value;
    const sexoV = inputSexo.value;
    const pesoV = inputPeso.value;
    const fechaV = inputFecha.value;
    const colorV = inputColor.value;
    const vacunasV = inputVacunas.value;
    const alergiasV = inputAlergias.value;
    const observacionesV = inputObservaciones.value;
    

    const nuevaMascota = {
        nombre: nombreMascotaAV,
        especie: especieV,
        raza: razaV,
        edadNumero: edadNumeroV,
        edadValor : edadUnidadV,
        sexo : sexoV,
        peso : pesoV,
        fecha : fechaV,
        color : colorV,
        vacunas : vacunasV,
        alergias : alergiasV,
        observaciones : observacionesV

    };

    listaDeMascota.push(nuevaMascota);

    console.log("abajo estan el arreglo mascotas")
    console.log(listaDeMascota)

});