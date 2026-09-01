import { Router } from 'express';
import { 
  getRooms, 
  createRoom, 
  getRoomById, 
  updateRoom, 
  deleteRoom,
  getRoomSettings, 
  updateRoomSettings 
} from '../controllers/room.controller';
import { authenticateUser, requireAdmin, requireRoomAccess } from '../middleware/auth.middleware';

import billRoutes from './bill.routes';

const router = Router();

router.use(authenticateUser);

router.use('/:id/bills', billRoutes);

router.get('/', requireAdmin, getRooms);
router.post('/', requireAdmin, createRoom);

router.get('/:id', requireRoomAccess, getRoomById);
router.put('/:id', requireAdmin, updateRoom);
router.delete('/:id', requireAdmin, deleteRoom);

router.get('/:id/settings', requireRoomAccess, getRoomSettings);
router.put('/:id/settings', requireAdmin, updateRoomSettings);

export default router;
