import { Request, Response } from 'express';
import { BorneModel } from '../models/borne.model';

export class BorneController {
  static async getAll(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const { data, total } = await BorneModel.findAll(page, limit);

      res.json({
        success: true,
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Error fetching bornes:', error);
      res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const borne = await BorneModel.findById(id);

      if (!borne) {
        return res.status(404).json({ success: false, error: 'Borne non trouvée' });
      }

      res.json({ success: true, data: borne });
    } catch (error) {
      console.error('Error fetching borne:', error);
      res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
  }

  static async getByAntenneId(req: Request, res: Response) {
    try {
      const antenneId = parseInt(req.params.antenneId as string);
      const bornes = await BorneModel.findByAntenneId(antenneId);

      res.json({ success: true, data: bornes });
    } catch (error) {
      console.error('Error fetching bornes by antenne:', error);
      res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { numero, numero_serie, antenne_id } = req.body;

      if (!numero || !numero_serie || !antenne_id) {
        return res.status(400).json({
          success: false,
          error: 'Les champs numero, numero_serie et antenne_id sont requis',
        });
      }

      const borne = await BorneModel.create({ numero, numero_serie, antenne_id });

      res.status(201).json({
        success: true,
        data: borne,
        message: 'Borne créée avec succès',
      });
    } catch (error) {
      console.error('Error creating borne:', error);
      res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const { numero, numero_serie, antenne_id } = req.body;

      const borne = await BorneModel.update(id, { numero, numero_serie, antenne_id });

      if (!borne) {
        return res.status(404).json({ success: false, error: 'Borne non trouvée' });
      }

      res.json({
        success: true,
        data: borne,
        message: 'Borne mise à jour avec succès',
      });
    } catch (error) {
      console.error('Error updating borne:', error);
      res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const deleted = await BorneModel.delete(id);

      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Borne non trouvée' });
      }

      res.json({ success: true, message: 'Borne supprimée avec succès' });
    } catch (error) {
      console.error('Error deleting borne:', error);
      res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
  }

  static async getStats(req: Request, res: Response) {
    try {
      const stats = await BorneModel.getStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
  }
}
