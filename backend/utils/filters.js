// 📁 /utils/primengFilters.js
const { mssql } = require("../config/database");

/**
 * 🧱 Genera una condición SQL según el matchMode de PrimeNG
 */
function buildFilterCondition(field, value, matchMode, request, paramName, type = "string") {
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
      condition = `CAST(${field} AS DATE) = @${paramName}`;
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

    if (value == null || value === "" || (Array.isArray(value) && value.length === 0)) {
      return; // sin filtro
    }

    // 🔢 Multiselect (IN)
    if (isMulti && Array.isArray(value)) {
      const paramList = value.map((v, i) => {
        const paramName = `${name}_${i}`;
        request.input(paramName, mssql.NVarChar, v);
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
    const condition = buildFilterCondition(dbField, value, matchMode, request, name, type);
    if (condition) conditions.push(condition);
  });

  //console.log("conditions ", conditions)

  return conditions;
}

module.exports = {
  buildFilterCondition,
  buildDateFilterCondition,
  buildConditions,
};
