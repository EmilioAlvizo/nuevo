const { getConnection, mssql } = require("../config/database");

class InterfazModel {

  static async getAll() {
    const pool = await getConnection();
    const result = await pool.request().query(`SELECT * FROM interfaz ORDER BY id_config`);
    return result.recordset;
  }

  static async getById(id) {
    const pool = await getConnection();
    const result = await pool.request()
      .input("id", mssql.Int, id)
      .query(`SELECT * FROM interfaz WHERE id_config = @id`);
    return result.recordset[0];
  }

  static async create(data) {
    const { nombre, auxiliar, archivo, estatus } = data;

    const pool = await getConnection();
    const result = await pool.request()
      .input("nombre", mssql.VarChar, nombre)
      .input("auxiliar", mssql.VarChar, auxiliar)
      .input("archivo", mssql.VarChar, archivo)
      .input("estatus", mssql.Char, estatus)
      .query(`
        INSERT INTO interfaz (nombre, auxiliar, archivo, estatus)
        VALUES (@nombre, @auxiliar, @archivo, @estatus);

        SELECT SCOPE_IDENTITY() AS id;
      `);

    return result.recordset[0].id;
  }

  static async update(id, data) {
    const { nombre, auxiliar, archivo, estatus } = data;

    const pool = await getConnection();
    const result = await pool.request()
      .input("id", mssql.Int, id)
      .input("nombre", mssql.VarChar, nombre)
      .input("auxiliar", mssql.VarChar, auxiliar)
      .input("archivo", mssql.VarChar, archivo)
      .input("estatus", mssql.Char, estatus)
      .query(`
        UPDATE interfaz SET
          nombre = @nombre,
          auxiliar = @auxiliar,
          archivo = @archivo,
          estatus = @estatus
        WHERE id_config = @id;
      `);

    return result.rowsAffected[0] > 0;
  }

  static async delete(id) {
    const pool = await getConnection();
    const result = await pool.request()
      .input("id", mssql.Int, id)
      .query(`DELETE FROM interfaz WHERE id_config = @id`);

    return result.rowsAffected[0] > 0;
  }
}

module.exports = InterfazModel;
