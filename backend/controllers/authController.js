//nuevo/backend/controllers/authController.js
const UserModel = require("../models/userModel");
const { generateToken, verifyToken } = require("../config/jwt");
const { getConnection, mssql } = require("../config/database");

class AuthController {
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

      // ⭐ VERIFICAR si el email está autorizado (ajustado para SQL Server)
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
            "Este email no está autorizado para registrarse. Contacta al administrador para solicitar acceso.",
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

      // ⭐ Marcar el email autorizado como usado (ajustado para SQL Server)
      await pool
        .request()
        .input("email", email.toLowerCase().trim())
        .query(
          "UPDATE authorized_emails SET used = 1, used_at = GETDATE() WHERE email = @email"
        );

      // Generar token
      const token = generateToken(newUser);

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // true solo en producción
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000, // 24 horas
      });

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
        console.log("no se encontro email");
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
      console.log("password ", password);
      console.log("user.password ", user.password);
      if (!isPasswordValid) {
        console.log("error en la contraseña");
        return res.status(401).json({
          success: false,
          message: "Credenciales inválidas",
        });
      }

      // Generar token
      const token = generateToken(user);

      // ✅ Enviar token como cookie HTTP-only
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
      });

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

  // Verificar token
  static async verifyToken(req, res) {
    try {
      res.status(200).json({
        success: true,
        message: "Token válido",
        data: {
          user: req.user,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ✅ Verificar si hay sesión activa
  static async verify(req, res) {
    try {
      const token = req.cookies.token;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "No hay token",
        });
      }

      const decoded = verifyToken(token);

      if (!decoded) {
        return res.status(401).json({
          success: false,
          message: "Token inválido o expirado",
        });
      }

      res.status(200).json({
        success: true,
        data: {
          user: decoded,
        },
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ✅ Cerrar sesión (elimina cookie)
  static async logout(req, res) {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    res.status(200).json({
      success: true,
      message: "Sesión cerrada",
    });
  }
}

module.exports = AuthController;
