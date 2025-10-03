const express = require("express");
const mssql = require("mssql");

const app = express();
const PORT = 3000;

// Configuración de la base de datos
const config = {
  server: "172.31.27.44",
  user: "sajg",
  password: "Sajg!.25",
  database: "sajg_20252001",
  options: {
    trustedConnection: true,
    encrypt: false,
  },
};

// Ruta principal
app.get("/", async (req, res) => {
  try {
    await mssql.connect(config);
    const result = await mssql.query("SELECT * FROM municipio");
    res.send(`<pre>${JSON.stringify(result.recordset, null, 2)}</pre>`);
  } catch (err) {
    console.error("Error:", err);
    res.send(`Error: ${err.message}`);
  } finally {
    await mssql.close();
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});