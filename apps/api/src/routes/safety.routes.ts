import { Router } from 'express';
import { reportUserOrProvider } from '../controllers/safety.controller.ts';
import { authenticate } from '../middleware/auth.middleware.ts';

const router = Router();

router.post('/report', authenticate, reportUserOrProvider);

export default router;