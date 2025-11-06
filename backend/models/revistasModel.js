//nuevo/backend/models/revistasModel.js
const { buildFilterCondition, buildConditions } = require("../utils/filters");
const { getConnection, mssql } = require("../config/database");

// Modelo para operaciones CRUD
class revistasModel {
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
        SELECT * FROM revistas
        WHERE 1=1
      `;
  
      // Configuración reutilizable
      const filterConfig = [
        { name: "volumen", dbField: "volumen", type: "int" },
        { name: "id_revista", dbField: "id_revista", type: "int" },
        { name: "numero_year", dbField: "numero_year", type: "int" },
        { name: "fecha", dbField: "fecha", type: "date" },
        { name: "fecha_modificacion", dbField: "fecha_modificacion", type: "date" },
        { name: "estatus", dbField: "estatus", isMulti: true },
      ];
  
      // 🔧 construir condiciones
      const conditions = buildConditions(params, request, filterConfig);
  
      // 🔍 búsqueda global
      if (params.busqueda) {
        conditions.push(`(
          descripcion LIKE @busqueda OR 
          archivo LIKE @busqueda
        )`);
        request.input("busqueda", mssql.NVarChar, `%${params.busqueda}%`);
      }
  
      if (conditions.length > 0) query += " AND " + conditions.join(" AND ");
  
      // 🔽 Ordenamiento
      if (params.sortField) {
        const direction = params.sortOrder === -1 ? "DESC" : "ASC";
        query += ` ORDER BY ${params.sortField} ${direction}`;
      } else {
        query += " ORDER BY id_revista DESC";
      }
  
      // 📄 Paginación
      const offset = (params.pagina - 1) * params.limite;
      query += ` OFFSET ${offset} ROWS FETCH NEXT ${params.limite} ROWS ONLY`;

      //console.log("query ", query)
  
      // 🧮 Contar total
      const countQuery = `
        SELECT COUNT(*) AS total FROM revistas WHERE 1=1
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

  // ✅ Obtener archivos con filtros avanzados estilo PrimeNG
  static async getArchivosFiltrados2(params) {
    try {
      const pool = await getConnection();
      const request = pool.request();

      // Construir la consulta base con JOIN
      let query = `
        SELECT * FROM revistas
        WHERE 1=1
      `;

      const conditions = [];

      // 🔍 Búsqueda global (busca en todos los campos)
      if (params.busqueda) {
        conditions.push(`(
          descripcion LIKE @busqueda OR 
          archivo LIKE @busqueda 
        )`);
        request.input("busqueda", mssql.NVarChar, `%${params.busqueda}%`);
      }

      // 📝 Filtro por descripcion de archivo con matchMode
      if (params.descripcion) {
        const matchMode = params.descripcion_matchMode || "contains";
        conditions.push(
          buildFilterCondition(
            "descripcion",
            params.descripcion,
            matchMode,
            request,
            "descripcion"
          )
        );
      }

      // 🏷️ Filtro por volumen con matchMode
      if (params.volumen) {
        const matchMode = params.volumen_matchMode || "contains";
        conditions.push(
          buildFilterCondition(
            "volumen",
            params.volumen,
            matchMode,
            request,
            "volumen"
          )
        );
      }

      // 🔖 Filtro por id_revista clave con matchMode
      if (params.id_revista) {
        const matchMode = params.id_revista_matchMode || "contains";
        conditions.push(
          buildFilterCondition(
            "id_revista",
            params.id_revista,
            matchMode,
            request,
            "id_revista"
          )
        );
      }

      // 🔖 Filtro por numero_year clave con matchMode
      if (params.numero_year) {
        const matchMode = params.numero_year_matchMode || "contains";
        conditions.push(
          buildFilterCondition(
            "numero_year",
            params.numero_year,
            matchMode,
            request,
            "numero_year"
          )
        );
      }

      // ✅ Filtro por estatus (multiselect - IN)
      if (params.estatus && params.estatus.length > 0) {
        const estatusList = params.estatus
          .map((_, index) => `@estatus${index}`)
          .join(",");
        conditions.push(`estatus IN (${estatusList})`);
        params.estatus.forEach((est, index) => {
          request.input(`estatus${index}`, mssql.NVarChar, est);
        });
      }

      // 📅 Filtro por fecha con matchMode
      if (params.fecha) {
        const matchMode = params.fecha_matchMode || "dateIs";
        conditions.push(
          this.buildDateFilterCondition(
            "fecha",
            params.fecha,
            matchMode,
            request,
            "fecha"
          )
        );
      }

      // 📅 Filtro por fecha_modificacion con matchMode
      if (params.fecha_modificacion) {
        const matchMode = params.fecha_modificacion_matchMode || "dateIs";
        conditions.push(
          this.buildDateFilterCondition(
            "fecha_modificacion",
            params.fecha_modificacion,
            matchMode,
            request,
            "fecha_modificacion"
          )
        );
      }

      // Agregar condiciones a la consulta
      if (conditions.length > 0) {
        query += ` AND ${conditions.join(" AND ")}`;
      }

      // 🔀 Ordenamiento
      let orderByClause = "";

      if (params.sortField && params.sortOrder) {
        const direction = params.sortOrder === 1 ? "ASC" : "DESC";

        const fieldMap = {
          id_revista: "id_revista",
          volumen: "volumen",
          descripcion: "descripcion",
          numero_year: "numero_year",
          fecha: "fecha",
          fecha_modificacion: "fecha_modificacion",
          estatus: "estatus",
        };

        const dbField = fieldMap[params.sortField] || "fecha_modificacion";
        orderByClause = ` ORDER BY ${dbField} ${direction}`;

        console.log(`🔀 Ordenando por: ${dbField} ${direction}`);
      } else {
        orderByClause = ` ORDER BY fecha_modificacion DESC`;
      }

      query += orderByClause;

      // Paginación
      const limite = params.limite || 50;
      const pagina = params.pagina || 1;
      const offset = (pagina - 1) * limite;

      query += ` OFFSET @offset ROWS FETCH NEXT @limite ROWS ONLY`;
      request.input("offset", mssql.Int, offset);
      request.input("limite", mssql.Int, limite);

      //console.log('query ',query)

      // Ejecutar consulta principal
      const result = await request.query(query);

      // Obtener total de resultados para paginación
      const countRequest = pool.request();
      let countQuery = `
        SELECT COUNT(*) as total
        FROM revistas WHERE 1=1
      `;

      // Aplicar las mismas condiciones al contador
      const countConditions = [];

      if (params.busqueda) {
        countConditions.push(`(
          descripcion LIKE @busqueda OR 
          archivo LIKE @busqueda 
        )`);
        countRequest.input("busqueda", mssql.NVarChar, `%${params.busqueda}%`);
      }

      if (params.descripcion) {
        const matchMode = params.descripcion_matchMode || "contains";
        countConditions.push(
          buildFilterCondition(
            "descripcion",
            params.descripcion,
            matchMode,
            countRequest,
            "descripcion"
          )
        );
      }

      if (params.estatus && params.estatus.length > 0) {
        const estatusList = params.estatus
          .map((_, index) => `@estatus${index}`)
          .join(",");
        countConditions.push(`estatus IN (${estatusList})`);
        params.estatus.forEach((est, index) => {
          countRequest.input(`estatus${index}`, mssql.NVarChar, est);
        });
      }

      if (params.volumen) {
        const matchMode = params.volumen_matchMode || "contains";
        countConditions.push(
          buildFilterCondition(
            "volumen",
            params.volumen,
            matchMode,
            countRequest,
            "volumen"
          )
        );
      }

      if (params.id_revista) {
        const matchMode = params.id_revista_matchMode || "contains";
        countConditions.push(
          buildFilterCondition(
            "id_revista",
            params.id_revista,
            matchMode,
            countRequest,
            "id_revista"
          )
        );
      }

      if (params.numero_year) {
        const matchMode = params.numero_year_matchMode || "contains";
        countConditions.push(
          buildFilterCondition(
            "numero_year",
            params.numero_year,
            matchMode,
            countRequest,
            "numero_year"
          )
        );
      }

      if (params.estatus && params.estatus.length > 0) {
        const estatusList = params.estatus
          .map((_, index) => `@estatus${index}`)
          .join(",");
        countConditions.push(`estatus_archivo IN (${estatusList})`);
        params.estatus.forEach((est, index) => {
          countRequest.input(`estatus${index}`, mssql.NVarChar, est);
        });
      }

      if (params.fecha) {
        const matchMode = params.fecha_matchMode || "dateIs";
        countConditions.push(
          this.buildDateFilterCondition(
            "fecha",
            params.fecha,
            matchMode,
            countRequest,
            "fecha"
          )
        );
      }

      if (params.fecha_modificacion) {
        const matchMode = params.fecha_modificacion_matchMode || "dateIs";
        countConditions.push(
          this.buildDateFilterCondition(
            "fecha_modificacion",
            params.fecha_modificacion,
            matchMode,
            countRequest,
            "fecha_modificacion"
          )
        );
      }

      if (countConditions.length > 0) {
        countQuery += ` AND ${countConditions.join(" AND ")}`;
      }

      const countResult = await countRequest.query(countQuery);
      const total = countResult.recordset[0].total;

      console.log(
        `✅ Resultados: ${result.recordset.length} de ${total} totales`
      );

      return {
        data: result.recordset,
        total: total,
        pagina: pagina,
        totalPaginas: Math.ceil(total / limite),
      };
    } catch (error) {
      console.error("❌ Error en getArchivosFiltrados:", error);
      throw new Error(`Error al obtener archivos filtrados: ${error.message}`);
    }
  }

  // ✅ NUEVO - Obtener conteos por municipio
  /* static async getConteos() {
    try {
      const pool = await getConnection();
      const query = `
        SELECT 
          m.id_municipio,
          m.nombre,
          COUNT(a.id_archivo) as contador
        FROM municipio m
        LEFT JOIN archivos_municipio a ON m.id_municipio = a.id_municipio
        GROUP BY m.id_municipio, m.nombre
        ORDER BY m.nombre ASC
      `;

      const result = await pool.request().query(query);
      return result.recordset;
    } catch (error) {
      throw new Error(
        `Error al obtener conteos por municipio: ${error.message}`
      );
    }
  } */

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

module.exports = revistasModel;
