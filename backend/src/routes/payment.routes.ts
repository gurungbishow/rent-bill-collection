import { Router } from 'express';
import { getBillPayments, createPayment, updatePayment, deletePayment } from '../controllers/payment.controller';
import { authenticateUser, requireAdmin, requireBillAccess } from '../middleware/auth.middleware';

const router = Router({ mergeParams: true });

router.use(authenticateUser);

router.get('/', requireBillAccess, getBillPayments);
router.post('/', requireAdmin, createPayment);
router.put('/:paymentId', requireAdmin, updatePayment);
router.delete('/:paymentId', requireAdmin, deletePayment);

export default router;
