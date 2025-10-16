const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const municipioRoutes = require("./routes/municipioRoutes");
const authRoutes = require("./routes/authRoutes");
const testimoniosRoutes = require("./routes/testimoniosRoutes");
const archivos_municipioRoutes = require("./routes/archivos_municipioRoutes");
const documentos_cendocRoutes = require("./routes/documentos_cendocRoutes");

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
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
        profile: "GET /api/auth/profile (requiere token)",
        verify: "GET /api/auth/verify (requiere token)"
      },
      municipios: {
        getAll: "GET /api/municipios (requiere token)",
        getById: "GET /api/municipios/:id (requiere token)",
        create: "POST /api/municipios (requiere token)",
        update: "PUT /api/municipios/:id (requiere token)",
        delete: "DELETE /api/municipios/:id (requiere token + rol admin)"
      }
    },
  });
});

// Rutas del API
app.use("/api", documentos_cendocRoutes);
app.use("/api", archivos_municipioRoutes);
app.use("/api", municipioRoutes);
app.use("/api", testimoniosRoutes);
app.use("/api/auth", authRoutes);

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