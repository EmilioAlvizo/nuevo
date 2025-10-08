const UserModel = require("../models/userModel");
const { generateToken } = require("../config/jwt");

class AuthController {
  // Registro de usuario
  static async register(req, res) {
    try {
      const { nombre, email, password, confirmPassword } = req.body;

      // Validaciones
      if (!nombre || !email || !password) {
        return res.status(400).json({
          success: false,
          message: "Todos los campos son obligatorios"
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: "Las contraseñas no coinciden"
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "La contraseña debe tener al menos 6 caracteres"
        });
      }

      // Verificar si el email ya existe
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "El email ya está registrado"
        });
      }

      // Crear usuario
      const newUser = await UserModel.create({ nombre, email, password });

      // Generar token
      const token = generateToken(newUser);

      res.status(201).json({
        success: true,
        message: "Usuario registrado exitosamente",
        data: {
          user: {
            id: newUser.id,
            nombre: newUser.nombre,
            email: newUser.email,
            rol: newUser.rol
          },
          token
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
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
          message: "Email y contraseña son obligatorios"
        });
      }

      // Buscar usuario
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Credenciales inválidas"
        });
      }

      // Verificar contraseña
      const isPasswordValid = await UserModel.verifyPassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Credenciales inválidas"
        });
      }

      // Generar token
      const token = generateToken(user);

      res.status(200).json({
        success: true,
        message: "Login exitoso",
        data: {
          user: {
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol
          },
          token
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
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
          message: "Usuario no encontrado"
        });
      }

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
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
          user: req.user
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = AuthController;