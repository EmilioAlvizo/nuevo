// const express = require("express");
// const router = express.Router();
// const TestimoniosController = require("../controllers/testimoniosController");

// router.get("/testimonios", TestimoniosController.getAll);
// router.get("/testimonios/:id", TestimoniosController.getById);

// module.exports = router;

// nuevo/backend/routes/testimoniosRoutes.js

const express = require("express");
const router = express.Router();
const TestimoniosController = require("../controllers/testimoniosController");
const { crearUpload } = require('../middleware/uploadMiddleware');
const { authMiddleware, checkRole } = require("../middleware/authMiddleware");

const uploadTestimonio = crearUpload('testimonios', {
  imagen: ['image/*']
});

// Rutas del API REST

// GET - Obtener todos los registros
router.get("/testimonios", TestimoniosController.getAll);

// GET - Obtener un registro por ID
router.get("/testimonios/:id", TestimoniosController.getById);

//POST - Crear registro
router.post('/testimonios', uploadTestimonio.fields([
  { name: 'imagenT', maxCount: 1 }
]), TestimoniosController.create);

//PUT - Actualizar registro
router.put('/testimonios/:id', uploadTestimonio.fields([
  { name: 'imagenT', maxCount: 1 }
]), TestimoniosController.update);

// DELETE - Eliminar un registro
router.delete("/testimonios/:id", TestimoniosController.delete);


module.exports = router;