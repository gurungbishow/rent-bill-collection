const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_only';

async function testApi() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const bill = await prisma.monthlyBill.findFirst();
  const token = jwt.sign({ userId: admin.id, role: admin.role, roomId: admin.room_id }, JWT_SECRET);
  
  try {
    const res = await fetch(`http://localhost:5000/api/bills/${bill.id}/payments`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ amount: '50', payment_method: 'CASH', note: 'API test' })
    });
    const data = await res.json();
    console.log('API Response:', res.status, data);
  } catch (err) {
    console.error('API Error:', err);
  }
}
testApi().finally(() => prisma.$disconnect());
