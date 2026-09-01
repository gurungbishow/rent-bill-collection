const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const bill = await prisma.monthlyBill.findFirst();
  if (!bill) {
    console.log('No bills found');
    return;
  }
  
  console.log('Found bill:', bill.id);
  
  try {
    const payment = await prisma.payment.create({
      data: {
        monthly_bill_id: bill.id,
        amount: '100',
        payment_method: 'CASH',
        note: 'Test'
      }
    });
    console.log('Success!', payment);
  } catch (e) {
    console.error('Prisma Error:', e.message);
  }
}

test().finally(() => prisma.$disconnect());
