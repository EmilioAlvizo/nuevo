const express = require("express");
const router = express.Router();

const InterfazController = require("../controllers/interfazController");
const { crearUpload } = require("../middleware/uploadMiddleware");

const uploadInterfaz = crearUpload("interfaz", {
  archivo: ["image/*"]
});

// CRUD
router.get("/interfaz", InterfazController.getAll);
router.get("/interfaz/:id", InterfazController.getById);

// router.post(
//   "/",
//   uploadInterfaz.fields([{ name: "archivo", maxCount: 1 }]),
//   InterfazController.create
// );

router.put(
  "/interfaz/:id",
  uploadInterfaz.fields([{ name: "archivo", maxCount: 1 }]),
  InterfazController.update
);

// router.delete("interfaz/:id", InterfazController.delete);

module.exports = router;
