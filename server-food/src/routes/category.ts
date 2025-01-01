import express from 'express';
import { CategoryController } from '../controllers/CategoryController';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/', CategoryController.getAll);
router.get('/:id', CategoryController.getById);
router.get('/:id/menu-items', CategoryController.getMenuItems);

// Protected routes (admin only)
router.post('/', authenticateToken, isAdmin, CategoryController.create);
router.put('/:id', authenticateToken, isAdmin, CategoryController.update);
router.delete('/:id', authenticateToken, isAdmin, CategoryController.delete);
router.post('/reorder', authenticateToken, isAdmin, CategoryController.reorder);

export default router;
