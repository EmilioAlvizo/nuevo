const express = require("express");
const router = express.Router();
const Banco_datosController = require("../controllers/banco_datosController");
const { crearUpload } = require('../middleware/uploadMiddleware');
const { authMiddleware, checkRole } = require("../middleware/authMiddleware");

const uploadDocumento = crearUpload('banco_datos', {
  archivo: [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel'
  ]
});

// Rutas del API REST

// GET - Obtener todos los registros
router.get("/banco", Banco_datosController.getAll);

// GET - Obtener un registro por ID
router.get("/banco/:id", Banco_datosController.getById);

//POST - Crear registro
router.post('/banco', uploadDocumento.fields([
  { name: 'archivo', maxCount: 1 }
]), Banco_datosController.create);

//PUT - Actualizar registro
router.put('/banco/:id', uploadDocumento.fields([
  { name: 'archivo', maxCount: 1 }
]), Banco_datosController.update);

// DELETE - Eliminar un registro
router.delete("/banco/:id", Banco_datosController.delete);


module.exports = router;