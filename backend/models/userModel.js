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
      if (error.number === 2627) { // Error de clave duplicada
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

      // Si se proporciona nueva contraseña
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