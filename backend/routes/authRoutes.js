// nuevo/backend/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/authController");
const { authMiddleware } = require("../middleware/authMiddleware");

// Rutas públicas (sin autenticación)
router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/logout", AuthController.logout);
router.get("/verify", AuthController.verify);

// 🆕 Ruta para refrescar el access token
router.post("/refresh", AuthController.refresh);

// Rutas protegidas (requieren autenticación)
router.get("/profile", authMiddleware, AuthController.getProfile);

module.exports = router;