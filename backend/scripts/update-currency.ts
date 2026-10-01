import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const r = await prisma.school.updateMany({
  data: { currency: 'RWF', timezone: 'Africa/Kigali', country: 'Rwanda', city: 'Kigali' },
});
console.log('Updated schools:', r.count);
await prisma.$disconnect();
