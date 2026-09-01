import prisma from '../config/db';
import { Decimal } from '@prisma/client/runtime/library';

export class BillCalculationService {
  /**
   * Calculate electricity logic with optional meter reset/replacement support
   */
  static calculateElectricity(prevUnit: number, presUnit: number, rate: number | Decimal, isMeterReset: boolean = false) {
    let unitsUsed = 0;
    if (isMeterReset) {
      unitsUsed = Math.max(0, presUnit);
    } else {
      if (presUnit < prevUnit) {
        throw new Error("Present electricity unit cannot be lower than previous unit unless meter was reset.");
      }
      unitsUsed = presUnit - prevUnit;
    }
    const bill = new Decimal(unitsUsed).mul(rate);
    
    return {
      unitsUsed,
      bill
    };
  }

  /**
   * Find previous outstanding balance for a room
   */
  static async getPreviousBalance(roomId: string, currentYear: number, currentMonth: number): Promise<Decimal> {
    // Find the most recent bill before the current one
    const previousBill = await prisma.monthlyBill.findFirst({
      where: {
        room_id: roomId,
        OR: [
          { billing_year: { lt: currentYear } },
          { billing_year: currentYear, billing_month: { lt: currentMonth } }
        ]
      },
      orderBy: [
        { billing_year: 'desc' },
        { billing_month: 'desc' }
      ]
    });

    if (!previousBill) {
      return new Decimal(0);
    }

    return await this.calculateRemainingBalance(previousBill.id);
  }

  /**
   * Calculate remaining balance for a specific bill (supports credit balance/negative values)
   */
  static async calculateRemainingBalance(billId: string): Promise<Decimal> {
    const bill = await prisma.monthlyBill.findUnique({
      where: { id: billId },
      include: { payments: true }
    });

    if (!bill) {
      throw new Error("Bill not found.");
    }

    const totalPaid = bill.payments.reduce(
      (sum, p) => sum.add(p.amount),
      new Decimal(0)
    );

    return bill.grand_total.sub(totalPaid);
  }

  /**
   * Get bill payment status
   */
  static async getBillStatus(billId: string) {
    const bill = await prisma.monthlyBill.findUnique({
      where: { id: billId },
      include: { payments: true }
    });

    if (!bill) throw new Error("Bill not found");

    const totalPaid = bill.payments.reduce(
      (sum, p) => sum.add(p.amount),
      new Decimal(0)
    );

    if (totalPaid.isZero()) return 'UNPAID';
    if (totalPaid.greaterThanOrEqualTo(bill.grand_total)) return 'PAID';
    return 'PARTIALLY_PAID';
  }

  /**
   * Recalculates and synchronizes running balances across all bills for a room in chronological order.
   * Whenever a payment or bill is created, edited, or deleted, this method updates all subsequent
   * bills' previous_balance and grand_total in real-time.
   */
  static async syncRoomLedger(roomId: string): Promise<void> {
    const bills = await prisma.monthlyBill.findMany({
      where: { room_id: roomId },
      include: { payments: true },
      orderBy: [
        { billing_year: 'asc' },
        { billing_month: 'asc' },
        { bill_date: 'asc' }
      ]
    });

    if (bills.length === 0) return;

    let runningPreviousBalance = new Decimal(0);

    for (const bill of bills) {
      const currentMonthTotal = bill.current_month_total;
      const grandTotal = currentMonthTotal.add(runningPreviousBalance);

      // Sum payments on this bill
      const totalPaid = bill.payments.reduce(
        (sum, p) => sum.add(p.amount),
        new Decimal(0)
      );

      const remaining = grandTotal.sub(totalPaid);

      // If bill's previous_balance or grand_total differs from recalculated ledger, update DB
      if (!bill.previous_balance.equals(runningPreviousBalance) || !bill.grand_total.equals(grandTotal)) {
        await prisma.monthlyBill.update({
          where: { id: bill.id },
          data: {
            previous_balance: runningPreviousBalance,
            grand_total: grandTotal
          }
        });
      }

      // The remaining balance of this bill (dues or credit) becomes previous_balance for the next bill
      runningPreviousBalance = remaining;
    }
  }
}

