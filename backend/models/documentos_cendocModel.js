//nuevo/backend/models/documentos_cendocModel.js
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

      const conditions = [];

      // Filtrar por búsqueda
      if (params.busqueda) {
        conditions.push(`(
          a.nombre_documento LIKE @busqueda
        )`);
        request.input("busqueda", mssql.NVarChar, `%${params.busqueda}%`);
      }

      // Filtrar por categoría
      if (params.categoria && params.categoria.length > 0) {
        const categoriaList = params.categoria
          .map((_, index) => `@categoria${index}`)
          .join(",");
        conditions.push(`a.id_categoria_cendoc IN (${categoriaList})`);
        params.categoria.forEach((id, index) => {
          request.input(`categoria${index}`, mssql.Int, id);
        });
      }

      // filtrar por autor
      if (params.autor) {
        conditions.push(`a.autor_documento LIKE @autor`);
        request.input("autor", mssql.NVarChar, `%${params.autor}%`);
      }

      // Filtrar por palabra clave específica
      if (params.palabra_clave) {
        conditions.push(`a.palabras_clave LIKE @palabra_clave`);
        request.input(
          "palabra_clave",
          mssql.NVarChar,
          `%${params.palabra_clave}%`
        );
      }

      // Agregar condiciones a la consulta
      if (conditions.length > 0) {
        query += ` AND ${conditions.join(" AND ")}`;
      }

      // Ordenamiento
      switch (params.ordenar) {
        case "AZ":
          query += ` ORDER BY a.nombre_documento ASC`;
          break;
        case "ZA":
          query += ` ORDER BY a.nombre_documento DESC`;
          break;
        case "masReciente":
          query += ` ORDER BY a.fecha_modificacion DESC`;
          break;
        case "masAntiguo":
          query += ` ORDER BY a.fecha_modificacion ASC`;
          break;
        default:
          query += ` ORDER BY a.fecha_modificacion DESC`;
      }

      // Paginación con OFFSET/FETCH (SQL Server 2012+)
      const limite = params.limite || 50;
      const pagina = params.pagina || 1;
      const offset = (pagina - 1) * limite;

      query += ` OFFSET @offset ROWS FETCH NEXT @limite ROWS ONLY`;
      request.input("offset", mssql.Int, offset);
      request.input("limite", mssql.Int, limite);

      // Ejecutar consulta principal
      const result = await request.query(query);

      // Obtener total de resultados para paginación
      const countRequest = pool.request();
      let countQuery = `
        SELECT COUNT(*) as total
        FROM documentos_cendoc a
        INNER JOIN categorias_cendoc m ON a.id_categoria_cendoc = m.id_categoria_cendoc
        WHERE 1=1
      `;

      const countConditions = [];

      if (params.busqueda) {
        countConditions.push(`(
          a.nombre_documento LIKE @busqueda 
        )`);
        countRequest.input("busqueda", mssql.NVarChar, `%${params.busqueda}%`);
      }

      if (params.categoria && params.categoria.length > 0) {
        const categoriaList = params.categoria
          .map((_, index) => `@categoria${index}`)
          .join(",");

        countConditions.push(`a.id_categoria_cendoc IN (${categoriaList})`);

        params.categoria.forEach((id, index) => {
          countRequest.input(`categoria${index}`, mssql.Int, id);
        });
      }

      if (params.autor) {
        countConditions.push(`a.autor_documento = @autor`);
        countRequest.input("autor", mssql.NVarChar, params.autor);
      }

      // Filtrar por palabra clave específica
      if (params.palabra_clave) {
        countConditions.push(`a.palabras_clave LIKE @palabra_clave`);
        countRequest.input(
          "palabra_clave",
          mssql.NVarChar,
          `%${params.palabra_clave}%`
        );
      }

      if (params.tipo) {
        countConditions.push(`a.tipo_archivo = @tipo`);
        countRequest.input("tipo", mssql.NVarChar, params.tipo);
      }

      if (countConditions.length > 0) {
        countQuery += ` AND ${countConditions.join(" AND ")}`;
      }

      const countResult = await countRequest.query(countQuery);
      const total = countResult.recordset[0].total;

      return {
        data: result.recordset,
        total: total,
        pagina: pagina,
        totalPaginas: Math.ceil(total / limite),
      };
    } catch (error) {
      throw new Error(`Error al obtener archivos filtrados: ${error.message}`);
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
