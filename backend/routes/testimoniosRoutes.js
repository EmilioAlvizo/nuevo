// const express = require("express");
// const router = express.Router();
// const TestimoniosController = require("../controllers/testimoniosController");

// router.get("/testimonios", TestimoniosController.getAll);
// router.get("/testimonios/:id", TestimoniosController.getById);

// module.exports = router;

// nuevo/backend/routes/temas_interesRoutes.js

const express = require("express");
const router = express.Router();
const TestimoniosController = require("../controllers/testimoniosController");
const { crearUpload } = require('../middleware/uploadMiddleware');
const { authMiddleware, checkRole } = require("../middleware/authMiddleware");

const uploadTema = crearUpload('testimonios', {
  imagen: ['image/*']
});

// Rutas del API REST

// GET - Obtener todos los registros
router.get("/testimonios", TestimoniosController.getAll);

// GET - Obtener un registro por ID
router.get("/testimonios/:id", TestimoniosController.getById);

//POST - Crear registro
router.post('/testimonios', uploadTema.fields([
  { name: 'imagen', maxCount: 1 }
]), TestimoniosController.create);

//PUT - Actualizar registro
router.put('/testimonios/:id', uploadTema.fields([
  { name: 'imagen', maxCount: 1 }
]), TestimoniosController.update);

// DELETE - Eliminar un registro
router.delete("/testimonios/:id", TestimoniosController.delete);


module.exports = router;