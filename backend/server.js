// nuevo/backend/server.js
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require('path')
const bodyParser = require("body-parser");
const municipioRoutes = require("./routes/municipioRoutes");
const authRoutes = require("./routes/authRoutes");
const testimoniosRoutes = require("./routes/testimoniosRoutes");
const archivos_municipioRoutes = require("./routes/archivos_municipioRoutes");
const documentos_cendocRoutes = require("./routes/documentos_cendocRoutes");
const { startCleanupScheduler } = require("./scripts/cleanup");
const revistasRoutes = require("./routes/revistasRoutes");
const articulosRoutes = require("./routes/articulosRoutes");


const app = express();
const PORT = 3000;

// ⚠️ IMPORTANTE: CORS debe ser lo primero y con configuración correcta
app.use(cors({
  origin: "http://localhost:4200", // tu frontend Angular
  credentials: true, // ⚠️ CRÍTICO para que las cookies funcionen
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ⚠️ IMPORTANTE: cookieParser ANTES de las rutas
app.use(cookieParser());

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging para debugging
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.path}`, {
    hasCookies: !!req.cookies && Object.keys(req.cookies).length > 0,
    cookies: Object.keys(req.cookies || {}),
    origin: req.headers.origin,
    credentials: req.headers.cookie ? 'yes' : 'no'
  });
  next();
});
// Middlewares
app.use(bodyParser.json()); // Parsear JSON
app.use(bodyParser.urlencoded({ extended: true })); // Parsear datos de formularios

//Carpeta public en proyecto Angular
const backendPublicPath = path.join(__dirname, 'public');
app.use('/public', express.static(backendPublicPath));

// Ruta de bienvenida
app.get("/", (req, res) => {
  res.json({
    message: "🚀 API REST con Node.js y Express (esto es desde el backend)",
    version: "2.0.0",
    status: "running",
    features: ["JWT con Access y Refresh Tokens", "Autenticación basada en cookies"],
    endpoints: {
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
        logout: "POST /api/auth/logout",
        refresh: "POST /api/auth/refresh",
        verify: "GET /api/auth/verify",
        profile: "GET /api/auth/profile (requiere token)",
      },
      municipios: {
        getAll: "GET /api/municipios (requiere token)",
        getById: "GET /api/municipios/:id (requiere token)",
        create: "POST /api/municipios (requiere token)",
        update: "PUT /api/municipios/:id (requiere token)",
        delete: "DELETE /api/municipios/:id (requiere token + rol admin)",
      },
    },
  });
});

// Rutas del API
app.use("/api/auth", authRoutes);
app.use("/api", documentos_cendocRoutes);
app.use("/api", archivos_municipioRoutes);
app.use("/api", municipioRoutes);
app.use("/api", testimoniosRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", revistasRoutes);
app.use("/api", articulosRoutes);

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Ruta no encontrada",
  });
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error('💥 Error en el servidor:', err.stack);
  res.status(500).json({
    success: false,
    message: "Error interno del servidor",
    error: err.message,
  });
});

// Iniciar el servidor
app.listen(PORT, async () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📡 API disponible en http://localhost:${PORT}/api`);
  console.log(`📚 Documentación en http://localhost:${PORT}/`);
  console.log(`🍪 CORS habilitado para: http://localhost:4200`);
  console.log(`${'='.repeat(60)}\n`);
  
  // 🆕 Iniciar limpiador automático de tokens expirados
  try {
    await startCleanupScheduler();
    console.log(`🧹 Sistema de limpieza de tokens iniciado\n`);
  } catch (error) {
    console.error('❌ Error al iniciar limpiador de tokens:', error.message);
  }
});

// Manejo de cierre graceful
process.on("SIGINT", async () => {
  console.log("\n⏹️  Cerrando servidor...");
  const { closeConnection } = require("./config/database");
  await closeConnection();
  process.exit(0);
});