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
 * 📝 Genera el archivo de modelo
 */
function generateModel(schema) {
  const { tableName, columns, primaryKey } = schema;
  const modelName = toPascalCase(tableName) + 'Model';
  const config = getTableConfig(tableName);
  
  // 🔥 CRITICAL: Determinar si hay JOINs
  const hasJoins = config.joins && config.joins.length > 0;
  const mainAlias = hasJoins ? 'a' : '';
  const tablePrefix = hasJoins ? `${mainAlias}.` : '';
  
  // Construir configuración de filtros CON PREFIJO
  const filterConfig = columns
    .filter(col => !col.isIdentity && !shouldExcludeFromFilters(col.name, tableName))
    .map(col => {
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
  const defaultSort = config.defaultSort || { field: primaryKey, order: 'DESC' };
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
          .filter(col => isMultiselectColumn(col.name, tableName) && !col.isIdentity)
          .map(col => col.name)
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
  const modelName = toPascalCase(tableName) + "Model";
  const controllerName = toPascalCase(tableName) + "Controller";

  // Generar parámetros de query
  const queryParams = columns
    .map((col) => {
      const filterType = getFilterType(col.type);
      const isMulti =
        col.name.includes("estatus") ||
        col.name.includes("tipo") ||
        col.name.includes("categoria");

      return `        // ${col.name}
        ${col.name},
        ${col.name}_matchMode,`;
    })
    .join("\n");

  // Generar procesamiento de parámetros
  const paramProcessing = columns
    .map((col) => {
      const filterType = getFilterType(col.type);
      // Detectar campos que deberían ser multiselect
      const isMulti =
        col.name.includes("estatus") ||
        col.name.includes("tipo") ||
        col.name.includes("categoria") ||
        col.name.includes("municipio") || // 👈 AGREGADO
        col.name.includes("nombre_municipio") || // 👈 AGREGADO
        col.name.includes("subcategoria");

      if (isMulti) {
        return `        ${col.name}: ${col.name} ? parseArrayParam(${col.name}, "${filterType}") : [],`;
      } else if (filterType === "date") {
        return `        ${col.name}: ${col.name} || null,
        ${col.name}_matchMode: ${col.name}_matchMode || "dateIs",`;
      } else {
        return `        ${col.name}: ${col.name} || null,
        ${col.name}_matchMode: ${col.name}_matchMode || "contains",`;
      }
    })
    .join("\n");

  // Campos requeridos (excluyendo ID y fechas automáticas)
  const requiredFields = columns
    .filter(
      (col) =>
        !col.isIdentity &&
        col.nullable === "NO" &&
        !col.name.toLowerCase().includes("fecha_modificacion") &&
        !col.name.toLowerCase().includes("fecha_captura")
    )
    .map((col) => `"${col.name}"`)
    .join(", ");

  return `//nuevo/backend/controllers/${tableName}Controller.js
const ${modelName} = require("../models/${tableName}Model");
const { parseArrayParam, validarCamposRequeridos } = require("../utils/filters");

const TABLE_NAME = "${tableName}";
const ID_COLUMN = "${primaryKey}";

const path = require("path");
const fs = require("fs");
const backendPublicPath = path.join(__dirname, "../public");

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

      const nuevoRegistro = await ${modelName}.create(TABLE_NAME, data);

      res.status(201).json({
        success: true,
        message: "Registro creado correctamente",
        data: nuevoRegistro,
      });
    } catch (err) {
      console.error(err);
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

      const registroActual = await ${modelName}.getById(TABLE_NAME, id, ID_COLUMN);

      if (!registroActual) {
        return res.status(404).json({
          success: false,
          message: "Registro no encontrado",
        });
      }

      await ${modelName}.update(TABLE_NAME, id, data, ID_COLUMN);

      res.json({
        success: true,
        message: "Registro actualizado correctamente",
      });
    } catch (err) {
      console.error(err);
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

      const registro = await ${modelName}.getById(TABLE_NAME, id, ID_COLUMN);

      if (!registro) {
        return res.status(404).json({
          success: false,
          message: "Registro no encontrado",
        });
      }

      await ${modelName}.delete(TABLE_NAME, id, ID_COLUMN);

      res.json({
        success: true,
        message: "Registro eliminado correctamente",
        id,
      });
    } catch (err) {
      console.error("Error al eliminar registro:", err);
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
}

module.exports = ${controllerName};
`;
}

/**
 * 🚀 Genera el archivo de rutas
 */
function generateRoutes(schema) {
  const { tableName } = schema;
  const controllerName = toPascalCase(tableName) + "Controller";

  return `//nuevo/backend/routes/${tableName}Routes.js
const express = require('express');
const router = express.Router();
const ${controllerName} = require('../controllers/${tableName}Controller');

// Rutas generadas automáticamente para: ${tableName}

router.get('/', ${controllerName}.getAll);
router.get('/filtrados', ${controllerName}.getFiltrados);
router.get('/valores-unicos', ${controllerName}.getValoresUnicos);
router.get('/:id', ${controllerName}.getById);
router.post('/', ${controllerName}.create);
router.put('/:id', ${controllerName}.update);
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
