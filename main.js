function cargarCursos() {

fetch('http://localhost:3000/api/cursos')
.then(res => res.json))
.then(data => {
    const select = document.querySelector('#cursos');
    select.innerHTML = '';
    for (let curso of data) {
const option = document.createAttribute.Elemnt('option');
const { anio, division, esp } = curso;
option.textContent ='${anio} ${division} ${esp}';
option.value = curso.id;
select.append(option);
}
})
catch(err => alert(err.stack));

}

cargarCursos();

function cargarMaterias(e) {
const cursoId = e.target.value;
fetch('http://localhost:3000/api/materias/' + cursoId)
.then(res => res.json())
.then (data => {
const select = document.querySelector('#materias');
select.innerHTML = '':
for (let materia of data) {
const option = document.createElement('option');
option.textContent = materia.nombre;
select.append(option);

}


})
}
