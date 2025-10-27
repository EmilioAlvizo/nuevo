// nuevo/backend/models/userModel.js
const { getConnection, mssql } = require("../config/database");
const bcrypt = require("bcryptjs");

class UserModel {
  // Crear usuario
  static async create(userData) {
    try {
      const pool = await getConnection();
      
      // Hashear password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const result = await pool
        .request()
        .input("nombre", mssql.NVarChar, userData.nombre)
        .input("email", mssql.NVarChar, userData.email)
        .input("password", mssql.NVarChar, hashedPassword)
        .input("rol", mssql.NVarChar, userData.rol || 'usuario')
        .query(`
          INSERT INTO Usuarios (nombre, email, password, rol) 
          OUTPUT INSERTED.id, INSERTED.nombre, INSERTED.email, INSERTED.rol
          VALUES (@nombre, @email, @password, @rol)
        `);

      return result.recordset[0];
    } catch (error) {
      if (error.number === 2627) {
        throw new Error("El email ya está registrado");
      }
      throw new Error(`Error al crear usuario: ${error.message}`);
    }
  }

  // Buscar usuario por email
  static async findByEmail(email) {
    try {
      const pool = await getConnection();
      const result = await pool
        .request()
        .input("email", mssql.NVarChar, email)
        .query("SELECT * FROM Usuarios WHERE email = @email AND activo = 1");

      return result.recordset[0];
    } catch (error) {
      throw new Error(`Error al buscar usuario: ${error.message}`);
    }
  }

  // Buscar usuario por ID
  static async findById(id) {
    try {
      const pool = await getConnection();
      const result = await pool
        .request()
        .input("id", mssql.Int, id)
        .query("SELECT id, nombre, email, rol, fecha_registro FROM Usuarios WHERE id = @id AND activo = 1");

      return result.recordset[0];
    } catch (error) {
      throw new Error(`Error al buscar usuario: ${error.message}`);
    }
  }

  // Verificar password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // 🆕 Guardar refresh token
  static async saveRefreshToken(userId, refreshToken) {
    try {
      const pool = await getConnection();
      
      // Guardar el token con fecha de expiración
      await pool
        .request()
        .input("userId", mssql.Int, userId)
        .input("refreshToken", mssql.NVarChar, refreshToken)
        .input("expiresAt", mssql.DateTime, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) // 7 días
        .query(`
          INSERT INTO RefreshTokens (user_id, token, expires_at)
          VALUES (@userId, @refreshToken, @expiresAt)
        `);

      return true;
    } catch (error) {
      throw new Error(`Error al guardar refresh token: ${error.message}`);
    }
  }

  // 🆕 Verificar si el refresh token existe y es válido
  static async findRefreshToken(refreshToken) {
    try {
      const pool = await getConnection();
      const result = await pool
        .request()
        .input("refreshToken", mssql.NVarChar, refreshToken)
        .query(`
          SELECT rt.*, u.id, u.nombre, u.email, u.rol
          FROM RefreshTokens rt
          INNER JOIN Usuarios u ON rt.user_id = u.id
          WHERE rt.token = @refreshToken 
            AND rt.revoked = 0 
            AND rt.expires_at > GETDATE()
            AND u.activo = 1
        `);

      return result.recordset[0];
    } catch (error) {
      throw new Error(`Error al buscar refresh token: ${error.message}`);
    }
  }

  // 🆕 Revocar refresh token (al hacer logout)
  static async revokeRefreshToken(refreshToken) {
    try {
      const pool = await getConnection();
      await pool
        .request()
        .input("refreshToken", mssql.NVarChar, refreshToken)
        .query("UPDATE RefreshTokens SET revoked = 1 WHERE token = @refreshToken");

      return true;
    } catch (error) {
      throw new Error(`Error al revocar refresh token: ${error.message}`);
    }
  }

  // 🆕 Revocar todos los tokens de un usuario
  static async revokeAllUserTokens(userId) {
    try {
      const pool = await getConnection();
      await pool
        .request()
        .input("userId", mssql.Int, userId)
        .query("UPDATE RefreshTokens SET revoked = 1 WHERE user_id = @userId");

      return true;
    } catch (error) {
      throw new Error(`Error al revocar tokens del usuario: ${error.message}`);
    }
  }

  // 🆕 Limpiar tokens expirados (ejecutar periódicamente)
  static async cleanExpiredTokens() {
    try {
      const pool = await getConnection();
      const result = await pool
        .request()
        .query("DELETE FROM RefreshTokens WHERE expires_at < GETDATE()");

      return result.rowsAffected[0];
    } catch (error) {
      throw new Error(`Error al limpiar tokens expirados: ${error.message}`);
    }
  }

  // Obtener todos los usuarios (solo admin)
  static async getAll() {
    try {
      const pool = await getConnection();
      const result = await pool
        .request()
        .query("SELECT id, nombre, email, rol, activo, fecha_registro FROM Usuarios ORDER BY fecha_registro DESC");

      return result.recordset;
    } catch (error) {
      throw new Error(`Error al obtener usuarios: ${error.message}`);
    }
  }

  // Actualizar usuario
  static async update(id, userData) {
    try {
      const pool = await getConnection();
      
      let query = "UPDATE Usuarios SET nombre = @nombre, email = @email";
      const request = pool.request()
        .input("id", mssql.Int, id)
        .input("nombre", mssql.NVarChar, userData.nombre)
        .input("email", mssql.NVarChar, userData.email);

      if (userData.password) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        query += ", password = @password";
        request.input("password", mssql.NVarChar, hashedPassword);
      }

      query += " WHERE id = @id";
      await request.query(query);

      return await this.findById(id);
    } catch (error) {
      throw new Error(`Error al actualizar usuario: ${error.message}`);
    }
  }

  // Eliminar usuario (soft delete)
  static async delete(id) {
    try {
      const pool = await getConnection();
      await pool
        .request()
        .input("id", mssql.Int, id)
        .query("UPDATE Usuarios SET activo = 0 WHERE id = @id");

      return { message: "Usuario eliminado exitosamente", id };
    } catch (error) {
      throw new Error(`Error al eliminar usuario: ${error.message}`);
    }
  }
}

module.exports = UserModel;