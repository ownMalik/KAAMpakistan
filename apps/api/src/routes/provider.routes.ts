import { Router } from 'express';
import {
  getMyProviderProfile,
  updateProviderProfile,
  addProviderSkill,
  removeProviderSkill,
  addServiceArea,
  removeServiceArea,
  addPortfolioItem,
  removePortfolioItem,
  getProviderDashboard,
} from '../controllers/provider.controller.ts';
import { authenticate, requireRole } from '../middleware/auth.middleware.ts';

const router = Router();

// All routes require authentication and PROVIDER role (or Admin)
router.use(authenticate, requireRole('PROVIDER'));

router.get('/profile', getMyProviderProfile);
router.patch('/profile', updateProviderProfile);
router.get('/dashboard', getProviderDashboard);

router.post('/skills', addProviderSkill);
router.delete('/skills/:skillId', removeProviderSkill);

router.post('/areas', addServiceArea);
router.delete('/areas/:areaMappingId', removeServiceArea);

router.post('/portfolio', addPortfolioItem);
router.delete('/portfolio/:itemId', removePortfolioItem);

export default router;