import { Router } from 'express';
import { searchProviders } from '../controllers/search.controller.ts';

const router = Router();

router.get('/providers', searchProviders);

export default router;