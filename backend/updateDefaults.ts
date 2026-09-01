import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.roomSettings.updateMany({
    data: {
      default_water_bill: 150,
      default_electric_rate: 15,
    },
  });
  console.log(`Updated ${result.count} room settings.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
