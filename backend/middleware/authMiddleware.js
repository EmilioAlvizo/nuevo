// nuevo/backend/middleware/authMiddleware.js
const { verifyAccessToken } = require("../config/jwt");

// ✅ Middleware simple: SOLO verifica el token, NO lo renueva
const authMiddleware = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        message: "No autorizado - Token requerido",
      });
    }

    // Verificar token
    const decoded = verifyAccessToken(accessToken);

    if (!decoded) {
      // Token expirado o inválido
      return res.status(401).json({
        success: false,
        message: "Token expirado o inválido",
      });
    }

    // Token válido - adjuntar usuario al request
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error al verificar autenticación",
      error: error.message,
    });
  }
};

// ✅ Middleware para verificar rol de administrador
const adminMiddleware = (req, res, next) => {
  // Primero verifica que el usuario esté autenticado
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "No autorizado",
    });
  }

  // Luego verifica el rol
  if (req.user.rol !== 'admin') {
    return res.status(403).json({
      success: false,
      message: "Acceso denegado - Se requiere rol de administrador",
    });
  }

  next();
};

module.exports = {
  authMiddleware,
  adminMiddleware,
};