// nuevo/backend/config/jwt.js
const jwt = require('jsonwebtoken');

// Claves secretas (en producción usa variables de entorno diferentes)
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'tu_clave_access_token_super_secreta';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'tu_clave_refresh_token_super_secreta';

const ACCESS_TOKEN_EXPIRES_IN = '30s'; // 15 minutos
const REFRESH_TOKEN_EXPIRES_IN = '7d'; // 7 días

// Generar Access Token
const generateAccessToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    nombre: user.nombre,
    rol: user.rol
  };

  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
};

// Generar Refresh Token
const generateRefreshToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email
  };

  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
};

// Verificar Access Token
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_ACCESS_SECRET);
  } catch (error) {
    return null;
  }
};

// Verificar Refresh Token
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
};

// Generar ambos tokens
const generateTokens = (user) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  
  return { accessToken, refreshToken };
};

module.exports = {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokens
};