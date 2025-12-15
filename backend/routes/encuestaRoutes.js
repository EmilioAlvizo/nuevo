// nuevo/backend/routes/encuestaRoutes.js
const express = require("express");
const router = express.Router();
const EncuestaController = require("../controllers/encuestaController");
const multer = require("multer");
const upload = multer();
const rateLimit = require("express-rate-limit");
const { authMiddleware } = require("../middleware/authMiddleware");

const encuestaLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20, // máximo 20 votos por minuto desde la misma IP
});

// Encuesta activa
router.get("/activa", EncuestaController.obtenerActiva);

// CRUD
router.get("/", EncuestaController.listar);
router.get("/:id", EncuestaController.obtener);
router.post("/", authMiddleware, upload.none(), EncuestaController.crear);
router.put("/:id", authMiddleware, upload.none(), EncuestaController.actualizar);
router.delete("/:id", authMiddleware, EncuestaController.eliminar);

// Votar
router.post("/:idEncuesta/votar/:idOpcion", encuestaLimiter, EncuestaController.votar);

module.exports = router;
