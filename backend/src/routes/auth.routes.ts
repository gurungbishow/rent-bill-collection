import { Router } from 'express';
import { login, logout, getMe, changePassword } from '../controllers/auth.controller';
import { authenticateUser } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', login);
router.post('/logout', authenticateUser, logout);
router.get('/me', authenticateUser, getMe);
router.put('/change-password', authenticateUser, changePassword);

export default router;
