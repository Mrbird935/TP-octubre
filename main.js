
function IniciarAplicacion() {
    ConfigurarEventListeners();
    CargarCursosDisponibles();
    CrearSelectorFecha();
}

const url = 'http://localhost:3000/api';
function ConfigurarEventListeners() {
   const selectCursos = document.querySelector('#cursos');
   const selectMaterias = document.querySelector('#materias');
   
   selectCursos.addEventListener('change', ManejarCambioCurso);
   selectMaterias.addEventListener('change', ManejarCambioMateria);
}

function ManejarCambioCurso(evento) {
   const idCurso = evento.target.value;
   
   if (idCurso) {
      CargarMateriasDelCurso(idCurso);
   }
}

function ManejarCambioMateria(evento) {
   const selectMaterias = evento.target;
   const idMateria = selectMaterias.value;
   
   if (!idMateria) {
      MostrarMensajeTablaVacia('Por favor, selecciona una <b>Materia</b> y una <b>División</b>.');
      return;
   }
   
   const fechaSeleccionada = ObtenerFechaSeleccionada();
   RenderizarTablaEstudiantes(idMateria, fechaSeleccionada);
}

async function CargarCursosDisponibles() {
   try {
      const respuesta = await fetch(`${url}/cursos`, {
         headers: { 'Content-Type': 'application/json' }
      });
      const cursos = await respuesta.json();
      
      PoblarSelectorCursos(cursos);
      AgregarSelectorCursosEnFormulario(cursos);
   } catch (error) {
      console.error('Error al cargar cursos:', error);
      alert(`ERROR: No se pudieron cargar los cursos. Causa: ${error}`);
   }
}

function PoblarSelectorCursos(cursos) {
   const selectCursos = document.querySelector('#cursos');
   selectCursos.innerHTML = '<option>Curso</option>';
   
   for (let curso of cursos) {
      const opcion = CrearOpcionCurso(curso);
      selectCursos.appendChild(opcion);
   }
}

function CrearOpcionCurso(curso) {
   const opcion = document.createElement('option');
   opcion.value = curso.id;
   opcion.textContent = `${curso.anio} ${curso.division} ${curso.especialidad}`;
   return opcion;
}

function AgregarSelectorCursosEnFormulario() {
   if (document.querySelector('#selector-cursos')) {
      return;
   }
   
   const formulario = document.querySelector('#crear-materia');
   const selectOriginal = document.querySelector('#cursos');
   const selectClonado = selectOriginal.cloneNode(true);
   
   selectClonado.id = 'selector-cursos';
   selectClonado.name = 'cursos';
   formulario.appendChild(selectClonado);
}

async function CargarMateriasDelCurso(idCurso) {
   try {
      const respuesta = await fetch(`${url}/materias/${idCurso}`, {
         method: 'GET',
         headers: { 'Content-Type': 'application/json' }
      });
      const materias = await respuesta.json();
      
      ActualizarSelectorMaterias(materias);
   } catch (error) {
      console.error('Error al cargar materias:', error);
   }
}

function ActualizarSelectorMaterias(materias) {
   const selectMaterias = document.querySelector('#materias');
   selectMaterias.innerHTML = '<option>Materia</option>';
   
   for (let materia of materias) {
      const opcion = CrearOpcionMateria(materia);
      selectMaterias.appendChild(opcion);
   }
}

function CrearOpcionMateria(materia) {
   const opcion = document.createElement('option');
   opcion.value = materia.id;
   opcion.textContent = materia.nombre;
   return opcion;
}

async function RenderizarTablaEstudiantes(idMateria, fecha) {
   const fechaFormateada = fecha || ObtenerFechaActual();
   
   try {
      const estudiantes = await ObtenerEstudiantesDemateria(idMateria);
      
      if (estudiantes.length === 0) {
         MostrarMensajeTablaVacia('No se encontraron estudiantes para este curso.');
         return;
      }
      
      const asistencias = await ObtenerAsistenciasDelDia(idMateria, fechaFormateada);
      GenerarfilasTabla(estudiantes, asistencias, idMateria);
   } catch (error) {
      console.error('Error al renderizar tabla:', error);
      GenerarfilasSinasistencias(await ObtenerEstudiantesDemateria(idMateria), idMateria);
   }
}

async function ObtenerEstudiantesDemateria(idMateria) {
   const respuesta = await fetch(`${url}/estudiantes/${idMateria}`, {
      headers: { 'Content-Type': 'application/json' }
   });
   return await respuesta.json();
}

async function ObtenerAsistenciasDelDia(idMateria, fecha) {
   const respuesta = await fetch(`${url}/asistencias/${idMateria}/${fecha}`, {
      headers: { 'Content-Type': 'application/json' }
   });
   return await respuesta.json();
}

function GenerarfilasTabla(estudiantes, asistencias, idMateria) {
   const tbody = document.querySelector('tbody');
   tbody.innerHTML = '';
   
   for (let estudiante of estudiantes) {
      const fila = CrearfilaEstudiante(estudiante, idMateria);
      const asistencia = BuscarAsistenciaEstudiante(asistencias, estudiante.id);
      
      if (asistencia) {
         AplicarEstadoAsistencia(fila, asistencia);
      }
      
      tbody.appendChild(fila);
   }
}

function GenerarfilasSinasistencias(estudiantes, idMateria) {
   const tbody = document.querySelector('tbody');
   tbody.innerHTML = '';
   
   for (let estudiante of estudiantes) {
      const fila = CrearfilaEstudiante(estudiante, idMateria);
      tbody.appendChild(fila);
   }
}

function CrearfilaEstudiante(estudiante, idMateria) {
   const fila = document.createElement('tr');
   fila.setAttribute('data-materia-id', idMateria);
   fila.setAttribute('data-estudiante-id', estudiante.id);
   fila.innerHTML = GenerarHtmlfila(estudiante);
   return fila;
}

function CrearfilaEstudiante(estudiante, idMateria) {
   const fila = document.createElement('tr');
   fila.setAttribute('data-materia-id', idMateria);
   fila.setAttribute('data-estudiante-id', estudiante.id);
   
   const celdas = GenerarHtmlfila(estudiante);
   fila.appendChild(celdas.celdaNombre);
   fila.appendChild(celdas.celdaApellido);
   fila.appendChild(celdas.celdaAcciones);
   
   return fila;
}

function GenerarHtmlfila(estudiante) {
   const celdaNombre = document.createElement('td');
   celdaNombre.textContent = estudiante.nombre;
   
   const celdaApellido = document.createElement('td');
   celdaApellido.textContent = estudiante.apellido;
   
   const celdaAcciones = document.createElement('td');
   
   const botonesConfig = [
      { valor: 'P', texto: 'Presente', handler: RegistrarAsistencia },
      { valor: 'T', texto: 'Tarde', handler: RegistrarAsistencia },
      { valor: 'A', texto: 'Ausente', handler: RegistrarAsistencia },
      { valor: 'RA', texto: 'Retiro antes', handler: RegistrarAsistencia },
      { valor: 'AP', texto: 'Ausente con presencia', handler: RegistrarAsistencia },
      { valor: null, texto: '↺', handler: BorrarAsistencia }
   ];
   
   for (let config of botonesConfig) {
      const boton = CrearBotonAsistencia(config);
      celdaAcciones.appendChild(boton);
   }
   
   return { celdaNombre, celdaApellido, celdaAcciones };
}
function CrearBotonAsistencia(config) {
   const boton = document.createElement('button');
   boton.textContent = config.texto;
   
   if (config.valor) {
      boton.value = config.valor;
   }
   
   boton.onclick = config.handler;
   
   return boton;
}

function BuscarAsistenciaEstudiante(asistencias, idEstudiante) {
   return asistencias.find(asistencia => asistencia.estudiante === idEstudiante);
}

function AplicarEstadoAsistencia(fila, asistencia) {
   console.log(asistencia);
   fila.setAttribute('data-asistencia-id', asistencia.id);
   
   const botones = Array.from(fila.children[2].children);
   
   for (let boton of botones) {
      if (boton.value === asistencia.presencia) {
         MarcarBotonActivo(boton);
      }
      
      if (boton.textContent !== '↺') {
         boton.disabled = true;
      }
   }
}

function MarcarBotonActivo(boton) {
   boton.classList = boton.value;
   boton.style.opacity = 1;
}

async function RegistrarAsistencia(evento) {
   const boton = evento.target;
   const presenciaAsistencia = boton.value;
   const fila = boton.parentNode.parentNode;
   
   const datosAsistencia = ExtraerDatosFila(fila, presenciaAsistencia);
   
   if (!ValidarDatosAsistencia(datosAsistencia)) {
      console.error('Faltan datos para registrar la asistencia.');
      return;
   }
   
   DeshabilitarBotonesAsistencia(fila);
   boton.classList = presenciaAsistencia;
   
   try {
      const resultado = await EnviarAsistenciaAlservidor(datosAsistencia);
      fila.setAttribute('data-asistencia-id', resultado.id);
   } catch (error) {
      console.error('Falló el registro de asistencia:', error);
      RevertirEstadofila(fila, boton);
   }
}

function ExtraerDatosFila(fila, presenciaAsistencia) {
   return {
      presencia: presenciaAsistencia,
      estudiante: fila.getAttribute('data-estudiante-id'),
      materia: fila.getAttribute('data-materia-id'),
      creado: document.querySelector('#fecha').value
   };
}

function ValidarDatosAsistencia(datos) {
   return datos.presencia && datos.estudiante;
}

function DeshabilitarBotonesAsistencia(fila) {
   const botones = Array.from(fila.children[2].children);
   
   for (let boton of botones) {
      if (boton.textContent !== '↺') {
         boton.disabled = true;
      }
   }
}

async function EnviarAsistenciaAlservidor(datos) {
   const respuesta = await fetch(`${url}/asistencias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
   });
   return await respuesta.json();
}

function RevertirEstadofila(fila, boton) {
   boton.classList = '';
   fila.style.backgroundColor = '#ffe6e6';
}

async function BorrarAsistencia(evento) {
   evento.preventDefault();
   const fila = evento.target.parentNode.parentNode;
   const idAsistencia = fila.getAttribute('data-asistencia-id');
   
   try {
      await EliminarAsistenciaDelservidor(idAsistencia);
      const idMateria = document.querySelector("#materias").value;
      const fechaActual = ObtenerFechaSeleccionada();
      RenderizarTablaEstudiantes(idMateria, fechaActual);
   } catch (error) {
      console.error('Falló la eliminación de asistencia:', error);
   }
}

async function EliminarAsistenciaDelservidor(idAsistencia) {
   const respuesta = await fetch(`${url}/asistencias/${idAsistencia}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
   });
   return await respuesta.json();
}

async function CrearCurso(evento) {
   evento.preventDefault();
   const formulario = evento.target;
   const datosCurso = ExtraerDatosFormularioCurso(formulario);
   
   try {
      await EnviarCursoAlservidor(datosCurso);
      formulario.reset();
   } catch (error) {
      console.error('Falló el registro de curso:', error);
      alert(`ERROR: No se pudo registrar el curso. Causa: ${error}`);
   }
}

function ExtraerDatosFormularioCurso(formulario) {
   return {
      anio: formulario.querySelector('input[name="anio"]').value,
      division: formulario.querySelector('input[name="division"]').value,
      especialidad: formulario.querySelector('input[name="especialidad"]').value
   };
}

async function EnviarCursoAlservidor(datos) {
   const respuesta = await fetch(`${url}/cursos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
   });
   const resultado = await respuesta.json();
   console.log('Curso registrado:', resultado);
   return resultado;
}

async function CrearMateria(evento) {
   evento.preventDefault();
   const formulario = evento.target;
   const datosMateria = ExtraerDatosFormularioMateria(formulario);
   
   try {
      await EnviarMateriaAlservidor(datosMateria);
      formulario.reset();
   } catch (error) {
      console.error('Falló el registro de la materia:', error);
      alert(`ERROR: No se pudo registrar la materia. Causa: ${error}`);
   }
}

function ExtraerDatosFormularioMateria(formulario) {
   return {
      nombre: formulario.querySelector('input[name="nombre"]').value,
      cursoId: formulario.querySelector('select[name="cursos"]').value
   };
}

async function EnviarMateriaAlservidor(datos) {
   const respuesta = await fetch(`${url}/materias/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
   });
   const resultado = await respuesta.json();
   console.log('Materia registrada:', resultado);
   return resultado;
}

async function AgregarEstudiante(evento) {
   evento.preventDefault();
   const idMateria = document.querySelector("#materias").value;
   
   if (idMateria === "Materia") {
      alert("Seleccione una materia");
      return;
   }
   
   const formulario = evento.target;
   const datosEstudiante = ExtraerDatosFormularioEstudiante(formulario, idMateria);
   
   try {
      await EnviarEstudianteAlservidor(datosEstudiante);
      formulario.reset();
      const fechaActual = ObtenerFechaSeleccionada();
      RenderizarTablaEstudiantes(idMateria, fechaActual);
   } catch (error) {
      console.error('Falló el registro de estudiante:', error);
      alert(`ERROR: No se pudo registrar el estudiante. Causa: ${error}`);
   }
}

function ExtraerDatosFormularioEstudiante(formulario, idMateria) {
   return {
      nombre: formulario.querySelector('input[name="nombre"]').value,
      apellido: formulario.querySelector('input[name="apellido"]').value,
      materia: idMateria
   };
}

async function EnviarEstudianteAlservidor(datos) {
   const respuesta = await fetch(`${url}/estudiantes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
   });
   const resultado = await respuesta.json();
   console.log('Estudiante registrado:', resultado);
   return resultado;
}
function CrearSelectorFecha() {
   if (document.querySelector("#fecha")) {
      return;
   }
   
   const inputFecha = document.createElement("input");
   inputFecha.type = "date";
   inputFecha.id = "fecha";
   inputFecha.value = ObtenerFechaActual();
   inputFecha.setAttribute("max", ObtenerFechaActual());
   inputFecha.onchange = ManejarCambioFecha;
   
   const contenedor = document.querySelector(".contenedor-selects");
   contenedor.appendChild(inputFecha);
}

function ManejarCambioFecha() {
   const idMateria = document.querySelector("#materias").value;
   const fechaSeleccionada = document.querySelector("#fecha").value;
   RenderizarTablaEstudiantes(idMateria, fechaSeleccionada);
}

function ObtenerFechaActual() {
   return new Intl.DateTimeFormat('sv-SE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
   }).format(new Date());
}

function ObtenerFechaSeleccionada() {
   const inputFecha = document.querySelector('#fecha');
   return inputFecha ? inputFecha.value : ObtenerFechaActual();
}
function MostrarMensajeTablaVacia(mensaje) {
   const tbody = document.querySelector('tbody');
   if (tbody) {
      tbody.innerHTML = `<tr><td colspan="4" style="color: grey;">${mensaje}</td></tr>`;
   }
}

IniciarAplicacion();