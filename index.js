const express = require('express');
const morgan = require('morgan');
const mysql = require('mysql2/promise'); 
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const connect = mysql.createPool({
    host: 'localhost', 
    user: 'root',
    password: '',
    database: 'escuela'
});



app.get('/api/estudiantes/:materia_id', async (req, res) => {
    const idMateria = req.params.materia_id;
    
    try {
        const estudiantes = await BuscarEstudiantesPorMateria(idMateria);
      res.json(estudiantes);
   } catch (error) {
       console.error('Error al obtener estudiantes:', error);
      res.status(500).json({ 
          error: 'Error al obtener estudiantes', 
         detalle: error.message 
      });
    }
});

app.post('/api/estudiantes', async (req, res) => {
    const { nombre, apellido, materia } = req.body;
    
    if (!ValidarDatosEstudiante(nombre, apellido, materia)) {
        return res.status(400).json({ 
            error: 'Faltan datos requeridos (nombre, apellido o materia)' 
        });
    }
    
    try {
        const result = await RegistrarNuevoEstudiante(nombre, apellido, materia);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error al crear estudiante:', error);
        res.status(500).json({ 
            error: 'Error al crear estudiante', 
            detalle: error.message 
        });
    }
});

app.delete('/api/asistencias/:asistenciaId', async (req, res) => {
   const idAsistencia = req.params.asistenciaId;
   
   if (!idAsistencia) {
      return res.status(400).json({ 
         error: 'Falta el ID de la asistencia' 
      });
   }
   
   try {
      const eliminado = await EliminarRegistroAsistencia(idAsistencia);
      
      if (!eliminado) {
         return res.status(404).json({ 
            error: 'Registro de asistencia no encontrado' 
         });
      }
      
      res.status(200).json({ 
         mensaje: 'Registro de asistencia eliminado con éxito', 
         asistenciaId: idAsistencia 
      });
   } catch (error) {
      console.error('Error al eliminar asistencia:', error);
      res.status(500).json({ 
         error: 'Error al eliminar asistencia', 
         detalle: error.message 
      });
   }
});
app.get('/api/asistencias/:materia/:creado', async (req, res) => {
    const idMateria = req.params.materia;
    const creadoquery = req.params.creado;
    
   try {
       const registros = await queryAsistencias(idMateria, creadoquery);
      res.json(registros);
   } catch (error) {
       console.error('Error al obtener asistencias:', error);
       res.status(500).json({ 
         error: 'Error al obtener asistencias', 
         detalle: error.message 
      });
   }
});

app.post('/api/asistencias', async (req, res) => {
   const { presencia, estudiante, materia, creado } = req.body;
   console.log(req.body);
   if (!ValidarDatosAsistencia(presencia, estudiante, materia, creado)) {
       return res.status(400).json({ 
         error: 'Faltan datos requeridos (presencia, estudiante, materia o creado)' 
      });
   }
   
   try {
       const yaExiste = await VerificarAsistenciaExistente(estudiante, creado);
       
       if (yaExiste) {
         return res.status(409).json({ 
            error: 'Ya se registró asistencia para este estudiante hoy',
            msg: 'No se puede registrar dos veces el mismo día'
         });
      }
      
      const result = await GuardarNuevaAsistencia(presencia, estudiante, materia, creado);
      res.status(201).json(result);
    } catch (error) {
        console.error('Error al guardar asistencia:', error);
        res.status(500).json({ 
            error: 'Error al guardar asistencia', 
            detalle: error.message 
        });
    }
});

app.get('/api/cursos', async (req, res) => {
   try {
      const query = 'SELECT * FROM cursos';
      const [filas] = await connect.query(query);
      res.json(filas);
   } catch (error) {
      console.error('Error al obtener cursos:', error);
      res.status(500).json({ 
         error: 'Error al obtener cursos', 
         detalle: error.message 
      });
   }
});

app.post('/api/cursos', async (req, res) => {
   const { anio, division, especialidad } = req.body;
   
   if (!ValidarDatosCurso(anio, division, especialidad)) {
      return res.status(400).json({ 
         error: 'Faltan datos requeridos para crear el curso' 
      });
   }
   
   try {
      const result = await CrearNuevoCurso(anio, division, especialidad);
      res.status(201).json(result);
   } catch (error) {
      console.error('Error al crear curso:', error);
      res.status(500).json({ 
         error: 'Error al crear curso', 
         detalle: error.message 
      });
   }
});

app.get('/api/materias/:curso', async (req, res) => {
   const idCurso = req.params.curso;
   
   try {
      const materias = await ObtenerMateriasPorCurso(idCurso);
      res.json(materias);
   } catch (error) {
      console.error('Error al obtener materias:', error);
      res.status(500).json({ 
         error: 'Error al obtener materias', 
         detalle: error.message 
      });
   }
});

app.post('/api/materias', async (req, res) => {
   const { nombre, cursoId } = req.body;
   
   if (!ValidarDatosMateria(nombre, cursoId)) {
      return res.status(400).json({ 
         error: 'Faltan datos requeridos (nombre o curso)' 
      });
   }
   
   try {
      const result = await InsertarMateria(nombre, cursoId);
      res.status(201).json(result);
   } catch (error) {
      console.error('Error al crear materia:', error);
      res.status(500).json({ 
         error: 'Error al crear materia', 
         detalle: error.message 
      });
   }
});

function ValidarDatosCurso(anio, division, especialidad) {
   return anio && division && especialidad;
}

function ValidarDatosMateria(nombre, cursoId) {
   return nombre && cursoId;
}

function ValidarDatosEstudiante(nombre, apellido, materia) {
   return nombre && apellido && materia;
}

function ValidarDatosAsistencia(presencia, estudiante, materia, creado) {
   return presencia && estudiante && materia && creado;
}


async function CrearNuevoCurso(anio, division, especialidad) {
   const query = 'INSERT INTO cursos (anio, division, especialidad) VALUES (?, ?, ?)';
   const [result] = await connect.query(query, [anio, division, especialidad]);
   return result;
}

async function ObtenerMateriasPorCurso(idCurso) {
   const query = 'SELECT * FROM materias WHERE curso = ?';
   const [filas] = await connect.query(query, [idCurso]);
   return filas;
}

async function InsertarMateria(nombre, idCurso) {
   const query = 'INSERT INTO materias (nombre, curso) VALUES (?, ?)';
   const [result] = await connect.query(query, [nombre, idCurso]);
   return result;
}

async function BuscarEstudiantesPorMateria(idMateria) {
   const query = `
      SELECT estudiantes.id, estudiantes.nombre, estudiantes.apellido 
      FROM estudiantes 
      JOIN materias ON estudiantes.materia = materias.id 
      WHERE estudiantes.materia = ?
   `;
   const [filas] = await connect.query(query, [idMateria]);
   return filas;
}

async function RegistrarNuevoEstudiante(nombre, apellido, idMateria) {
   const query = 'INSERT INTO estudiantes (nombre, apellido, materia) VALUES (?, ?, ?)';
   const [result] = await connect.query(query, [nombre, apellido, idMateria]);
   return result;
}
async function VerificarAsistenciaExistente(id_estudiante, creado) {
   const query = `
      SELECT id 
      FROM asistencias
      WHERE estudiante = ? AND DATE(creado) = ?
   `;
   const [registros] = await connect.query(query, [id_estudiante, creado]);
   return registros.length > 0;
}

async function GuardarNuevaAsistencia(presencia, id_estudiante, idMateria, creado) {
   const query = `
      INSERT INTO asistencias (estudiante, presencia, creado)
      VALUES (?, ?, ?)
   `;
   const [result] = await connect.query(query, [id_estudiante, presencia, creado]);
   
   return {
      id: result.insertId,
      presencia: presencia,
      estudiante: id_estudiante,
      materia: idMateria
   };
}

async function queryAsistencias(idMateria, creado) {
   const query = `
      SELECT 
         asistencias.estudiante, 
         estudiantes.nombre, 
         estudiantes.apellido, 
         asistencias.id AS id, 
         asistencias.presencia, 
         asistencias.creado 
      FROM asistencias 
      JOIN estudiantes ON asistencias.estudiante = estudiantes.id 
      WHERE estudiantes.materia = ? AND DATE(creado) = ?
   `;
   const [filas] = await connect.query(query, [idMateria, creado]);
   return filas;
}

async function EliminarRegistroAsistencia(idAsistencia) {
   const query = 'DELETE FROM asistencias WHERE id = ?';
   const [result] = await connect.query(query, [idAsistencia]);
   return result.affectedRows > 0;
}

app.listen(3000, () => {
   console.log("Funciona en http://localhost:3000");
});