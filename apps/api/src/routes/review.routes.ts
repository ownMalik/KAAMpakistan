import { Router } from 'express';
import { createReview, getProviderReviews } from '../controllers/review.controller.ts';
import { authenticate } from '../middleware/auth.middleware.ts';

const router = Router();

router.post('/', authenticate, createReview);
router.get('/provider/:providerId', getProviderReviews);

export default router;