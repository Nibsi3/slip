/**
 * One-time admin account recovery script.
 * Run locally against production DB:
 *   npx tsx scripts/reset-admin.ts
 *
 * Requires .env (or .env.local) to have DATABASE_URL / DIRECT_URL pointing
 * at your production Supabase database.
 *
 * What it does:
 *  1. Lists all ADMIN / SUPER_ADMIN users so you can confirm the right account.
 *  2. Clears loginAttempts + lockedUntil on every admin account.
 *  3. If RESET_EMAIL and RESET_PASSWORD env vars are set, resets that user's
 *     password hash and unlocks the account.
 *
 * Usage:
 *   # Just unlock / inspect (no password change):
 *   npx tsx scripts/reset-admin.ts
 *
 *   # Unlock AND reset password:
 *   RESET_EMAIL="admin@slipatip.co.za" RESET_PASSWORD="NewPass123!" npx tsx scripts/reset-admin.ts
 */

import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

const prisma = new PrismaClient();

async function main() {
  console.log("\n=== Admin Account Recovery ===\n");

  // 1. List all admin-level users
  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    select: {
      id: true,
      email: true,
      phone: true,
      role: true,
      loginAttempts: true,
      lockedUntil: true,
      createdAt: true,
    },
  });

  if (admins.length === 0) {
    console.log("⚠️  No ADMIN or SUPER_ADMIN users found in this database.");
    console.log(
      "   Check that DATABASE_URL in your .env points to the correct production DB.\n"
    );
  } else {
    console.log("Admin accounts found:");
    for (const a of admins) {
      const locked =
        a.lockedUntil && a.lockedUntil > new Date()
          ? `🔒 locked until ${a.lockedUntil.toISOString()}`
          : "✅ not locked";
      console.log(
        `  [${a.role}] ${a.email ?? a.phone} — attempts: ${a.loginAttempts} — ${locked}`
      );
    }
    console.log();
  }

  // 2. Also list workers (phone-based logins)
  const workers = await prisma.user.findMany({
    where: { role: "WORKER" },
    select: {
      id: true,
      phone: true,
      firstName: true,
      lastName: true,
      loginAttempts: true,
      lockedUntil: true,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  console.log(`Worker accounts (most recent 10 of ${await prisma.user.count({ where: { role: "WORKER" } })}):`);
  for (const w of workers) {
    const locked =
      w.lockedUntil && w.lockedUntil > new Date()
        ? `🔒 locked until ${w.lockedUntil.toISOString()}`
        : "✅ ok";
    console.log(
      `  ${w.firstName} ${w.lastName} (${w.phone}) — attempts: ${w.loginAttempts} — ${locked}`
    );
  }
  console.log();

  // 3. Unlock ALL locked accounts
  const unlocked = await prisma.user.updateMany({
    where: {
      OR: [
        { lockedUntil: { gt: new Date() } },
        { loginAttempts: { gt: 0 } },
      ],
    },
    data: { loginAttempts: 0, lockedUntil: null },
  });
  console.log(`✅ Cleared lockout on ${unlocked.count} account(s).\n`);

  // 4. Optional password reset
  const resetEmail = process.env.RESET_EMAIL;
  const resetPassword = process.env.RESET_PASSWORD;

  if (resetEmail && resetPassword) {
    const user = await prisma.user.findFirst({
      where: { email: resetEmail.toLowerCase() },
    });
    if (!user) {
      console.log(`❌ No user found with email: ${resetEmail}`);
      console.log("   Tip: the account might use a phone number, not email.\n");
    } else {
      const newHash = await hash(resetPassword, 12);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash, loginAttempts: 0, lockedUntil: null },
      });
      console.log(`✅ Password reset for ${resetEmail}. You can now log in.\n`);

      // Also invalidate all existing sessions so old tokens are gone
      const deleted = await prisma.session.deleteMany({ where: { userId: user.id } });
      console.log(`   Invalidated ${deleted.count} existing session(s).\n`);
    }
  } else {
    console.log(
      "ℹ️  No RESET_EMAIL / RESET_PASSWORD set — password unchanged.\n" +
      "   To reset: RESET_EMAIL=you@example.com RESET_PASSWORD=NewPass123! npx tsx scripts/reset-admin.ts\n"
    );
  }

  // 5. Also handle phone-based worker reset
  const resetPhone = process.env.RESET_PHONE;
  if (resetPhone && resetPassword) {
    const digits = resetPhone.replace(/\D/g, "");
    const normalized =
      digits.startsWith("27") && digits.length === 11
        ? "0" + digits.slice(2)
        : digits;
    const user = await prisma.user.findFirst({ where: { phone: normalized } });
    if (!user) {
      console.log(`❌ No user found with phone: ${resetPhone} (normalised: ${normalized})\n`);
    } else {
      const newHash = await hash(resetPassword, 12);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash, loginAttempts: 0, lockedUntil: null },
      });
      const deleted = await prisma.session.deleteMany({ where: { userId: user.id } });
      console.log(
        `✅ Password reset for phone ${normalized} (${user.firstName} ${user.lastName}). ` +
        `Invalidated ${deleted.count} session(s).\n`
      );
    }
  }

  console.log("=== Done ===\n");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
