import { Request, Response } from 'express';
import prisma from '../config/db';
import { BillCalculationService } from '../services/bill.service';
import { Decimal } from '@prisma/client/runtime/library';

export const getRoomBills = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await BillCalculationService.syncRoomLedger(id);
    const bills = await prisma.monthlyBill.findMany({
      where: { room_id: id },
      include: { payments: true },
      orderBy: [
        { bill_date: 'desc' },
        { billing_year: 'desc' },
        { billing_month: 'desc' }
      ]
    });

    const billsWithStatus = await Promise.all(bills.map(async (bill) => {
      const status = await BillCalculationService.getBillStatus(bill.id);
      const remaining = await BillCalculationService.calculateRemainingBalance(bill.id);
      const paid = bill.grand_total.sub(remaining);
      return { ...bill, status, remaining_balance: remaining, amount_paid: paid };
    }));

    res.json({ success: true, data: billsWithStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch bills' });
  }
};

export const createMonthlyBill = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string; // room_id
    const {
      bill_date,
      billing_year,
      billing_month,
      water_bill,
      waste_bill,
      wifi_bill,
      wifi_enabled,
      room_rent,
      prev_electric_unit,
      pres_electric_unit,
      electric_rate,
      prorate_details,
      is_meter_reset
    } = req.body;

    let finalYear: number;
    let finalMonth: number;
    
    const dateObj = bill_date ? new Date(bill_date) : new Date();
    
    if (!billing_year || !billing_month) {
      return res.status(400).json({ success: false, message: 'billing_year and billing_month are required' });
    }
    finalYear = Number(billing_year);
    finalMonth = Number(billing_month);

    const existingBill = await prisma.monthlyBill.findFirst({
      where: { room_id: id, billing_year: finalYear, billing_month: finalMonth }
    });

    if (existingBill) {
      return res.status(400).json({ success: false, message: 'Bill for this date/period already exists' });
    }

    // 1. Calculate Electricity
    const { unitsUsed, bill: electric_bill } = BillCalculationService.calculateElectricity(
      prev_electric_unit,
      pres_electric_unit,
      electric_rate,
      Boolean(is_meter_reset)
    );

    // 2. Calculate Current Month Total
    const actualWifiBill = wifi_enabled ? new Decimal(wifi_bill) : new Decimal(0);
    const currentMonthTotal = new Decimal(water_bill)
      .add(new Decimal(waste_bill))
      .add(actualWifiBill)
      .add(new Decimal(room_rent))
      .add(electric_bill);

    // 3. Find Previous Balance
    const previousBalance = await BillCalculationService.getPreviousBalance(id, finalYear, finalMonth);

    // 4. Calculate Grand Total
    const grandTotal = currentMonthTotal.add(previousBalance);

    // 5. Create Transaction
    const newBill = await prisma.$transaction(async (tx) => {
      return await tx.monthlyBill.create({
        data: {
          room_id: id,
          bill_date: dateObj,
          billing_year: finalYear,
          billing_month: finalMonth,
          water_bill,
          waste_bill,
          wifi_bill: actualWifiBill,
          wifi_enabled,
          room_rent,
          prev_electric_unit,
          pres_electric_unit,
          electric_rate,
          electric_units_used: unitsUsed,
          electric_bill,
          current_month_total: currentMonthTotal,
          previous_balance: previousBalance,
          grand_total: grandTotal,
          prorate_details: prorate_details ? prorate_details : null
        }
      });
    });

    await BillCalculationService.syncRoomLedger(id);

    res.status(201).json({ success: true, data: newBill });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to create bill' });
  }
};

export const getBillById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string; // bill_id
    const bill = await prisma.monthlyBill.findUnique({
      where: { id },
      include: { payments: true, room: true }
    });

    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });

    await BillCalculationService.syncRoomLedger(bill.room_id);
    const updatedBill = await prisma.monthlyBill.findUnique({
      where: { id },
      include: { payments: true, room: true }
    });
    const targetBill = updatedBill || bill;

    const status = await BillCalculationService.getBillStatus(targetBill.id);
    const remaining = await BillCalculationService.calculateRemainingBalance(targetBill.id);
    const paid = targetBill.grand_total.sub(remaining);

    res.json({ success: true, data: { ...targetBill, status, remaining_balance: remaining, amount_paid: paid } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch bill' });
  }
};

export const updateMonthlyBill = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string; // bill_id
    const {
      bill_date,
      water_bill,
      waste_bill,
      wifi_bill,
      wifi_enabled,
      room_rent,
      prev_electric_unit,
      pres_electric_unit,
      electric_rate,
      previous_balance
    } = req.body;

    const existingBill = await prisma.monthlyBill.findUnique({
      where: { id },
      include: { payments: true }
    });

    if (!existingBill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    // 1. Calculate Electricity
    const prevUnit = prev_electric_unit !== undefined ? Number(prev_electric_unit) : existingBill.prev_electric_unit;
    const presUnit = pres_electric_unit !== undefined ? Number(pres_electric_unit) : existingBill.pres_electric_unit;
    const rate = electric_rate !== undefined ? new Decimal(electric_rate) : existingBill.electric_rate;

    const { unitsUsed, bill: electric_bill } = BillCalculationService.calculateElectricity(
      prevUnit,
      presUnit,
      rate
    );

    // 2. Calculate Current Month Total
    const actualWifiEnabled = wifi_enabled !== undefined ? Boolean(wifi_enabled) : existingBill.wifi_enabled;
    const rawWifiBill = wifi_bill !== undefined ? wifi_bill : existingBill.wifi_bill;
    const actualWifiBill = actualWifiEnabled ? new Decimal(rawWifiBill) : new Decimal(0);

    const actualWaterBill = water_bill !== undefined ? new Decimal(water_bill) : existingBill.water_bill;
    const actualWasteBill = waste_bill !== undefined ? new Decimal(waste_bill) : existingBill.waste_bill;
    const actualRoomRent = room_rent !== undefined ? new Decimal(room_rent) : existingBill.room_rent;

    const currentMonthTotal = actualWaterBill
      .add(actualWasteBill)
      .add(actualWifiBill)
      .add(actualRoomRent)
      .add(electric_bill);

    // 3. Previous Balance
    const actualPrevBalance = previous_balance !== undefined 
      ? new Decimal(previous_balance) 
      : existingBill.previous_balance;

    // 4. Grand Total
    const grandTotal = currentMonthTotal.add(actualPrevBalance);

    // 5. Update in DB
    const updatedBill = await prisma.monthlyBill.update({
      where: { id },
      data: {
        ...(bill_date ? { bill_date: new Date(bill_date) } : {}),
        water_bill: actualWaterBill,
        waste_bill: actualWasteBill,
        wifi_bill: actualWifiBill,
        wifi_enabled: actualWifiEnabled,
        room_rent: actualRoomRent,
        prev_electric_unit: prevUnit,
        pres_electric_unit: presUnit,
        electric_rate: rate,
        electric_units_used: unitsUsed,
        electric_bill,
        current_month_total: currentMonthTotal,
        previous_balance: actualPrevBalance,
        grand_total: grandTotal
      }
    });

    await BillCalculationService.syncRoomLedger(existingBill.room_id);

    res.json({ success: true, data: updatedBill });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to update bill' });
  }
};

export const deleteMonthlyBill = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string; // bill_id

    const existingBill = await prisma.monthlyBill.findUnique({
      where: { id }
    });

    if (!existingBill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.payment.deleteMany({
        where: { monthly_bill_id: id }
      });
      await tx.monthlyBill.delete({
        where: { id }
      });
    });

    await BillCalculationService.syncRoomLedger(existingBill.room_id);

    res.json({ success: true, message: 'Bill deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to delete bill' });
  }
};
