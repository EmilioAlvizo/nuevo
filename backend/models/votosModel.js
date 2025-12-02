const { getConnection, mssql } = require("../config/database");

class VotosModel {
  static async registrarVoto(idEncuesta, idOpcion, huella) {
    const pool = await getConnection();

    // evitar duplicados
    const existe = await pool
      .request()
      .input("idEncuesta", mssql.Int, idEncuesta)
      .input("huella", mssql.NVarChar, huella)
      .query(
        `SELECT * FROM EncuestaVotos WHERE idEncuesta=@idEncuesta AND huella=@huella`
      );

    if (existe.recordset.length > 0) {
      throw new Error("Ya has votado en esta encuesta.");
    }

    await pool
      .request()
      .input("idEncuesta", mssql.Int, idEncuesta)
      .input("huella", mssql.NVarChar, huella)
      .query(
        `INSERT INTO EncuestaVotos (idEncuesta, huella) VALUES (@idEncuesta, @huella)`
      );

    await pool
      .request()
      .input("idOpcion", mssql.Int, idOpcion)
      .query(
        `UPDATE EncuestaOpciones SET votos = votos + 1 WHERE idOpcion = @idOpcion`
      );

    return true;
  }
}

module.exports = VotosModel;
