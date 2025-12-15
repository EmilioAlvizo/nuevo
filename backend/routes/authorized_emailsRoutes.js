// backend/routes/authorized_emails.js

const express = require('express');
const router = express.Router();
const { getConnection, mssql } = require("../config/database");
const { authMiddleware } = require("../middleware/authMiddleware");

const TABLE_NAME = 'authorized_emails';

/**
 * GET /api/authorized-emails
 * Obtiene todos los emails autorizados con su estado de usuario
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query(`
        SELECT 
          ae.id,
          ae.email,
          ae.authorized_by,
          ae.authorized_at,
          ae.used,
          ae.used_at,
          CAST(u.activo AS int) as usuario_activo,
          u.id as usuario_id,
          u.nombre as usuario_nombre
        FROM ${TABLE_NAME} ae
        LEFT JOIN usuarios u ON ae.email = u.email
        ORDER BY ae.authorized_at DESC
      `);

    res.json({
      success: true,
      data: result.recordset
    });

  } catch (error) {
    console.error('Error al obtener emails autorizados:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los emails autorizados',
      error: error.message
    });
  }
});


/**
 * POST /api/authorized-emails
 * Crea un nuevo email autorizado
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { email, authorized_by } = req.body;

    // Validaciones
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'El email es requerido'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'El formato del email no es válido'
      });
    }

    const pool = await getConnection();

    // Verificar si el email ya existe
    const checkResult = await pool.request()
      .input('email', mssql.VarChar(255), email)
      .query(`SELECT id FROM ${TABLE_NAME} WHERE email = @email`);

    if (checkResult.recordset.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Este email ya está registrado'
      });
    }

    // Insertar nuevo email
    const result = await pool.request()
      .input('email', mssql.VarChar(255), email)
      .input('authorized_by', mssql.VarChar(100), authorized_by || 'admin')
      .query(`
        INSERT INTO ${TABLE_NAME} (email, authorized_by)
        OUTPUT INSERTED.*
        VALUES (@email, @authorized_by)
      `);

    res.status(201).json({
      success: true,
      message: 'Email autorizado creado exitosamente',
      data: result.recordset[0]
    });

  } catch (error) {
    console.error('Error al crear email autorizado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear el email autorizado',
      error: error.message
    });
  }
});

/**
 * PUT /api/authorized-emails/:id
 * Actualiza un email autorizado
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, used } = req.body;

    // Validaciones
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'El email es requerido'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'El formato del email no es válido'
      });
    }

    const pool = await getConnection();

    // Verificar si el email ya existe en otro registro
    const checkResult = await pool.request()
      .input('email', mssql.VarChar(255), email)
      .input('id', mssql.Int, id)
      .query(`SELECT id FROM ${TABLE_NAME} WHERE email = @email AND id != @id`);

    if (checkResult.recordset.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Este email ya está registrado en otro registro'
      });
    }

    // Preparar query de actualización
    let updateQuery = `
      UPDATE ${TABLE_NAME}
      SET 
        email = @email,
        used = @used
    `;

    // Si se marca como usado y no tenía used_at, establecer la fecha actual
    if (used === true || used === 1) {
      updateQuery += `, used_at = CASE WHEN used_at IS NULL THEN GETDATE() ELSE used_at END`;
    }

    updateQuery += `
      OUTPUT INSERTED.*
      WHERE id = @id
    `;

    const result = await pool.request()
      .input('id', mssql.Int, id)
      .input('email', mssql.VarChar(255), email)
      .input('used', mssql.Bit, used !== undefined ? used : false)
      .query(updateQuery);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Email autorizado no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Email autorizado actualizado exitosamente',
      data: result.recordset[0]
    });

  } catch (error) {
    console.error('Error al actualizar email autorizado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el email autorizado',
      error: error.message
    });
  }
});


/**
 * PATCH /api/authorized-emails/usuario/:usuarioId/status
 * Actualiza el estado activo/inactivo del usuario por su ID
 */
router.patch('/usuario/:usuarioId/status', authMiddleware, async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const { activo } = req.body;

    if (activo === undefined) {
      return res.status(400).json({
        success: false,
        message: 'El campo activo es requerido'
      });
    }

    const pool = await getConnection();

    // Verificar si existe el usuario
    const checkUser = await pool.request()
      .input('usuarioId', mssql.Int, usuarioId)
      .query(`SELECT id, email FROM usuarios WHERE id = @usuarioId`);

    if (checkUser.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No existe un usuario con ese ID'
      });
    }

    // Actualizar el estado
    const result = await pool.request()
      .input('usuarioId', mssql.Int, usuarioId)
      .input('activo', mssql.Bit, activo)
      .query(`
        UPDATE usuarios
        SET activo = @activo
        OUTPUT INSERTED.*
        WHERE id = @usuarioId
      `);

    res.json({
      success: true,
      message: `Usuario ${activo ? 'activado' : 'inactivado'} exitosamente`,
      data: result.recordset[0]
    });

  } catch (error) {
    console.error('Error al actualizar estado de usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el estado del usuario',
      error: error.message
    });
  }
});


/**
 * DELETE /api/authorized-emails/:id
 * Elimina un email autorizado
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await getConnection();
    const result = await pool.request()
      .input('id', mssql.Int, id)
      .query(`DELETE FROM ${TABLE_NAME} WHERE id = @id`);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'Email autorizado no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Email autorizado eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar email autorizado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el email autorizado',
      error: error.message
    });
  }
});

module.exports = router;