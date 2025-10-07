const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const itemRoutes = require("./routes/itemRoutes");

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors()); // Permitir peticiones desde el frontend
app.use(bodyParser.json()); // Parsear JSON
app.use(bodyParser.urlencoded({ extended: true })); // Parsear datos de formularios

// Ruta de bienvenida
app.get("/", (req, res) => {
  res.json({
    message: "🚀 API REST con Node.js y Express (esto es desde el backend)",
    version: "1.0.0",
    endpoints: {
      getAll: "GET /api/items",
      getById: "GET /api/items/:id",
      create: "POST /api/items",
      update: "PUT /api/items/:id",
      delete: "DELETE /api/items/:id",
    },
  });
});

// Rutas del API
app.use("/api", itemRoutes);

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Ruta no encontrada",
  });
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Error interno del servidor",
    error: err.message,
  });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📡 API disponible en http://localhost:${PORT}/api`);
  console.log(`📚 Documentación en http://localhost:${PORT}/\n`);
});

// Manejo de cierre graceful
process.on("SIGINT", async () => {
  console.log("\n⏹️  Cerrando servidor...");
  const { closeConnection } = require("./config/database");
  await closeConnection();
  process.exit(0);
});