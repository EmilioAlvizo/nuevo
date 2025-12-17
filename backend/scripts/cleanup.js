// nuevo/backend/scripts/cleanup.js
// Script para limpiar tokens expirados periódicamente
const UserModel = require('../models/userModel');

// Función para limpiar tokens expirados
async function cleanupExpiredTokens() {
  try {
    //console.log('🧹 Iniciando limpieza de tokens expirados...');
    const deletedCount = await UserModel.cleanExpiredTokens();
    //console.log(`✅ Se eliminaron ${deletedCount} tokens expirados`);
  } catch (error) {
    console.error('❌ Error al limpiar tokens:', error.message);
  }
}

// Ejecutar limpieza cada 24 horas
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 horas en milisegundos

async function startCleanupScheduler() {
  //console.log('📅 Iniciando programador de limpieza de tokens');
  
  // Ejecutar inmediatamente
  await cleanupExpiredTokens();
  
  // Programar ejecución periódica
  setInterval(async () => {
    await cleanupExpiredTokens();
  }, CLEANUP_INTERVAL);
}

// Exportar funciones
module.exports = {
  cleanupExpiredTokens,
  startCleanupScheduler
};

// Si se ejecuta directamente (node cleanup.js)
if (require.main === module) {
  startCleanupScheduler().catch(error => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
}