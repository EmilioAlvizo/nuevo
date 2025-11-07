//nuevo/backend/models/revistasModel.js
const { buildConditions } = require("../utils/filters");
const { getConnection, mssql } = require("../config/database");

// Modelo para operaciones CRUD
class documentos_fisicosModel {
  // Obtener todos los registros
  static async getAll(tableName) {
    try {
      const pool = await getConnection();
      const result = await pool.request().query(`SELECT * FROM ${tableName}`);
      return result.recordset;
    } catch (error) {
      throw new Error(`Error al obtener registros: ${error.message}`);
    }
  }

  // Obtener un registro por ID
  static async getById(tableName, id, idColumn = "id") {
    try {
      const pool = await getConnection();
      const result = await pool
        .request()
        .input("id", mssql.Int, id)
        .query(`SELECT * FROM ${tableName} WHERE ${idColumn} = @id`);
      return result.recordset[0];
    } catch (error) {
      throw new Error(`Error al obtener registro: ${error.message}`);
    }
  }


  static async getArchivosFiltrados(params) {
    try {
      const pool = await getConnection();
      const request = pool.request();
  
      let query = `
        SELECT * FROM documentos_fisicos
        WHERE 1=1
      `;
  
      // Configuración reutilizable
      const filterConfig = [
        { name: "id_documento", dbField: "id_documento", type: "int" },
        { name: "titulo", dbField: "titulo", type: "string" },
        { name: "editorial", dbField: "editorial", type: "string" },
        { name: "tipo", dbField: "tipo", type: "string" },
        { name: "clave", dbField: "clave", type: "string" },
        { name: "ejemplares", dbField: "ejemplares", type: "int" },
        { name: "estatus", dbField: "estatus", isMulti: true },
        { name: "fecha_modificacion", dbField: "fecha_modificacion", type: "date" },
      ];
  
      // 🔧 construir condiciones
      const conditions = buildConditions(params, request, filterConfig);
  
      // 🔍 búsqueda global
      if (params.busqueda) {
        conditions.push(`(
          titulo LIKE @busqueda OR 
          editorial LIKE @busqueda
        )`);
        request.input("busqueda", mssql.NVarChar, `%${params.busqueda}%`);
      }
  
      if (conditions.length > 0) query += " AND " + conditions.join(" AND ");
  
      // 🔽 Ordenamiento
      if (params.sortField) {
        const direction = params.sortOrder === -1 ? "DESC" : "ASC";
        query += ` ORDER BY ${params.sortField} ${direction}`;
      } else {
        query += " ORDER BY id_documento DESC";
      }
  
      // 📄 Paginación
      const offset = (params.pagina - 1) * params.limite;
      query += ` OFFSET ${offset} ROWS FETCH NEXT ${params.limite} ROWS ONLY`;

      //console.log("query ", query)
  
      // 🧮 Contar total
      const countQuery = `
        SELECT COUNT(*) AS total FROM documentos_fisicos WHERE 1=1
        ${conditions.length > 0 ? " AND " + conditions.join(" AND ") : ""}
      `;

      //console.log("countQuery ", countQuery)
  
      const result = await request.query(query);
      const totalResult = await request.query(countQuery);
  
      const total = totalResult.recordset[0].total;
      const totalPaginas = Math.ceil(total / params.limite);
  
      // ✅ Retornar datos en formato consistente
      return {
        data: result.recordset,
        total,
        pagina: params.pagina,
        totalPaginas,
      };
  
    } catch (error) {
      throw new Error(`Error en getArchivosFiltrados: ${error.message}`);
    }
  }

  // Crear un nuevo registro
  static async create(tableName, data) {
    try {
      const pool = await getConnection();
      const columns = Object.keys(data).join(", ");
      const values = Object.keys(data)
        .map((key) => `@${key}`)
        .join(", ");

      const request = pool.request();

      // Agregar parámetros dinámicamente
      Object.keys(data).forEach((key) => {
        request.input(key, data[key]);
      });

      const query = `INSERT INTO ${tableName} (${columns}) VALUES (${values}); SELECT SCOPE_IDENTITY() AS id;`;
      const result = await request.query(query);

      return { id: result.recordset[0].id, ...data };
    } catch (error) {
      throw new Error(`Error al crear registro: ${error.message}`);
    }
  }

  // Actualizar un registro
    static async update(tableName, id, data, idColumn = "id") {
    try {
      const pool = await getConnection();
      const setClause = Object.keys(data)
        .map((key) => `${key} = @${key}`)
        .join(", ");

      const request = pool.request();
      request.input("id", mssql.Int, id);
      Object.keys(data).forEach((key) => request.input(key, data[key]));

      const query = `
        UPDATE ${tableName}
        SET ${setClause}
        WHERE ${idColumn} = @id;
      `;
      const result = await request.query(query);

      if (result.rowsAffected[0] === 0) {
        return null; // 👈 Ninguna fila actualizada
      }

      return { id, ...data };
    } catch (error) {
      throw new Error(`Error al actualizar registro: ${error.message}`);
    }
  }

  // Eliminar un registro
static async delete(tableName, id, idColumn = "id") {
    try {
      const pool = await getConnection();
      const result = await pool
        .request()
        .input("id", mssql.Int, id)
        .query(`DELETE FROM ${tableName} WHERE ${idColumn} = @id`);

      if (result.rowsAffected[0] === 0) {
        return null; // 👈 Ninguna fila eliminada
      }

      return { message: "Registro eliminado exitosamente", id };
    } catch (error) {
      throw new Error(`Error al eliminar registro: ${error.message}`);
    }
  }
}

module.exports = documentos_fisicosModel;
