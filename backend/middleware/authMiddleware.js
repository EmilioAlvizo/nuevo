// nuevo/backend/middleware/authMiddleware.js
const { verifyToken } = require("../config/jwt");

// Middleware para verificar token
const authMiddleware = (req, res, next) => {
  try {
    // Obtener token desde cookie (no desde headers)
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token no proporcionado en la cookie",
      });
    }

    // Verificar token
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Token inválido o expirado",
      });
    }

    // Adjuntar información del usuario al request
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error al verificar token",
      error: error.message,
    });
  }
};

// Middleware para verificar roles
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    if (!allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para acceder a este recurso",
      });
    }

    next();
  };
};

module.exports = {
  authMiddleware,
  checkRole,
};
