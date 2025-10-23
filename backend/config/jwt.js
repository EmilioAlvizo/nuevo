// nuevo/backend/config/jwt.js
// esto es para autenticación y autorización con registro y login
const jwt = require('jsonwebtoken');

// Clave secreta (en producción usa variables de entorno)
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_super_secreta_cambiala_en_produccion';
const JWT_EXPIRES_IN = '24h'; // Token expira en 24 horas

// Generar token
const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    nombre: user.nombre,
    rol: user.rol
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Verificar token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  generateToken,
  verifyToken
};