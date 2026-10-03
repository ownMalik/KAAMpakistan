import { Router } from 'express';
import { getCategories, createCategory, createSubcategory, createService } from '../controllers/category.controller.ts';
import { authenticate, requireRole } from '../middleware/auth.middleware.ts';

const router = Router();

router.get('/', getCategories);
router.post('/', authenticate, requireRole('ADMIN'), createCategory);
router.post('/subcategory', authenticate, requireRole('ADMIN'), createSubcategory);
router.post('/service', authenticate, requireRole('ADMIN'), createService);

export default router;