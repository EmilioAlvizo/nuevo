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

  static async obtenerUltimaFinalizada(req, res) {
    try {
      const ultima = await EncuestaModel.obtenerUltimaFinalizada();
      if (!ultima) {
        // Si no hay ninguna encuesta finalizada, devuelve 404
        return res.status(404).json({ error: "No hay encuestas finalizadas." });
      }
      res.json(ultima);
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
      const idEncuesta = req.params.idEncuesta;
      const idOpcion = req.params.idOpcion;
      const huella = req.body.huella;

      // 1. OBTENER LA ENCUESTA Y VERIFICAR CADUCIDAD
      const encuesta = await EncuestaModel.getById(idEncuesta);

      if (!encuesta) {
        return res.status(404).json({ error: "Encuesta no encontrada." });
      }

      // ⚠️ Validación de Fechas CRÍTICA
      const fechaFin = new Date(encuesta.fechaFin);
      const hoy = new Date();

      if (hoy > fechaFin) {
        // Si la encuesta ha caducado, devolvemos un error 403 (Forbidden)
        return res.status(403).json({ error: "Esta encuesta ha finalizado y no acepta más votos." });
      }

      // 2. Verificar si ya votó (usando la lógica existente)
      const votoExistente = await EncuestaModel.yaVoto(idEncuesta, huella);
      if (votoExistente) {
        // 409 Conflict si ya votó
        return res.status(409).json({ error: "Ya has votado en esta encuesta." });
      }

      // 3. Registrar el voto
      await EncuestaModel.registrarVoto(idEncuesta, idOpcion, huella);

      res.json({ ok: true, message: "Voto registrado" });
    } catch (e) {
      // Usamos 500 para errores internos (DB, código)
      res.status(500).json({ error: e.message });
    }
  }
}

module.exports = EncuestaController;
