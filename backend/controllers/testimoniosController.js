const ItemModel = require("../models/itemModel");

class TestimoniosController {
  static async getAll(req, res) {
    try {
      const items = await ItemModel.getAll("testimonios");
      res.status(200).json({
        success: true,
        data: items,
        count: items.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const item = await ItemModel.getById("testimonios", id, "id");

      if (!item) {
        return res.status(404).json({
          success: false,
          message: "testimonio no encontrado",
        });
      }

      res.status(200).json({
        success: true,
        data: item,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = TestimoniosController;