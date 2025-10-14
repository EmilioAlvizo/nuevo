const express = require("express");
const router = express.Router();
const TestimoniosController = require("../controllers/testimoniosController");

router.get("/testimonios", TestimoniosController.getAll);
router.get("/testimonios/:id", TestimoniosController.getById);

module.exports = router;