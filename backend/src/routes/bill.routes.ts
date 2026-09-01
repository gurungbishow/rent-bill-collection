import { Router } from 'express';
import { 
  getRoomBills, 
  createMonthlyBill, 
  getBillById,
  updateMonthlyBill,
  deleteMonthlyBill
} from '../controllers/bill.controller';
import { authenticateUser, requireAdmin, requireRoomAccess, requireBillAccess } from '../middleware/auth.middleware';

import paymentRoutes from './payment.routes';

const router = Router({ mergeParams: true });

router.use(authenticateUser);

router.use('/:id/payments', paymentRoutes);

// If accessed as /api/rooms/:id/bills
router.get('/', requireRoomAccess, getRoomBills);
router.post('/', requireAdmin, createMonthlyBill);

// If accessed as /api/bills/:id
router.get('/:id', requireBillAccess, getBillById);
router.put('/:id', requireAdmin, updateMonthlyBill);
router.delete('/:id', requireAdmin, deleteMonthlyBill);

export default router;
