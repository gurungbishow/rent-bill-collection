import { Router } from 'express';
import { getUsers, createUser, updateUser, resetUserPassword, deleteUser } from '../controllers/user.controller';
import { authenticateUser, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateUser);
router.use(requireAdmin);

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.post('/:id/reset-password', resetUserPassword);

export default router;
