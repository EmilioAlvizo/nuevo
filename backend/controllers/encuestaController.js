// nuevo/backend/controllers/encuestaController.js
const EncuestaModel = require("../models/encuestaModel");
const VotosModel = require("../models/votosModel");

class EncuestaController {
  static async listar(req, res) {
    try {
      const encuestas = await EncuestaModel.getAll();
      res.json({
        success: true,
        data: encuestas,
        count: encuestas.length,});
    } catch (e) {
      res.status(500).json({
        success: false,
        message: e.message,
      });
    }
  }

  static async obtener(req, res) {
    try {
      const data = await EncuestaModel.getById(req.params.id);
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }

  static async obtenerActiva(req, res) {
    try {
      const activa = await EncuestaModel.obtenerEncuestaActiva();
      res.json(activa);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }

  static async crear(req, res) {
    try {
      const id = await EncuestaModel.create(req.body);
      res.json({ ok: true, idEncuesta: id });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }

  static async actualizar(req, res) {
    try {
      await EncuestaModel.update(req.params.id, req.body);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }

  static async eliminar(req, res) {
    try {
      await EncuestaModel.delete(req.params.id);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }

  static async votar(req, res) {
    try {
      await VotosModel.registrarVoto(
        req.params.idEncuesta,
        req.params.idOpcion,
        req.body.huella
      );

      res.json({ ok: true, message: "Voto registrado" });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }
}

module.exports = EncuestaController;
