// 📁 nuevo/backend/utils/filters.js
const { mssql } = require("../config/database");

/**
 * 🧱 Genera una condición SQL según el matchMode de PrimeNG
 */
function buildFilterCondition(
  field,
  value,
  matchMode,
  request,
  paramName,
  type = "string"
) {
  let condition = "";
  let paramValue = value;

  switch (matchMode) {
    case "startsWith":
      condition = `${field} LIKE @${paramName}`;
      paramValue = `${value}%`;
      break;
    case "endsWith":
      condition = `${field} LIKE @${paramName}`;
      paramValue = `%${value}`;
      break;
    case "contains":
      condition = `${field} LIKE @${paramName}`;
      paramValue = `%${value}%`;
      break;
    case "notContains":
      condition = `${field} NOT LIKE @${paramName}`;
      paramValue = `%${value}%`;
      break;
    case "equals":
      condition = `${field} = @${paramName}`;
      break;
    case "notEquals":
      condition = `${field} <> @${paramName}`;
      break;
    case "lt":
      condition = `${field} < @${paramName}`;
      break;
    case "lte":
      condition = `${field} <= @${paramName}`;
      break;
    case "gt":
      condition = `${field} > @${paramName}`;
      break;
    case "gte":
      condition = `${field} >= @${paramName}`;
      break;
    default:
      condition = `${field} LIKE @${paramName}`;
      paramValue = `%${value}%`;
      break;
  }

  // Tipo de dato según el campo
  if (type === "int") {
    request.input(paramName, mssql.Int, parseInt(paramValue));
  } else {
    request.input(paramName, mssql.NVarChar, paramValue);
  }

  return condition;
}

/**
 * 🗓️ Construye condición para filtros de fecha
 */
function buildDateFilterCondition(field, value, matchMode, request, paramName) {
  let condition = "";

  switch (matchMode) {
    case "dateIs":
      //condition = `CAST(${field} AS DATE) = @${paramName}`;
      condition = `CONVERT(date, ${field}) = CONVERT(date, @${paramName})`;
      break;
    case "dateIsNot":
      // Día diferente (sin importar hora)
      condition = `CONVERT(date, ${field}) <> CONVERT(date, @${paramName})`;
      break;
    case "dateBefore":
      condition = `CAST(${field} AS DATE) < @${paramName}`;
      break;
    case "dateAfter":
      condition = `CAST(${field} AS DATE) > @${paramName}`;
      break;
    default:
      condition = `CAST(${field} AS DATE) = @${paramName}`;
      break;
  }

  request.input(paramName, mssql.DateTime, new Date(value));
  return condition;
}

/**
 * ⚙️ Construye condiciones dinámicamente según configuración
 *
 * @param {object} params - filtros recibidos del frontend
 * @param {object} request - request de MSSQL
 * @param {Array} fields - configuración de campos [{name, dbField, type, alias, isMulti}]
 */
function buildConditions(params, request, config) {
  const conditions = [];

  config.forEach(({ name, dbField, type = "string", isMulti = false }) => {
    const value = params[name];
    const matchMode = params[`${name}_matchMode`] || "contains";
    //console.log("match ", matchMode)

    // 🟣 MATCH MODES UNIVERSALES PARA NULL
    if (matchMode === "isNull") {
      //console.log("si es  ", matchMode)
      conditions.push(`${dbField} IS NULL`);
      return;
    }

    if (matchMode === "isNotNull") {
      conditions.push(`${dbField} IS NOT NULL`);
      return;
    }

    if (
      value == null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return; // sin filtro
    }

    // 🔢 Multiselect (IN)
    if (isMulti && Array.isArray(value)) {
      const paramList = value.map((v, i) => {
        const paramName = `${name}_${i}`;

        // 👇 FIX: Usar el tipo correcto según la configuración
        if (type === "int") {
          request.input(paramName, mssql.Int, parseInt(v));
        } else {
          request.input(paramName, mssql.NVarChar, v);
        }

        return `@${paramName}`;
      });

      conditions.push(`${dbField} IN (${paramList.join(",")})`);
      return;
    }

    // 📅 Fecha
    if (type === "date") {
      return conditions.push(
        buildDateFilterCondition(dbField, value, matchMode, request, name)
      );
    }

    // 🔤 Texto o número
    const condition = buildFilterCondition(
      dbField,
      value,
      matchMode,
      request,
      name,
      type
    );
    if (condition) conditions.push(condition);
  });

  return conditions;
}

// 🛠️ Utilidad para parsear parámetros de array
function parseArrayParam(param, type = "string") {
  //console.log("func   ", param);
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

/**
 * Valida que los campos requeridos no estén vacíos o indefinidos.
 * @param {Object} data - Objeto con los datos (por ejemplo req.body)
 * @param {string[]} requiredFields - Lista de campos requeridos
 * @throws {Error} Si algún campo está vacío o no definido
 */
function validarCamposRequeridos(data, requiredFields) {
  const camposInvalidos = requiredFields.filter((campo) => {
    const valor = data[campo];
    if (valor === undefined || valor === null) return true;
    if (typeof valor === "string" && valor.trim() === "") return true;
    return false;
  });

  if (camposInvalidos.length > 0) {
    throw new Error(`Campos inválidos o vacíos: ${camposInvalidos.join(", ")}`);
  }
}

module.exports = {
  buildFilterCondition,
  buildDateFilterCondition,
  buildConditions,
  parseArrayParam,
  validarCamposRequeridos,
};
