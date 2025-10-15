class archivosMunicipioController {
  static async getAll(req, res) {
    try {
      const items = await archivosMunicipioControllerModel.getAll();
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

  
}

module.exports = TestimoniosController;