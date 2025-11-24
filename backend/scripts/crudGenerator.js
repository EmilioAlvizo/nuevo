// 📁 nuevo/backend/scripts/crudGenerator.js

const fs = require("fs");
const path = require("path");
const { getConnection, mssql } = require("../config/database");
const tableConfig = require("./crud.config");

/**
 * 🔧 Obtiene la configuración de una tabla
 */
function getTableConfig(tableName) {
  return tableConfig[tableName] || tableConfig._default || {};
}

/**
 * 🎯 Determina si una columna debe ser multiselect
 */
function isMultiselectColumn(columnName, tableName) {
  const config = getTableConfig(tableName);

  // Si hay configuración explícita, usarla
  if (config.multiselect && Array.isArray(config.multiselect)) {
    return config.multiselect.includes(columnName);
  }

  // Si no hay config, usar auto-detección
  if (config.autoDetectMultiselect !== false) {
    const patterns = config.autoDetectPatterns || [
      "estatus",
      "tipo",
      "categoria",
      "subcategoria",
      "municipio",
      "nombre_municipio",
    ];

    return patterns.some((pattern) =>
      columnName.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  return false;
}

/**
 * 🔍 Obtiene información de columnas de una tabla
 */
async function getTableSchema(tableName) {
  try {
    const pool = await getConnection();

    // Consulta para obtener información de columnas
    const query = `
      SELECT 
        COLUMN_NAME as name,
        DATA_TYPE as type,
        IS_NULLABLE as nullable,
        CHARACTER_MAXIMUM_LENGTH as maxLength,
        COLUMNPROPERTY(OBJECT_ID(TABLE_SCHEMA + '.' + TABLE_NAME), COLUMN_NAME, 'IsIdentity') as isIdentity
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = @tableName
      ORDER BY ORDINAL_POSITION
    `;

    const result = await pool
      .request()
      .input("tableName", mssql.NVarChar, tableName)
      .query(query);

    // Obtener columna de clave primaria
    const pkQuery = `
      SELECT COLUMN_NAME as name
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_NAME = @tableName
      AND CONSTRAINT_NAME LIKE 'PK_%'
    `;

    const pkResult = await pool
      .request()
      .input("tableName", mssql.NVarChar, tableName)
      .query(pkQuery);

    const primaryKey = pkResult.recordset[0]?.name || "id";

    return {
      columns: result.recordset,
      primaryKey,
      tableName,
    };
  } catch (error) {
    throw new Error(
      `Error al obtener esquema de ${tableName}: ${error.message}`
    );
  }
}

/**
 * 🎯 Determina el tipo de filtro según el tipo de dato SQL
 */
function getFilterType(sqlType) {
  const dateTypes = [
    "date",
    "datetime",
    "datetime2",
    "smalldatetime",
    "timestamp",
  ];
  const numericTypes = [
    "int",
    "bigint",
    "smallint",
    "tinyint",
    "decimal",
    "numeric",
    "float",
    "real",
    "money",
  ];

  if (dateTypes.includes(sqlType.toLowerCase())) return "date";
  if (numericTypes.includes(sqlType.toLowerCase())) return "int";
  return "string";
}

/**
 * 🔍 Determina si una columna debe excluirse de filtros
 */
function shouldExcludeFromFilters(columnName, tableName) {
  const config = getTableConfig(tableName);

  if (config.excludeFromFilters && Array.isArray(config.excludeFromFilters)) {
    return config.excludeFromFilters.includes(columnName);
  }

  return false;
}

/**
 * 🔍 Detecta si una tabla tiene columna de archivo
 */
function hasFileColumn(columns) {
  return columns.some(col => {
    const colName = col.name.toLowerCase();
    return (
      colName === 'archivo' ||
      colName === 'file' ||
      colName === 'imagen' ||
      colName === 'portada' ||
      colName.startsWith('archivo_') ||
      colName.startsWith('imagen_') ||
      colName.startsWith('portada_') ||
      colName.endsWith('_archivo') ||
      colName.endsWith('_imagen') ||
      colName.endsWith('_portada')
    );
  });
}

/**
 * 📝 Genera el archivo de modelo
 */
function generateModel(schema) {
  const { tableName, columns, primaryKey } = schema;
  const modelName = toPascalCase(tableName) + "Model";
  const config = getTableConfig(tableName);

  // 🔥 CRITICAL: Determinar si hay JOINs
  const hasJoins = config.joins && config.joins.length > 0;
  const mainAlias = hasJoins ? "a" : "";
  const tablePrefix = hasJoins ? `${mainAlias}.` : "";

  // Construir configuración de filtros CON PREFIJO
  const filterConfig = columns
    .filter(
      (col) => !col.isIdentity && !shouldExcludeFromFilters(col.name, tableName)
    )
    .map((col) => {
      const filterType = getFilterType(col.type);
      const isMulti = isMultiselectColumn(col.name, tableName);

      // 🔥 AGREGAR PREFIJO AL dbField
      const dbField = `${tablePrefix}${col.name}`;

      const config = {
        name: col.name,
        dbField: dbField,
        type: filterType,
        ...(isMulti && { isMulti: true }),
      };

      return `    { name: "${config.name}", dbField: "${
        config.dbField
      }", type: "${config.type}"${isMulti ? ", isMulti: true" : ""} }`;
    })
    .join(",\n");

  // Obtener campos de búsqueda CON PREFIJO
  const searchFields =
    config.searchFields ||
    columns
      .filter((col) => getFilterType(col.type) === "string" && !col.isIdentity)
      .map((col) => col.name)
      .slice(0, config.maxSearchFields || 5);

  const searchFieldsWithPrefix = searchFields.map(
    (field) => `${tablePrefix}${field}`
  );

  // Construir queries base
  let baseQuery = `SELECT * FROM ${tableName}`;
  let countQuery = `SELECT COUNT(*) AS total FROM ${tableName}`;

  if (hasJoins) {
    const selectFields = [`${mainAlias}.*`];

    config.joins.forEach((join) => {
      selectFields.push(...join.selectFields);
    });

    baseQuery = `SELECT ${selectFields.join(
      ", "
    )} FROM ${tableName} ${mainAlias}`;
    countQuery = `SELECT COUNT(*) AS total FROM ${tableName} ${mainAlias}`;

    config.joins.forEach((join) => {
      baseQuery += `\n        INNER JOIN ${join.table} ${join.alias} ON ${join.on}`;
      countQuery += `\n        INNER JOIN ${join.table} ${join.alias} ON ${join.on}`;
    });
  }

  // Ordenamiento por defecto
  const defaultSort = config.defaultSort || {
    field: primaryKey,
    order: "DESC",
  };
  const sortFieldWithPrefix = `${tablePrefix}${defaultSort.field}`;

  return `//nuevo/backend/models/${tableName}Model.js
const { buildConditions } = require("../utils/filters");
const { getConnection, mssql } = require("../config/database");

// Modelo generado automáticamente para la tabla: ${tableName}
class ${modelName} {
  // Obtener todos los registros
  static async getAll(tableName) {
    try {
      const pool = await getConnection();
      const result = await pool.request().query(\`SELECT * FROM \${tableName}\`);
      return result.recordset;
    } catch (error) {
      throw new Error(\`Error al obtener registros: \${error.message}\`);
    }
  }

  // Obtener un registro por ID
  static async getById(tableName, id, idColumn = "id") {
    try {
      const pool = await getConnection();
      const result = await pool
        .request()
        .input("id", mssql.Int, id)
        .query(\`SELECT * FROM \${tableName} WHERE \${idColumn} = @id\`);
      return result.recordset[0];
    } catch (error) {
      throw new Error(\`Error al obtener registro: \${error.message}\`);
    }
  }

  // Obtener registros con filtros
  static async getFiltrados(params) {
    try {
      const pool = await getConnection();
      const request = pool.request();

      let query = \`${baseQuery} WHERE 1=1\`;

      // Configuración de filtros
      const filterConfig = [
${filterConfig}
      ];

      // Construir condiciones
      const conditions = buildConditions(params, request, filterConfig);

      // Búsqueda global
      if (params.busqueda) {
        const searchFields = ${JSON.stringify(searchFieldsWithPrefix)};
        
        const searchConditions = searchFields.map(field => \`\${field} LIKE @busqueda\`).join(' OR ');
        if (searchConditions) {
          conditions.push(\`(\${searchConditions})\`);
          request.input("busqueda", mssql.NVarChar, \`%\${params.busqueda}%\`);
        }
      }

      if (conditions.length > 0) query += " AND " + conditions.join(" AND ");

      // Ordenamiento
      if (params.sortField) {
        const direction = params.sortOrder === -1 ? "DESC" : "ASC";
        const sortField = params.sortField.includes('.') ? params.sortField : \`${tablePrefix}\${params.sortField}\`;
        query += \` ORDER BY \${sortField} \${direction}\`;
      } else {
        query += \` ORDER BY ${sortFieldWithPrefix} ${defaultSort.order}\`;
      }

      // Paginación
      const offset = (params.pagina - 1) * params.limite;
      query += \` OFFSET \${offset} ROWS FETCH NEXT \${params.limite} ROWS ONLY\`;

      // Contar total
      const countQuery = \`
        ${countQuery}
        WHERE 1=1
        \${conditions.length > 0 ? " AND " + conditions.join(" AND ") : ""}
      \`;

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
      throw new Error(\`Error en getFiltrados: \${error.message}\`);
    }
  }

  // Obtener valores únicos para filtros multiselect
  static async getValoresUnicos() {
    try {
      const pool = await getConnection();
      const valores = {};

      const camposMultiselect = ${JSON.stringify(
        columns
          .filter(
            (col) => isMultiselectColumn(col.name, tableName) && !col.isIdentity
          )
          .map((col) => col.name)
      )};

      for (const campo of camposMultiselect) {
        const query = \`
          SELECT DISTINCT \${campo} 
          FROM ${tableName} 
          WHERE \${campo} IS NOT NULL AND \${campo} != ''
          ORDER BY \${campo}
        \`;
        const result = await pool.request().query(query);
        valores[campo] = result.recordset.map(r => r[campo]);
      }

      return valores;
    } catch (error) {
      throw new Error(\`Error al obtener valores únicos: \${error.message}\`);
    }
  }

  // Crear un nuevo registro
  static async create(tableName, data) {
    try {
      const pool = await getConnection();
      const columns = Object.keys(data).join(", ");
      const values = Object.keys(data)
        .map((key) => \`@\${key}\`)
        .join(", ");

      const request = pool.request();

      Object.keys(data).forEach((key) => {
        request.input(key, data[key]);
      });

      const query = \`INSERT INTO \${tableName} (\${columns}) VALUES (\${values}); SELECT SCOPE_IDENTITY() AS id;\`;
      const result = await request.query(query);

      return { id: result.recordset[0].id, ...data };
    } catch (error) {
      throw new Error(\`Error al crear registro: \${error.message}\`);
    }
  }

  // Actualizar un registro
  static async update(tableName, id, data, idColumn = "id") {
    try {
      const pool = await getConnection();
      const setClause = Object.keys(data)
        .map((key) => \`\${key} = @\${key}\`)
        .join(", ");

      const request = pool.request();
      request.input("id", mssql.Int, id);

      Object.keys(data).forEach((key) => {
        request.input(key, data[key]);
      });

      const query = \`UPDATE \${tableName} SET \${setClause} WHERE \${idColumn} = @id\`;
      await request.query(query);

      return { id, ...data };
    } catch (error) {
      throw new Error(\`Error al actualizar registro: \${error.message}\`);
    }
  }

  // Eliminar un registro
  static async delete(tableName, id, idColumn = "id") {
    try {
      const pool = await getConnection();
      await pool
        .request()
        .input("id", mssql.Int, id)
        .query(\`DELETE FROM \${tableName} WHERE \${idColumn} = @id\`);

      return { message: "Registro eliminado exitosamente", id };
    } catch (error) {
      throw new Error(\`Error al eliminar registro: \${error.message}\`);
    }
  }
}

module.exports = ${modelName};
`;
}

/**
 * 🎮 Genera el archivo de controlador
 */
function generateController(schema) {
  const { tableName, columns, primaryKey } = schema;
  const modelName = toPascalCase(tableName) + 'Model';
  const controllerName = toPascalCase(tableName) + 'Controller';
  const config = getTableConfig(tableName);
  const hasFiles = hasFileColumn(columns);
  
  // Generar parámetros de query (excluir columnas de archivo de filtros)
  const queryParams = columns
    .filter(col => !col.name.toLowerCase().includes('archivo') && 
                   !col.name.toLowerCase().includes('file') &&
                   !col.name.toLowerCase().includes('imagen') &&
                   !col.name.toLowerCase().includes('portada'))
    .map(col => {
      return `        // ${col.name}
        ${col.name},
        ${col.name}_matchMode,`;
    }).join('\n');

  // Generar procesamiento de parámetros
  const paramProcessing = columns
    .filter(col => !col.name.toLowerCase().includes('archivo') && 
                   !col.name.toLowerCase().includes('file') &&
                   !col.name.toLowerCase().includes('imagen') &&
                   !col.name.toLowerCase().includes('portada'))
    .map(col => {
      const filterType = getFilterType(col.type);
      const isMulti = isMultiselectColumn(col.name, tableName);
    
      if (isMulti) {
        return `        ${col.name}: ${col.name} ? parseArrayParam(${col.name}, "${filterType}") : [],`;
      } else if (filterType === 'date') {
        return `        ${col.name}: ${col.name} || null,
        ${col.name}_matchMode: ${col.name}_matchMode || "dateIs",`;
      } else {
        return `        ${col.name}: ${col.name} || null,
        ${col.name}_matchMode: ${col.name}_matchMode || "contains",`;
      }
    }).join('\n');

  // Campos requeridos (excluyendo ID, fechas automáticas y archivos)
  const requiredFields = columns
    .filter(col => 
      !col.isIdentity && 
      col.nullable === 'NO' && 
      !col.name.toLowerCase().includes('fecha_modificacion') &&
      !col.name.toLowerCase().includes('fecha_captura') &&
      !col.name.toLowerCase().includes('archivo') &&
      !col.name.toLowerCase().includes('file') &&
      !col.name.toLowerCase().includes('imagen') &&
      !col.name.toLowerCase().includes('portada')
    )
    .map(col => `"${col.name}"`)
    .join(', ');

  // Detectar columnas de archivo
  const fileColumns = columns.filter(col => 
    col.name.toLowerCase().includes('archivo') || 
    col.name.toLowerCase().includes('file') ||
    col.name.toLowerCase().includes('imagen') ||
    col.name.toLowerCase().includes('portada')
  );

  return `//nuevo/backend/controllers/${tableName}Controller.js
const ${modelName} = require("../models/${tableName}Model");
const { parseArrayParam, validarCamposRequeridos } = require("../utils/filters");
${hasFiles ? `
const path = require("path");
const fs = require("fs");
const backendPublicPath = path.join(__dirname, "../public");` : ''}

const TABLE_NAME = "${tableName}";
const ID_COLUMN = "${primaryKey}";

class ${controllerName} {
  // GET - Obtener todos los registros
  static async getAll(req, res) {
    try {
      const data = await ${modelName}.getAll(TABLE_NAME);
      res.status(200).json({
        success: true,
        data: data,
        count: data.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET - Obtener un registro por ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const registro = await ${modelName}.getById(TABLE_NAME, id, ID_COLUMN);

      if (!registro) {
        return res.status(404).json({
          success: false,
          message: "Registro no encontrado",
        });
      }

      res.status(200).json({
        success: true,
        data: registro,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET - Obtener registros con filtros
  static async getFiltrados(req, res) {
    try {
      const {
        // Paginación
        limite,
        pagina,
        
        // Búsqueda global
        busqueda,
        
        // Ordenamiento
        sortField,
        sortOrder,

        // Filtros de columna
${queryParams}
      } = req.query;

      const params = {
        limite: parseInt(limite) || 10,
        pagina: parseInt(pagina) || 1,
        busqueda: busqueda || null,
        sortField: sortField || null,
        sortOrder: sortOrder ? parseInt(sortOrder) : null,

${paramProcessing}
      };

      const resultado = await ${modelName}.getFiltrados(params);

      res.status(200).json({
        success: true,
        data: resultado.data,
        total: resultado.total,
        pagina: resultado.pagina,
        totalPaginas: resultado.totalPaginas,
        count: resultado.data.length,
      });
    } catch (error) {
      console.error("Error en getFiltrados:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET - Obtener valores únicos para filtros
  static async getValoresUnicos(req, res) {
    try {
      const valores = await ${modelName}.getValoresUnicos();
      res.status(200).json({
        success: true,
        data: valores,
      });
    } catch (error) {
      console.error("Error en getValoresUnicos:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // POST - Crear un nuevo registro
  static async create(req, res) {
    try {
      const data = req.body;

      // Validar campos requeridos
      validarCamposRequeridos(data, [${requiredFields}]);

${hasFiles ? `      console.log("📥 Datos recibidos:", req.body);
      console.log("📎 Archivos recibidos:", req.files);

      // 1️⃣ Crear el registro primero (sin archivos)
      const nuevoRegistro = await ${modelName}.create(TABLE_NAME, { 
        ...data,
${fileColumns.map(col => `        ${col.name}: null`).join(',\n')}
      });

      console.log("🆕 Resultado create():", nuevoRegistro);
      const id = nuevoRegistro.${primaryKey} || nuevoRegistro.insertId || nuevoRegistro.id;
      if (!id) throw new Error("No se pudo obtener el ID del nuevo registro");

      // 2️⃣ Definir carpetas
      const tempPath = path.join(backendPublicPath, TABLE_NAME, 'temp');
      const baseFolder = path.join(backendPublicPath, TABLE_NAME, id.toString());
      fs.mkdirSync(baseFolder, { recursive: true });

      // 3️⃣ Procesar archivos
      const archivosActualizados = {};
${fileColumns.map(col => `      
      if (req.files && req.files.${col.name} && req.files.${col.name}[0]) {
        const ${col.name} = req.files.${col.name}[0];
        const oldPath = path.join(tempPath, ${col.name}.filename);
        const newPath = path.join(baseFolder, ${col.name}.filename);
        fs.renameSync(oldPath, newPath);
        archivosActualizados.${col.name} = ${col.name}.filename;
        console.log("📂 ${col.name} movido a:", newPath);
      } else {
        console.warn("⚠️ No se recibió archivo en req.files.${col.name}");
      }`).join('\n')}

      // 4️⃣ Actualizar registro con archivos
      if (Object.keys(archivosActualizados).length > 0) {
        await ${modelName}.update(TABLE_NAME, id, archivosActualizados, ID_COLUMN);
      }

      res.status(201).json({
        success: true,
        message: "Registro creado correctamente",
        data: { id, ...archivosActualizados },
      });` : `      const nuevoRegistro = await ${modelName}.create(TABLE_NAME, data);

      res.status(201).json({
        success: true,
        message: "Registro creado correctamente",
        data: nuevoRegistro,
      });`}
    } catch (err) {
      console.error(${hasFiles ? `"💥 Error en create ${tableName}:"` : 'err'}, err);
      res.status(500).json({
        success: false,
        message: "Error al crear registro",
        error: err.message,
      });
    }
  }

  // PUT - Actualizar un registro
  static async update(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;

${hasFiles ? `      // 🧩 Validar que haya datos
      if (!data || Object.keys(data).length === 0) {
        return res.status(400).json({
          success: false,
          message: "Datos inválidos o vacíos",
        });
      }

      // 📁 Verificar que el registro exista` : ''}
      const registroActual = await ${modelName}.getById(TABLE_NAME, id, ID_COLUMN);

      if (!registroActual) {
        return res.status(404).json({
          success: false,
          message: "Registro no encontrado",
        });
      }

${hasFiles ? `      const tempPath = path.join(backendPublicPath, TABLE_NAME, 'temp');
      const baseFolder = path.join(backendPublicPath, TABLE_NAME, id.toString());
      fs.mkdirSync(baseFolder, { recursive: true });

      // 🧾 Campos actualizables
      const camposActualizados = { ...data };

      // 📂 Si se envían nuevos archivos, reemplazar los anteriores
${fileColumns.map(col => `      if (req.files && req.files.${col.name} && req.files.${col.name}[0]) {
        const nuevo${toPascalCase(col.name)} = req.files.${col.name}[0];
        const oldPath = path.join(tempPath, nuevo${toPascalCase(col.name)}.filename);
        const newPath = path.join(baseFolder, nuevo${toPascalCase(col.name)}.filename);

        // Eliminar el archivo anterior (si existe)
        if (registroActual.${col.name}) {
          const archivoAnterior = path.join(baseFolder, registroActual.${col.name});
          if (fs.existsSync(archivoAnterior)) {
            fs.unlinkSync(archivoAnterior);
            console.log("🗑️ Archivo anterior eliminado:", archivoAnterior);
          }
        }

        // Mover el nuevo
        fs.renameSync(oldPath, newPath);
        camposActualizados.${col.name} = nuevo${toPascalCase(col.name)}.filename;
        console.log("📂 Nuevo archivo guardado en:", newPath);
      }`).join('\n')}

      // 🔄 Actualizar BD
      await ${modelName}.update(TABLE_NAME, id, camposActualizados, ID_COLUMN);

      res.status(200).json({
        success: true,
        message: "Registro actualizado correctamente",
        data: camposActualizados,
      });` : `      await ${modelName}.update(TABLE_NAME, id, data, ID_COLUMN);

      res.json({
        success: true,
        message: "Registro actualizado correctamente",
      });`}
    } catch (err) {
      console.error(${hasFiles ? `"💥 Error en update ${tableName}:"` : 'err'}, err);
      res.status(500).json({
        success: false,
        message: "Error al actualizar registro",
        error: err.message,
      });
    }
  }

  // DELETE - Eliminar un registro
  static async delete(req, res) {
    try {
      const { id } = req.params;

      // 🔍 Verificar existencia
      const registro = await ${modelName}.getById(TABLE_NAME, id, ID_COLUMN);

      if (!registro) {
        return res.status(404).json({
          success: false,
          message: "Registro no encontrado${hasFiles ? ' o ya fue eliminado' : ''}",
        });
      }

${hasFiles ? `      // 🗂️ Borrar carpeta del archivo físico
      const dir = path.join(backendPublicPath, TABLE_NAME, id.toString());
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log("🗑️ Carpeta eliminada:", dir);
      }
` : ''}
      // 🧾 Eliminar registro en la BD
      await ${modelName}.delete(TABLE_NAME, id, ID_COLUMN);

      res${hasFiles ? '.status(200)' : ''}.json({
        success: true,
        message: "Registro eliminado correctamente",${hasFiles ? '' : '\n        id,'}
      });
    } catch (err) {
      console.error("${hasFiles ? '💥 ' : ''}Error al eliminar registro:", err);
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }

  // 🛠️ Utilidad para parsear parámetros de array
  static parseArrayParam(param, type = "string") {
    if (!param) return [];

    // Si ya es un array, devolverlo
    if (Array.isArray(param)) {
      return type === "int" ? param.map(Number) : param;
    }

    // Si es un string, dividirlo por comas
    const arr = param
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    return type === "int" ? arr.map(Number) : arr;
  }
}

module.exports = ${controllerName};
`;
}

/**
 * 🚀 Genera el archivo de rutas
 */
function generateRoutes(schema) {
  const { tableName, columns } = schema;
  const controllerName = toPascalCase(tableName) + 'Controller';
  const hasFiles = hasFileColumn(columns);
  const config = getTableConfig(tableName);
  
  // Detectar SOLO columnas de archivo (no cualquier cosa que contenga "archivo")
  const fileColumns = columns.filter(col => {
    const colName = col.name.toLowerCase();
    // Solo columnas que SEAN archivos, no que contengan la palabra
    return (
      colName === 'archivo' ||
      colName === 'file' ||
      colName === 'imagen' ||
      colName === 'portada' ||
      colName.startsWith('archivo_') ||
      colName.startsWith('imagen_') ||
      colName.startsWith('portada_') ||
      colName.endsWith('_archivo') ||
      colName.endsWith('_imagen') ||
      colName.endsWith('_portada')
    );
  });

  // Si hay configuración manual, usarla en lugar de auto-detección
  let uploadConfig = {};
  
  if (config.uploadConfig && Object.keys(config.uploadConfig).length > 0) {
    // Usar SOLO la configuración manual
    uploadConfig = config.uploadConfig;
  } else {
    // Auto-detección solo si NO hay config manual
    fileColumns.forEach(col => {
      const colName = col.name.toLowerCase();
      if (colName.includes('imagen') || colName.includes('portada')) {
        uploadConfig[col.name] = ['image/*'];
      } else if (colName.includes('archivo') || colName.includes('file')) {
        uploadConfig[col.name] = ['application/pdf'];
      } else {
        uploadConfig[col.name] = ['*/*'];
      }
    });
  }

  // Solo generar rutas con upload si hay columnas configuradas
  const hasUploadConfig = Object.keys(uploadConfig).length > 0;
  const uploadConfigStr = JSON.stringify(uploadConfig, null, 2).replace(/"/g, "'");
  const fieldsArray = Object.keys(uploadConfig).map(col => `{ name: '${col}', maxCount: 1 }`).join(',\n    ');
  
  return `//nuevo/backend/routes/${tableName}Routes.js
const express = require('express');
const router = express.Router();
const ${controllerName} = require('../controllers/${tableName}Controller');
${hasUploadConfig ? `const { crearUpload } = require('../middleware/uploadMiddleware');

// Configurar upload para esta tabla
const upload${toPascalCase(tableName)} = crearUpload('${tableName}', ${uploadConfigStr});
` : ''}
// Rutas generadas automáticamente para: ${tableName}

router.get('/', ${controllerName}.getAll);
router.get('/filtrados', ${controllerName}.getFiltrados);
router.get('/valores-unicos', ${controllerName}.getValoresUnicos);
router.get('/:id', ${controllerName}.getById);
${hasUploadConfig ? `router.post('/', upload${toPascalCase(tableName)}.fields([
    ${fieldsArray}
]), ${controllerName}.create);
router.put('/:id', upload${toPascalCase(tableName)}.fields([
    ${fieldsArray}
]), ${controllerName}.update);` : `router.post('/', ${controllerName}.create);
router.put('/:id', ${controllerName}.update);`}
router.delete('/:id', ${controllerName}.delete);

module.exports = router;
`;
}

/**
 * 🔧 Utilidad: Convierte string a PascalCase
 */
function toPascalCase(str) {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

/**
 * 🎯 Función principal para generar todo
 */
async function generateCRUD(tableName, options = {}) {
  try {
    console.log(`\n🔄 Generando CRUD para la tabla: ${tableName}...`);

    // 1. Obtener esquema de la tabla
    const schema = await getTableSchema(tableName);
    console.log(
      `✅ Esquema obtenido: ${schema.columns.length} columnas, PK: ${schema.primaryKey}`
    );

    // 2. Crear directorios si no existen
    const basePath = path.join(__dirname, "..");
    const dirs = ["models", "controllers", "routes"];
    dirs.forEach((dir) => {
      const dirPath = path.join(basePath, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });

    // 3. Generar archivos
    const model = generateModel(schema);
    const controller = generateController(schema);
    const routes = generateRoutes(schema);

    // 4. Guardar archivos

    if (!options.dryRun) {
      fs.writeFileSync(
        path.join(basePath, "models", `${tableName}Model.js`),
        model
      );
      fs.writeFileSync(
        path.join(basePath, "controllers", `${tableName}Controller.js`),
        controller
      );
      fs.writeFileSync(
        path.join(basePath, "routes", `${tableName}Routes.js`),
        routes
      );

      console.log(`✅ Archivos generados exitosamente:`);
      console.log(`   📄 models/${tableName}Model.js`);
      console.log(`   📄 controllers/${tableName}Controller.js`);
      console.log(`   📄 routes/${tableName}Routes.js`);
    } else {
      console.log("\n📋 Vista previa (dry-run):");
      console.log("\n--- MODEL ---");
      console.log(model.substring(0, 500) + "...");
      console.log("\n--- CONTROLLER ---");
      console.log(controller.substring(0, 500) + "...");
    }

    // 5. Instrucciones para registrar la ruta
    console.log(`\n📌 Para activar las rutas, agrega esto a tu app.js:`);
    console.log(
      `   const ${tableName}Routes = require('./routes/${tableName}Routes');`
    );
    console.log(`   app.use('/api/${tableName}', ${tableName}Routes);`);

    return { model, controller, routes, schema };
  } catch (error) {
    console.error(`❌ Error generando CRUD: ${error.message}`);
    throw error;
  }
}

/**
 * 📋 Genera CRUD para múltiples tablas
 */
async function generateMultipleCRUD(tableNames, options = {}) {
  const results = [];

  for (const tableName of tableNames) {
    try {
      const result = await generateCRUD(tableName, options);
      results.push({ tableName, success: true, result });
    } catch (error) {
      results.push({ tableName, success: false, error: error.message });
    }
  }

  console.log("\n📊 Resumen de generación:");
  results.forEach((r) => {
    const status = r.success ? "✅" : "❌";
    console.log(`${status} ${r.tableName}`);
    if (!r.success) console.log(`   Error: ${r.error}`);
  });

  return results;
}

module.exports = {
  generateCRUD,
  generateMultipleCRUD,
  getTableSchema,
};
