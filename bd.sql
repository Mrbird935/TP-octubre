CREATE DATABASE escuela;
USE escuela;


CREATE TABLE cursos(
   id INT auto_increment PRIMARY KEY,
   anio INT NOT NULL,
   division INT NOT NULL,
   especialidad VARCHAR(255));


CREATE TABLE materias(
   id INT auto_increment PRIMARY KEY,
   nombre VARCHAR (255),
   curso INT, 
   FOREIGN KEY (curso) REFERENCES cursos(id));


CREATE TABLE estudiantes(
   id INT auto_increment PRIMARY KEY,
   nombre VARCHAR (255),
   apellido VARCHAR (255),
   materia INT, 
   FOREIGN KEY (materia) REFERENCES materias(id));


CREATE TABLE asistencias(
   id INT auto_increment PRIMARY KEY,
   estudiante INT NOT NULL,
   presencia ENUM("P","T","A","AP","RA"),
   creado DATETIME DEFAULT (current_date),
   FOREIGN KEY (estudiante) REFERENCES estudiantes(id));
