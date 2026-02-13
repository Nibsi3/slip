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

  // Create demo QR codes linked to demo workers
  const thaboWorker = await prisma.worker.findFirst({ where: { user: { phone: "0662995533" } } });
  const nalediWorker = await prisma.worker.findFirst({ where: { user: { phone: "0829876543" } } });

  if (thaboWorker) {
    await prisma.qRCode.upsert({
      where: { token: "DEMO0001" },
      update: {},
      create: {
        token: "DEMO0001",
        workerId: thaboWorker.id,
        batchId: "batch-demo",
        status: "ACTIVE",
        activatedAt: new Date(),
      },
    });
    console.log("Demo QR (active): /qr/DEMO0001 → Thabo");
  }

  if (nalediWorker) {
    await prisma.qRCode.upsert({
      where: { token: "DEMO0002" },
      update: {},
      create: {
        token: "DEMO0002",
        workerId: nalediWorker.id,
        batchId: "batch-demo",
        status: "ACTIVE",
        activatedAt: new Date(),
      },
    });
    console.log("Demo QR (active): /qr/DEMO0002 → Naledi");
  }

  // Create some inactive demo QR codes
  for (let i = 3; i <= 5; i++) {
    const token = `DEMO000${i}`;
    await prisma.qRCode.upsert({
      where: { token },
      update: {},
      create: {
        token,
        batchId: "batch-demo",
        status: "INACTIVE",
      },
    });
  }
  console.log("Demo QR (inactive): /qr/DEMO0003, /qr/DEMO0004, /qr/DEMO0005");

  console.log("\nSeeding complete!");
  console.log("\nTest accounts:");
  console.log("  Admin: cameronfalck03@gmail.com / !!AnCam123");
  console.log("  Worker 1 (Thabo): 0662995533 / worker123");
  console.log("  Worker 2 (Naledi): 0829876543 / worker123");
  console.log("\nQR Code URLs:");
  console.log("  Active: /qr/DEMO0001 (Thabo), /qr/DEMO0002 (Naledi)");
  console.log("  Inactive (activation test): /qr/DEMO0003");
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
