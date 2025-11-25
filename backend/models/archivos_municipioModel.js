//nuevo/backend/models/archivos_municipioModel.js
const { buildConditions } = require("../utils/filters");
const { getConnection, mssql } = require("../config/database");

// Modelo generado automáticamente para la tabla: archivos_municipio
class ArchivosMunicipioModel {
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

      let query = `SELECT a.*, m.nombre as nombre_municipio FROM archivos_municipio a
        INNER JOIN municipio m ON a.id_municipio = m.id_municipio WHERE 1=1`;

      // Configuración de filtros
      const filterConfig = [
    { name: "nombre_archivo", dbField: "a.nombre_archivo", type: "string" },
    { name: "fecha_archivo", dbField: "a.fecha_archivo", type: "date" },
    { name: "id_municipio", dbField: "a.id_municipio", type: "int", isMulti: true },
    { name: "estatus_archivo", dbField: "a.estatus_archivo", type: "string", isMulti: true },
    { name: "fecha_modificacion", dbField: "a.fecha_modificacion", type: "date" },
    { name: "tipo_archivo", dbField: "a.tipo_archivo", type: "string", isMulti: true },
    { name: "categoria_archivo", dbField: "a.categoria_archivo", type: "string", isMulti: true },
    { name: "palabras_clave", dbField: "a.palabras_clave", type: "string" },
    { name: "subcategoria_archivo", dbField: "a.subcategoria_archivo", type: "string", isMulti: true }
      ];

      // Construir condiciones
      const conditions = buildConditions(params, request, filterConfig);

      // Búsqueda global
      if (params.busqueda) {
        const searchFields = ["a.nombre_archivo","a.palabras_clave","a.categoria_archivo"];
        
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
        const sortField = params.sortField.includes('.') ? params.sortField : `a.${params.sortField}`;
        query += ` ORDER BY ${sortField} ${direction}`;
      } else {
        query += ` ORDER BY a.fecha_modificacion DESC`;
      }

      // Paginación
      const offset = (params.pagina - 1) * params.limite;
      query += ` OFFSET ${offset} ROWS FETCH NEXT ${params.limite} ROWS ONLY`;

      // Contar total
      const countQuery = `
        SELECT COUNT(*) AS total FROM archivos_municipio a
        INNER JOIN municipio m ON a.id_municipio = m.id_municipio
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

      const camposMultiselect = ["id_municipio","estatus_archivo","tipo_archivo","categoria_archivo","subcategoria_archivo"];

      for (const campo of camposMultiselect) {
        const query = `
          SELECT DISTINCT ${campo} 
          FROM archivos_municipio 
          WHERE ${campo} IS NOT NULL AND ${campo} != ''
          ORDER BY ${campo}
        `;
        const result = await pool.request().query(query);
        valores[campo] = result.recordset.map(r => r[campo]);
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

module.exports = ArchivosMunicipioModel;
