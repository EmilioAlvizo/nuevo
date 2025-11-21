// nuevo/backend/scripts/reorganizarArchivos.js
const fs = require('fs').promises;
const path = require('path');
const { getConnection, closeConnection } = require('../config/database');

class ReorganizadorArchivos {
  constructor(carpetaBase) {
    this.carpetaBase = carpetaBase;
    this.carpetaSinRegistro = path.join(carpetaBase, '_archivos_sin_registro');
  }

  log(mensaje, tipo = 'info') {
    const timestamp = new Date().toISOString();
    const emojis = { info: 'ℹ️', warn: '⚠️', error: '❌', success: '✅' };
    console.log(`[${timestamp}] ${emojis[tipo] || 'ℹ️'} ${mensaje}`);
  }

  async obtenerEstructuraCorrecta() {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .query('SELECT id_archivo, archivo FROM archivos_municipio WHERE archivo IS NOT NULL');
      
      const estructura = {};
      result.recordset.forEach(row => {
        estructura[row.id_archivo] = row.archivo;
      });
      
      this.log(`Se obtuvieron ${Object.keys(estructura).length} registros de la BD`, 'success');
      return estructura;
    } catch (error) {
      this.log(`Error al consultar la BD: ${error.message}`, 'error');
      throw error;
    }
  }

  async inventariarArchivosActuales() {
    const inventario = {};
    
    try {
      const carpetas = await fs.readdir(this.carpetaBase, { withFileTypes: true });
      
      for (const carpeta of carpetas) {
        // Solo procesar carpetas numéricas, ignorar carpetas especiales
        if (carpeta.isDirectory() && /^\d+$/.test(carpeta.name)) {
          const rutaCarpeta = path.join(this.carpetaBase, carpeta.name);
          const archivos = await fs.readdir(rutaCarpeta, { withFileTypes: true });
          
          for (const archivo of archivos) {
            if (archivo.isFile()) {
              const rutaCompleta = path.join(rutaCarpeta, archivo.name);
              if (inventario[archivo.name]) {
                this.log(`Archivo duplicado encontrado: ${archivo.name}`, 'warn');
              }
              inventario[archivo.name] = {
                ruta: rutaCompleta,
                carpetaActual: carpeta.name
              };
            }
          }
        }
      }
      
      this.log(`Se encontraron ${Object.keys(inventario).length} archivos en total`, 'success');
      return inventario;
    } catch (error) {
      this.log(`Error al inventariar archivos: ${error.message}`, 'error');
      throw error;
    }
  }

  async crearCarpeta(ruta) {
    try {
      await fs.mkdir(ruta, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  async reorganizar(modoPrueba = true) {
    this.log(`Iniciando reorganización (Modo ${modoPrueba ? 'PRUEBA' : 'REAL'})`, 'info');
    
    const estructuraCorrecta = await this.obtenerEstructuraCorrecta();
    const inventarioActual = await this.inventariarArchivosActuales();
    
    const reporte = {
      archivosPorMover: [],
      archivosNoEncontrados: [],
      archivosSinRegistro: [],
      archivosYaCorrectos: 0
    };

    // Procesar cada registro de la BD
    for (const [idArchivo, nombreArchivo] of Object.entries(estructuraCorrecta)) {
      const carpetaDestino = path.join(this.carpetaBase, idArchivo.toString());
      const rutaDestino = path.join(carpetaDestino, nombreArchivo);
      
      if (inventarioActual[nombreArchivo]) {
        const archivoInfo = inventarioActual[nombreArchivo];
        
        // Verificar si el archivo ya está en la carpeta correcta
        if (archivoInfo.carpetaActual !== idArchivo.toString()) {
          reporte.archivosPorMover.push({
            archivo: nombreArchivo,
            desde: `carpeta ${archivoInfo.carpetaActual}`,
            hacia: `carpeta ${idArchivo}`,
            rutaOrigen: archivoInfo.ruta,
            rutaDestino: rutaDestino,
            idArchivo: idArchivo
          });
          
          if (!modoPrueba) {
            await this.crearCarpeta(carpetaDestino);
            await fs.rename(archivoInfo.ruta, rutaDestino);
            this.log(`Movido: ${nombreArchivo} -> carpeta ${idArchivo}`, 'success');
          }
        } else {
          reporte.archivosYaCorrectos++;
        }
        
        // Marcar como procesado
        delete inventarioActual[nombreArchivo];
      } else {
        reporte.archivosNoEncontrados.push({
          idArchivo: idArchivo,
          nombreArchivo: nombreArchivo
        });
      }
    }

    // Archivos que no tienen registro en la BD
    for (const [nombreArchivo, info] of Object.entries(inventarioActual)) {
      reporte.archivosSinRegistro.push({
        archivo: nombreArchivo,
        carpetaActual: info.carpetaActual,
        ruta: info.ruta
      });
      
      if (!modoPrueba) {
        await this.crearCarpeta(this.carpetaSinRegistro);
        const destino = path.join(this.carpetaSinRegistro, nombreArchivo);
        await fs.rename(info.ruta, destino);
        this.log(`Archivo sin registro movido: ${nombreArchivo}`, 'warn');
      }
    }

    // Limpiar carpetas vacías
    if (!modoPrueba) {
      await this.limpiarCarpetasVacias();
    }

    return reporte;
  }

  async limpiarCarpetasVacias() {
    try {
      const carpetas = await fs.readdir(this.carpetaBase, { withFileTypes: true });
      let carpetasEliminadas = 0;
      
      for (const carpeta of carpetas) {
        if (carpeta.isDirectory() && /^\d+$/.test(carpeta.name)) {
          const rutaCarpeta = path.join(this.carpetaBase, carpeta.name);
          const contenido = await fs.readdir(rutaCarpeta);
          
          if (contenido.length === 0) {
            await fs.rmdir(rutaCarpeta);
            this.log(`Carpeta vacía eliminada: ${carpeta.name}`, 'info');
            carpetasEliminadas++;
          }
        }
      }
      
      if (carpetasEliminadas > 0) {
        this.log(`Total de carpetas vacías eliminadas: ${carpetasEliminadas}`, 'success');
      }
    } catch (error) {
      this.log(`Error al limpiar carpetas: ${error.message}`, 'error');
    }
  }

  imprimirReporte(reporte) {
    console.log('\n' + '='.repeat(60));
    console.log('           REPORTE DE REORGANIZACIÓN');
    console.log('='.repeat(60) + '\n');
    
    console.log(`✅ Archivos que ya están correctos: ${reporte.archivosYaCorrectos}`);
    
    console.log(`\n📦 Archivos por mover: ${reporte.archivosPorMover.length}`);
    if (reporte.archivosPorMover.length > 0) {
      reporte.archivosPorMover.slice(0, 10).forEach(item => {
        console.log(`   • ${item.archivo}`);
        console.log(`     ${item.desde} ➜ ${item.hacia}`);
      });
      if (reporte.archivosPorMover.length > 10) {
        console.log(`   ... y ${reporte.archivosPorMover.length - 10} más`);
      }
    }
    
    console.log(`\n❌ Archivos no encontrados en disco: ${reporte.archivosNoEncontrados.length}`);
    if (reporte.archivosNoEncontrados.length > 0) {
      reporte.archivosNoEncontrados.slice(0, 10).forEach(item => {
        console.log(`   • ID ${item.idArchivo}: ${item.nombreArchivo}`);
      });
      if (reporte.archivosNoEncontrados.length > 10) {
        console.log(`   ... y ${reporte.archivosNoEncontrados.length - 10} más`);
      }
    }
    
    console.log(`\n⚠️  Archivos sin registro en BD: ${reporte.archivosSinRegistro.length}`);
    if (reporte.archivosSinRegistro.length > 0) {
      reporte.archivosSinRegistro.slice(0, 10).forEach(item => {
        console.log(`   • ${item.archivo} (carpeta ${item.carpetaActual})`);
      });
      if (reporte.archivosSinRegistro.length > 10) {
        console.log(`   ... y ${reporte.archivosSinRegistro.length - 10} más`);
      }
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
  }
}

// Función principal
async function main() {
  // Ruta a la carpeta de archivos
  const carpetaArchivos = path.join(__dirname, '..', 'public', 'archivos_municipio');
  
  const reorganizador = new ReorganizadorArchivos(carpetaArchivos);

  try {
    console.log('\n🔍 MODO PRUEBA - No se moverán archivos\n');
    const reportePrueba = await reorganizador.reorganizar(true);
    reorganizador.imprimirReporte(reportePrueba);
    
    // Preguntar si desea continuar (en Node.js puro sin readline)
    console.log('⚠️  Para ejecutar en MODO REAL, descomenta las líneas al final del script\n');
    
    // Descomentar estas líneas para ejecutar en modo REAL:
    
    /* console.log('\n🚀 MODO REAL - Moviendo archivos...\n');
    const reporteReal = await reorganizador.reorganizar(false);
    reorganizador.imprimirReporte(reporteReal);
    console.log('✅ Reorganización completada exitosamente!\n'); */
    
    
  } catch (error) {
    console.error('\n❌ Error durante la reorganización:', error);
  } finally {
    await closeConnection();
  }
}

// Ejecutar
main();