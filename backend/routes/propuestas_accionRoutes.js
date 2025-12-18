const express = require("express");
const router = express.Router();
const Propuestas_accionController = require("../controllers/propuestas_accionController");
//autenticacion
const { authMiddleware, checkRole } = require("../middleware/authMiddleware");
const rateLimit = require("express-rate-limit");

// Rate limiter para usuarios públicos (Evitar spam de propuestas)
const publicPropuestaLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // Máximo 3 propuestas por IP por hora
  message: {
    success: false,
    message: "Demasiadas propuestas enviadas. Por favor intenta más tarde.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para lectura pública
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

// POST - Crear propuesta pública (CON RESTRICCIONES Y VALIDACIÓN)
router.post('/propuestas/publico',
  publicPropuestaLimiter,
  Propuestas_accionController.createPublico
);

// ========================================
// 🔒 RUTAS PROTEGIDAS (ADMINISTRADOR)
// ========================================

// GET - Obtener todos los registros
router.get("/propuestas", authMiddleware, Propuestas_accionController.getAll);

// GET - Obtener un registro por ID
router.get("/propuestas/:id", authMiddleware, Propuestas_accionController.getById);

// POST - Crear un nuevo registro
router.post("/propuestas", authMiddleware, Propuestas_accionController.create);

// PUT - Actualizar un registro
router.put("/propuestas/:id", authMiddleware, Propuestas_accionController.update);

// DELETE - Eliminar un registro
router.delete("/propuestas/:id", authMiddleware, Propuestas_accionController.delete);

module.exports = router;