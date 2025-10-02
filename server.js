// server.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const Municipios = require('./models/Municipios');
//const sql = require('mssql');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de la base de datos
const dbConfig = {
    server: '172.31.27.44',
    user: 'sajg',              // Cambia esto
    password: 'Sajg!.25',              // Cambia esto
    database: 'sajg_20252001', // Cambia esto
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const municipiosModel = new Municipios(dbConfig);

// Ruta base donde están los PDFs
const PDF_BASE_PATH = path.join(__dirname, '..', 'GeneradorContratos', 'public', 'documentos_municipios');

// RUTAS

// Ruta principal
app.get('/', (req, res) => {
    res.json({
        message: 'API de Municipios',
        endpoints: {
            municipios: '/api/municipios',
            estadisticas: '/estadisticasMunicipio/:id',
            pdf: '/public/documentos_municipios/:id/:filename'
        }
    });
});

// About page route
app.get("/about", function (req, res) {
  res.send("Acerca de esta wiki");
});

// Obtener todos los municipios
app.get('/api/municipios', async (req, res) => {
    try {
        const municipios = await municipiosModel.obtenerTodosMunicipios();
        res.json({
            success: true,
            data: municipios
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Ruta de estadísticas del municipio (equivalente a tu ruta PHP)
app.get('/estadisticasMunicipio/:id', async (req, res) => {
    try {
        const municipio = await municipiosModel.obtenerMunicipio(req.params.id);
        
        if (municipio.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Municipio no encontrado'
            });
        }

        // Aquí puedes renderizar HTML o devolver JSON
        res.json({
            success: true,
            data: municipio[0],
            pdfUrl: municipio[0].pdf ? `/public/documentos_municipios/${req.params.id}/${municipio[0].pdf}` : null
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Servir PDFs (ruta similar a tu estructura PHP)
app.get('/public/documentos_municipios/:id/:filename', async (req, res) => {
    try {
        const { id, filename } = req.params;
        
        // Construir la ruta del archivo
        const filePath = path.join(PDF_BASE_PATH, id, filename);
        
        // Verificar si el archivo existe
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'PDF no encontrado'
            });
        }

        // Verificar que sea un PDF
        if (!filename.endsWith('.pdf')) {
            return res.status(400).json({
                success: false,
                message: 'El archivo no es un PDF válido'
            });
        }

        // Obtener información del municipio
        const municipio = await municipiosModel.obtenerMunicipio(id);
        const nombreMunicipio = municipio.length > 0 ? municipio[0].nombre : 'documento';

        // Configurar headers para descarga
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${nombreMunicipio}_${filename}"`);
        
        // Enviar el archivo
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Ruta alternativa para obtener el PDF directamente por ID de municipio
app.get('/api/municipios/:id/pdf', async (req, res) => {
    try {
        const resultado = await municipiosModel.obtenerRutaPdfMunicipio(req.params.id);
        
        if (!resultado || !resultado.pdf) {
            return res.status(404).json({
                success: false,
                message: 'PDF no encontrado en la base de datos'
            });
        }

        const filePath = path.join(PDF_BASE_PATH, req.params.id, resultado.pdf);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'Archivo PDF no existe en el servidor'
            });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${resultado.nombre}.pdf"`);
        
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Actualizar municipio
app.put('/api/municipios/:id', async (req, res) => {
    try {
        const actualizado = await municipiosModel.updateMunicipio(req.params.id, req.body);
        if (actualizado) {
            res.json({
                success: true,
                message: 'Municipio actualizado correctamente'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Municipio no encontrado'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Manejo de errores 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📁 Ruta de PDFs: ${PDF_BASE_PATH}`);
});

module.exports = app;