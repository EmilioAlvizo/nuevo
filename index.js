/*const http = require('node:http');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello, World!\n');
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
}); */





const express = require('express');
const Municipios = require('./models/Municipios');

const app = express();
const port = 3000;

// Configuración DB
const dbConfig = { 
  host: 'localhost',
  user: 'root',
  password: 'tu_password',
  database: 'tu_bd'
};

const municipios = new Municipios(dbConfig);

// Ruta para todos los municipios
app.get('/municipios', async (req, res) => {
  try {
    const rows = await municipios.obtenerTodosMunicipios();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});