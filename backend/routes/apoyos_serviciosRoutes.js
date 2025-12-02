// nuevo/backend/routes/apoyos_serviciosRoutes.js

const express = require("express");
const router = express.Router();
const Apoyos_serviciosController = require("../controllers/apoyos_serviciosController");
const { crearUpload } = require('../middleware/uploadMiddleware');
const { authMiddleware, checkRole } = require("../middleware/authMiddleware");

const uploadApoyo = crearUpload('apoyos_servicios', {
  imagen: ['image/*']
});

// Rutas del API REST

// GET - Obtener todos los registros
router.get("/apoyos", Apoyos_serviciosController.getAll);

// GET - Obtener un registro por ID
router.get("/apoyos/:id", Apoyos_serviciosController.getById);

//POST - Crear registro
router.post('/apoyos', uploadApoyo.fields([
  { name: 'imagen', maxCount: 1 }
]), Apoyos_serviciosController.create);

//PUT - Actualizar registro
router.put('/apoyos/:id', uploadApoyo.fields([
  { name: 'imagen', maxCount: 1 }
]), Apoyos_serviciosController.update);

// DELETE - Eliminar un registro
router.delete("/apoyos/:id", Apoyos_serviciosController.delete);


module.exports = router;