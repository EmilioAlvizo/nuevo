// 📁 nuevo/backend/generate-crud.js
// Script simplificado - coloca este archivo en la RAÍZ de backend

const { generateCRUD, generateMultipleCRUD } = require("./crudGenerator");
const tableConfig = require("./crud.config");

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
╔════════════════════════════════════════════════════════╗
║     🚀 Generador Automático de CRUD para MSSQL         ║
╚════════════════════════════════════════════════════════╝

📍 Uso desde la raíz de backend:

  node generate-crud.js <tabla>
  node generate-crud.js <tabla1> <tabla2> <tabla3>
  node generate-crud.js <tabla> --dry-run
  node generate-crud.js --list-config <tabla>

📝 Ejemplos:

  node generate-crud.js archivos_municipio
  node generate-crud.js documentos_cendoc revistas
  node generate-crud.js productos --dry-run
  node generate-crud.js archivos_municipio --list-config

✨ Esto generará:
  ✓ models/<tabla>Model.js
  ✓ controllers/<tabla>Controller.js
  ✓ routes/<tabla>Routes.js

⚙️  Configuración:
  Edita scripts/crud.config.js para personalizar:
  - Columnas multiselect
  - JOINs con otras tablas
  - Campos de búsqueda
  - Ordenamiento por defecto
  `);
  process.exit(0);
}

const options = {
  dryRun: args.includes("--dry-run"),
  listConfig: args.includes("--list-config"),
};

const tableNames = args.filter((arg) => !arg.startsWith("--"));

// Mostrar configuración de una tabla
if (options.listConfig && tableNames.length > 0) {
  const tableName = tableNames[0];
  const config = tableConfig[tableName] || tableConfig._default;

  console.log(`\n📋 Configuración para: ${tableName}\n`);
  console.log("Multiselect:", config.multiselect || "Auto-detectar");
  console.log("Filtros de fecha:", config.dateFilters || "Auto-detectar");
  console.log("Excluir de filtros:", config.excludeFromFilters || "Ninguno");
  console.log("Campos de búsqueda:", config.searchFields || "Auto-detectar");
  console.log("Ordenamiento por defecto:", config.defaultSort || "Auto");

  if (config.joins) {
    console.log("\nJOINs configurados:");
    config.joins.forEach((join) => {
      console.log(`  - ${join.table} (${join.alias}): ${join.on}`);
    });
  }

  console.log("\n💡 Para modificar, edita: scripts/crud.config.js\n");
  process.exit(0);
}

(async () => {
  try {
    console.log("\n🔄 Iniciando generación...\n");

    if (tableNames.length === 1) {
      await generateCRUD(tableNames[0], options);
    } else if (tableNames.length > 1) {
      await generateMultipleCRUD(tableNames, options);
    }

    console.log("\n✨ ¡Generación completada exitosamente!\n");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error durante la generación:");
    console.error("   ", error.message);

    if (error.message.includes("Cannot find module")) {
      console.error(
        "\n💡 Sugerencia: Asegúrate de ejecutar desde la raíz de backend"
      );
      console.error("   cd C:\\Users\\emili\\Documents\\node\\nuevo\\backend");
      console.error("   node generate-crud.js tabla_nombre\n");
    }

    if (error.message.includes("database")) {
      console.error(
        "\n💡 Sugerencia: Verifica tu conexión a la base de datos en config/database.js\n"
      );
    }

    console.error("\n📋 Stack trace completo:");
    console.error(error.stack);
    process.exit(1);
  }
})();
