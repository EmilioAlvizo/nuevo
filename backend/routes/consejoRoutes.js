
const express = require("express");
const router = express.Router();
const ConsejoController = require("../controllers/consejoController");
const { crearUpload } = require('../middleware/uploadMiddleware');
const { authMiddleware, checkRole } = require("../middleware/authMiddleware");

const uploadConsejo = crearUpload('integrantes_consejo', {
  imagen: ['image/*']
});

// Rutas del API REST

// GET - Obtener todos los registros
router.get("/consejo", ConsejoController.getAll);

// GET - Obtener un registro por ID
router.get("/consejo/:id", ConsejoController.getById);

//POST - Crear registro
router.post('/consejo', uploadConsejo.fields([
  { name: 'imagen', maxCount: 1 }
]), ConsejoController.create);

//PUT - Actualizar registro
router.put('/consejo/:id', uploadConsejo.fields([
  { name: 'imagen', maxCount: 1 }
]), ConsejoController.update);

// DELETE - Eliminar un registro
router.delete("/consejo/:id", ConsejoController.delete);


module.exports = router;