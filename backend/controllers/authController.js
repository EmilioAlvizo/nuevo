// nuevo/backend/controllers/authController.js
const UserModel = require("../models/userModel");
const {
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
} = require("../config/jwt");
const { getConnection, mssql } = require("../config/database");

class AuthController {
  // Configurar cookies de tokens
  static setTokenCookies(res, accessToken, refreshToken) {
    const isProduction = process.env.NODE_ENV === "production";

    // Cookie para Access Token (15 minutos)
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 15 * 60 * 1000, // 15 minutos
    });

    // Cookie para Refresh Token (7 días)
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });

    /* console.log("🍪 [AUTH] Cookies configuradas:", {
      accessToken: accessToken.substring(0, 20) + "...",
      refreshToken: refreshToken.substring(0, 20) + "...",
    }); */
  }

  // Registro de usuario
  static async register(req, res) {
    try {
      const pool = await getConnection();
      const { nombre, email, password, confirmPassword } = req.body;

      // Validaciones
      if (!nombre || !email || !password) {
        return res.status(400).json({
          success: false,
          message: "Todos los campos son obligatorios",
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: "Las contraseñas no coinciden",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "La contraseña debe tener al menos 6 caracteres",
        });
      }

      // Verificar si el email está autorizado
      const result = await pool
        .request()
        .input("email", email.toLowerCase().trim())
        .query(
          "SELECT * FROM authorized_emails WHERE email = @email AND used = 0"
        );

      if (!result.recordset || result.recordset.length === 0) {
        return res.status(403).json({
          success: false,
          message:
            "Este email no está autorizado para registrarse. Contacta al administrador.",
        });
      }

      // Verificar si el email ya existe
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "El email ya está registrado",
        });
      }

      // Crear usuario
      const newUser = await UserModel.create({ nombre, email, password });

      // Marcar el email autorizado como usado
      await pool
        .request()
        .input("email", email.toLowerCase().trim())
        .query(
          "UPDATE authorized_emails SET used = 1, used_at = GETDATE() WHERE email = @email"
        );

      // Generar tokens
      const { accessToken, refreshToken } = generateTokens(newUser);

      // Guardar refresh token en la base de datos
      await UserModel.saveRefreshToken(newUser.id, refreshToken);

      // Enviar cookies
      AuthController.setTokenCookies(res, accessToken, refreshToken);

      res.status(201).json({
        success: true,
        message: "Usuario registrado exitosamente",
        data: {
          user: {
            id: newUser.id,
            nombre: newUser.nombre,
            email: newUser.email,
            rol: newUser.rol,
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Login de usuario
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validaciones
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email y contraseña son obligatorios",
        });
      }

      // Buscar usuario
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Credenciales inválidas",
        });
      }

      // Verificar contraseña
      const isPasswordValid = await UserModel.verifyPassword(
        password,
        user.password
      );

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Credenciales inválidas",
        });
      }

      // Generar tokens
      const { accessToken, refreshToken } = generateTokens(user);

      // Guardar refresh token en la base de datos
      await UserModel.saveRefreshToken(user.id, refreshToken);

      // Enviar cookies
      AuthController.setTokenCookies(res, accessToken, refreshToken);

      res.status(200).json({
        success: true,
        message: "Login exitoso",
        data: {
          user: {
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol,
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // 🆕 Refrescar Access Token usando Refresh Token
  static async refresh(req, res) {
    try {
      //console.log("🔄 [REFRESH] Iniciando refresh de tokens...");
      //console.log("🍪 [REFRESH] Cookies recibidas:", Object.keys(req.cookies));

      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        //console.log("❌ [REFRESH] No hay refresh token en cookies");
        return res.status(401).json({
          success: false,
          message: "Refresh token no proporcionado",
        });
      }

      // Verificar el refresh token
      const decoded = verifyRefreshToken(refreshToken);

      if (!decoded) {
        //console.log("❌ [REFRESH] Token inválido o expirado");
        return res.status(401).json({
          success: false,
          message: "Refresh token inválido o expirado",
        });
      }

      // Verificar que el token existe en la base de datos y no ha sido revocado
      const tokenData = await UserModel.findRefreshToken(refreshToken);

      if (!tokenData) {
        //console.log("❌ [REFRESH] Token no encontrado en BD");
        return res.status(401).json({
          success: false,
          message: "Refresh token no válido",
        });
      }

      // Crear nuevo access token
      const user = {
        id: tokenData.id,
        email: tokenData.email,
        nombre: tokenData.nombre,
        rol: tokenData.rol,
      };

      const { accessToken, refreshToken: newRefreshToken } =
        generateTokens(user);

      // Revocar el refresh token anterior
      await UserModel.revokeRefreshToken(refreshToken);

      // Guardar el nuevo refresh token
      await UserModel.saveRefreshToken(user.id, newRefreshToken);

      // Enviar nuevas cookies
      AuthController.setTokenCookies(res, accessToken, newRefreshToken);

      //console.log("✅ [REFRESH] Tokens renovados exitosamente para:", user.email);

      res.status(200).json({
        success: true,
        message: "Token renovado exitosamente",
        data: {
          user,
        },
      });
    } catch (error) {
      console.error("❌ [REFRESH] Error:", error.message);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Obtener perfil del usuario autenticado
  static async getProfile(req, res) {
    try {
      const user = await UserModel.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
      }

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ✅ MEJORADO: Verificar si hay sesión activa
  static async verify(req, res) {
    try {
      // 🔍 Debug: Ver qué cookies llegan
      //console.log("🔍 [VERIFY] Headers recibidos:");
      //console.log("  - Origin:", req.headers.origin);
      //console.log("  - Cookie header:", req.headers.cookie ? "✅ Presente" : "❌ Ausente");
      //console.log("🔍 [VERIFY] Cookies parseadas por cookieParser:", Object.keys(req.cookies));
      /* console.log("🔍 [VERIFY] Valores:", {
        hasAccessToken: !!req.cookies.accessToken,
        hasRefreshToken: !!req.cookies.refreshToken,
      }); */

      const accessToken = req.cookies.accessToken;
      const refreshToken = req.cookies.refreshToken;

      // Si no hay accessToken
      if (!accessToken) {
        //console.log("❌ [VERIFY] No hay accessToken");
        
        // Verificar si hay refresh token para indicar si puede refrescar
        if (refreshToken) {
          //console.log("⚠️  [VERIFY] Hay refreshToken, cliente debe refrescar");
          return res.status(401).json({
            success: false,
            message: "Token de acceso expirado",
            code: "TOKEN_EXPIRED",
            needsRefresh: true,
          });
        }

        //console.log("🚫 [VERIFY] No hay tokens, sesión inválida");
        return res.status(401).json({
          success: false,
          message: "No hay token de acceso",
          code: "NO_TOKEN",
          needsRefresh: false,
        });
      }

      // Verificar el accessToken
      const decoded = verifyAccessToken(accessToken);

      if (!decoded) {
        //console.log("❌ [VERIFY] AccessToken inválido o expirado");
        
        // Verificar si hay refresh token
        const hasRefreshToken = !!refreshToken;
        
        return res.status(401).json({
          success: false,
          message: "Token expirado",
          code: "TOKEN_EXPIRED",
          needsRefresh: hasRefreshToken,
        });
      }

      // ✅ Verificar que el usuario aún existe en la BD
      const user = await UserModel.findById(decoded.id);
      if (!user) {
        //console.log("❌ [VERIFY] Usuario no encontrado en BD");
        return res.status(401).json({
          success: false,
          message: "Usuario no encontrado",
          code: "USER_NOT_FOUND",
        });
      }

      //console.log("✅ [VERIFY] Token válido para:", user.email);

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: decoded.id,
            nombre: decoded.nombre,
            email: decoded.email,
            rol: decoded.rol,
          },
        },
      });
    } catch (error) {
      console.error("💥 [VERIFY] Error inesperado:", error.message);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        code: "SERVER_ERROR",
      });
    }
  }

  // Cerrar sesión
  static async logout(req, res) {
    try {
      const refreshToken = req.cookies.refreshToken;

      // Revocar el refresh token si existe
      if (refreshToken) {
        await UserModel.revokeRefreshToken(refreshToken);
      }

      // Limpiar cookies
      res.clearCookie("accessToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      //console.log("👋 [LOGOUT] Sesión cerrada exitosamente");

      res.status(200).json({
        success: true,
        message: "Sesión cerrada exitosamente",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = AuthController;