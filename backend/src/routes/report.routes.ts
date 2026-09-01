import { Router } from 'express';
import { getMonthlyReport, getDashboardStats } from '../controllers/report.controller';
import { authenticateUser, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateUser);
router.use(requireAdmin);

router.get('/monthly', getMonthlyReport);
router.get('/dashboard', getDashboardStats);

export default router;
