//nuevo/backend/models/documentos_cendocModel.js
const { buildConditions } = require("../utils/filters");
const { getConnection, mssql } = require("../config/database");

// Modelo para operaciones CRUD
class Documentos_cendocModel {
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

  // ✅ NUEVO - Obtener archivos con filtros
  static async getArchivosFiltrados(params) {
    try {
      const pool = await getConnection();
      const request = pool.request();

      // Construir la consulta base con JOIN
      let query = `
        SELECT 
          a.*,
          m.nombre_categoria_cendoc as nombre_categoria
        FROM documentos_cendoc a
        INNER JOIN categorias_cendoc m ON a.id_categoria_cendoc = m.id_categoria_cendoc
        WHERE 1=1
      `;

      // Configuración reutilizable
      const filterConfig = [
        { name: "id_documento", dbField: "id_documento", type: "int" },
        {
          name: "nombre_documento",
          dbField: "nombre_documento",
          type: "string",
        },
        { name: "autor_documento", dbField: "autor_documento", isMulti: true },
        {
          name: "descripcion_documento",
          dbField: "descripcion_documento",
          type: "string",
        },
        { name: "fecha_documento", dbField: "fecha_documento", type: "date" },
        {
          name: "id_categoria_cendoc",
          dbField: "id_categoria_cendoc",
          type: "int",
        },
        {
          name: "archivo_documento",
          dbField: "archivo_documento",
          type: "string",
        },
        {
          name: "estatus_documento",
          dbField: "estatus_documento",
          isMulti: true,
        },
        {
          name: "fecha_modificacion",
          dbField: "fecha_modificacion",
          type: "date",
        },
        { name: "palabras_clave", dbField: "palabras_clave", type: "string" },
        {
          name: "nombre_categoria",
          dbField: "m.nombre_categoria_cendoc",
          isMulti: true,
        },
      ];

      // 🔧 construir condiciones
      const conditions = buildConditions(params, request, filterConfig);

      // 🔍 búsqueda global
      if (params.busqueda) {
        conditions.push(`(
          nombre_documento LIKE @busqueda OR 
          autor_documento LIKE @busqueda
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

      //console.log("query ", query);

      // 🧮 Contar total
      const countQuery = `
        SELECT COUNT(*) AS total 
        FROM documentos_cendoc a
        INNER JOIN categorias_cendoc m ON a.id_categoria_cendoc = m.id_categoria_cendoc
        WHERE 1=1
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

  // ✅ NUEVO - Obtener conteos por municipio
  static async getConteosPorDocumentos_cendoc() {
    try {
      const pool = await getConnection();
      const query = `
        SELECT 
          m.id_categoria_cendoc,
          m.nombre_categoria_cendoc,
          COUNT(a.id_categoria_cendoc) as contador
        FROM categorias_cendoc m
        LEFT JOIN documentos_cendoc a ON m.id_categoria_cendoc = a.id_categoria_cendoc
        GROUP BY m.id_categoria_cendoc, m.nombre_categoria_cendoc
        ORDER BY m.nombre_categoria_cendoc ASC
      `;

      const result = await pool.request().query(query);
      return result.recordset;
    } catch (error) {
      throw new Error(
        `Error al obtener conteos por municipio: ${error.message}`
      );
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

      // Agregar parámetros dinámicamente
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

module.exports = Documentos_cendocModel;
