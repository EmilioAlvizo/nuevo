// nuevo/backend/routes/articulosRoutes.js

const express = require("express");
const router = express.Router();
const ArticulosController = require("../controllers/articulosController");
const { crearUpload } = require('../middleware/uploadMiddleware');


const uploadArticulos = crearUpload('articulos', {
  imagen: ['image/*']
});

router.get("/articulos", ArticulosController.getAll);
router.get("/articulos/:id", ArticulosController.getById);

router.post(
  "/articulos",
  uploadArticulos.fields([{ name: "imagen", maxCount: 1 }]),
  ArticulosController.create
);

router.put(
  "/articulos/:id",
  uploadArticulos.fields([{ name: "imagen", maxCount: 1 }]),
  ArticulosController.update
);

router.delete("/articulos/:id", ArticulosController.delete);

module.exports = router;

