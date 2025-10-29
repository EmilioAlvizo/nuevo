// nuevo/backend/routes/revistasRoutes.js

const express = require("express");
const router = express.Router();

const upload = require("../config/upload");


const RevistasController = require("../controllers/revistasController");
// const { getRevista, crearRevista, actualizarRevista, eliminarRevista } = require('../controllers/revistasController');


//autenticacion
// const { authMiddleware, checkRole } = require("../middleware/authMiddleware");



// Rutas del API REST

// GET - Obtener todos los registros
router.get("/revistas", RevistasController.getAll);

// GET - Obtener un registro por ID
router.get("/revistas/:id", RevistasController.getById);

// POST - Crear un nuevo registro
// router.post("/revistas", RevistasController.create);

// router.post(
//   "/revistas",
//   upload.fields([
//     { name: "portada", maxCount: 1 },
//     { name: "archivo", maxCount: 1 }
//   ]),
//   RevistasController.create
// );

// // PUT - Actualizar un registro
// router.put("/revistas/:id", RevistasController.update);

// DELETE - Eliminar un registro
router.delete("/revistas/:id", RevistasController.delete);




// Crear revista con archivos
router.post("/revistas", upload.fields([
  { name: "archivo", maxCount: 1 },
  { name: "portada", maxCount: 1 }
]), RevistasController.create);

// Editar revista con archivos opcionales
router.put("/revistas/:id", upload.fields([
  { name: "archivo", maxCount: 1 },
  { name: "portada", maxCount: 1 }
]), RevistasController.update);

module.exports = router;