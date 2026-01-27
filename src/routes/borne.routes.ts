import { Router } from 'express';
import { BorneController } from '../controllers/borne.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Appliquer l'authentification sur toutes les routes
router.use(authMiddleware);

// Routes CRUD
router.get('/', BorneController.getAll);
router.get('/stats', BorneController.getStats);
router.get('/antenne/:antenneId', BorneController.getByAntenneId);
router.get('/:id', BorneController.getById);
router.post('/', BorneController.create);
router.put('/:id', BorneController.update);
router.delete('/:id', BorneController.delete);

export default router;
