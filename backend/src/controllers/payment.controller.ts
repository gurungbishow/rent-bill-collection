import { Request, Response } from 'express';
import prisma from '../config/db';
import { BillCalculationService } from '../services/bill.service';
import { Decimal } from '@prisma/client/runtime/library';

export const getBillPayments = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string; // bill_id
    const payments = await prisma.payment.findMany({
      where: { monthly_bill_id: id },
      orderBy: { payment_date: 'desc' }
    });
    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch payments' });
  }
};

export const createPayment = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string; // bill_id
    const { amount, payment_method, note, payment_date } = req.body;

    const remaining = await BillCalculationService.calculateRemainingBalance(id);

    if (new Decimal(amount).lessThanOrEqualTo(0)) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than 0' });
    }

    const payment = await prisma.payment.create({
      data: {
        monthly_bill_id: id,
        amount,
        payment_method,
        note,
        payment_date: payment_date ? new Date(payment_date) : new Date()
      }
    });

    // Synchronize room ledger so future bills' previous_balance & grand_total update automatically
    const targetBill = await prisma.monthlyBill.findUnique({ where: { id }, select: { room_id: true } });
    if (targetBill) {
      await BillCalculationService.syncRoomLedger(targetBill.room_id);
    }

    res.status(201).json({ success: true, data: payment });
  } catch (error: any) {
    console.error('Payment Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to record payment' });
  }
};

export const updatePayment = async (req: Request, res: Response) => {
  try {
    const paymentId = req.params.paymentId as string;
    const { amount, payment_method, note, payment_date } = req.body;

    const existingPayment = await prisma.payment.findUnique({
      where: { id: paymentId }
    });

    if (!existingPayment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (amount !== undefined) {
      if (new Decimal(amount).lessThanOrEqualTo(0)) {
        return res.status(400).json({ success: false, message: 'Payment amount must be greater than 0' });
      }
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        ...(amount !== undefined && { amount }),
        ...(payment_method !== undefined && { payment_method }),
        ...(note !== undefined && { note }),
        ...(payment_date !== undefined && { payment_date: new Date(payment_date) })
      }
    });

    // Synchronize room ledger after payment update
    const targetBill = await prisma.monthlyBill.findUnique({ where: { id: existingPayment.monthly_bill_id }, select: { room_id: true } });
    if (targetBill) {
      await BillCalculationService.syncRoomLedger(targetBill.room_id);
    }

    res.json({ success: true, data: updatedPayment });
  } catch (error: any) {
    console.error('Update Payment Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update payment' });
  }
};

export const deletePayment = async (req: Request, res: Response) => {
  try {
    const paymentId = req.params.paymentId as string;
    
    const existingPayment = await prisma.payment.findUnique({
      where: { id: paymentId }
    });

    if (!existingPayment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    const targetBill = await prisma.monthlyBill.findUnique({ where: { id: existingPayment.monthly_bill_id }, select: { room_id: true } });

    await prisma.payment.delete({
      where: { id: paymentId }
    });

    if (targetBill) {
      await BillCalculationService.syncRoomLedger(targetBill.room_id);
    }

    res.json({ success: true, message: 'Payment deleted successfully' });
  } catch (error: any) {
    console.error('Delete Payment Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete payment' });
  }
};
