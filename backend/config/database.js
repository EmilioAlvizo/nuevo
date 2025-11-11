//nuevo/backend/config/database.js
const mssql = require("mssql");

// Configuración de la base de datos
const config = {
  server: "172.31.27.44",
<<<<<<< HEAD
  //server: "HP\\SQLEXPRESS",
=======
  // server: "HP\\SQLEXPRESS",
>>>>>>> 98bc8f5038bfca7284977d20f829cddb23ba8fe4
  user: "sajg",
  password: "Sajg!.25",
  database: "sajg_20252001",
  options: {
    trustedConnection: true,
    encrypt: false,
    enableArithAbort: true,
    timezone: 'America/Mexico_City',
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Pool de conexiones
let pool = null;

// Función para obtener la conexión
const getConnection = async () => {
  try {
    if (!pool) {
      pool = await mssql.connect(config);
      console.log("✅ Conectado a SQL Server");
    }
    return pool;
  } catch (error) {
    console.error("❌ Error de conexión a la base de datos:", error);
    throw error;
  }
};

// Cerrar conexión
const closeConnection = async () => {
  try {
    if (pool) {
      await pool.close();
      pool = null;
      console.log("🔌 Conexión cerrada");
    }
  } catch (error) {
    console.error("❌ Error al cerrar conexión:", error);
  }
};

module.exports = {
  getConnection,
  closeConnection,
  mssql,
};