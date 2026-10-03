import { Router } from 'express';
import {
  getAdminDashboardStats,
  resolveReport,
  verifyProviderAccount,
} from '../controllers/admin.controller.ts';
import { authenticate, requireRole } from '../middleware/auth.middleware.ts';

const router = Router();

// Protect all admin routes with authentication and ADMIN role requirement
router.use(authenticate, requireRole('ADMIN'));

router.get('/dashboard', getAdminDashboardStats);
router.patch('/reports/:reportId/resolve', resolveReport);
router.patch('/providers/:providerId/verify', verifyProviderAccount);

export default router;