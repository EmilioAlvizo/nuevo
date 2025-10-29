// nuevo/backend/models/userModel.js
const { getConnection, mssql } = require("../config/database");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

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
        .input("rol", mssql.NVarChar, userData.rol || "usuario").query(`
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
        .query(
          "SELECT id, nombre, email, rol, fecha_registro FROM Usuarios WHERE id = @id AND activo = 1"
        );

      return result.recordset[0];
    } catch (error) {
      throw new Error(`Error al buscar usuario: ${error.message}`);
    }
  }

  // Verificar password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // ✅ ACTUALIZADO: Guardar refresh token (con hash para seguridad)
  static async saveRefreshToken(userId, refreshToken) {
    try {
      console.log("💾 [MODEL] Guardando refresh token...");
      console.log("💾 [MODEL] User ID:", userId);
      console.log(
        "💾 [MODEL] Token (primeros 30 chars):",
        refreshToken.substring(0, 30) + "..."
      );

      const pool = await getConnection();

      // ✅ Hashear el token antes de guardarlo (seguridad)
      const tokenHash = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");

      console.log(
        "💾 [MODEL] Token hash (primeros 30 chars):",
        tokenHash.substring(0, 30) + "..."
      );

      // Calcular fecha de expiración (7 días)
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      console.log("💾 [MODEL] Expira en:", expiresAt.toISOString());

      // ✅ Guardar el HASH del token, no el token completo
      const result = await pool
        .request()
        .input("userId", mssql.Int, userId)
        .input("tokenHash", mssql.NVarChar, tokenHash)
        .input("expiresAt", mssql.DateTime, expiresAt).query(`
          INSERT INTO RefreshTokens (user_id, token, expires_at)
          VALUES (@userId, @tokenHash, @expiresAt);
          SELECT SCOPE_IDENTITY() AS id;
        `);

      const insertedId = result.recordset[0].id;
      console.log("✅ [MODEL] Token guardado con ID:", insertedId);

      // 🔍 Verificar que se guardó correctamente
      const verification = await pool
        .request()
        .input("tokenHash", mssql.NVarChar, tokenHash)
        .query(
          "SELECT id, user_id FROM RefreshTokens WHERE token = @tokenHash"
        );

      if (verification.recordset.length > 0) {
        console.log(
          "✅ [MODEL] Verificación exitosa - Token hash encontrado en BD"
        );
      } else {
        console.error(
          "❌ [MODEL] ADVERTENCIA: Token hash no encontrado después de guardar"
        );
      }

      return true;
    } catch (error) {
      console.error("❌ [MODEL] Error guardando refresh token:", error);
      throw new Error(`Error al guardar refresh token: ${error.message}`);
    }
  }

  // ✅ ACTUALIZADO: Verificar si el refresh token existe y es válido
  static async findRefreshToken(refreshToken) {
    try {
      console.log("🔍 [MODEL] Buscando refresh token...");
      console.log(
        "🔍 [MODEL] Token (primeros 30 chars):",
        refreshToken.substring(0, 30) + "..."
      );

      const pool = await getConnection();

      // ✅ Hashear el token para buscarlo
      const tokenHash = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");

      console.log(
        "🔍 [MODEL] Token hash (primeros 30 chars):",
        tokenHash.substring(0, 30) + "..."
      );

      // 🔍 Contar tokens activos
      const countResult = await pool
        .request()
        .query("SELECT COUNT(*) as total FROM RefreshTokens WHERE revoked = 0");
      console.log(
        "🔍 [MODEL] Total de tokens activos en BD:",
        countResult.recordset[0].total
      );

      // Buscar el token por su hash
      const result = await pool
        .request()
        .input("tokenHash", mssql.NVarChar, tokenHash).query(`
          SELECT 
            rt.id as token_id,
            rt.user_id,
            rt.token,
            rt.expires_at,
            rt.created_at,
            rt.revoked,
            u.id as id,
            u.nombre,
            u.email,
            u.rol
          FROM RefreshTokens rt
          INNER JOIN Usuarios u ON rt.user_id = u.id
          WHERE rt.token = @tokenHash 
            AND rt.revoked = 0 
            AND rt.expires_at > GETDATE()
            AND u.activo = 1
        `);

      if (result.recordset.length === 0) {
        console.log("❌ [MODEL] Token no encontrado");

        // 🔍 Debug: Buscar sin restricciones
        const debugResult = await pool
          .request()
          .input("tokenHash", mssql.NVarChar, tokenHash)
          .query("SELECT * FROM RefreshTokens WHERE token = @tokenHash");

        if (debugResult.recordset.length > 0) {
          const token = debugResult.recordset[0];
          console.log("🔍 [MODEL] Token encontrado pero:");
          console.log("   - Revoked:", token.revoked);
          console.log("   - Expires at:", token.expires_at);
          console.log("   - Now:", new Date());
        } else {
          console.log("❌ [MODEL] Token hash no existe en BD");

          // Mostrar últimos 3 tokens
          const recentTokens = await pool.request().query(`
            SELECT TOP 3 
              id, 
              user_id, 
              LEFT(token, 50) as token_preview,
              created_at,
              revoked
            FROM RefreshTokens 
            ORDER BY created_at DESC
          `);
          console.log(
            "🔍 [MODEL] Últimos 3 tokens en BD:",
            recentTokens.recordset
          );
        }

        return null;
      }

      console.log(
        "✅ [MODEL] Token encontrado para usuario:",
        result.recordset[0].email
      );
      return result.recordset[0];
    } catch (error) {
      console.error("❌ [MODEL] Error buscando refresh token:", error);
      throw new Error(`Error al buscar refresh token: ${error.message}`);
    }
  }

  // ✅ ACTUALIZADO: Revocar refresh token
  static async revokeRefreshToken(refreshToken) {
    try {
      console.log("🗑️  [MODEL] Revocando refresh token...");

      const pool = await getConnection();

      // ✅ Hashear el token para buscarlo
      const tokenHash = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");

      await pool
        .request()
        .input("tokenHash", mssql.NVarChar, tokenHash)
        .query("UPDATE RefreshTokens SET revoked = 1 WHERE token = @tokenHash");

      console.log("✅ [MODEL] Token revocado exitosamente");
      return true;
    } catch (error) {
      console.error("❌ [MODEL] Error revocando token:", error);
      throw new Error(`Error al revocar refresh token: ${error.message}`);
    }
  }

  // Revocar todos los tokens de un usuario
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

  // Limpiar tokens expirados (ejecutar periódicamente)
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
        .query(
          "SELECT id, nombre, email, rol, activo, fecha_registro FROM Usuarios ORDER BY fecha_registro DESC"
        );

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
      const request = pool
        .request()
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
