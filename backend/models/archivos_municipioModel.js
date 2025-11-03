//nuevo/backend/models/archivos_municipioModel.js
const { getConnection, mssql } = require("../config/database");

// Modelo para operaciones CRUD
class Archivos_municipioModel {
  // Obtener todos los registros
  static async getAll(tableName) {
    try {
      const pool = await getConnection();
      const result = await pool.request().query(`SELECT 
          a.*,
          m.nombre as nombre_municipio
        FROM archivos_municipio a
        INNER JOIN municipio m ON a.id_municipio = m.id_municipio
        WHERE 1=1`);
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

  // ✅ Obtener archivos con filtros avanzados estilo PrimeNG
  static async getArchivosFiltrados(params) {
    try {
      const pool = await getConnection();
      const request = pool.request();

      // Construir la consulta base con JOIN
      let query = `
        SELECT 
          a.*,
          m.nombre as nombre_municipio
        FROM archivos_municipio a
        INNER JOIN municipio m ON a.id_municipio = m.id_municipio
        WHERE 1=1
      `;

      const conditions = [];

      // 🔍 Búsqueda global (busca en todos los campos)
      if (params.busqueda) {
        conditions.push(`(
          a.nombre_archivo LIKE @busqueda OR 
          a.palabras_clave LIKE @busqueda OR
          a.tipo_archivo LIKE @busqueda OR
          a.categoria_archivo LIKE @busqueda OR
          a.subcategoria_archivo LIKE @busqueda OR
          m.nombre LIKE @busqueda
        )`);
        request.input("busqueda", mssql.NVarChar, `%${params.busqueda}%`);
      }

      // 📝 Filtro por nombre de archivo con matchMode
      if (params.nombre_archivo) {
        const matchMode = params.nombre_archivo_matchMode || "contains";
        conditions.push(
          this.buildFilterCondition(
            "a.nombre_archivo",
            params.nombre_archivo,
            matchMode,
            request,
            "nombre_archivo"
          )
        );
      }

      // 🏛️ Filtro por municipios (multiselect - IN)
      if (params.municipios && params.municipios.length > 0) {
        const municipiosList = params.municipios
          .map((_, index) => `@municipio${index}`)
          .join(",");
        conditions.push(`a.id_municipio IN (${municipiosList})`);
        params.municipios.forEach((id, index) => {
          request.input(`municipio${index}`, mssql.Int, id);
        });
      }

      // 📄 Filtro por tipos de archivo (multiselect - IN)
      if (params.tipos && params.tipos.length > 0) {
        const tiposList = params.tipos
          .map((_, index) => `@tipo${index}`)
          .join(",");
        conditions.push(`a.tipo_archivo IN (${tiposList})`);
        params.tipos.forEach((tipo, index) => {
          request.input(`tipo${index}`, mssql.NVarChar, tipo);
        });
      }

      // 📁 Filtro por categorías (multiselect - IN)
      if (params.categorias && params.categorias.length > 0) {
        const categoriasList = params.categorias
          .map((_, index) => `@categoria${index}`)
          .join(",");
        conditions.push(`a.categoria_archivo IN (${categoriasList})`);
        params.categorias.forEach((cat, index) => {
          request.input(`categoria${index}`, mssql.NVarChar, cat);
        });
      }

      // 🏷️ Filtro por subcategoría con matchMode
      if (params.subcategoria) {
        const matchMode = params.subcategoria_matchMode || "contains";
        conditions.push(
          this.buildFilterCondition(
            "a.subcategoria_archivo",
            params.subcategoria,
            matchMode,
            request,
            "subcategoria"
          )
        );
      }

      // 🔖 Filtro por palabras clave con matchMode
      if (params.palabras_clave) {
        const matchMode = params.palabras_clave_matchMode || "contains";
        conditions.push(
          this.buildFilterCondition(
            "a.palabras_clave",
            params.palabras_clave,
            matchMode,
            request,
            "palabras_clave"
          )
        );
      }

      // ✅ Filtro por estatus (multiselect - IN)
      if (params.estatus && params.estatus.length > 0) {
        const estatusList = params.estatus
          .map((_, index) => `@estatus${index}`)
          .join(",");
        conditions.push(`a.estatus_archivo IN (${estatusList})`);
        params.estatus.forEach((est, index) => {
          request.input(`estatus${index}`, mssql.NVarChar, est);
        });
      }

      // 📅 Filtro por fecha_archivo con matchMode
      if (params.fecha_archivo) {
        const matchMode = params.fecha_archivo_matchMode || "dateIs";
        conditions.push(
          this.buildDateFilterCondition(
            "a.fecha_archivo",
            params.fecha_archivo,
            matchMode,
            request,
            "fecha_archivo"
          )
        );
      }

      // 📅 Filtro por fecha_modificacion con matchMode
      if (params.fecha_modificacion) {
        const matchMode = params.fecha_modificacion_matchMode || "dateIs";
        conditions.push(
          this.buildDateFilterCondition(
            "a.fecha_modificacion",
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
          nombre_archivo: "a.nombre_archivo",
          nombre_municipio: "m.nombre",
          tipo_archivo: "a.tipo_archivo",
          categoria_archivo: "a.categoria_archivo",
          subcategoria_archivo: "a.subcategoria_archivo",
          fecha_archivo: "a.fecha_archivo",
          fecha_modificacion: "a.fecha_modificacion",
          estatus_archivo: "a.estatus_archivo",
        };

        const dbField = fieldMap[params.sortField] || "a.fecha_modificacion";
        orderByClause = ` ORDER BY ${dbField} ${direction}`;

        console.log(`🔀 Ordenando por: ${dbField} ${direction}`);
      } else {
        orderByClause = ` ORDER BY a.fecha_modificacion DESC`;
      }

      query += orderByClause;

      // Paginación
      const limite = params.limite || 50;
      const pagina = params.pagina || 1;
      const offset = (pagina - 1) * limite;

      query += ` OFFSET @offset ROWS FETCH NEXT @limite ROWS ONLY`;
      request.input("offset", mssql.Int, offset);
      request.input("limite", mssql.Int, limite);

      /*console.log(
        `📊 Query SQL generada (primeros 300 caracteres):`,
        query.substring(0, 300) + "..."
      );*/

      // Ejecutar consulta principal
      const result = await request.query(query);

      // Obtener total de resultados para paginación
      const countRequest = pool.request();
      let countQuery = `
        SELECT COUNT(*) as total
        FROM archivos_municipio a
        INNER JOIN municipio m ON a.id_municipio = m.id_municipio
        WHERE 1=1
      `;

      // Aplicar las mismas condiciones al contador
      const countConditions = [];

      if (params.busqueda) {
        countConditions.push(`(
          a.nombre_archivo LIKE @busqueda OR 
          a.palabras_clave LIKE @busqueda OR
          a.tipo_archivo LIKE @busqueda OR
          a.categoria_archivo LIKE @busqueda OR
          a.subcategoria_archivo LIKE @busqueda OR
          m.nombre LIKE @busqueda
        )`);
        countRequest.input("busqueda", mssql.NVarChar, `%${params.busqueda}%`);
      }

      if (params.nombre_archivo) {
        const matchMode = params.nombre_archivo_matchMode || "contains";
        countConditions.push(
          this.buildFilterCondition(
            "a.nombre_archivo",
            params.nombre_archivo,
            matchMode,
            countRequest,
            "nombre_archivo"
          )
        );
      }

      if (params.municipios && params.municipios.length > 0) {
        const municipiosList = params.municipios
          .map((_, index) => `@municipio${index}`)
          .join(",");
        countConditions.push(`a.id_municipio IN (${municipiosList})`);
        params.municipios.forEach((id, index) => {
          countRequest.input(`municipio${index}`, mssql.Int, id);
        });
      }

      if (params.tipos && params.tipos.length > 0) {
        const tiposList = params.tipos
          .map((_, index) => `@tipo${index}`)
          .join(",");
        countConditions.push(`a.tipo_archivo IN (${tiposList})`);
        params.tipos.forEach((tipo, index) => {
          countRequest.input(`tipo${index}`, mssql.NVarChar, tipo);
        });
      }

      if (params.categorias && params.categorias.length > 0) {
        const categoriasList = params.categorias
          .map((_, index) => `@categoria${index}`)
          .join(",");
        countConditions.push(`a.categoria_archivo IN (${categoriasList})`);
        params.categorias.forEach((cat, index) => {
          countRequest.input(`categoria${index}`, mssql.NVarChar, cat);
        });
      }

      if (params.subcategoria) {
        const matchMode = params.subcategoria_matchMode || "contains";
        countConditions.push(
          this.buildFilterCondition(
            "a.subcategoria_archivo",
            params.subcategoria,
            matchMode,
            countRequest,
            "subcategoria"
          )
        );
      }

      if (params.palabras_clave) {
        const matchMode = params.palabras_clave_matchMode || "contains";
        countConditions.push(
          this.buildFilterCondition(
            "a.palabras_clave",
            params.palabras_clave,
            matchMode,
            countRequest,
            "palabras_clave"
          )
        );
      }

      if (params.estatus && params.estatus.length > 0) {
        const estatusList = params.estatus
          .map((_, index) => `@estatus${index}`)
          .join(",");
        countConditions.push(`a.estatus_archivo IN (${estatusList})`);
        params.estatus.forEach((est, index) => {
          countRequest.input(`estatus${index}`, mssql.NVarChar, est);
        });
      }

      if (params.fecha_archivo) {
        const matchMode = params.fecha_archivo_matchMode || "dateIs";
        countConditions.push(
          this.buildDateFilterCondition(
            "a.fecha_archivo",
            params.fecha_archivo,
            matchMode,
            countRequest,
            "fecha_archivo"
          )
        );
      }

      if (params.fecha_modificacion) {
        const matchMode = params.fecha_modificacion_matchMode || "dateIs";
        countConditions.push(
          this.buildDateFilterCondition(
            "a.fecha_modificacion",
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

      /*console.log(
        `✅ Resultados: ${result.recordset.length} de ${total} totales`
      );*/

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

  // 🛠️ Construir condición de filtro según matchMode de PrimeNG
  static buildFilterCondition(field, value, matchMode, request, paramName) {
    switch (matchMode) {
      case 'startsWith':
        request.input(paramName, mssql.NVarChar, `${value}%`);
        return `${field} LIKE @${paramName}`;
      
      case 'endsWith':
        request.input(paramName, mssql.NVarChar, `%${value}`);
        return `${field} LIKE @${paramName}`;
      
      case 'contains':
        request.input(paramName, mssql.NVarChar, `%${value}%`);
        return `${field} LIKE @${paramName}`;
      
      case 'notContains':
        request.input(paramName, mssql.NVarChar, `%${value}%`);
        return `${field} NOT LIKE @${paramName}`;
      
      case 'equals':
        request.input(paramName, mssql.NVarChar, value);
        return `${field} = @${paramName}`;
      
      case 'notEquals':
        request.input(paramName, mssql.NVarChar, value);
        return `${field} != @${paramName}`;
      
      default:
        request.input(paramName, mssql.NVarChar, `%${value}%`);
        return `${field} LIKE @${paramName}`;
    }
  }

  // 🛠️ Construir condición de filtro para fechas
  static buildDateFilterCondition(field, value, matchMode, request, paramName) {
    const date = new Date(value);
    
    switch (matchMode) {
      case 'dateIs':
        request.input(paramName, mssql.Date, date);
        return `CAST(${field} AS DATE) = @${paramName}`;
      
      case 'dateIsNot':
        request.input(paramName, mssql.Date, date);
        return `CAST(${field} AS DATE) != @${paramName}`;
      
      case 'dateBefore':
        request.input(paramName, mssql.Date, date);
        return `CAST(${field} AS DATE) < @${paramName}`;
      
      case 'dateAfter':
        request.input(paramName, mssql.Date, date);
        return `CAST(${field} AS DATE) > @${paramName}`;
      
      default:
        request.input(paramName, mssql.Date, date);
        return `CAST(${field} AS DATE) = @${paramName}`;
    }
  }

  // ✅ NUEVO - Obtener conteos por municipio
  static async getConteosPorMunicipio() {
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
  }

  // Crear un nuevo registro
  static async create(tableName, data) {
    try {
      //console.log("Datos recibidos para insertar:", data);

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

      return { id_archivo: result.recordset[0].id, ...data };
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

module.exports = Archivos_municipioModel;
