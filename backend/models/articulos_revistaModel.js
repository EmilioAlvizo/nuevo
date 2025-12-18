//nuevo/backend/models/articulos_revistaModel.js
const { buildConditions } = require("../utils/filters");
const { getConnection, mssql } = require("../config/database");

// Modelo generado automáticamente para la tabla: articulos_revista
class ArticulosRevistaModel {
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

  // Obtener registros con filtros
  static async getFiltrados(params) {
    try {
      const pool = await getConnection();
      const request = pool.request();

      let query = `SELECT * FROM articulos_revista WHERE 1=1`;

      // Configuración de filtros
      const filterConfig = [
        { name: "id_revista", dbField: "id_revista", type: "int", isMulti: true },
        { name: "titulo", dbField: "titulo", type: "string" },
        { name: "autor", dbField: "autor", type: "string", isMulti: true },
        { name: "contenido", dbField: "contenido", type: "string" },
        { name: "estatus", dbField: "estatus", type: "string", isMulti: true },
        { name: "fecha_modificacion", dbField: "fecha_modificacion", type: "date" },
        { name: "pagina", dbField: "pagina", type: "int" }
      ];

      // Construir condiciones
      const conditions = buildConditions(params, request, filterConfig);

      // Búsqueda global
      if (params.busqueda) {
        const searchFields = ["titulo", "autor", "contenido"];

        const searchConditions = searchFields.map(field => `${field} LIKE @busqueda`).join(' OR ');
        if (searchConditions) {
          conditions.push(`(${searchConditions})`);
          request.input("busqueda", mssql.NVarChar, `%${params.busqueda}%`);
        }
      }

      if (conditions.length > 0) query += " AND " + conditions.join(" AND ");

      // Ordenamiento
      if (params.sortField) {
        const direction = params.sortOrder === -1 ? "DESC" : "ASC";
        const sortField = params.sortField.includes('.') ? params.sortField : `${params.sortField}`;
        query += ` ORDER BY ${sortField} ${direction}`;
      } else {
        query += ` ORDER BY fecha_modificacion DESC`;
      }

      // Paginación
      const offset = (params.pagina - 1) * params.limite;
      query += ` OFFSET ${offset} ROWS FETCH NEXT ${params.limite} ROWS ONLY`;

      // Contar total
      const countQuery = `
        SELECT COUNT(*) AS total FROM articulos_revista
        WHERE 1=1
        ${conditions.length > 0 ? " AND " + conditions.join(" AND ") : ""}
      `;

      const result = await request.query(query);
      const totalResult = await request.query(countQuery);

      const total = totalResult.recordset[0].total;
      const totalPaginas = Math.ceil(total / params.limite);

      return {
        data: result.recordset,
        total,
        pagina: params.pagina,
        totalPaginas,
      };
    } catch (error) {
      throw new Error(`Error en getFiltrados: ${error.message}`);
    }
  }

  // Obtener valores únicos para filtros multiselect
  static async getValoresUnicos() {
    try {
      const pool = await getConnection();
      const valores = {};

      const filterConfig = [
        { name: "id_revista", dbField: "id_revista", type: "int", isMulti: true },
        { name: "titulo", dbField: "titulo", type: "string" },
        { name: "autor", dbField: "autor", type: "string", isMulti: true },
        { name: "contenido", dbField: "contenido", type: "string" },
        { name: "estatus", dbField: "estatus", type: "string", isMulti: true },
        { name: "fecha_modificacion", dbField: "fecha_modificacion", type: "date" },
        { name: "pagina", dbField: "pagina", type: "int" }
      ];

      const camposMultiselect = filterConfig
        .filter(f => f.isMulti)
        .map(f => ({ name: f.name, dbField: f.dbField }));

      for (const campo of camposMultiselect) {
        const query = `
          SELECT DISTINCT ${campo.dbField} as valor
          FROM articulos_revista
          
          WHERE ${campo.dbField} IS NOT NULL AND ${campo.dbField} != ''
          ORDER BY ${campo.dbField}
        `;
        const result = await pool.request().query(query);
        valores[campo.name] = result.recordset.map(r => r.valor);
      }

      return valores;
    } catch (error) {
      throw new Error(`Error al obtener valores únicos: ${error.message}`);
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

      Object.keys(data).forEach((key) => {
        request.input(key, data[key]);
      });

      const query = `INSERT INTO ${tableName} (${columns}) VALUES (${values}); SELECT SCOPE_IDENTITY() AS id;`;
      //console.log("asada: ", query)
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

      Object.keys(data).forEach((key) => {
        request.input(key, data[key]);
      });

      const query = `UPDATE ${tableName} SET ${setClause} WHERE ${idColumn} = @id`;
      await request.query(query);

      return { id, ...data };
    } catch (error) {
      throw new Error(`Error al actualizar registro: ${error.message}`);
    }
  }

  // Eliminar un registro
  static async delete(tableName, id, idColumn = "id") {
    try {
      const pool = await getConnection();
      await pool
        .request()
        .input("id", mssql.Int, id)
        .query(`DELETE FROM ${tableName} WHERE ${idColumn} = @id`);

      return { message: "Registro eliminado exitosamente", id };
    } catch (error) {
      throw new Error(`Error al eliminar registro: ${error.message}`);
    }
  }
}

module.exports = ArticulosRevistaModel;
