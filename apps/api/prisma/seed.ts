import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data for KAAM PAKISTAN...');

  // 1. Create Admin User
  const adminPassword = await bcrypt.hash('admin1234', 10);
  const admin = await prisma.user.upsert({
    where: { phone: '+923000000000' },
    update: {},
    create: {
      phone: '+923000000000',
      email: 'admin@kaampakistan.pk',
      passwordHash: adminPassword,
      fullName: 'Platform Administrator',
      role: 'ADMIN',
      city: 'Islamabad',
      isVerifiedPhone: true,
    },
  });

  // 2. Create Cities & Areas
  const rawalpindi = await prisma.city.upsert({
    where: { name: 'Rawalpindi' },
    update: {},
    create: {
      name: 'Rawalpindi',
      province: 'Punjab',
      areas: {
        create: [
          { name: 'Saddar' },
          { name: 'Satellite Town' },
          { name: 'Commercial Market' },
          { name: 'Bahria Town' },
        ],
      },
    },
  });

  const islamabad = await prisma.city.upsert({
    where: { name: 'Islamabad' },
    update: {},
    create: {
      name: 'Islamabad',
      province: 'Federal Capital',
      areas: {
        create: [
          { name: 'Blue Area' },
          { name: 'F-6' },
          { name: 'F-7' },
          { name: 'G-9' },
        ],
      },
    },
  });

  // 3. Create Categories, Subcategories, and Services
  const homeRepair = await prisma.category.upsert({
    where: { slug: 'home-repair' },
    update: {},
    create: {
      name: 'Home Repair',
      slug: 'home-repair',
      icon: 'wrench',
      subcategories: {
        create: [
          {
            name: 'Plumbing & Electrical',
            slug: 'plumbing-electrical',
            services: {
              create: [
                { name: 'Electrician', slug: 'electrician' },
                { name: 'Plumber', slug: 'plumber' },
              ],
            },
          },
        ],
      },
    },
  });

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });