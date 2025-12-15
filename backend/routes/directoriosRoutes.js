// nuevo/backend/routes/directoriosRoutes.js

const express = require("express");
const router = express.Router();
const DirectoriosController = require("../controllers/directoriosController");
const { crearUpload } = require("../middleware/uploadMiddleware");
const { authMiddleware, checkRole } = require("../middleware/authMiddleware");


const uploadDirectorio = crearUpload("directorios", {
  archivo: [
    'application/pdf',

    // Excel:
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv'
  ]
});


// Rutas del API REST

// GET - Obtener todos los registros
router.get("/directorios", DirectoriosController.getAll);

// GET - Obtener un registro por ID
router.get("/directorios/:id", DirectoriosController.getById);

//POST - Crear registro
router.post(
  "/directorios", authMiddleware,
  uploadDirectorio.fields([{ name: "archivo", maxCount: 1 }]),
  DirectoriosController.create
);

//PUT - Actualizar registro
router.put(
  "/directorios/:id",
  authMiddleware,
  uploadDirectorio.fields([{ name: "archivo", maxCount: 1 }]),
  DirectoriosController.update
);

// DELETE - Eliminar un registro
router.delete("/directorios/:id", authMiddleware, DirectoriosController.delete);

module.exports = router;
