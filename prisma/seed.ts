import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Seed script must not be run in production. " +
      "Create the admin account manually via the database or a secure one-time script."
    );
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD environment variables must be set to run seed. " +
      "Add them to your .env file."
    );
  }

  console.log("Seeding database (development only)...");

  // Create admin user from env vars
  const adminHash = await hash(adminPassword, 12);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      firstName: "Admin",
      lastName: "User",
      passwordHash: adminHash,
      role: "ADMIN",
      isVerified: true,
    },
  });
  console.log(`Admin user: ${admin.email}`);

  // Demo workers (development only — use SEED_WORKER_PASSWORD env var)
  const workerPassword = process.env.SEED_WORKER_PASSWORD;
  if (!workerPassword) {
    console.log("SEED_WORKER_PASSWORD not set — skipping demo worker creation.");
    return;
  }

  const workerHash = await hash(workerPassword, 12);

  const worker = await prisma.user.upsert({
    where: { phone: "0710000001" },
    update: {},
    create: {
      firstName: "Demo",
      lastName: "Worker",
      phone: "0710000001",
      passwordHash: workerHash,
      role: "WORKER",
      isVerified: true,
      worker: {
        create: {
          employerName: "Demo Employer",
          jobTitle: "Waiter",
          qrCode: "DEMO0001",
          phoneForIM: "0710000001",
        },
      },
    },
  });
  console.log(`Demo worker: ${worker.phone}`);

  const worker2 = await prisma.user.upsert({
    where: { phone: "0720000002" },
    update: {},
    create: {
      firstName: "Demo",
      lastName: "Worker2",
      phone: "0720000002",
      passwordHash: workerHash,
      role: "WORKER",
      isVerified: true,
      worker: {
        create: {
          employerName: "Demo Venue",
          jobTitle: "Barista",
          qrCode: "DEMO0002",
          phoneForIM: "0720000002",
        },
      },
    },
  });
  console.log(`Demo worker: ${worker2.phone}`);

  const thaboWorker = await prisma.worker.findFirst({ where: { user: { phone: "0710000001" } } });
  const nalediWorker = await prisma.worker.findFirst({ where: { user: { phone: "0720000002" } } });

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
  }

  for (let i = 3; i <= 5; i++) {
    const token = `DEMO000${i}`;
    await prisma.qRCode.upsert({
      where: { token },
      update: {},
      create: { token, batchId: "batch-demo", status: "INACTIVE" },
    });
  }

  console.log("\nSeeding complete!");
  console.log("  QR codes: /qr/DEMO0001 (Thabo), /qr/DEMO0002 (Naledi)");
  console.log("  Inactive QRs: /qr/DEMO0003, /qr/DEMO0004, /qr/DEMO0005");
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
