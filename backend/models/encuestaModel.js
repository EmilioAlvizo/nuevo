// nuevo/backend/models/encuestaModel.js
const { getConnection, mssql } = require("../config/database");

class EncuestaModel {
  static async getAll() {
    const pool = await getConnection();
    const result = await pool.request().query(`SELECT * FROM Encuestas`);
    return result.recordset;
  }
  static async getById(idEncuesta) {
    const pool = await getConnection();

    const encuesta = await pool
      .request()
      .input("idEncuesta", mssql.Int, idEncuesta)
      .query(`SELECT * FROM Encuestas WHERE idEncuesta = @idEncuesta`);

    const opciones = await pool
      .request()
      .input("idEncuesta", mssql.Int, idEncuesta)
      .query(`SELECT * FROM EncuestaOpciones WHERE idEncuesta = @idEncuesta`);

    return {
      ...encuesta.recordset[0],
      opciones: opciones.recordset,
    };
  }
  // Obtener encuesta activa (por fechas y bandera activa)
  static async obtenerEncuestaActiva() {
    try {
      const pool = await getConnection();

      // Obtener encuesta activa
      const encuesta = await pool.request().query(`
        SELECT *
        FROM Encuestas
        WHERE activa = 1
        AND fechaInicio <= SYSDATETIME()
        AND fechaFin >= SYSDATETIME()
      `);

      if (encuesta.recordset.length === 0) return null;

      const enc = encuesta.recordset[0];

      // Obtener opciones de esa encuesta
      const opciones = await pool
        .request()
        .input("idEncuesta", mssql.Int, enc.idEncuesta).query(`
          SELECT *
          FROM EncuestaOpciones
          WHERE idEncuesta = @idEncuesta
        `);

      enc.opciones = opciones.recordset;

      return enc;
    } catch (error) {
      throw new Error("Error al obtener la encuesta activa: " + error.message);
    }
  }

  // Obtener opciones de una encuesta por ID
  static async obtenerOpciones(idEncuesta) {
    try {
      const pool = await getConnection();
      const result = await pool
        .request()
        .input("idEncuesta", mssql.Int, idEncuesta)
        .query(`SELECT * FROM EncuestaOpciones WHERE idEncuesta = @idEncuesta`);
      return result.recordset;
    } catch (error) {
      throw new Error("Error al obtener opciones: " + error.message);
    }
  }

  // NUEVO: Obtener la última encuesta cuya fechaFin ya pasó.
  static async obtenerUltimaFinalizada() {
    try {
      const pool = await getConnection();

      const encuesta = await pool.request().query(`
      SELECT TOP 1 *
      FROM Encuestas
      WHERE fechaFin < SYSDATETIME()  -- Cuya fecha de fin ya pasó
      ORDER BY fechaFin DESC;        -- Ordenar por la más reciente
    `);

      if (encuesta.recordset.length === 0) return null;

      const enc = encuesta.recordset[0];

      // Obtener opciones y votos de la encuesta finalizada
      const opciones = await pool
        .request()
        .input("idEncuesta", mssql.Int, enc.idEncuesta).query(`
        SELECT *
        FROM EncuestaOpciones
        WHERE idEncuesta = @idEncuesta
      `);

      enc.opciones = opciones.recordset;

      return enc;
    } catch (error) {
      throw new Error(
        "Error al obtener la última encuesta finalizada: " + error.message
      );
    }
  }

  // Registrar un voto
  static async registrarVoto(idEncuesta, idOpcion, huella) {
    try {
      const pool = await getConnection();

      await pool
        .request()
        .input("idEncuesta", mssql.Int, idEncuesta)
        .input("idOpcion", mssql.Int, idOpcion)
        .input("huella", mssql.NVarChar, huella).query(`
          INSERT INTO EncuestaVotos (idEncuesta, huella)
          VALUES (@idEncuesta, @huella);

          UPDATE EncuestaOpciones
          SET votos = votos + 1
          WHERE idOpcion = @idOpcion;
      `);
    } catch (error) {
      throw new Error("Error al registrar voto: " + error.message);
    }
  }

  // Verificar si un usuario ya votó
  static async yaVoto(idEncuesta, huella) {
    try {
      const pool = await getConnection();
      const result = await pool
        .request()
        .input("idEncuesta", mssql.Int, idEncuesta)
        .input("huella", mssql.NVarChar, huella).query(`
          SELECT idVoto FROM EncuestaVotos
          WHERE idEncuesta = @idEncuesta AND huella = @huella
      `);
      return result.recordset.length > 0;
    } catch (error) {
      throw new Error("Error al verificar voto: " + error.message);
    }
  }

  static async create(data) {
    const pool = await getConnection();

    // 1. Insertar encuesta y obtener ID
    const result = await pool
      .request()
      .input("pregunta", mssql.NVarChar, data.pregunta)
      .input("fechaInicio", mssql.DateTime2, data.fechaInicio)
      .input("fechaFin", mssql.DateTime2, data.fechaFin)
      .input("activa", mssql.Bit, data.activa ?? false).query(`
      INSERT INTO Encuestas (pregunta, fechaInicio, fechaFin, activa)
      OUTPUT INSERTED.idEncuesta
      VALUES (@pregunta, @fechaInicio, @fechaFin, @activa)
    `);

    const idEncuesta = result.recordset[0].idEncuesta;

    // Validación
    if (!Array.isArray(data.opciones) || data.opciones.length === 0) {
      return idEncuesta;
    }

    // 2. Insertar cada opción
    for (const opcion of data.opciones) {
      await pool
        .request()
        .input("idEncuesta", mssql.Int, idEncuesta)
        .input("textoOpcion", mssql.NVarChar, opcion).query(`
        INSERT INTO EncuestaOpciones (idEncuesta, textoOpcion)
        VALUES (@idEncuesta, @textoOpcion)
      `);
    }

    return idEncuesta;
  }

  static async update(idEncuesta, data) {
    const pool = await getConnection();
    const transaction = new mssql.Transaction(pool);

    // Convertir "1"/"0" → número
    const activaBit = Number(data.activa); // 1 o 0
    try {
      await transaction.begin();

      // 1️⃣ Actualizar encuesta
      await transaction
        .request()
        .input("idEncuesta", mssql.Int, idEncuesta)
        .input("pregunta", mssql.NVarChar, data.pregunta)
        .input("fechaInicio", mssql.DateTime2, data.fechaInicio)
        .input("fechaFin", mssql.DateTime2, data.fechaFin)
        .input("activa", mssql.Bit, activaBit).query(`
        UPDATE Encuestas SET
          pregunta = @pregunta,
          fechaInicio = @fechaInicio,
          fechaFin = @fechaFin,
          activa = @activa,
          fechaModificacion = SYSDATETIME()
        WHERE idEncuesta = @idEncuesta
      `);

      // 2️⃣ Borrar opciones anteriores
      await transaction
        .request()
        .input("idEncuesta", mssql.Int, idEncuesta)
        .query(`DELETE FROM EncuestaOpciones WHERE idEncuesta = @idEncuesta`);

      // 3️⃣ Insertar nuevas opciones
      if (Array.isArray(data.opciones)) {
        for (const texto of data.opciones) {
          await transaction
            .request()
            .input("idEncuesta", mssql.Int, idEncuesta)
            .input("textoOpcion", mssql.NVarChar, texto).query(`
            INSERT INTO EncuestaOpciones (idEncuesta, textoOpcion)
            VALUES (@idEncuesta, @textoOpcion)
          `);
        }
      }

      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /* static async delete(idEncuesta) {
    const pool = await getConnection();
    await pool
      .request()
      .input("idEncuesta", mssql.Int, idEncuesta)
      .query(`DELETE FROM Encuestas WHERE idEncuesta = @idEncuesta`);
  } */
  // En tu archivo models/encuestaModel.js (o similar)

  static async delete(idEncuesta) {
    const pool = await getConnection();
    const transaction = new mssql.Transaction(pool);

    try {
      await transaction.begin();
      const request = new mssql.Request(transaction);
      request.input("idEncuesta", mssql.Int, idEncuesta);

      // 1. Primero borrar los VOTOS asociados a esta encuesta
      // (Si no borras esto primero, te dará error luego con la tabla de votos)
      await request.query(
        `DELETE FROM EncuestaVotos WHERE idEncuesta = @idEncuesta`
      );

      // 2. Segundo borrar las OPCIONES asociadas
      // (Este es el que te estaba dando el error específico FK__EncuestaO...)
      await request.query(
        `DELETE FROM EncuestaOpciones WHERE idEncuesta = @idEncuesta`
      );

      // 3. Finalmente borrar la ENCUESTA principal
      await request.query(
        `DELETE FROM Encuestas WHERE idEncuesta = @idEncuesta`
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error; // Lanza el error para que el controlador lo capture
    }
  }
}

module.exports = EncuestaModel;
