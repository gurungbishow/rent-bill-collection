import { Router } from 'express';
import { login, logout, getMe, changePassword, directResetPassword } from '../controllers/auth.controller';
import { authenticateUser } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', login);
router.post('/logout', authenticateUser, logout);
router.get('/me', authenticateUser, getMe);
router.put('/change-password', authenticateUser, changePassword);
router.post('/direct-reset-password', directResetPassword);

export default router;
