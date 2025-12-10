// nuevo/backend/server.js
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const municipioRoutes = require("./routes/municipioRoutes");
const categorias_cendocRoutes = require("./routes/categorias_cendocRoutes");
const authRoutes = require("./routes/authRoutes");
const testimoniosRoutes = require("./routes/testimoniosRoutes");
const archivos_municipioRoutes = require("./routes/archivos_municipioRoutes");
const documentos_cendocRoutes = require("./routes/documentos_cendocRoutes");
const revistasRoutes = require("./routes/revistasRoutes");
const articulosRoutes = require("./routes/articulosRoutes");
const documentos_fisicosRoutes = require("./routes/documentos_fisicosRoutes");
const temas_interesRoutes = require("./routes/temas_interesRoutes");
const propuesta_accionRoutes = require("./routes/propuestas_accionRoutes");
const banco_datosRoutes = require("./routes/banco_datosRoutes");
const consejoRoutes = require("./routes/consejoRoutes");
const directoriosRoutes = require("./routes/directoriosRoutes");
const apoyos_serviciosRoutes = require("./routes/apoyos_serviciosRoutes");
const authorized_emailsRoutes = require("./routes/authorized_emailsRoutes");
const encuestaRoutes = require("./routes/encuestaRoutes");
const interfazRoutes = require("./routes/interfazRoutes");

const { startCleanupScheduler } = require("./scripts/cleanup");
const Propuestas_accionController = require("./controllers/propuestas_accionController");

const app = express();
const PORT = 3000;

// ⚠️ IMPORTANTE: CORS debe ser lo primero y con configuración correcta
app.use(cors({
  origin: "http://localhost:4200", // tu frontend Angular
  //origin: "https://hnd2r2hj-4200.usw3.devtunnels.ms", // tu frontend Angular
  credentials: true, // ⚠️ CRÍTICO para que las cookies funcionen
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
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
app.use("/api/documentos_cendoc", documentos_cendocRoutes);
app.use("/api/archivos_municipio", archivos_municipioRoutes);
app.use("/api/encuestas", encuestaRoutes);
app.use("/api", municipioRoutes);
app.use("/api", categorias_cendocRoutes);
app.use("/api", testimoniosRoutes);
app.use("/api", revistasRoutes);
app.use("/api", articulosRoutes);
app.use("/api", documentos_fisicosRoutes);
app.use("/api", temas_interesRoutes);
app.use("/api", propuesta_accionRoutes);
app.use("/api", banco_datosRoutes);
app.use("/api", consejoRoutes);
app.use("/api", directoriosRoutes);
app.use("/api", apoyos_serviciosRoutes);
app.use("/api/authorized-emails", authorized_emailsRoutes);
app.use("/api", interfazRoutes);
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// Manejo de rutas no encontradas
app.use((req, res) => {
  // Si la solicitud es para un archivo estático (imagenes, PDF, etc)
  if (req.path.startsWith('/public')) {
    return res.status(404).end(); // ❗ sin JSON, sin texto
  }

  res.status(404).json({
    success: false,
    message: "Ruta no encontrada",
  });
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error('💥 Error en el servidor:', err.stack);
  console.error('req:', req.stack);
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