const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/authController");
const { authMiddleware } = require("../middleware/authMiddleware");

// Rutas públicas (sin autenticación)
router.post("/register", AuthController.register);
router.post("/login", AuthController.login);

// Rutas protegidas (requieren autenticación)
router.get("/profile", authMiddleware, AuthController.getProfile);
router.get("/verify", authMiddleware, AuthController.verifyToken);

module.exports = router;