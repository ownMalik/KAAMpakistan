import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.ts';
import {
  createServiceRequest,
  getMyRequests,
  updateRequestStatus,
  createAgreement,
} from '../controllers/request.controller.ts';

const router = Router();

router.post('/', authenticate, createServiceRequest);
router.get('/', authenticate, getMyRequests);
router.patch('/:requestId/status', authenticate, updateRequestStatus);
router.post('/:requestId/agreement', authenticate, createAgreement);

export default router;