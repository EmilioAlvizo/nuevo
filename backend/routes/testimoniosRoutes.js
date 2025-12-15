// nuevo/backend/routes/testimoniosRoutes.js

const express = require("express");
const router = express.Router();
const TestimoniosController = require("../controllers/testimoniosController");
const { crearUpload } = require("../middleware/uploadMiddleware");
const { authMiddleware, checkRole } = require("../middleware/authMiddleware");
const rateLimit = require("express-rate-limit");

const uploadTestimonio = crearUpload("testimonios", {
  imagen: ["image/*"],
});

// Rate limiter para usuarios públicos (MÁS RESTRICTIVO)
const publicTestimonioLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // Máximo 3 testimonios por IP por hora
  message: {
    success: false,
    message: "Demasiados testimonios enviados. Por favor intenta más tarde.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para lectura (más permisivo)
const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 peticiones por IP
  message: {
    success: false,
    message: 'Demasiadas peticiones. Intenta de nuevo en unos minutos.'
  }
});

// ========================================
// 🌐 RUTAS PÚBLICAS (sin autenticación)
// ========================================

// GET - Obtener testimonios activos (solo los aprobados)
router.get("/testimonios/publico",
  readLimiter,
  TestimoniosController.getPublicos
);

// POST - Crear testimonio público (CON RESTRICCIONES)
router.post('/testimonios/publico',
  publicTestimonioLimiter,
  uploadTestimonio.fields([
    { name: 'imagenT', maxCount: 1 }
  ]),
  TestimoniosController.createPublico
);


// GET - Obtener todos los registros
router.get("/testimonios", TestimoniosController.getAll);

// GET - Obtener un registro por ID
router.get("/testimonios/:id", TestimoniosController.getById);

//POST - Crear registro
router.post(
  "/testimonios",
  authMiddleware,
  uploadTestimonio.fields([{ name: "imagenT", maxCount: 1 }]),
  TestimoniosController.create
);

//PUT - Actualizar registro
router.put(
  "/testimonios/:id",
  authMiddleware,
  uploadTestimonio.fields([{ name: "imagenT", maxCount: 1 }]),
  TestimoniosController.update
);

// DELETE - Eliminar un registro
router.delete("/testimonios/:id", authMiddleware, TestimoniosController.delete);

module.exports = router;
