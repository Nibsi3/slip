import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await hash("!!AnCam123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "cameronfalck03@gmail.com" },
    update: {},
    create: {
      email: "cameronfalck03@gmail.com",
      firstName: "Cameron",
      lastName: "Falck",
      passwordHash: adminPassword,
      role: "ADMIN",
      isVerified: true,
    },
  });
  console.log(`Admin user: ${admin.email}`);

  // Create demo worker - Thabo
  const workerPassword = await hash("worker123", 12);
  const worker = await prisma.user.upsert({
    where: { phone: "0662995533" },
    update: {},
    create: {
      firstName: "Thabo",
      lastName: "Molefe",
      phone: "0662995533",
      passwordHash: workerPassword,
      role: "WORKER",
      isVerified: true,
      worker: {
        create: {
          employerName: "The Grand Hotel",
          jobTitle: "Waiter",
          qrCode: "demo-thabo-molefe",
          phoneForIM: "0662995533",
        },
      },
    },
  });
  console.log(`Worker user: ${worker.phone} / worker123`);
  console.log(`Worker QR code: demo-thabo-molefe`);
  console.log(`Tip URL: http://localhost:3000/tip/demo-thabo-molefe`);

  // Create second demo worker - Naledi
  const worker2Password = await hash("worker123", 12);
  const worker2 = await prisma.user.upsert({
    where: { phone: "0829876543" },
    update: {},
    create: {
      firstName: "Naledi",
      lastName: "Dlamini",
      phone: "0829876543",
      passwordHash: worker2Password,
      role: "WORKER",
      isVerified: true,
      worker: {
        create: {
          employerName: "Ocean Basket Waterfront",
          jobTitle: "Barista",
          qrCode: "demo-naledi-dlamini",
          phoneForIM: "0829876543",
        },
      },
    },
  });
  console.log(`Worker user: ${worker2.phone} / worker123`);
  console.log(`Worker QR code: demo-naledi-dlamini`);

  console.log("\nSeeding complete!");
  console.log("\nTest accounts:");
  console.log("  Admin: cameronfalck03@gmail.com / !!AnCam123");
  console.log("  Worker 1 (Thabo): 0662995533 / worker123");
  console.log("  Worker 2 (Naledi): 0829876543 / worker123");
  console.log("\nTip URLs:");
  console.log("  http://localhost:3000/tip/demo-thabo-molefe");
  console.log("  http://localhost:3000/tip/demo-naledi-dlamini");
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
