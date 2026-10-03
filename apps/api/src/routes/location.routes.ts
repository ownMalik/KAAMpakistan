import { Router } from 'express';
import { getLocations, createCity, createArea } from '../controllers/location.controller.ts';
import { authenticate, requireRole } from '../middleware/auth.middleware.ts';

const router = Router();

router.get('/', getLocations);
router.post('/city', authenticate, requireRole('ADMIN'), createCity);
router.post('/area', authenticate, requireRole('ADMIN'), createArea);

export default router;