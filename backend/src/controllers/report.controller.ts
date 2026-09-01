import { Request, Response } from 'express';
import prisma from '../config/db';
import { BillCalculationService } from '../services/bill.service';
import { Decimal } from '@prisma/client/runtime/library';

export const getMonthlyReport = async (req: Request, res: Response) => {
  try {
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({ success: false, message: 'Year and month required' });
    }

    const bills = await prisma.monthlyBill.findMany({
      where: { 
        billing_year: parseInt(year as string), 
        billing_month: parseInt(month as string) 
      },
      include: { 
        room: { select: { room_name: true } }
      }
    });

    let totalExpected = new Decimal(0);
    let totalCollected = new Decimal(0);
    let totalOutstanding = new Decimal(0);
    
    let paidCount = 0;
    let partialCount = 0;
    let unpaidCount = 0;

    const reportBills = await Promise.all(bills.map(async (bill) => {
      const status = await BillCalculationService.getBillStatus(bill.id);
      const remaining = await BillCalculationService.calculateRemainingBalance(bill.id);
      const paid = bill.grand_total.sub(remaining);

      totalExpected = totalExpected.add(bill.grand_total);
      totalCollected = totalCollected.add(paid);
      totalOutstanding = totalOutstanding.add(remaining);

      if (status === 'PAID') paidCount++;
      else if (status === 'PARTIALLY_PAID') partialCount++;
      else unpaidCount++;

      return {
        id: bill.id,
        room_id: bill.room_id,
        room_name: bill.room.room_name,
        bill_total: bill.grand_total,
        paid,
        remaining,
        status
      };
    }));

    res.json({ 
      success: true, 
      data: {
        bills: reportBills,
        summary: {
          totalExpected,
          totalCollected,
          totalOutstanding,
          counts: { paid: paidCount, partial: partialCount, unpaid: unpaidCount }
        }
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate monthly report' });
  }
};

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const rooms = await prisma.room.count({ where: { is_active: true } });
    
    // Get all unpaid or partially paid bills to calculate total outstanding
    const allBills = await prisma.monthlyBill.findMany({
      include: { payments: true }
    });
    
    // Since this can be heavy, in a real production system we might want to optimize this,
    // but we'll do it in memory for now.
    
    let expected = new Decimal(0);
    let collected = new Decimal(0);
    let outstanding = new Decimal(0);
    
    let paidStatus = 0;
    let partialStatus = 0;
    let unpaidStatus = 0;

    // To make it simple for the dashboard, let's just use the current month stats or overall stats.
    // The prompt says: Expected, Collected, Outstanding, Paid, Partially Paid, Unpaid.
    
    for (const bill of allBills) {
        const totalPaid = bill.payments.reduce((sum, p) => sum.add(p.amount), new Decimal(0));
        const remaining = bill.grand_total.sub(totalPaid);
        const actualRemaining = remaining.isNegative() ? new Decimal(0) : remaining;
        
        expected = expected.add(bill.grand_total);
        collected = collected.add(totalPaid);
        outstanding = outstanding.add(actualRemaining);
        
        if (totalPaid.isZero()) unpaidStatus++;
        else if (totalPaid.greaterThanOrEqualTo(bill.grand_total)) paidStatus++;
        else partialStatus++;
    }

    res.json({
        success: true,
        data: {
            totalRooms: rooms,
            paid: paidStatus,
            partiallyPaid: partialStatus,
            unpaid: unpaidStatus,
            expected,
            collected,
            outstanding
        }
    })

  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate dashboard stats' });
  }
};
