import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await argon2.hash('Ramnagar@10');
  const admin = await prisma.user.upsert({
    where: { email: 'bishow7070@gmail.com' },
    update: {
      password_hash: adminPassword,
    },
    create: {
      name: 'System Admin',
      email: 'bishow7070@gmail.com',
      password_hash: adminPassword,
      role: Role.ADMIN,
    },
  });
  console.log({ admin });

  // Create 5 rooms
  for (let i = 1; i <= 5; i++) {
    const roomName = `Room ${i}`;
    const room = await prisma.room.upsert({
      where: { room_name: roomName },
      update: {},
      create: {
        room_name: roomName,
        settings: {
          create: {
            default_water_bill: 150,
            default_waste_bill: 50,
            default_wifi_bill: 200,
            wifi_enabled: true,
            default_room_rent: 5000,
            default_electric_rate: 15,
          },
        },
      },
    });
    console.log({ room });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
