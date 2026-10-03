import { Router } from 'express';
import { createReport } from '../controllers/report.controller.ts';
import { requestVerification } from '../controllers/verification.controller.ts';
import { authenticate, requireRole } from '../middleware/auth.middleware.ts';

const router = Router();

router.post('/report', authenticate, createReport);
router.post('/verify-request', authenticate, requireRole('PROVIDER'), requestVerification);

export default router;