// nuevo/backend/routes/temas_interesRoutes.js

const express = require("express");
const router = express.Router();
const Temas_interesController = require("../controllers/temas_interesController");
const { crearUpload } = require('../middleware/uploadMiddleware');
const { authMiddleware, checkRole } = require("../middleware/authMiddleware");

const uploadTema = crearUpload('temas', {
  imagen: ['image/*']
});

// Rutas del API REST

// GET - Obtener todos los registros
router.get("/temas", Temas_interesController.getAll);

// GET - Obtener un registro por ID
router.get("/temas/:id", Temas_interesController.getById);

//POST - Crear registro
router.post('/temas', uploadTema.fields([
  { name: 'imagen', maxCount: 1 }
]), Temas_interesController.create);

//PUT - Actualizar registro
router.put('/temas/:id', uploadTema.fields([
  { name: 'imagen', maxCount: 1 }
]), Temas_interesController.update);

// DELETE - Eliminar un registro
router.delete("/temas/:id", Temas_interesController.delete);


module.exports = router;